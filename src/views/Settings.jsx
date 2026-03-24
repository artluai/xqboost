import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useTheme } from '../theme';
import { useAuth } from '../auth';

export default function Settings() {
  const { t } = useTheme();
  const { logout } = useAuth();
  const [settings, setSettings] = useState({ bannedWords: [], phase: 'manual', xApiConfigured: false });
  const [newWord, setNewWord] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const snap = await getDoc(doc(db, 'settings', 'global')); if (snap.exists()) setSettings(snap.data()); } catch {}
      setLoading(false);
    })();
  }, []);

  const save = async (updates) => {
    const ns = { ...settings, ...updates, updatedAt: serverTimestamp() };
    setSettings(ns);
    await setDoc(doc(db, 'settings', 'global'), ns, { merge: true });
  };

  const addBanned = () => { if (!newWord.trim()) return; save({ bannedWords: [...(settings.bannedWords || []), newWord.trim().toLowerCase()] }); setNewWord(''); };
  const removeBanned = (w) => save({ bannedWords: (settings.bannedWords || []).filter(x => x !== w) });

  if (loading) return <div style={{ padding: 24, fontSize: 13, color: t.textSecondary, fontFamily: t.font, textAlign: 'center' }}>loading...</div>;

  const sectionStyle = { padding: '20px 16px', borderBottom: `1px solid ${t.border}` };
  const titleStyle = { fontSize: 16, fontWeight: 700, color: t.text, fontFamily: t.font, marginBottom: 4 };
  const descStyle = { fontSize: 13, color: t.textSecondary, fontFamily: t.font, marginBottom: 16 };

  return (
    <div>
      {/* Posting mode */}
      <div style={sectionStyle}>
        <div style={titleStyle}>Posting mode</div>
        <div style={descStyle}>Controls how tweets get posted.</div>
        {[
          { key: 'manual', label: 'manual', desc: 'Copy-paste to X yourself, mark as posted.' },
          { key: 'approved', label: 'approved', desc: 'Review drafts, click post — bot posts via X API.' },
          { key: 'auto', label: 'full auto', desc: 'Bot generates and posts automatically.' },
        ].map(p => (
          <div key={p.key} onClick={() => save({ phase: p.key })} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 0', borderBottom: `1px solid ${t.border}`,
            cursor: 'pointer', transition: 'background 0.1s',
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${settings.phase === p.key ? '#00ba7c' : t.borderHover}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {settings.phase === p.key && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00ba7c' }} />}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: settings.phase === p.key ? 700 : 600, color: settings.phase === p.key ? '#07694a' : t.text, fontFamily: t.font }}>{p.label}</div>
              <div style={{ fontSize: 13, color: t.textSecondary, fontFamily: t.font }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Banned words */}
      <div style={sectionStyle}>
        <div style={titleStyle}>Banned words / phrases</div>
        <div style={descStyle}>The bot will never use these in auto-drafts.</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {(settings.bannedWords || []).map(w => (
            <span key={w} style={{
              fontSize: 13, padding: '4px 12px', borderRadius: 9999,
              background: t.surface, border: `1px solid ${t.border}`,
              fontFamily: t.font, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {w} <span onClick={() => removeBanned(w)} style={{ cursor: 'pointer', color: t.textMuted, fontSize: 14 }}>×</span>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={newWord} onChange={e => setNewWord(e.target.value)} onKeyDown={e => e.key === 'Enter' && addBanned()} placeholder="add word or phrase..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: 9999, border: `1px solid ${t.borderHover}`, fontSize: 14, background: t.bg, outline: 'none', color: t.text, fontFamily: t.font }} />
          <button onClick={addBanned} style={{ padding: '10px 20px', borderRadius: 9999, background: t.btnPrimary, color: t.btnPrimaryText, fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: t.font }}>Add</button>
        </div>
      </div>

      {/* X API */}
      <div style={sectionStyle}>
        <div style={titleStyle}>X API</div>
        <div style={descStyle}>Connection status for automated posting.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', fontSize: 14, fontFamily: t.font }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#00ba7c' }} />
          <strong>Connected</strong>
          <span style={{ color: t.textSecondary, marginLeft: 4 }}>@Artlu157291 · Read and write</span>
        </div>
      </div>

      {/* Schedule */}
      <div style={sectionStyle}>
        <div style={titleStyle}>Schedule</div>
        <div style={descStyle}>When the bot posts approved tweets.</div>
        <div style={{ display: 'flex', gap: 0, border: `1px solid ${t.border}`, overflow: 'hidden', borderRadius: 0 }}>
          <div style={{ flex: 1, padding: 14, borderRight: `1px solid ${t.border}` }}>
            <div style={{ fontWeight: 600, fontSize: 15, fontFamily: t.font }}>Morning slot</div>
            <div style={{ fontSize: 13, color: t.textSecondary, marginTop: 2, fontFamily: t.font }}>9:00 AM (+ random 0-90min)</div>
            <div style={{ fontSize: 13, color: '#00ba7c', marginTop: 4, fontFamily: t.font }}>Archive backlog</div>
          </div>
          <div style={{ flex: 1, padding: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 15, fontFamily: t.font }}>Evening slot</div>
            <div style={{ fontSize: 13, color: t.textSecondary, marginTop: 2, fontFamily: t.font }}>9:00 PM (+ random 0-90min)</div>
            <div style={{ fontSize: 13, color: '#1d9bf0', marginTop: 4, fontFamily: t.font }}>Current builds</div>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <div style={{ padding: '20px 16px' }}>
        <button
          onClick={logout}
          style={{
            background: 'none', border: `1px solid ${t.border}`,
            color: t.textSecondary, fontSize: 14, fontFamily: t.font,
            padding: '10px 20px', borderRadius: 9999, cursor: 'pointer',
            width: '100%',
          }}
        >
          sign out
        </button>
      </div>
    </div>
  );
}
