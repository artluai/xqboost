/**
 * xqboost AI draft generator
 * 
 * reads x-voice.md, project data, tweet history, coverage gaps,
 * and banned words. calls Claude API to generate voice-consistent
 * tweet drafts. writes drafts to Firestore.
 */

const fs = require('fs');
const path = require('path');
const { db, FieldValue } = require('./firebase-admin');

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const VOICE_FILE = path.join(__dirname, '..', 'x-voice.md');

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
    // Get notes related to this project that haven't been used in a tweet
    const snap = await db.collection('notes')
      .where('usedInTweet', '==', null)
      .get();
    
    snap.forEach(doc => {
      const data = doc.data();
      // Include notes that match this project or have no project ref (general notes)
      if (!data.projectRef?.name || data.projectRef.name.toLowerCase() === projectName?.toLowerCase()) {
        notes.push({ id: doc.id, ...data });
      }
    });
  } catch (e) {
    console.log('[draft] no notes found or notes collection does not exist');
  }
  return notes;
}

async function markNoteUsed(noteId, tweetId) {
  try {
    await db.collection('notes').doc(noteId).update({
      usedInTweet: tweetId,
    });
  } catch (e) {}
}

async function getSourcesNeedingTweets() {
  const sourcesSnap = await db.collection('sources')
    .where('status', 'in', ['active', 'priority'])
    .get();
  
  const tweetsSnap = await db.collection('tweets').get();
  
  const tweetCounts = {};
  tweetsSnap.forEach(doc => {
    const ref = doc.data().sourceRef;
    if (ref?.id) tweetCounts[ref.id] = (tweetCounts[ref.id] || 0) + 1;
  });

  const needsTweets = [];
  sourcesSnap.forEach(doc => {
    const data = doc.data();
    const count = tweetCounts[doc.id] || 0;
    if (count === 0 || data.status === 'priority') {
      needsTweets.push({ id: doc.id, ...data, tweetCount: count });
    }
  });

  return needsTweets;
}

async function generateDraft(source, voiceGuide, recentTweets, bannedWords, notes) {
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

  const userPrompt = `write a single tweet about this project:

project name: ${source.name}
day number: ${source.dayNumber || '?'}
project url: ${source.url || 'none'}
current tweet count for this project: ${source.tweetCount || 0}
project status: ${source.status}
angles to cover: ${(source.angles || []).join(', ') || 'none specified'}
${bannedSection}
${historySection}
${notesSection}

write one tweet. follow the format in the voice guide (start with $ experiment_log). MUST be under 280 characters. include the project url or artlu.ai at the end. only reference real events from the session notes above — never fabricate.`;

  const content = await callClaude(systemPrompt, userPrompt);
  return { content: content.trim(), usedNotes: notes.map(n => n.id) };
}

async function generateDrafts() {
  console.log('[draft] starting...');

  if (!CLAUDE_API_KEY) {
    console.error('[draft] CLAUDE_API_KEY not set');
    process.exit(1);
  }

  const voiceGuide = await getVoiceGuide();
  const recentTweets = await getRecentTweets();
  const bannedWords = await getBannedWords();

  // Check if specific new sources were passed from sync
  let sources;
  const newSourcesEnv = process.env.NEW_SOURCES;
  
  if (newSourcesEnv) {
    sources = JSON.parse(newSourcesEnv);
    console.log(`[draft] generating for ${sources.length} new source(s)`);
  } else {
    sources = await getSourcesNeedingTweets();
    console.log(`[draft] found ${sources.length} source(s) needing tweets`);
  }

  if (sources.length === 0) {
    console.log('[draft] nothing to generate');
    return { generated: 0 };
  }

  let generated = 0;

  for (const source of sources) {
    try {
      console.log(`[draft] generating for "${source.name}"...`);
      
      // Fetch unused notes related to this project
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
        type: 'announcement',
        status: 'draft',
        source: 'claude-api',
        sourceRef: { id: source.id, name: source.name },
        dayNumber: source.dayNumber || null,
        media: [],
        xPostId: null,
        xPostUrl: null,
        createdAt: FieldValue.serverTimestamp(),
        postedAt: null,
        updatedAt: FieldValue.serverTimestamp(),
      };

      const ref = await db.collection('tweets').add(tweetDoc);
      console.log(`[draft] created: "${source.name}" -> ${ref.id}`);
      console.log(`[draft] content: ${result.content}`);
      
      // Mark notes as used
      for (const noteId of result.usedNotes) {
        await markNoteUsed(noteId, ref.id);
      }
      
      generated++;

      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`[draft] error for "${source.name}":`, err.message);
    }
  }

  console.log(`[draft] done. ${generated} draft(s) generated.`);
  return { generated };
}

generateDrafts()
  .then(r => { console.log('[draft] complete:', JSON.stringify(r)); process.exit(0); })
  .catch(e => { console.error('[draft] error:', e); process.exit(1); });
