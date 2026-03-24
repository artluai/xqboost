/**
 * xqboost auto-sync engine
 * 
 * scrapes the target website with Puppeteer, extracts project data,
 * compares against existing sources in Firestore, creates new source
 * docs when new projects are detected.
 * 
 * v2: stricter name extraction to prevent garbled/concatenated names.
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

// Validate that a scraped name looks like a real project name
function isValidProjectName(name) {
  if (!name || name.length < 2) return false;
  if (name.length > 80) return false;           // real names are short
  if (name.includes('·')) return false;          // stack separator leaked in
  if (name.includes('\t')) return false;         // tab character = cell bleed
  if (/\d{4}-\d{2}-\d{2}/.test(name)) return false; // date leaked into name
  if (/https?:\/\//.test(name)) return false;    // URL leaked into name
  // Reject if it looks like concatenated text (lowercase run > 40 chars)
  if (/[a-z]{40,}/.test(name.replace(/\s/g, ''))) return false;
  return true;
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

        // Try to get name from the first child element (h3, a, span, strong)
        // rather than the whole cell's textContent
        let name = '';
        const firstChild = nameEl.querySelector('h3, a, strong, span, b');
        if (firstChild) {
          name = firstChild.textContent?.trim();
        }
        // Fallback: first line of cell text, split on newline
        if (!name) {
          name = nameEl?.textContent?.trim()?.split('\n')[0]?.trim();
        }
        // Extra cleanup: cut at first lowercase-to-uppercase boundary
        // that looks like a description starting (e.g. "Perp Calculatorrisk management" -> "Perp Calculator")
        if (name && name.length > 60) {
          const cutMatch = name.match(/^(.{10,}?)(?=[a-z][A-Z])/);
          if (cutMatch) name = cutMatch[1];
        }

        // Find date (YYYY-MM-DD pattern)
        const rowText = row.textContent;
        const dateMatch = rowText.match(/(\d{4}-\d{2}-\d{2})/);
        const date = dateMatch ? dateMatch[1] : '';
        
        // Find links
        const links = row.querySelectorAll('a[href*="http"]');
        const url = links.length > 0 ? links[0].href : '';
        
        if (name) {
          results.push({ name: name.trim(), date, url });
        }
      });

      return results;
    });

    // Validate names server-side (page.evaluate can't call our functions)
    const validated = projects.filter(p => {
      if (!isValidProjectName(p.name)) {
        console.log(`[sync] SKIPPED garbled name: "${p.name.slice(0, 60)}..."`);
        return false;
      }
      return true;
    });

    console.log(`[sync] scraped ${projects.length} raw, ${validated.length} valid projects from ${TARGET_URL}`);
    return validated;

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
