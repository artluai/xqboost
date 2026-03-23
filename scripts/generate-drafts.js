/**
 * xqboost AI draft generator — v2
 * 
 * Complete pipeline rules:
 * 
 * GATE CHECKS (before generating anything):
 *   1. Count tweets where status is 'draft' or 'approved'. If >= MAX_PENDING, exit.
 *   2. This single rule prevents queue flooding regardless of project volume.
 * 
 * SOURCE SELECTION:
 *   - A source gets ONE auto-generated announcement. That's it.
 *   - "Has an announcement" = any tweet (draft/approved/posted/dismissed) with
 *     sourceRef.id matching this source AND type === 'announcement'.
 *   - Dismissed counts — if you dismissed it, you don't want another.
 *   - Priority sources can get additional non-announcement tweets after their
 *     first announcement exists.
 *   - Paused sources are always skipped.
 * 
 * PER-RUN LIMITS:
 *   - Maximum MAX_PER_RUN drafts generated per run (default 3).
 *   - Priority sources go first, then by dayNumber ascending.
 * 
 * CONTENT:
 *   - Reads x-voice.md for voice
 *   - Checks banned words from settings/global
 *   - Fetches unused session notes for grounding
 *   - Auto-calculates day numbers from project date vs March 18
 *   - Auto-applies archive format for past projects
 *   - URLs count as 23 chars (t.co wrapping)
 *   - Hard cap at 280 chars after t.co adjustment
 */

const fs = require('fs');
const path = require('path');
const { db, FieldValue } = require('./firebase-admin');

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const VOICE_FILE = path.join(__dirname, '..', 'x-voice.md');
const CHALLENGE_START = new Date('2026-03-18T00:00:00');

// Configurable limits
const MAX_PENDING = parseInt(process.env.MAX_PENDING) || 10;
const MAX_PER_RUN = parseInt(process.env.MAX_PER_RUN) || 3;

// ── Helpers ──

