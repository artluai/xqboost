import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useTheme, getDayNumber } from '../theme';
import { useAuth } from '../auth';

// Feather-style SVG icons as components
const Icon = ({ d, size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{typeof d === 'string' ? <path d={d} /> : d}</svg>
);

const icons = {
  queue: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  topics: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
  notes: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.18V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.28.56.86.95 1.51 1H21a2 2 0 0 1 0 4h-.09c-.65.05-1.23.44-1.51 1z"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
};

const NAV_ITEMS = [
  { key: 'queue', label: 'Queue', icon: icons.queue },
  { key: 'calendar', label: 'Calendar', icon: icons.calendar },
  { key: 'topics', label: 'Topics', icon: icons.topics },
  { key: 'notes', label: 'Notes', icon: icons.notes },
  { key: 'settings', label: 'Settings', icon: icons.settings },
];

export default function Sidebar({ activeTab, onTabChange, stats, onCompose }) {
  const { t } = useTheme();
  const { logout } = useAuth();
  const [autopostOn, setAutopostOn] = useState(false);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'autopost'));
        if (snap.exists()) setAutopostOn(snap.data().enabled === true);
      } catch {}
    })();
  }, []);

  const toggleAutopost = async () => {
    const next = !autopostOn;
    setAutopostOn(next);
    await setDoc(doc(db, 'settings', 'autopost'), { enabled: next }, { merge: true });
  };

  const dayNum = getDayNumber(new Date());

  return (
    <div style={{ padding: '4px 12px', display: 'flex', flexDirection: 'column', height: '100%', borderRight: `1px solid ${t.border}` }}>
      {/* Logo */}
      <div style={{ padding: '16px 12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36 }}>
          <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
            <rect width="36" height="36" rx="8" fill={t.text}/>
            <path d="M8 10.5L13.5 18L8 25.5H11L15 20.25L19 25.5H28L22.5 18L28 10.5H25L21 15.75L17 10.5H8Z" fill="#1d9bf0"/>
          </svg>
        </div>
        <span style={{ fontSize: 20, fontWeight: 800, color: t.text }}>xqboost</span>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1 }}>
        {NAV_ITEMS.map(item => (
          <div
            key={item.key}
            onClick={() => onTabChange(item.key)}
            onMouseEnter={() => setHovered(item.key)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 20,
              padding: '12px', borderRadius: 9999, cursor: 'pointer',
              marginBottom: 1, fontSize: 20,
              color: t.text,
              fontWeight: activeTab === item.key ? 700 : 400,
              background: hovered === item.key ? t.surface : 'transparent',
              transition: 'background 0.15s',
              fontFamily: t.font,
            }}
          >
            <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === item.key ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
              {item.icon}
            </svg>
            <span>{item.label}</span>
            {item.key === 'queue' && stats?.draftCount > 0 && (
              <span style={{
                fontSize: 12, fontWeight: 700, color: '#fff',
                background: '#1d9bf0', borderRadius: 9999,
                minWidth: 20, height: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 6px', marginLeft: 'auto',
              }}>{stats.draftCount}</span>
            )}
          </div>
        ))}

        {/* Compose button */}
        <button
          onClick={onCompose}
          style={{
            width: 'calc(100% - 24px)', margin: '16px 12px 8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px 24px', borderRadius: 9999,
            background: t.text, color: t.bg,
            fontSize: 17, fontWeight: 700,
            border: 'none', cursor: 'pointer',
            fontFamily: t.font,
            transition: 'opacity 0.15s',
          }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Draft tweet
        </button>
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: t.border, margin: '8px 12px' }} />

      {/* Autopost toggle */}
      <div style={{ padding: '4px 0' }}>
        <div
          onClick={toggleAutopost}
          onMouseEnter={() => setHovered('autopost')}
          onMouseLeave={() => setHovered(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: 12, borderRadius: 9999, cursor: 'pointer',
            background: hovered === 'autopost' ? t.surface : 'transparent',
            transition: 'background 0.15s',
          }}
        >
          <div style={{
            width: 44, height: 24, borderRadius: 12,
            background: autopostOn ? '#00ba7c' : t.borderHover,
            position: 'relative', transition: 'background 0.2s', flexShrink: 0,
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              position: 'absolute', top: 2, left: autopostOn ? 22 : 2,
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </div>
          <span style={{ fontSize: 15, color: t.textSecondary, fontFamily: t.font }}>
            <strong style={{ color: t.text, fontWeight: 600 }}>Autopost</strong> {autopostOn ? 'on' : 'off'}
          </span>
        </div>
        <div style={{ padding: '4px 12px 8px', fontSize: 13, color: t.textMuted, lineHeight: 1.6, fontFamily: t.font }}>
          <span style={{ color: t.textSecondary, fontWeight: 600, fontFamily: 'ui-monospace, "SF Mono", monospace' }}>day {dayNum} / 100</span>
          <br />
          {autopostOn ? 'next: 9am tomorrow' : 'next post: manual'}
        </div>
      </div>

      {/* Sign out */}
      <div style={{ padding: '0 12px 12px' }}>
        <button
          onClick={logout}
          onMouseEnter={() => setHovered('logout')}
          onMouseLeave={() => setHovered(null)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 14, color: t.textSecondary, fontFamily: t.font,
            padding: '8px 0',
            opacity: hovered === 'logout' ? 1 : 0.7,
            transition: 'opacity 0.15s',
          }}
        >
          sign out
        </button>
      </div>
    </div>
  );
}

// Export icons + NAV_ITEMS for mobile nav
export { icons, NAV_ITEMS };
