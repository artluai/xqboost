/**
 * xqboost auto-sync engine
 * 
 * scrapes the target website with Puppeteer, extracts project data,
 * compares against existing sources in Firestore, creates new source
 * docs when new projects are detected.
 */

const puppeteer = require('puppeteer');
const { db, FieldValue } = require('./firebase-admin');

const TARGET_URL = process.env.TARGET_URL || 'https://artlu.ai';
const CHALLENGE_START = new Date('2026-03-18');

function getDayNumber(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const diff = Math.floor((d - CHALLENGE_START) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

async function scrapeProjects() {
  console.log(`[sync] launching browser, target: ${TARGET_URL}`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for content to render (SPA)
    await new Promise(r => setTimeout(r, 5000));

    // Extract project data from the rendered DOM
    const projects = await page.evaluate(() => {
      const results = [];
      
      // Look for table rows with project data
      const rows = document.querySelectorAll('table tbody tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 2) return;
        
        const nameEl = cells[0];
        const name = nameEl?.textContent?.trim()?.split('\n')[0]?.trim();
        
        // Find date (YYYY-MM-DD pattern)
        const rowText = row.textContent;
        const dateMatch = rowText.match(/(\d{4}-\d{2}-\d{2})/);
        const date = dateMatch ? dateMatch[1] : '';
        
        // Find links
        const links = row.querySelectorAll('a[href*="http"]');
        const url = links.length > 0 ? links[0].href : '';
        
        if (name && name.length > 1 && name.length < 200) {
          results.push({ name, date, url });
        }
      });

      return results;
    });

    console.log(`[sync] scraped ${projects.length} projects from ${TARGET_URL}`);
    return projects;

  } finally {
    await browser.close();
  }
}

async function getExistingSources() {
  const snapshot = await db.collection('sources').get();
  const sources = {};
  snapshot.forEach(doc => {
    const data = doc.data();
    sources[data.name?.toLowerCase()] = { id: doc.id, ...data };
  });
  return sources;
}

async function syncProjects() {
  console.log('[sync] starting...');
  
  const scraped = await scrapeProjects();
  const existing = await getExistingSources();
  
  let newCount = 0;
  let updatedCount = 0;
  const newSources = [];

  for (const project of scraped) {
    const key = project.name?.toLowerCase();
    if (!key) continue;

    if (!existing[key]) {
      const dayNum = project.date ? getDayNumber(project.date) : null;
      
      const sourceDoc = {
        name: project.name,
        url: project.url || '',
        siteUrl: TARGET_URL,
        date: project.date || '',
        dayNumber: dayNum,
        status: 'active',
        angles: [],
        tweetCount: 0,
        lastSynced: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const ref = await db.collection('sources').add(sourceDoc);
      console.log(`[sync] NEW: "${project.name}" -> ${ref.id}`);
      newSources.push({ id: ref.id, name: project.name, dayNumber: dayNum, url: project.url });
      newCount++;
    } else {
      await db.collection('sources').doc(existing[key].id).update({
        lastSynced: FieldValue.serverTimestamp(),
      });
      updatedCount++;
    }
  }

  console.log(`[sync] done. ${newCount} new, ${updatedCount} updated.`);

  // Output for next steps in the workflow
  const fs = require('fs');
  const outputPath = process.env.GITHUB_OUTPUT;
  if (outputPath) {
    fs.appendFileSync(outputPath, `new_count=${newCount}\n`);
    fs.appendFileSync(outputPath, `has_new=${newCount > 0}\n`);
    if (newSources.length > 0) {
      fs.appendFileSync(outputPath, `new_sources=${JSON.stringify(newSources)}\n`);
    }
  }

  return { newSources, newCount, updatedCount };
}

syncProjects()
  .then(r => { console.log('[sync] complete:', JSON.stringify(r)); process.exit(0); })
  .catch(e => { console.error('[sync] error:', e); process.exit(1); });
