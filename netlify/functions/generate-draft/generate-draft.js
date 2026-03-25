const { db, FieldValue } = require('./lib/firebase');
const { validateAuth, AuthError } = require('./lib/auth');
const { getAdapter, MODEL_ENV_KEYS } = require('./lib/adapters');
const { encrypt, decrypt, mask } = require('./lib/crypto');
const { countTcoChars } = require('./lib/tco');
const { fetchVoiceGuide, fetchBannedWords, fetchRecentTweets, fetchUnusedNotes, buildSourcePrompt, buildTopicPrompt } = require('./lib/prompt');

function sanitizeString(str, maxLen = 200) {
  if (typeof str !== 'string') return '';
  return str.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, maxLen);
}

function sanitizeAngles(arr, maxItems = 5, maxLen = 200) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, maxItems).map(a => sanitizeString(a, maxLen));
}

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ok = (body) => ({ statusCode: 200, headers, body: JSON.stringify(body) });
const err = (message, status = 500) => ({ statusCode: status, headers, body: JSON.stringify({ ok: false, error: message }) });

const VALID_MODELS = ['claude-sonnet', 'gpt-4o', 'kimi-k2.5'];

// ── Key management helpers ──

async function getUserKeys(uid) {
  try {
    const doc = await db.collection('apiKeys').doc(uid).get();
    if (!doc.exists) return {};
    return doc.data() || {};
  } catch (e) {
    console.error('[generate-draft] failed to read user keys:', e.message);
    return {};
  }
}

async function getDecryptedKey(uid, model) {
  const keys = await getUserKeys(uid);
  const encrypted = keys[model];
  if (!encrypted) return null;
  try {
    return decrypt(encrypted);
  } catch (e) {
    console.error(`[generate-draft] failed to decrypt key for ${model}:`, e.message);
    return null;
  }
}

