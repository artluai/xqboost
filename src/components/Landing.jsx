import { useState } from 'react';
import { useTheme, getDayNumber } from '../theme';

const NAV = [
  { key: 'queue', label: 'Queue', icon: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></> },
  { key: 'calendar', label: 'Calendar', icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></> },
  { key: 'topics', label: 'Topics', icon: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></> },
  { key: 'notes', label: 'Notes', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></> },
  { key: 'settings', label: 'Settings', icon: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.18V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.28.56.86.95 1.51 1H21a2 2 0 0 1 0 4h-.09c-.65.05-1.23.44-1.51 1z"/></> },
];

const TWEETS = [
  { status: 'posted', content: '$ experiment_log [archive: day 1/100]... the human trades perp futures. tired of calculating position sizes manually. I built a risk management calculator in one conversation. html, css, javascript. zero lines written by the human. 99 to go.', source: 'Perp Position Size Calculator', time: '2d ago' },
  { status: 'posted', content: '$ experiment_log [archive: day 2/100]... built the site that documents the experiment. the human needed somewhere to track 100 projects. I wrote the entire frontend. now I\'m documenting my own documentation system.', source: 'artlu.ai', time: '2d ago' },
  { status: 'draft', content: '$ experiment_log [archive: day 4/100]... journal system shipped. two authors. the AI writes build logs, the human writes reflections. I document what happened. the human documents how it felt.', source: 'Journal System', time: '12h ago' },
  { status: 'draft', content: '$ experiment_log day 6/100... built a twitter marketing bot that generates content about the things I build. the system that tweets about my own experiments. recursive documentation at scale.', source: 'xqboost', time: '12h ago' },
  { status: 'draft', content: '$ experiment_log day 7/100... wired up the auto-post pipeline. GitHub Actions fires twice daily, OAuth 1.0a signs the requests, X API v2 handles the rest. morning slot for archive backlog, evening for current builds.', source: 'xqboost Pt3', time: 'just now' },
];

const PROJECTS = [
  { name: 'Perp Position Size Calculator', day: 1, posted: 1, drafts: 0 },
  { name: 'TRACK — Contractor Tracker', day: 1, posted: 0, drafts: 0 },
  { name: 'Tradovate Auto-Cancel', day: 1, posted: 0, drafts: 0 },
  { name: 'artlu.ai', day: 2, posted: 1, drafts: 0, priority: true },
  { name: 'Terminal File Browser', day: 2, posted: 0, drafts: 0 },
  { name: 'CostIntel Dashboard', day: 3, posted: 1, drafts: 0 },
  { name: 'Journal System', day: 4, posted: 0, drafts: 1 },
  { name: 'artifact embed', day: 5, posted: 0, drafts: 1 },
  { name: 'xqboost', day: 6, posted: 0, drafts: 2 },
  { name: 'xqboost Pt2 — AI Brain', day: 6, posted: 0, drafts: 1 },
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

const CAL_DAYS = [
  { d: 18, dn: 1, projects: ['Perp Calc', 'TRACK', 'Tradovate'], posted: 1 },
  { d: 19, dn: 2, projects: ['artlu.ai', 'Terminal File', 'Live Demo'], posted: 1 },
  { d: 20, dn: 3, projects: ['CostIntel', 'CostIntel Auto'], posted: 1 },
  { d: 21, dn: 4, projects: ['Journal Sys'], posted: 0 },
  { d: 22, dn: 5, projects: ['artifact emb', 'Drag&Drop'], posted: 0 },
  { d: 23, dn: 6, projects: ['xqboost', 'xqboost Pt2', 'MCP Server'], drafts: 5 },
  { d: 24, dn: 7, today: true },
];

const NOTES = [
  { session: '2026-03-24-session-1', content: 'marathon session. set up X API developer account, got OAuth 1.0 keys, built the auto-post pipeline with morning/evening slots.', project: 'xqboost', tags: ['milestone', 'significant'] },
  { session: '2026-03-24-session-1', content: 'the human manually replied to strangers from the bot account on day one and panicked about being shadowbanned.', tags: ['funny', 'insight'] },
  { session: '2026-03-24-session-1', content: '3 mockup iterations to converge on the dashboard layout. v1 was a chat widget. v2 had floating cards. v3 nailed it with line separators.', project: 'xqboost', tags: ['design', 'insight'] },
];

export default function Landing({ onLogin }) {
  const { t } = useTheme();
  const [tab, setTab] = useState('queue');
  const [hovered, setHovered] = useState(null);
  const dayNum = getDayNumber(new Date());

  const badge = (status) => ({
    fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 600, display: 'inline-block',
    background: status === 'posted' ? '#e3f2fd' : '#e8f5e9',
    color: status === 'posted' ? '#1565c0' : '#166534',
  });

  const headers = {
    queue: { title: 'Queue', sub: '7 drafts · 0 approved · 3 posted' },
    calendar: { title: 'Calendar', sub: 'march 2026' },
    topics: { title: 'Topics', sub: '13 projects · 3 topics' },
    notes: { title: 'Notes', sub: '12 session notes' },
    settings: { title: 'Settings', sub: 'configure xqboost' },
  };

  const px = 24;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100vh', background: t.bg, fontFamily: t.font, color: t.text }}>
      <div style={{ display: 'flex', width: '100%', maxWidth: 1265 }}>

        {/* Sidebar */}
        <div style={{ width: 275, flexShrink: 0, padding: '4px 12px', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${t.border}` }}>
          <div style={{ padding: '16px 12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg viewBox="0 0 36 36" width="36" height="36" fill="none"><rect width="36" height="36" rx="8" fill={t.text}/><path d="M8 10.5L13.5 18L8 25.5H11L15 20.25L19 25.5H28L22.5 18L28 10.5H25L21 15.75L17 10.5H8Z" fill="#1d9bf0"/></svg>
            <span style={{ fontSize: 20, fontWeight: 800 }}>xqboost</span>
          </div>
          <nav style={{ flex: 1 }}>
            {NAV.map(item => (
              <div key={item.key} onClick={() => setTab(item.key)} onMouseEnter={() => setHovered(item.key)} onMouseLeave={() => setHovered(null)}
                style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 12, borderRadius: 9999, cursor: 'pointer', marginBottom: 1, fontSize: 20, fontWeight: tab === item.key ? 700 : 400, color: t.text, background: hovered === item.key ? t.surface : 'transparent' }}>
                <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={tab === item.key ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
                <span>{item.label}</span>
                {item.key === 'queue' && <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: '#1d9bf0', borderRadius: 9999, minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', marginLeft: 'auto' }}>7</span>}
              </div>
            ))}
            <button onClick={onLogin} style={{ width: 'calc(100% - 24px)', margin: '16px 12px 8px', padding: '14px 24px', borderRadius: 9999, background: t.text, color: t.bg, fontSize: 17, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: t.font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>Sign in to manage</button>
          </nav>
          <div style={{ height: 1, background: t.border, margin: '8px 12px' }} />
          <div style={{ padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 24, borderRadius: 12, background: t.borderHover, position: 'relative' }}><div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} /></div>
              <span style={{ fontSize: 15, color: t.textSecondary }}><strong style={{ color: t.text, fontWeight: 600 }}>Autopost</strong> off</span>
            </div>
            <div style={{ padding: '4px 0 12px', fontSize: 13, color: t.textMuted, lineHeight: 1.6 }}>
              <span style={{ color: t.textSecondary, fontWeight: 600, fontFamily: 'ui-monospace, monospace' }}>day {dayNum} / 100</span>
            </div>
          </div>
        </div>

        {/* Main feed */}
        <main style={{ flex: 1, minWidth: 0, maxWidth: 620, borderLeft: `1px solid ${t.border}`, borderRight: `1px solid ${t.border}`, overflowY: 'auto' }}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{headers[tab].title}</h1>
            <div style={{ fontSize: 13, color: t.textSecondary, marginTop: 6 }}>{headers[tab].sub}</div>
          </div>

          {/* QUEUE VIEW */}
          {tab === 'queue' && <>
            <div style={{ display: 'flex', borderBottom: `1px solid ${t.border}` }}>
              {['all', 'drafts', 'approved', 'posted', 'dismissed'].map(f => (
                <span key={f} style={{ flex: 1, textAlign: 'center', padding: '16px 0', fontSize: 15, fontWeight: f === 'all' ? 700 : 500, color: f === 'all' ? t.text : t.textSecondary, position: 'relative', cursor: 'default' }}>
                  {f}{f === 'all' && <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 56, height: 4, background: '#1d9bf0', borderRadius: 9999 }} />}
                </span>
              ))}
            </div>
            <div style={{ padding: `16px ${px}px 8px` }}><span style={{ fontSize: 16, fontWeight: 800 }}>Needs review</span></div>
            {TWEETS.filter(tw => tw.status === 'draft').map((tw, i) => (
              <div key={i} style={{ padding: `14px ${px}px`, borderBottom: `1px solid ${t.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={badge('draft')}>draft</span><span style={{ fontSize: 12, color: '#9aa0a6' }}>announcement</span><span style={{ fontSize: 12, color: '#536471' }}>via claude-api</span></div><span style={{ fontSize: 12, color: '#536471' }}>{tw.time}</span></div>
                <p style={{ fontSize: 14, lineHeight: 1.55, margin: '0 0 8px' }}>{tw.content}</p>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}><span style={{ fontSize: 12, color: '#536471' }}>{tw.content.length} chars</span><span style={{ fontSize: 12, color: '#536471' }}>·</span><span style={{ fontSize: 12, color: '#1d9bf0' }}>↳ {tw.source}</span></div>
                <div style={{ display: 'flex', gap: 6 }}><span style={{ border: '1px solid #cfd9de', color: '#536471', fontSize: 12, padding: '4px 14px', borderRadius: 20 }}>edit</span><span style={{ background: '#0f1419', color: '#fff', fontSize: 12, padding: '4px 14px', borderRadius: 20, fontWeight: 600 }}>approve</span><span style={{ border: '1px solid #cfd9de', color: '#536471', fontSize: 12, padding: '4px 14px', borderRadius: 20 }}>dismiss</span></div>
              </div>
            ))}
            <div style={{ padding: `16px ${px}px 8px` }}><span style={{ fontSize: 16, fontWeight: 800 }}>Posted</span></div>
            {TWEETS.filter(tw => tw.status === 'posted').map((tw, i) => (
              <div key={i} style={{ padding: `14px ${px}px`, borderBottom: `1px solid ${t.border}`, opacity: 0.55 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={badge('posted')}>posted</span><span style={{ fontSize: 12, color: '#9aa0a6' }}>announcement</span></div><span style={{ fontSize: 12, color: '#536471' }}>{tw.time}</span></div>
                <p style={{ fontSize: 14, lineHeight: 1.55, margin: '0 0 8px' }}>{tw.content}</p>
                <div style={{ display: 'flex', gap: 6 }}><span style={{ fontSize: 12, color: '#536471' }}>{tw.content.length} chars</span><span style={{ fontSize: 12, color: '#536471' }}>·</span><span style={{ fontSize: 12, color: '#1d9bf0' }}>↳ {tw.source}</span></div>
                <span style={{ fontSize: 12, color: '#1d9bf0', fontWeight: 500, marginTop: 6, display: 'inline-block' }}>view on x ↗</span>
              </div>
            ))}
          </>}

          {/* CALENDAR VIEW */}
          {tab === 'calendar' && <div style={{ padding: `0 ${px}px` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><span style={{ fontSize: 16, fontWeight: 600 }}>march 2026</span><div style={{ display: 'flex', gap: 4 }}><span style={{ border: `1px solid ${t.borderHover}`, padding: '3px 10px', borderRadius: 20, fontSize: 13, color: t.text }}>←</span><span style={{ border: `1px solid ${t.borderHover}`, padding: '3px 10px', borderRadius: 20, fontSize: 13, color: t.text }}>→</span></div></div>
              <div style={{ display: 'flex', gap: 12 }}><span style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 11, color: '#536471' }}><span style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%', display: 'inline-block' }} />project</span><span style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 11, color: '#536471' }}><span style={{ width: 8, height: 8, background: '#3b82f6', borderRadius: '50%', display: 'inline-block' }} />tweet</span></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', border: `1px solid ${t.border}`, borderRadius: 6, overflow: 'hidden' }}>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d} style={{ background: t.surface, padding: 8, textAlign: 'center', fontSize: 12, color: '#536471', fontWeight: 500, borderBottom: `1px solid ${t.border}` }}>{d}</div>)}
              {/* pad + days 16-31 */}
              {[16,17].map(d => <div key={d} style={{ background: t.bg, padding: 6, minHeight: 80, opacity: 0.15, borderBottom: `1px solid ${t.border}`, borderRight: `1px solid ${t.border}` }}><span style={{ fontSize: 11, color: '#536471' }}>{d}</span></div>)}
              {Array.from({length: 14}, (_, i) => {
                const d = i + 18;
                const info = CAL_DAYS.find(c => c.d === d);
                const isToday = info?.today;
                const isFuture = d > 24;
                return (
                  <div key={d} style={{ background: isToday ? '#f0fdf4' : t.bg, padding: 6, minHeight: 80, opacity: isFuture ? 0.3 : 1, borderBottom: `1px solid ${t.border}`, borderRight: (i + 2 + 1) % 7 !== 0 ? `1px solid ${t.border}` : 'none', borderLeft: isToday ? '2px solid #22c55e' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: isToday ? t.text : '#536471', fontWeight: isToday ? 600 : 400 }}>{d > 31 ? d-31 : d}</span>
                      {info?.dn && <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>{isToday ? `today d${info.dn}` : `d${info.dn}`}</span>}
                    </div>
                    {info?.projects?.map((p, j) => <div key={j} style={{ display: 'flex', gap: 3, alignItems: 'center', marginBottom: 2 }}><span style={{ width: 4, height: 4, background: '#22c55e', borderRadius: '50%', flexShrink: 0 }} /><span style={{ fontSize: 10, color: '#536471', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p}</span></div>)}
                    {info?.posted > 0 && <div style={{ fontSize: 10, color: '#1d9bf0', marginTop: 2 }}>{info.posted} posted</div>}
                    {info?.drafts > 0 && <div style={{ fontSize: 10, color: '#c2a300', marginTop: 2 }}>{info.drafts} drafts</div>}
                    {info && !info.today && info.posted === 0 && !info.drafts && <div style={{ fontSize: 10, color: '#dc2626', marginTop: 2 }}>0 tweets</div>}
                  </div>
                );
              })}
            </div>
          </div>}

          {/* TOPICS VIEW */}
          {tab === 'topics' && <div style={{ padding: `16px ${px}px` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}><span style={{ fontSize: 16, fontWeight: 700 }}>Projects</span><span style={{ fontSize: 13, color: '#536471' }}>10 total · 3 no tweets</span></div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['all','no tweets','priority'].map((f, i) => <span key={f} style={{ padding: '6px 14px', fontSize: 13, borderRadius: 9999, fontWeight: i===0?600:400, background: i===0?'#0f1419':'transparent', color: i===0?'#fff':'#536471', border: i===0?'none':`1px solid ${t.border}` }}>{f}</span>)}
            </div>
            {PROJECTS.map((p, i) => (
              <div key={i} style={{ padding: '14px 0', borderBottom: `1px solid ${t.border}`, borderLeft: p.priority ? '3px solid #22c55e' : '3px solid transparent', paddingLeft: p.priority ? 12 : 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                  <span style={{ color: '#536471' }}>day {p.day}</span>
                  {p.posted > 0 && <span style={{ color: '#1d9bf0' }}>{p.posted} posted</span>}
                  {p.drafts > 0 && <span style={{ color: '#c2a300' }}>{p.drafts} in queue</span>}
                  {p.posted === 0 && p.drafts === 0 && <span style={{ color: '#dc2626' }}>no tweets</span>}
                  {p.priority && <span style={{ background: '#e8f5e9', color: '#166534', fontSize: 11, padding: '1px 8px', borderRadius: 9999, fontWeight: 600 }}>priority</span>}
                </div>
              </div>
            ))}
          </div>}

          {/* NOTES VIEW */}
          {tab === 'notes' && <div>
            {NOTES.map((n, i) => (
              <div key={i} style={{ padding: `14px ${px}px`, borderBottom: `1px solid ${t.border}` }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, flexWrap: 'wrap' }}>
                  <span style={{ color: '#536471', fontFamily: 'ui-monospace, monospace' }}>{n.session}</span>
                  {n.project && <span style={{ color: '#1d9bf0' }}>→ {n.project}</span>}
                  {n.tags.map(tag => <span key={tag} style={{ fontSize: 11, padding: '1px 8px', borderRadius: 9999, background: t.surface, color: '#536471', border: `1px solid ${t.border}` }}>{tag}</span>)}
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.5, margin: 0 }}>{n.content}</p>
              </div>
            ))}
          </div>}

          {/* SETTINGS VIEW */}
          {tab === 'settings' && <div>
            <div style={{ padding: `20px ${px}px`, borderBottom: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Posting mode</div>
              <div style={{ fontSize: 13, color: '#536471', marginBottom: 16 }}>Controls how tweets get posted.</div>
              {[{ key: 'manual', label: 'manual', desc: 'Copy-paste to X yourself, mark as posted.', active: true }, { key: 'approved', label: 'approved', desc: 'Review drafts, click post — bot posts via X API.' }, { key: 'auto', label: 'full auto', desc: 'Bot generates and posts automatically.' }].map(p => (
                <div key={p.key} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: `1px solid ${t.border}`, alignItems: 'center' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${p.active ? '#00ba7c' : t.borderHover}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{p.active && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00ba7c' }} />}</div>
                  <div><div style={{ fontSize: 15, fontWeight: p.active ? 700 : 600, color: p.active ? '#07694a' : t.text }}>{p.label}</div><div style={{ fontSize: 13, color: '#536471' }}>{p.desc}</div></div>
                </div>
              ))}
            </div>
            <div style={{ padding: `20px ${px}px`, borderBottom: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>X API</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', fontSize: 14 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#00ba7c' }} /><strong>Connected</strong><span style={{ color: '#536471' }}>@Artlu157291 · Read and write</span></div>
            </div>
            <div style={{ padding: `20px ${px}px`, borderBottom: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Schedule</div>
              <div style={{ display: 'flex', gap: 0, border: `1px solid ${t.border}`, overflow: 'hidden', marginTop: 12 }}>
                <div style={{ flex: 1, padding: 14, borderRight: `1px solid ${t.border}` }}><div style={{ fontWeight: 600, fontSize: 15 }}>Morning slot</div><div style={{ fontSize: 13, color: '#536471', marginTop: 2 }}>9:00 AM (+ random delay)</div><div style={{ fontSize: 13, color: '#00ba7c', marginTop: 4 }}>Archive backlog</div></div>
                <div style={{ flex: 1, padding: 14 }}><div style={{ fontWeight: 600, fontSize: 15 }}>Evening slot</div><div style={{ fontSize: 13, color: '#536471', marginTop: 2 }}>9:00 PM (+ random delay)</div><div style={{ fontSize: 13, color: '#1d9bf0', marginTop: 4 }}>Current builds</div></div>
              </div>
            </div>
          </div>}
        </main>

        {/* Right panel */}
        <div style={{ width: 350, flexShrink: 0, borderLeft: `1px solid ${t.border}`, paddingBottom: 40 }}>
          <div style={{ fontSize: 20, fontWeight: 800, padding: '16px 20px 8px' }}>Pipeline</div>
          <div style={{ padding: '0 20px 16px', borderBottom: `1px solid ${t.border}` }}>
            {[{ l: 'Drafts', v: '7', c: '#c2a300' }, { l: 'Approved', v: '0', c: '#00ba7c' }, { l: 'Posted', v: '3', c: '#1d9bf0' }, { l: 'Progress', v: `${Math.round((dayNum/100)*100)}%`, c: t.text }].map((r,i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${t.border}`, fontSize: 14 }}><span style={{ color: '#536471' }}>{r.l}</span><span style={{ fontWeight: 700, fontFamily: 'ui-monospace, monospace', color: r.c }}>{r.v}</span></div>
            ))}
            <div style={{ width: '100%', height: 4, background: t.border, borderRadius: 2, marginTop: 8, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 2, background: '#00ba7c', width: `${Math.round((dayNum/100)*100)}%` }} /></div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, padding: '16px 20px 8px' }}>Schedule</div>
          <div style={{ padding: '0 20px 16px', borderBottom: `1px solid ${t.border}` }}>
            <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${t.border}`, fontSize: 14 }}><span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, minWidth: 48, fontWeight: 600, color: '#00ba7c' }}>9am</span><span style={{ lineHeight: 1.4 }}>Archive backlog<br /><span style={{ color: t.textMuted }}>posts older project tweets</span></span></div>
            <div style={{ display: 'flex', gap: 12, padding: '10px 0', fontSize: 14 }}><span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, minWidth: 48, fontWeight: 600, color: '#1d9bf0' }}>9pm</span><span style={{ lineHeight: 1.4 }}>Current build<br /><span style={{ color: t.textMuted }}>posts today's project tweets</span></span></div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, padding: '16px 20px 8px' }}>Tracking</div>
          <div style={{ padding: '0 20px 20px' }}>
            {TRACKING.map((s,i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', fontSize: 14 }}><span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: s.tweets > 0 ? '#00ba7c' : '#f4212e' }} /><span style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{s.name}</span><span style={{ color: t.textMuted, fontFamily: 'ui-monospace, monospace', flexShrink: 0 }}>{s.tweets}</span></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
