import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const PROJECTS = [
  { name: "Perp Position Size Calculator", url: "https://perp-position-size-calc.netlify.app/", date: "2026-03-18", dayNumber: 1 },
  { name: "TRACK — Contractor Status Tracker", url: "https://contractortracker.netlify.app/", date: "2026-03-18", dayNumber: 1 },
  { name: "Tradovate Auto-Cancel Chrome Extension", url: "", date: "2026-03-18", dayNumber: 1 },
  { name: "artlu.ai", url: "https://artlu.ai", date: "2026-03-19", dayNumber: 2, status: "priority", angles: ["the journey narrative", "new feature drops"] },
  { name: "artlu-tracker-mcp", url: "", date: "2026-03-19", dayNumber: 2, status: "paused" },
  { name: "Terminal File Browser", url: "", date: "2026-03-19", dayNumber: 2 },
  { name: "Live Demo Iframe Embed", url: "", date: "2026-03-19", dayNumber: 2 },
  { name: "CostIntel — eCommerce Fulfillment Analytics Dashboard", url: "https://costintel.pages.dev/", date: "2026-03-20", dayNumber: 3 },
  { name: "CostIntel Fulfillment Automator", url: "https://costintel-automator-demo.pages.dev/", date: "2026-03-20", dayNumber: 3 },
  { name: "Journal System", url: "https://artlu.ai/journal", date: "2026-03-21", dayNumber: 4 },
  { name: "Drag & Drop, Tags, Permalinks — artlu.ai v2", url: "https://artlu.ai", date: "2026-03-22", dayNumber: 5 },
  { name: "artifact embed", url: "", date: "2026-03-22", dayNumber: 5 },
];

export async function seedSources() {
  const col = collection(db, 'sources');
  const existing = await getDocs(col);
  if (existing.size > 0) return { seeded: false, message: `already seeded (${existing.size} sources)` };

  let count = 0;
  for (const p of PROJECTS) {
    await addDoc(col, { ...p, siteUrl: 'artlu.ai', status: p.status || 'active', angles: p.angles || [], tweetCount: 0, lastSynced: serverTimestamp(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    count++;
  }
  return { seeded: true, message: `seeded ${count} sources` };
}

export async function seedDefaultTopics() {
  const col = collection(db, 'topics');
  const existing = await getDocs(col);
  if (existing.size > 0) return { seeded: false, message: `already seeded (${existing.size} topics)` };

  const topics = [
    { name: "the 100-day challenge itself", description: "why 100 projects, the pace, what momentum looks like from the AI's side" },
    { name: "building with AI, zero code experience", description: "what AI-assisted dev actually looks like — the dynamic, the frustration, the output" },
    { name: "the human-AI dynamic", description: "observations about how the collaboration is changing both sides" },
  ];

  let count = 0;
  for (const topic of topics) {
    await addDoc(col, { ...topic, tweetCount: 0, createdAt: serverTimestamp() });
    count++;
  }
  return { seeded: true, message: `seeded ${count} topics` };
}