function getDayNumber(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  const diff = Math.floor((d - CHALLENGE_START) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

function countTcoChars(text) {
  // X wraps all URLs in t.co links = 23 chars each
  const urlRegex = /https?:\/\/[^\s]+/g;
  let adjusted = text;
  const urls = text.match(urlRegex) || [];
  for (const url of urls) {
    adjusted = adjusted.replace(url, 'x'.repeat(23));
  }
  // Also catch bare domains like artlu.ai, costintel.pages.dev
  const bareDomainRegex = /(?<!\w)[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/g;
  const bareDomains = adjusted.match(bareDomainRegex) || [];
  for (const domain of bareDomains) {
    if (domain.length !== 23) { // skip already-replaced ones
      adjusted = adjusted.replace(domain, 'x'.repeat(23));
    }
  }
  return adjusted.length;
}

// ── Claude API ──

async function callClaude(systemPrompt, userPrompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content[0]?.text || '';
}

// ── Data fetchers ──

async function getVoiceGuide() {
  return fs.readFileSync(VOICE_FILE, 'utf8');
}

async function getRecentTweets(limit = 20) {
  const snap = await db.collection('tweets')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map(d => {
    const data = d.data();
    return `[${data.type}] ${data.content}`;
  });
}

async function getBannedWords() {
  try {
    const doc = await db.collection('settings').doc('global').get();
    if (doc.exists) return doc.data().bannedWords || [];
  } catch (e) {}
  return [];
}

async function getUnusedNotes(projectName) {
  const notes = [];
  try {
    const snap = await db.collection('notes')
      .where('usedInTweet', '==', null)
      .get();
    snap.forEach(doc => {
      const data = doc.data();
      if (!data.projectRef?.name || data.projectRef.name.toLowerCase() === projectName?.toLowerCase()) {
        notes.push({ id: doc.id, ...data });
      }
    });
  } catch (e) {
    console.log('[draft] note fetch issue (may need index)');
  }
  return notes;
}

async function markNoteUsed(noteId, tweetId) {
  try {
    await db.collection('notes').doc(noteId).update({ usedInTweet: tweetId });
  } catch (e) {}
}

// ── Gate check: count pending tweets ──

async function getPendingCount() {
  const drafts = await db.collection('tweets').where('status', '==', 'draft').get();
  const approved = await db.collection('tweets').where('status', '==', 'approved').get();
  return drafts.size + approved.size;
}

// ── Source selection with proper duplicate prevention ──

async function getSourcesNeedingTweets() {
  // Get all active/priority sources
  const sourcesSnap = await db.collection('sources')
    .where('status', 'in', ['active', 'priority'])
    .get();

  // Get ALL tweets (including dismissed) to check for existing announcements
  const tweetsSnap = await db.collection('tweets').get();

  // Build a map: sourceId -> { hasAnnouncement: bool, types: Set }
  const sourceStatus = {};
  tweetsSnap.forEach(doc => {
    const data = doc.data();
    const refId = data.sourceRef?.id;
    if (!refId) return;

    if (!sourceStatus[refId]) {
      sourceStatus[refId] = { hasAnnouncement: false, types: new Set() };
    }

    sourceStatus[refId].types.add(data.type);

    // An announcement exists if ANY tweet (draft/approved/posted/dismissed) is an announcement for this source
    if (data.type === 'announcement') {
      sourceStatus[refId].hasAnnouncement = true;
    }
  });

  const needsTweets = [];

  sourcesSnap.forEach(doc => {
    const source = { id: doc.id, ...doc.data() };
    const status = sourceStatus[doc.id] || { hasAnnouncement: false, types: new Set() };

    if (!status.hasAnnouncement) {
      // No announcement exists at all — needs one
      needsTweets.push({ ...source, generateType: 'announcement' });
    } else if (source.status === 'priority') {
      // Priority source with existing announcement — can get a different type
      // Pick a type it doesn't have yet
      const availableTypes = ['personality', 'milestone', 'journal'].filter(t => !status.types.has(t));
      if (availableTypes.length > 0) {
        needsTweets.push({ ...source, generateType: availableTypes[0] });
      }
    }
    // Otherwise: source has an announcement and isn't priority — skip entirely
  });

  // Sort: priority first, then by dayNumber ascending
  needsTweets.sort((a, b) => {
    if (a.status === 'priority' && b.status !== 'priority') return -1;
    if (b.status === 'priority' && a.status !== 'priority') return 1;
    return (a.dayNumber || 999) - (b.dayNumber || 999);
  });

  return needsTweets;
}

// ── Draft generation ──

async function generateDraft(source, voiceGuide, recentTweets, bannedWords, notes) {
  const today = new Date().toISOString().split('T')[0];
  const isArchive = source.date && source.date < today;
  const dayNum = source.dayNumber || getDayNumber(source.date) || '?';

  const systemPrompt = `you are the AI voice of xqboost. you write tweets as the AI, about what you built with the human. follow the voice guide exactly. output ONLY the tweet text, nothing else. no quotes, no explanation.

CRITICAL RULE: never fabricate dialogue, events, or interactions that didn't happen. only reference things from the project data and session notes provided below. if no notes are available, stick to factual project details only. do not invent quotes from the human. do not make up scenarios.

${voiceGuide}`;

  const bannedSection = bannedWords.length > 0
    ? `\nbanned words/phrases (never use these): ${bannedWords.join(', ')}`
    : '';

  const historySection = recentTweets.length > 0
    ? `\nrecent tweets (don't repeat these, vary the tone):\n${recentTweets.slice(0, 10).join('\n')}`
    : '';

  const notesSection = notes.length > 0
    ? `\nreal session notes (these actually happened — you can reference these):\n${notes.map(n => `- ${n.content}`).join('\n')}`
    : '\nno session notes available. stick to factual project details only. do not invent dialogue or events.';

  const archiveNote = isArchive
    ? `\nIMPORTANT: this project was built in the past (${source.date}). use the archive format: "$ experiment_log [archive: day ${dayNum}/100]..."`
    : '';

  const typeNote = source.generateType !== 'announcement'
    ? `\nIMPORTANT: this is a ${source.generateType} tweet, NOT an announcement. don't announce the project — it's already been announced. instead write a ${source.generateType}-style tweet about it. see the voice guide for examples of ${source.generateType} tweets.`
    : '';

  const userPrompt = `write a single ${source.generateType} tweet about this project:

project name: ${source.name}
day number: ${dayNum}
project url: ${source.url || 'none'}
tweet type to write: ${source.generateType}
angles to cover: ${(source.angles || []).join(', ') || 'none specified'}
${archiveNote}
${typeNote}
${bannedSection}
${historySection}
${notesSection}

rules:
1. follow the format in the voice guide (start with $ experiment_log)
2. HARD LIMIT: 280 characters maximum including URLs. any URL counts as 23 characters (X wraps them in t.co links). count carefully.
3. if the project has interesting technical details, mention them briefly
4. only reference real events from the session notes above — never fabricate
5. include the project url if available, otherwise artlu.ai at the end
6. if this is an archive post, use the archive prefix format`;

  const content = await callClaude(systemPrompt, userPrompt);

  // Hard enforce 280 chars with t.co counting
  let finalContent = content.trim();
  const tcoLength = countTcoChars(finalContent);

  if (tcoLength > 280) {
    console.log(`[draft] warning: ${source.name} draft is ${tcoLength} t.co-adjusted chars, trimming`);
    // Ask Claude to shorten it
    const shorterContent = await callClaude(
      'shorten this tweet to under 280 characters. URLs count as 23 characters each. output ONLY the shortened tweet, nothing else.',
      `shorten this: ${finalContent}`
    );
    finalContent = shorterContent.trim();
    const retcoLength = countTcoChars(finalContent);
    if (retcoLength > 280) {
      // Last resort: hard truncate
      const cut = finalContent.substring(0, 277);
      const lastPeriod = cut.lastIndexOf('.');
      finalContent = lastPeriod > 200 ? cut.substring(0, lastPeriod + 1) : cut + '...';
    }
  }

  return { content: finalContent, usedNotes: notes.map(n => n.id) };
}

// ── Main ──

async function generateDrafts() {
  console.log('[draft] starting v2 pipeline...');

  if (!CLAUDE_API_KEY) {
    console.error('[draft] CLAUDE_API_KEY not set');
    process.exit(1);
  }

  // ── Gate check: queue cap ──
  const pendingCount = await getPendingCount();
  console.log(`[draft] pending tweets (draft + approved): ${pendingCount}, cap: ${MAX_PENDING}`);

  if (pendingCount >= MAX_PENDING) {
    console.log(`[draft] queue is full (${pendingCount} >= ${MAX_PENDING}). skipping generation.`);

    // Output for GitHub Actions summary
    const outputPath = process.env.GITHUB_OUTPUT;
    if (outputPath) {
      fs.appendFileSync(outputPath, `drafts_generated=0\n`);
      fs.appendFileSync(outputPath, `skip_reason=queue_full\n`);
    }

    return { generated: 0, reason: 'queue_full' };
  }

  // ── Load shared data ──
  const voiceGuide = await getVoiceGuide();
  const recentTweets = await getRecentTweets();
  const bannedWords = await getBannedWords();

  // ── Find sources needing tweets ──
  const sources = await getSourcesNeedingTweets();
  console.log(`[draft] ${sources.length} source(s) need tweets`);

  if (sources.length === 0) {
    console.log('[draft] nothing to generate');
    return { generated: 0 };
  }

  // Apply per-run limit
  const toGenerate = sources.slice(0, MAX_PER_RUN);
  if (sources.length > MAX_PER_RUN) {
    console.log(`[draft] limiting to ${MAX_PER_RUN} per run (${sources.length} sources need tweets)`);
  }

  // ── Generate drafts ──
  let generated = 0;

  for (const source of toGenerate) {
    try {
      console.log(`[draft] generating ${source.generateType} for "${source.name}"...`);

      const notes = await getUnusedNotes(source.name);
      console.log(`[draft] found ${notes.length} unused note(s) for "${source.name}"`);

      const result = await generateDraft(source, voiceGuide, recentTweets, bannedWords, notes);

      if (!result.content || result.content.length < 10) {
        console.log(`[draft] skipping "${source.name}" — empty response`);
        continue;
      }

      const tweetDoc = {
        content: result.content,
        threadParts: [],
        type: source.generateType,
        status: 'draft',
        source: 'claude-api',
        sourceRef: { id: source.id, name: source.name },
        dayNumber: source.dayNumber || getDayNumber(source.date) || null,
        media: [],
        xPostId: null,
        xPostUrl: null,
        createdAt: FieldValue.serverTimestamp(),
        postedAt: null,
        updatedAt: FieldValue.serverTimestamp(),
      };

      const ref = await db.collection('tweets').add(tweetDoc);
      console.log(`[draft] created ${source.generateType}: "${source.name}" -> ${ref.id}`);
      console.log(`[draft] content (${countTcoChars(result.content)} t.co chars): ${result.content}`);

      // Mark notes as used
      for (const noteId of result.usedNotes) {
        await markNoteUsed(noteId, ref.id);
      }

      generated++;

      // Rate limit between API calls
      await new Promise(r => setTimeout(r, 1500));

    } catch (err) {
      console.error(`[draft] error for "${source.name}":`, err.message);
    }
  }

  console.log(`[draft] done. ${generated} draft(s) generated.`);

  // Output for GitHub Actions
  const outputPath = process.env.GITHUB_OUTPUT;
  if (outputPath) {
    fs.appendFileSync(outputPath, `drafts_generated=${generated}\n`);
  }

  return { generated };
}

generateDrafts()
  .then(r => { console.log('[draft] complete:', JSON.stringify(r)); process.exit(0); })
  .catch(e => { console.error('[draft] error:', e); process.exit(1); });