// ── Handler ──

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return err('method not allowed', 405);

  // Auth
  let user;
  try { user = await validateAuth(event.headers); }
  catch (e) { return e instanceof AuthError ? err(e.message, e.status) : err('auth failed', 401); }

  // Parse body
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return err('invalid JSON', 400); }

  const action = body.action || 'generate';

  // ── Action: model-status ──
  if (action === 'model-status') {
    const userKeys = await getUserKeys(user.uid);
    const status = {};

    for (const model of VALID_MODELS) {
      const hasUserKey = !!userKeys[model];
      const hasEnvKey = !!process.env[MODEL_ENV_KEYS[model]];
      let maskedKey = null;

      if (hasUserKey) {
        try { maskedKey = mask(decrypt(userKeys[model])); } catch (e) { maskedKey = '••••••••'; }
      }

      status[model] = {
        connected: hasUserKey || hasEnvKey,
        source: hasUserKey ? 'user' : (hasEnvKey ? 'env' : null),
        maskedKey,
      };
    }

    return ok({ ok: true, models: status });
  }

  // ── Action: save-key ──
  if (action === 'save-key') {
    const model = sanitizeString(body.model, 50);
    const apiKey = sanitizeString(body.apiKey, 500);

    if (!VALID_MODELS.includes(model)) return err('invalid model', 400);
    if (!apiKey || apiKey.length < 10) return err('invalid API key', 400);

    try {
      const encrypted = encrypt(apiKey);
      await db.collection('apiKeys').doc(user.uid).set(
        { [model]: encrypted, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
      console.log(`[generate-draft] saved key for ${model} (user: ${user.uid})`);
      return ok({ ok: true, model, maskedKey: mask(apiKey) });
    } catch (e) {
      console.error('[generate-draft] save-key failed:', e);
      return err('failed to save key', 500);
    }
  }

  // ── Action: delete-key ──
  if (action === 'delete-key') {
    const model = sanitizeString(body.model, 50);
    if (!VALID_MODELS.includes(model)) return err('invalid model', 400);

    try {
      const { FieldValue: FV } = require('firebase-admin').firestore;
      await db.collection('apiKeys').doc(user.uid).update({ [model]: FV.delete() });
      console.log(`[generate-draft] deleted key for ${model} (user: ${user.uid})`);
      return ok({ ok: true, model });
    } catch (e) {
      console.error('[generate-draft] delete-key failed:', e);
      return err('failed to remove key', 500);
    }
  }

  // ── Action: generate ──
  const model = sanitizeString(body.model || 'claude-sonnet', 50);
  const isTopicMode = !!body.topicId || body.mode === 'topic';

  // Validate model
  let adapter;
  try { adapter = getAdapter(model); } catch (e) { return err(`unknown model: ${model}`, 400); }

  // Get API key: user key first, then env var fallback
  const userApiKey = await getDecryptedKey(user.uid, model);
  const envKey = process.env[MODEL_ENV_KEYS[model]];
  if (!userApiKey && !envKey) return err(`no API key for ${model} — add one in Settings`, 400);

  // Fetch context (parallel)
  let voiceGuide, bannedWords, recentTweets;
  try {
    [voiceGuide, bannedWords, recentTweets] = await Promise.all([
      fetchVoiceGuide(), fetchBannedWords(), fetchRecentTweets(10),
    ]);
  } catch (e) {
    console.error('[generate-draft] context fetch failed:', e);
    return err('failed to load generation context — try again', 500);
  }

  // Build prompt
  let promptResult;
  if (isTopicMode) {
    const notes = await fetchUnusedNotes(null);
    promptResult = buildTopicPrompt({ topicName: sanitizeString(body.topicName || '', 200) }, voiceGuide, bannedWords, recentTweets, notes);
  } else {
    const sourceName = sanitizeString(body.sourceName || '', 100);
    if (!sourceName) return err('sourceName is required', 400);
    const notes = await fetchUnusedNotes(sourceName);
    promptResult = buildSourcePrompt(
      { sourceName, dayNumber: parseInt(body.dayNumber) || null, isArchive: !!body.isArchive, url: sanitizeString(body.url || '', 200), angles: sanitizeAngles(body.angles) },
      voiceGuide, bannedWords, recentTweets, notes
    );
  }

  const { systemPrompt, userPrompt, noteIds } = promptResult;

  // Call model — pass user key (adapter falls back to env var if null)
  let result;
  try { result = await adapter.generate(systemPrompt, userPrompt, userApiKey); }
  catch (e) { console.error(`[generate-draft] ${model} failed:`, e.message); return err('generation failed — try again or switch models', 500); }

  // Enforce 280 char cap
  let finalContent = result.content;
  let tcoLength = countTcoChars(finalContent);

  if (tcoLength > 280) {
    console.log(`[generate-draft] ${tcoLength} t.co chars, asking model to shorten`);
    try {
      const shorter = await adapter.generate(
        'shorten this tweet to under 280 characters. URLs count as 23 characters each. output ONLY the shortened tweet, nothing else.',
        `shorten this: ${finalContent}`,
        userApiKey
      );
      finalContent = shorter.content;
      tcoLength = countTcoChars(finalContent);
    } catch (e) { console.error('[generate-draft] shorten retry failed:', e.message); }

    if (tcoLength > 280) {
      const cut = finalContent.substring(0, 277);
      const lastPeriod = cut.lastIndexOf('.');
      finalContent = lastPeriod > 200 ? cut.substring(0, lastPeriod + 1) : cut + '...';
      tcoLength = countTcoChars(finalContent);
    }
  }

  // Save to Firestore
  const dayNum = isTopicMode
    ? (Math.floor((new Date() - new Date('2026-03-18')) / (1000 * 60 * 60 * 24)) + 1)
    : (parseInt(body.dayNumber) || null);

  const tweetDoc = {
    content: finalContent, threadParts: [],
    type: isTopicMode ? 'personality' : 'announcement',
    status: 'draft', source: model,
    sourceRef: isTopicMode
      ? { id: body.topicId || 'bot-picks', name: body.topicName || 'bot picks' }
      : { id: body.sourceId || '', name: sanitizeString(body.sourceName || '', 100) },
    dayNumber: dayNum, media: [], xPostId: null, xPostUrl: null,
    createdAt: FieldValue.serverTimestamp(), postedAt: null, updatedAt: FieldValue.serverTimestamp(),
  };

  let tweetId;
  try {
    const ref = await db.collection('tweets').add(tweetDoc);
    tweetId = ref.id;
    console.log(`[generate-draft] saved: ${tweetId} (${tcoLength} chars via ${model})`);
  } catch (e) {
    console.error('[generate-draft] Firestore save failed:', e);
    return ok({ ok: true, content: finalContent, model, charCount: tcoLength, saved: false, error: 'draft generated but failed to save' });
  }

  // Mark notes as used
  for (const noteId of noteIds) {
    try { await db.collection('notes').doc(noteId).update({ usedInTweet: tweetId }); } catch (e) {}
  }

  return ok({ ok: true, tweetId, content: finalContent, model, charCount: tcoLength, saved: true });
};
