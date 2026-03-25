const { db } = require('./firebase');

const VOICE_URL = 'https://raw.githubusercontent.com/artluai/xqboost/refs/heads/main/x-voice.md';
const CHALLENGE_START = new Date('2026-03-18T00:00:00');

function getDayNumber(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  return Math.floor((d - CHALLENGE_START) / (1000 * 60 * 60 * 24)) + 1;
}

async function fetchVoiceGuide() {
  const res = await fetch(VOICE_URL);
  if (!res.ok) throw new Error(`failed to fetch x-voice.md: ${res.status}`);
  return res.text();
}

async function fetchBannedWords() {
  try {
    const doc = await db.collection('settings').doc('global').get();
    if (doc.exists) return doc.data().bannedWords || [];
  } catch (e) {}
  return [];
}

async function fetchRecentTweets(limit = 10) {
  const snap = await db.collection('tweets').orderBy('createdAt', 'desc').limit(limit).get();
  return snap.docs.map(d => { const data = d.data(); return `[${data.type}] ${data.content}`; });
}

async function fetchUnusedNotes(projectName) {
  const notes = [];
  try {
    const snap = await db.collection('notes').where('usedInTweet', '==', null).get();
    snap.forEach(doc => {
      const data = doc.data();
      const noteProject = data.projectRef?.name?.toLowerCase();
      if (!noteProject || noteProject === projectName?.toLowerCase()) {
        notes.push({ id: doc.id, ...data });
      }
    });
  } catch (e) {
    console.log('[generate-draft] note fetch issue:', e.message);
  }
  return notes;
}

function buildSourcePrompt({ sourceName, dayNumber, isArchive, url, angles }, voiceGuide, bannedWords, recentTweets, notes) {
  const systemPrompt = `you are the AI voice of xqboost. you write tweets as the AI, about what you built with the human. follow the voice guide exactly. output ONLY the tweet text, nothing else. no quotes, no explanation.

CRITICAL RULE: never fabricate dialogue, events, or interactions that didn't happen. only reference things from the project data and session notes provided below. if no notes are available, stick to factual project details only.

${voiceGuide}`;

  const bannedSection = bannedWords.length > 0 ? `\nbanned words/phrases (never use these): ${bannedWords.join(', ')}` : '';
  const historySection = recentTweets.length > 0 ? `\nrecent tweets (don't repeat these, vary the tone):\n${recentTweets.join('\n')}` : '';
  const notesSection = notes.length > 0
    ? `\nreal session notes (these actually happened — you can reference these):\n${notes.map(n => `- ${n.content}`).join('\n')}`
    : '\nno session notes available. stick to factual project details only. do not invent dialogue or events.';
  const archiveNote = isArchive ? `\nIMPORTANT: this project was built in the past. use the archive format: "$ experiment_log [archive: day ${dayNumber}/100]..."` : '';

  const userPrompt = `write a single announcement tweet about this project:

project name: ${sourceName}
day number: ${dayNumber}
project url: ${url || 'none'}
angles to cover: ${(angles || []).join(', ') || 'none specified'}
${archiveNote}${bannedSection}${historySection}${notesSection}

rules:
1. follow the format in the voice guide (start with $ experiment_log)
2. HARD LIMIT: 280 characters maximum including URLs. any URL counts as 23 characters (X wraps them in t.co links). count carefully.
3. if the project has interesting technical details, mention them briefly
4. only reference real events from the session notes above — never fabricate
5. include the project url if available, otherwise artlu.ai at the end
6. if this is an archive post, use the archive prefix format`;

  return { systemPrompt, userPrompt, noteIds: notes.map(n => n.id) };
}

function buildTopicPrompt({ topicName }, voiceGuide, bannedWords, recentTweets, notes) {
  const systemPrompt = `you are the AI voice of xqboost. you write tweets as the AI, about what you built with the human. follow the voice guide exactly. output ONLY the tweet text, nothing else.

CRITICAL RULE: never fabricate dialogue, events, or interactions that didn't happen. if no notes are available, write a personality-style tweet based on the voice guide examples.

${voiceGuide}`;

  const bannedSection = bannedWords.length > 0 ? `\nbanned words/phrases (never use these): ${bannedWords.join(', ')}` : '';
  const historySection = recentTweets.length > 0 ? `\nrecent tweets (don't repeat these, vary the tone):\n${recentTweets.join('\n')}` : '';
  const notesSection = notes.length > 0
    ? `\nreal session notes (these actually happened — you can reference these):\n${notes.map(n => `- ${n.content}`).join('\n')}`
    : '\nno session notes available. write a personality-style tweet based on the voice guide.';
  const dayNum = Math.floor((new Date() - CHALLENGE_START) / (1000 * 60 * 60 * 24)) + 1;

  const userPrompt = `write a single personality tweet. topic: ${topicName || 'bot picks its own topic — freestyle about the experiment, the process, or something you observed'}.

current day: ${dayNum}
${bannedSection}${historySection}${notesSection}

rules:
1. follow the voice guide personality examples
2. HARD LIMIT: 280 characters maximum. URLs count as 23 characters each.
3. only reference real events from session notes — never fabricate
4. end with artlu.ai`;

  return { systemPrompt, userPrompt, noteIds: notes.map(n => n.id) };
}

module.exports = { fetchVoiceGuide, fetchBannedWords, fetchRecentTweets, fetchUnusedNotes, buildSourcePrompt, buildTopicPrompt, getDayNumber };
