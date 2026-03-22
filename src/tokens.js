// Design tokens matching artlu.ai — rules.md
export const T = {
  bg: '#08090a',
  surface: '#0e0f11',
  border: '#1a1d22',
  title: '#f0f1f3',
  desc: '#8a8f9a',
  stack: '#3a3f48',
  dim: '#555b66',
  green: '#4ade80',
  greenBg: '#062b12',
  greenBorder: '#163d28',
  blue: '#3b82f6',
  blueDim: '#7aa2d4',
  red: '#ef4444',
  redBg: '#2a0a0a',
  redBorder: '#3d1616',
  font: "'IBM Plex Mono', monospace",
  titleSize: '12px',
  bodySize: '11px',
  smallSize: '10px',
  tinySize: '9px',
};

// Status badge colors
export const statusColors = {
  draft: { bg: T.greenBg, text: T.green, border: T.greenBorder },
  approved: { bg: '#0a1a2e', text: '#60a5fa', border: '#1e3a5f' },
  posted: { bg: T.greenBorder, text: T.green, border: T.greenBorder },
  failed: { bg: T.redBg, text: T.red, border: T.redBorder },
};

// Tweet type labels
export const typeLabels = {
  announcement: 'announcement',
  milestone: 'milestone',
  journal: 'journal',
  thread: 'thread',
  personality: 'personality',
  punch: 'punch',
};

// Challenge start date (local time, not UTC)
export const CHALLENGE_START = new Date(2026, 2, 18); // month is 0-indexed: 2 = March

export function getDayNumber(date) {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const origin = new Date(2026, 2, 18);
  const diff = Math.floor((start - origin) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

export function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const now = new Date();
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'yesterday';
  return `${Math.floor(diff / 86400)}d ago`;
}
