import { createContext, useContext, useState, useEffect } from 'react';

const light = {
  bg: '#ffffff',
  surface: '#f8f9fa',
  border: '#eff3f4',
  borderHover: '#cfd9de',
  text: '#0f1419',
  textSecondary: '#536471',
  textMuted: '#9aa0a6',
  green: '#22c55e',
  greenBg: '#e8f5e9',
  greenText: '#166534',
  blue: '#3b82f6',
  blueBg: '#e3f2fd',
  blueText: '#1565c0',
  blueLink: '#1d9bf0',
  orange: '#f59e0b',
  orangeBg: '#fff3e0',
  orangeText: '#e65100',
  red: '#dc2626',
  redBg: '#fef2f2',
  redText: '#dc2626',
  redBorder: '#fecaca',
  btnPrimary: '#0f1419',
  btnPrimaryText: '#ffffff',
  btnBg: 'transparent',
  btnBorder: '#cfd9de',
  btnText: '#536471',
  btnHover: '#f7f9f9',
  pillBg: '#eff3f4',
  pillText: '#536471',
  pillActiveBg: '#0f1419',
  pillActiveText: '#ffffff',
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  radius: '20px',
  radiusSm: '10px',
  radiusXs: '6px',
  name: 'light',
};

const dark = {
  bg: '#08090a',
  surface: '#0e0f11',
  border: '#1a1d22',
  borderHover: '#2a2d32',
  text: '#f0f1f3',
  textSecondary: '#8a8f9a',
  textMuted: '#555b66',
  green: '#4ade80',
  greenBg: '#062b12',
  greenText: '#4ade80',
  blue: '#3b82f6',
  blueBg: '#0c1929',
  blueText: '#60a5fa',
  blueLink: '#60a5fa',
  orange: '#f59e0b',
  orangeBg: '#1a1400',
  orangeText: '#fbbf24',
  red: '#ef4444',
  redBg: '#2a0a0a',
  redText: '#ef4444',
  redBorder: '#3d1616',
  btnPrimary: '#f0f1f3',
  btnPrimaryText: '#08090a',
  btnBg: 'transparent',
  btnBorder: '#1a1d22',
  btnText: '#8a8f9a',
  btnHover: '#0e0f11',
  pillBg: '#0e0f11',
  pillText: '#555b66',
  pillActiveBg: '#0e0f11',
  pillActiveText: '#4ade80',
  font: "'IBM Plex Mono', monospace",
  radius: '3px',
  radiusSm: '3px',
  radiusXs: '2px',
  name: 'dark',
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return window.localStorage?.getItem('xqboost-theme') || 'light'; } catch { return 'light'; }
  });

  useEffect(() => {
    try { window.localStorage?.setItem('xqboost-theme', theme); } catch {}
  }, [theme]);

  const t = theme === 'dark' ? dark : light;
  const toggle = () => setTheme(p => p === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ t, theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Shared constants
export const CHALLENGE_START = new Date(2026, 2, 18);

export function getDayNumber(date) {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const origin = new Date(2026, 2, 18);
  return Math.floor((start - origin) / (1000 * 60 * 60 * 24)) + 1;
}

export function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const now = new Date();
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'yesterday';
  return `${Math.floor(diff / 86400)}d ago`;
}
