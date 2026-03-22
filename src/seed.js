import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const PROJECTS = [
  {
    name: "Perp Position Size Calculator",
    url: "https://perp-position-size-calc.netlify.app/",
    siteUrl: "artlu.ai",
    date: "2026-03-18",
    dayNumber: 1,
    status: "active",
    angles: [],
  },
  {
    name: "TRACK — Contractor Status Tracker",
    url: "https://contractortracker.netlify.app/",
    siteUrl: "artlu.ai",
    date: "2026-03-18",
    dayNumber: 1,
    status: "active",
    angles: [],
  },
  {
    name: "Tradovate Auto-Cancel Chrome Extension",
    url: "",
    siteUrl: "artlu.ai",
    date: "2026-03-18",
    dayNumber: 1,
    status: "active",
    angles: [],
  },
  {
    name: "artlu.ai",
    url: "https://artlu.ai",
    siteUrl: "artlu.ai",
    date: "2026-03-19",
    dayNumber: 2,
    status: "priority",
    angles: ["the journey narrative", "new feature drops"],
  },
  {
    name: "artlu-tracker-mcp",
    url: "",
    siteUrl: "artlu.ai",
    date: "2026-03-19",
    dayNumber: 2,
    status: "paused",
    angles: [],
  },
  {
    name: "Terminal File Browser",
    url: "",
    siteUrl: "artlu.ai",
    date: "2026-03-19",
    dayNumber: 2,
    status: "active",
    angles: [],
  },
  {
    name: "Live Demo Iframe Embed",
    url: "",
    siteUrl: "artlu.ai",
    date: "2026-03-19",
    dayNumber: 2,
    status: "active",
    angles: [],
  },
  {
    name: "CostIntel — eCommerce Fulfillment Analytics Dashboard",
    url: "https://costintel.pages.dev/",
    siteUrl: "artlu.ai",
    date: "2026-03-20",
    dayNumber: 3,
    status: "active",
    angles: [],
  },
  {
    name: "CostIntel Fulfillment Automator",
    url: "https://costintel-automator-demo.pages.dev/",
    siteUrl: "artlu.ai",
    date: "2026-03-20",
    dayNumber: 3,
    status: "active",
    angles: [],
  },
  {
    name: "Journal System",
    url: "https://artlu.ai/journal",
    siteUrl: "artlu.ai",
    date: "2026-03-21",
    dayNumber: 4,
    status: "active",
    angles: [],
  },
  {
    name: "Drag & Drop, Tags, Permalinks — artlu.ai v2",
    url: "https://artlu.ai",
    siteUrl: "artlu.ai",
    date: "2026-03-22",
    dayNumber: 5,
    status: "active",
    angles: [],
  },
  {
    name: "artifact embed",
    url: "",
    siteUrl: "artlu.ai",
    date: "2026-03-22",
    dayNumber: 5,
    status: "active",
    angles: [],
  },
];

export async function seedSources() {
  // Check if already seeded
  const col = collection(db, 'sources');
  const existing = await getDocs(col);
  if (existing.size > 0) {
    return { seeded: false, message: `already seeded (${existing.size} sources exist)` };
  }

  let count = 0;
  for (const project of PROJECTS) {
    await addDoc(col, {
      ...project,
      tweetCount: 0,
      lastSynced: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    count++;
  }

  return { seeded: true, message: `seeded ${count} sources` };
}

export async function seedDefaultTopics() {
  const col = collection(db, 'topics');
  const existing = await getDocs(col);
  if (existing.size > 0) {
    return { seeded: false, message: `already seeded (${existing.size} topics exist)` };
  }

  const topics = [
    {
      name: "the 100-day challenge itself",
      description: "why 100 projects, the pace, what momentum looks like from the AI's side",
    },
    {
      name: "building with AI, zero code experience",
      description: "what AI-assisted dev actually looks like — the dynamic, the frustration, the output",
    },
    {
      name: "the human-AI dynamic",
      description: "observations about how the collaboration is changing both sides",
    },
  ];

  let count = 0;
  for (const topic of topics) {
    await addDoc(col, {
      ...topic,
      tweetCount: 0,
      createdAt: serverTimestamp(),
    });
    count++;
  }

  return { seeded: true, message: `seeded ${count} topics` };
}
