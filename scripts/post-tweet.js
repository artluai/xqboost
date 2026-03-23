/**
 * xqboost auto-poster
 * 
 * posts approved tweets to X on a schedule.
 * 
 * two daily slots:
 *   morning (9am Bangkok) → archive posts (catching up backlog)
 *   evening (9pm Bangkok) → current/recent posts (staying current)
 * 
 * posting order within each slot:
 *   1. tweets with postOrder field (manual override, lowest first)
 *   2. dayNumber ascending, then createdAt ascending
 * 
 * checks settings/autopost toggle before doing anything.
 */

const crypto = require('crypto');
const { db, FieldValue } = require('./firebase-admin');

// X API credentials
const API_KEY = process.env.X_API_KEY;
const API_SECRET = process.env.X_API_SECRET;
const ACCESS_TOKEN = process.env.X_ACCESS_TOKEN;
const ACCESS_TOKEN_SECRET = process.env.X_ACCESS_TOKEN_SECRET;

// Which slot: 'morning' (archive) or 'evening' (current)
const SLOT = process.env.POST_SLOT || 'evening';

// Challenge start date
const CHALLENGE_START = new Date('2026-03-18');

function getCurrentDayNumber() {
  const now = new Date();
  const diff = Math.floor((now - CHALLENGE_START) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

// ── OAuth 1.0a signing ──

function percentEncode(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function generateOAuthSignature(method, url, params, consumerSecret, tokenSecret) {
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys.map(k => `${percentEncode(k)}=${percentEncode(params[k])}`).join('&');
  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  return crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
}

function buildOAuthHeader(method, url, body, apiKey, apiSecret, accessToken, accessTokenSecret) {
  const oauthParams = {
    oauth_consumer_key: apiKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0',
  };

  const signatureParams = { ...oauthParams };
  const signature = generateOAuthSignature(method, url, signatureParams, apiSecret, accessTokenSecret);
  oauthParams.oauth_signature = signature;

  const headerParts = Object.keys(oauthParams).sort().map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`);
  return `OAuth ${headerParts.join(', ')}`;
}

// ── X API posting ──

async function postTweet(text) {
  const url = 'https://api.x.com/2/tweets';
  const method = 'POST';
  const body = JSON.stringify({ text });

  const authHeader = buildOAuthHeader(method, url, body, API_KEY, API_SECRET, ACCESS_TOKEN, ACCESS_TOKEN_SECRET);

  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`X API error ${res.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

// ── Tweet selection logic ──

function isArchiveTweet(tweet) {
  return tweet.content?.includes('[archive:') || tweet.content?.includes('[from the archives]');
}

function sortTweets(tweets) {
  return tweets.sort((a, b) => {
    // 1. Manual postOrder override (lowest first)
    const aOrder = a.postOrder ?? Infinity;
    const bOrder = b.postOrder ?? Infinity;
    if (aOrder !== bOrder) return aOrder - bOrder;

    // 2. dayNumber ascending
    const aDay = a.dayNumber ?? Infinity;
    const bDay = b.dayNumber ?? Infinity;
    if (aDay !== bDay) return aDay - bDay;

    // 3. createdAt ascending
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return aTime - bTime;
  });
}

async function pickNextTweet() {
  const currentDay = getCurrentDayNumber();
  console.log(`[post] current challenge day: ${currentDay}, slot: ${SLOT}`);

  // Fetch ALL approved tweets
  const snap = await db.collection('tweets')
    .where('status', '==', 'approved')
    .get();

  if (snap.empty) return null;

  const allTweets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Split into pools
  const archives = allTweets.filter(t => isArchiveTweet(t));
  const current = allTweets.filter(t => !isArchiveTweet(t) && t.dayNumber != null);
  const random = allTweets.filter(t => !isArchiveTweet(t) && t.dayNumber == null);

  // Sort each pool
  sortTweets(archives);
  sortTweets(current);
  sortTweets(random);

  console.log(`[post] queue: ${archives.length} archive, ${current.length} current, ${random.length} random`);

  // Check for any tweet with manual postOrder override — always goes first
  const allSorted = sortTweets([...allTweets]);
  if (allSorted[0]?.postOrder != null && allSorted[0].postOrder !== Infinity) {
    console.log(`[post] manual override: tweet ${allSorted[0].id} (postOrder: ${allSorted[0].postOrder})`);
    return allSorted[0];
  }

  if (SLOT === 'morning') {
    // Morning: archive first, fallback to current, then random
    return archives[0] || current[0] || random[0] || null;
  } else {
    // Evening: current first, then random, fallback to archive
    return current[0] || random[0] || archives[0] || null;
  }
}

// ── Main ──

async function main() {
  console.log('[post] checking autopost toggle...');

  // Check on/off toggle
  try {
    const settingsDoc = await db.collection('settings').doc('autopost').get();
    if (settingsDoc.exists && settingsDoc.data().enabled === false) {
      console.log('[post] autopost is DISABLED. exiting.');
      return { posted: false, reason: 'disabled' };
    }
  } catch (e) {
    console.log('[post] no autopost settings found, defaulting to enabled');
  }

  // Validate credentials
  if (!API_KEY || !API_SECRET || !ACCESS_TOKEN || !ACCESS_TOKEN_SECRET) {
    console.error('[post] missing X API credentials');
    process.exit(1);
  }

  // Pick next tweet
  const tweet = await pickNextTweet();

  if (!tweet) {
    console.log('[post] no approved tweets in queue. nothing to post.');
    return { posted: false, reason: 'empty queue' };
  }

  console.log(`[post] selected: "${tweet.content.slice(0, 80)}..."`);
  console.log(`[post] tweet ID: ${tweet.id}, dayNumber: ${tweet.dayNumber || 'none'}, archive: ${isArchiveTweet(tweet)}`);

  // Post to X
  try {
    console.log('[post] posting to X...');
    const result = await postTweet(tweet.content);
    const postId = result.data?.id;
    const postUrl = postId ? `https://x.com/Artlu157291/status/${postId}` : null;

    console.log(`[post] success! post ID: ${postId}`);

    // Update Firestore
    await db.collection('tweets').doc(tweet.id).update({
      status: 'posted',
      xPostId: postId || null,
      xPostUrl: postUrl || null,
      postedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`[post] tweet ${tweet.id} marked as posted.`);
    return { posted: true, tweetId: tweet.id, xPostId: postId };

  } catch (err) {
    console.error(`[post] failed to post: ${err.message}`);

    await db.collection('tweets').doc(tweet.id).update({
      status: 'failed',
      error: err.message,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { posted: false, reason: err.message };
  }
}

main()
  .then(r => { console.log('[post] complete:', JSON.stringify(r)); process.exit(0); })
  .catch(e => { console.error('[post] error:', e); process.exit(1); });
