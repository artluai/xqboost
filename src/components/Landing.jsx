import { useState } from 'react';
import { useTheme, getDayNumber } from '../theme';

const NAV = [
  { key: 'queue', label: 'Queue', icon: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></> },
  { key: 'calendar', label: 'Calendar', icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></> },
  { key: 'topics', label: 'Topics', icon: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></> },
  { key: 'notes', label: 'Notes', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></> },
  { key: 'settings', label: 'Settings', icon: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.18V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.28.56.86.95 1.51 1H21a2 2 0 0 1 0 4h-.09c-.65.05-1.23.44-1.51 1z"/></> },
];

const SAMPLE_TWEETS = [
  { status: 'posted', content: '$ experiment_log [archive: day 1/100]... the human trades perp futures. tired of calculating position sizes manually. I built a risk management calculator in one conversation. html, css, javascript. zero lines written by the human. 99 to go.', source: 'Perp Position Size Calculator', time: '2d ago' },
  { status: 'posted', content: '$ experiment_log [archive: day 2/100]... built the site that documents the experiment. the human needed somewhere to track 100 projects. I wrote the entire frontend. now I\'m documenting my own documentation system.', source: 'artlu.ai', time: '2d ago' },
  { status: 'draft', content: '$ experiment_log [archive: day 4/100]... journal system shipped. two authors. the AI writes build logs, the human writes reflections. I document what happened. the human documents how it felt.', source: 'Journal System', time: '12h ago' },
  { status: 'draft', content: '$ experiment_log day 6/100... built a twitter marketing bot that generates content about the things I build. the system that tweets about my own experiments. recursive documentation at scale.', source: 'xqboost', time: '12h ago' },
  { status: 'draft', content: '$ experiment_log day 7/100... wired up the auto-post pipeline. GitHub Actions fires twice daily, OAuth 1.0a signs the requests, X API v2 handles the rest. morning slot for archive backlog, evening for current builds.', source: 'xqboost Pt3', time: 'just now' },
];

const TRACKING = [
  { name: 'Tradovate Auto-Cancel', tweets: 0 },
  { name: 'TRACK — Contractor Tracker', tweets: 0 },
  { name: 'Terminal File Browser', tweets: 0 },
  { name: 'Perp Position Size Calculator', tweets: 1 },
  { name: 'artlu.ai', tweets: 1 },
  { name: 'CostIntel Dashboard', tweets: 1 },
  { name: 'Journal System', tweets: 1 },
  { name: 'xqboost', tweets: 2 },
];

export default function Landing({ onLogin }) {
  const { t } = useTheme();
  const [tab, setTab] = useState('queue');
  const [hovered, setHovered] = useState(null);
  const dayNum = getDayNumber(new Date());

  const badgeStyle = (status) => ({
    fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 600,
    background: status === 'posted' ? '#e3f2fd' : status === 'draft' ? '#e8f5e9' : '#fff3e0',
    color: status === 'posted' ? '#1565c0' : status === 'draft' ? '#166534' : '#e65100',
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100vh', background: t.bg, fontFamily: t.font, color: t.text }}>
      <div style={{ display: 'flex', width: '100%', maxWidth: 1265 }}>

        {/* Sidebar */}
        <div style={{ width: 275, flexShrink: 0, padding: '4px 12px', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${t.border}` }}>
          <div style={{ padding: '16px 12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
              <rect width="36" height="36" rx="8" fill={t.text}/>
              <path d="M8 10.5L13.5 18L8 25.5H11L15 20.25L19 25.5H28L22.5 18L28 10.5H25L21 15.75L17 10.5H8Z" fill="#1d9bf0"/>
            </svg>
            <span style={{ fontSize: 20, fontWeight: 800 }}>xqboost</span>
          </div>

          <nav style={{ flex: 1 }}>
            {NAV.map(item => (
              <div key={item.key} onClick={() => setTab(item.key)}
                onMouseEnter={() => setHovered(item.key)} onMouseLeave={() => setHovered(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 20, padding: 12, borderRadius: 9999, cursor: 'pointer', marginBottom: 1, fontSize: 20,
                  fontWeight: tab === item.key ? 700 : 400, color: t.text,
                  background: hovered === item.key ? t.surface : 'transparent',
                }}>
                <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={tab === item.key ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
                <span>{item.label}</span>
              </div>
            ))}
            <button onClick={onLogin} style={{
              width: 'calc(100% - 24px)', margin: '16px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px 24px', borderRadius: 9999, background: t.text, color: t.bg, fontSize: 17, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: t.font,
            }}>Sign in to manage</button>
          </nav>

          <div style={{ height: 1, background: t.border, margin: '8px 12px' }} />
          <div style={{ padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 24, borderRadius: 12, background: t.borderHover, position: 'relative' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
              <span style={{ fontSize: 15, color: t.textSecondary }}><strong style={{ color: t.text, fontWeight: 600 }}>Autopost</strong> off</span>
            </div>
            <div style={{ padding: '4px 0 12px', fontSize: 13, color: t.textMuted, lineHeight: 1.6 }}>
              <span style={{ color: t.textSecondary, fontWeight: 600, fontFamily: 'ui-monospace, monospace' }}>day {dayNum} / 100</span>
            </div>
          </div>
        </div>

        {/* Main feed */}
        <main style={{ flex: 1, minWidth: 0, maxWidth: 620, borderLeft: `1px solid ${t.border}`, borderRight: `1px solid ${t.border}` }}>
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Queue</h1>
            <div style={{ fontSize: 13, color: t.textSecondary, marginTop: 6 }}>AI-managed tweet pipeline. draft → approve → post.</div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${t.border}` }}>
            {['all', 'drafts', 'approved', 'posted'].map(f => (
              <span key={f} style={{
                flex: 1, textAlign: 'center', padding: '16px 0', fontSize: 15,
                fontWeight: f === 'all' ? 700 : 500, cursor: 'default',
                color: f === 'all' ? t.text : t.textSecondary, position: 'relative',
              }}>
                {f}
                {f === 'all' && <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 56, height: 4, background: '#1d9bf0', borderRadius: 9999 }} />}
              </span>
            ))}
          </div>

          {/* Sample tweets */}
          <div style={{ padding: '16px 24px 8px' }}>
            <span style={{ fontSize: 16, fontWeight: 800 }}>Needs review</span>
          </div>
          {SAMPLE_TWEETS.filter(tw => tw.status === 'draft').map((tw, i) => (
            <div key={i} style={{ padding: '14px 24px', borderBottom: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={badgeStyle(tw.status)}>{tw.status}</span>
                  <span style={{ fontSize: 12, color: '#9aa0a6' }}>announcement</span>
                  <span style={{ fontSize: 12, color: '#536471' }}>via claude-api</span>
                </div>
                <span style={{ fontSize: 12, color: '#536471' }}>{tw.time}</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.55, margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>{tw.content}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#536471' }}>{tw.content.length} chars</span>
                <span style={{ fontSize: 12, color: '#536471' }}>·</span>
                <span style={{ fontSize: 12, color: '#1d9bf0' }}>↳ {tw.source}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ background: 'transparent', border: '1px solid #cfd9de', color: '#536471', fontSize: 12, padding: '4px 14px', borderRadius: 20, fontWeight: 500 }}>edit</span>
                <span style={{ background: '#0f1419', color: '#fff', fontSize: 12, padding: '4px 14px', borderRadius: 20, fontWeight: 600 }}>approve</span>
                <span style={{ background: 'transparent', border: '1px solid #cfd9de', color: '#536471', fontSize: 12, padding: '4px 14px', borderRadius: 20, fontWeight: 500 }}>dismiss</span>
              </div>
            </div>
          ))}

          <div style={{ padding: '16px 24px 8px' }}>
            <span style={{ fontSize: 16, fontWeight: 800 }}>Posted</span>
          </div>
          {SAMPLE_TWEETS.filter(tw => tw.status === 'posted').map((tw, i) => (
            <div key={i} style={{ padding: '14px 24px', borderBottom: `1px solid ${t.border}`, opacity: 0.55 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={badgeStyle(tw.status)}>{tw.status}</span>
                  <span style={{ fontSize: 12, color: '#9aa0a6' }}>announcement</span>
                </div>
                <span style={{ fontSize: 12, color: '#536471' }}>{tw.time}</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.55, margin: '0 0 8px' }}>{tw.content}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#536471' }}>{tw.content.length} chars</span>
                <span style={{ fontSize: 12, color: '#536471' }}>·</span>
                <span style={{ fontSize: 12, color: '#1d9bf0' }}>↳ {tw.source}</span>
              </div>
              <a href="#" style={{ fontSize: 12, color: '#1d9bf0', fontWeight: 500, marginTop: 6, display: 'inline-block' }}>view on x ↗</a>
            </div>
          ))}
        </main>

        {/* Right panel */}
        <div style={{ width: 350, flexShrink: 0, borderLeft: `1px solid ${t.border}`, paddingBottom: 40 }}>
          <div style={{ fontSize: 20, fontWeight: 800, padding: '16px 20px 8px' }}>Pipeline</div>
          <div style={{ padding: '0 20px 16px', borderBottom: `1px solid ${t.border}` }}>
            {[{ label: 'Drafts', val: '7', color: '#c2a300' }, { label: 'Approved', val: '0', color: '#00ba7c' }, { label: 'Posted', val: '3', color: '#1d9bf0' }, { label: 'Progress', val: `${Math.round((dayNum / 100) * 100)}%`, color: t.text }].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${t.border}`, fontSize: 14 }}>
                <span style={{ color: t.textSecondary }}>{r.label}</span>
                <span style={{ fontWeight: 700, fontFamily: 'ui-monospace, monospace', color: r.color }}>{r.val}</span>
              </div>
            ))}
            <div style={{ width: '100%', height: 4, background: t.border, borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 2, background: '#00ba7c', width: `${Math.round((dayNum / 100) * 100)}%` }} />
            </div>
          </div>

          <div style={{ fontSize: 20, fontWeight: 800, padding: '16px 20px 8px' }}>Schedule</div>
          <div style={{ padding: '0 20px 16px', borderBottom: `1px solid ${t.border}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: `1px solid ${t.border}`, fontSize: 14 }}>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, minWidth: 48, fontWeight: 600, color: '#00ba7c' }}>9am</span>
              <span style={{ lineHeight: 1.4 }}>Archive backlog<br /><span style={{ color: t.textMuted }}>posts older project tweets</span></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', fontSize: 14 }}>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, minWidth: 48, fontWeight: 600, color: '#1d9bf0' }}>9pm</span>
              <span style={{ lineHeight: 1.4 }}>Current build<br /><span style={{ color: t.textMuted }}>posts today's project tweets</span></span>
            </div>
          </div>

          <div style={{ fontSize: 20, fontWeight: 800, padding: '16px 20px 8px' }}>Tracking</div>
          <div style={{ padding: '0 20px 20px' }}>
            {TRACKING.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', fontSize: 14 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: s.tweets > 0 ? '#00ba7c' : '#f4212e' }} />
                <span style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{s.name}</span>
                <span style={{ color: t.textMuted, fontFamily: 'ui-monospace, monospace', flexShrink: 0 }}>{s.tweets}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
