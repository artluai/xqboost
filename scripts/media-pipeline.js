/**
 * xqboost media pipeline
 * 
 * auto-screenshots deployed projects using Puppeteer.
 * generates branded cards (day X/100, project name, stack).
 * flags low-confidence screenshots.
 * attaches media to tweet drafts in Firestore.
 */

const puppeteer = require('puppeteer');
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const { db, storage, FieldValue } = require('./firebase-admin');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'tmp-screenshots');

// Ensure tmp directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function takeScreenshot(url, filename) {
  if (!url) return { success: false, reason: 'no url' };

  console.log(`[media] screenshotting: ${url}`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 }).catch(() => null);
    
    if (!response || response.status() >= 400) {
      return { success: false, reason: `http ${response?.status() || 'timeout'}` };
    }

    // Wait for content to render
    await new Promise(r => setTimeout(r, 3000));

    // Check for blank/loading pages
    const bodyText = await page.evaluate(() => document.body.innerText.trim());
    const isBlank = bodyText.length < 20;
    const isLoading = bodyText.toLowerCase().includes('loading') && bodyText.length < 100;

    const filepath = path.join(SCREENSHOT_DIR, filename);
    await page.screenshot({ path: filepath, type: 'png' });

    const confidence = isBlank ? 'low' : isLoading ? 'low' : 'high';
    if (confidence === 'low') {
      console.log(`[media] low confidence screenshot for ${url}: ${isBlank ? 'blank page' : 'loading state'}`);
    }

    return { success: true, filepath, confidence };
  } catch (err) {
    console.error(`[media] screenshot error for ${url}:`, err.message);
    return { success: false, reason: err.message };
  } finally {
    await browser.close();
  }
}

function generateBrandedCard(projectName, dayNumber, stack) {
  console.log(`[media] generating branded card for "${projectName}"`);

  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#08090a';
  ctx.fillRect(0, 0, width, height);

  // Border
  ctx.strokeStyle = '#1a1d22';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // Green accent line at top
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(40, 40, width - 80, 3);

  // Terminal prompt
  ctx.fillStyle = '#4ade80';
  ctx.font = '24px monospace';
  ctx.fillText('$_ xqboost', 80, 120);

  // Day counter
  ctx.fillStyle = '#555b66';
  ctx.font = '20px monospace';
  const dayText = dayNumber ? `day ${dayNumber}/100` : '';
  if (dayText) {
    const dayWidth = ctx.measureText(dayText).width;
    ctx.fillText(dayText, width - 80 - dayWidth, 120);
  }

  // Project name
  ctx.fillStyle = '#f0f1f3';
  ctx.font = '42px monospace';
  
  // Word wrap for long names
  const maxWidth = width - 160;
  const words = projectName.split(' ');
  let line = '';
  let y = 260;
  
  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, 80, y);
      line = word;
      y += 55;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 80, y);

  // Stack tags
  if (stack) {
    ctx.fillStyle = '#3a3f48';
    ctx.font = '18px monospace';
    const stackText = Array.isArray(stack) ? stack.join(' · ') : stack;
    ctx.fillText(stackText, 80, y + 60);
  }

  // Bottom tagline
  ctx.fillStyle = '#555b66';
  ctx.font = '16px monospace';
  ctx.fillText('100 projects. 100 days. zero code. just AI.', 80, height - 80);

  // Save
  const filename = `card-${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40)}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filepath, buffer);

  console.log(`[media] branded card saved: ${filename}`);
  return { filepath, filename };
}

async function uploadToStorage(filepath, destination) {
  const bucket = storage.bucket();
  await bucket.upload(filepath, {
    destination,
    metadata: { contentType: 'image/png' },
  });
  
  const file = bucket.file(destination);
  await file.makePublic();
  const url = `https://storage.googleapis.com/${bucket.name}/${destination}`;
  
  console.log(`[media] uploaded: ${destination}`);
  return url;
}

async function attachMediaToTweet(tweetId, media) {
  await db.collection('tweets').doc(tweetId).update({
    media,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

async function processMedia() {
  console.log('[media] starting media pipeline...');

  // Find drafts without media
  const draftsSnap = await db.collection('tweets')
    .where('status', '==', 'draft')
    .get();

  let processed = 0;

  for (const doc of draftsSnap.docs) {
    const tweet = doc.data();
    
    // Skip if already has media
    if (tweet.media && tweet.media.length > 0) continue;
    
    // Skip if no source ref
    if (!tweet.sourceRef?.id) continue;

    // Get source data
    const sourceDoc = await db.collection('sources').doc(tweet.sourceRef.id).get();
    if (!sourceDoc.exists) continue;
    
    const source = sourceDoc.data();
    const media = [];

    // Screenshot
    if (source.url) {
      const screenshotFile = `screenshot-${doc.id}.png`;
      const result = await takeScreenshot(source.url, screenshotFile);
      
      if (result.success) {
        try {
          const url = await uploadToStorage(result.filepath, `media/${screenshotFile}`);
          media.push({
            type: 'screenshot',
            url,
            confidence: result.confidence,
            storagePath: `media/${screenshotFile}`,
          });
        } catch (err) {
          console.error(`[media] upload error: ${err.message}`);
        }
      }
    }

    // Branded card
    const card = generateBrandedCard(
      source.name || tweet.sourceRef.name,
      source.dayNumber || tweet.dayNumber,
      source.stack || ''
    );
    
    try {
      const cardStoragePath = `media/card-${doc.id}.png`;
      const cardUrl = await uploadToStorage(card.filepath, cardStoragePath);
      media.push({
        type: 'branded-card',
        url: cardUrl,
        confidence: 'high',
        storagePath: cardStoragePath,
      });
    } catch (err) {
      console.error(`[media] card upload error: ${err.message}`);
    }

    // Attach to tweet
    if (media.length > 0) {
      await attachMediaToTweet(doc.id, media);
      console.log(`[media] attached ${media.length} media to tweet ${doc.id}`);
      processed++;
    }
  }

  console.log(`[media] done. processed ${processed} tweet(s).`);

  // Cleanup tmp files
  if (fs.existsSync(SCREENSHOT_DIR)) {
    const files = fs.readdirSync(SCREENSHOT_DIR);
    files.forEach(f => fs.unlinkSync(path.join(SCREENSHOT_DIR, f)));
  }

  return { processed };
}

processMedia()
  .then(r => { console.log('[media] complete:', JSON.stringify(r)); process.exit(0); })
  .catch(e => { console.error('[media] error:', e); process.exit(1); });
