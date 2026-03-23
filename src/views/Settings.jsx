import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useTheme } from '../theme';

export default function Settings() {
  const { t } = useTheme();
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

  if (loading) return <div style={{ padding: '24px', fontSize: '13px', color: t.textSecondary, fontFamily: t.font, textAlign: 'center' }}>loading...</div>;

  return (
    <div>
      <div style={{ border: `1px solid ${t.border}`, borderRadius: t.radiusSm, padding: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: t.text, fontFamily: t.font, marginBottom: '4px' }}>posting phase</div>
        <div style={{ fontSize: '12px', color: t.textSecondary, fontFamily: t.font, marginBottom: '14px' }}>controls how tweets get posted</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { key: 'manual', label: 'manual', desc: 'copy-paste to X yourself, mark as posted' },
            { key: 'approved', label: 'approved', desc: 'review drafts, click post — bot posts via X API' },
            { key: 'auto', label: 'full auto', desc: 'bot generates and posts automatically' },
          ].map(p => (
            <div key={p.key} onClick={() => save({ phase: p.key })} style={{
              padding: '10px 14px', border: `1px solid ${settings.phase === p.key ? t.green : t.border}`, borderRadius: t.radiusXs, cursor: 'pointer',
              background: settings.phase === p.key ? (t.name === 'light' ? '#f0fdf4' : '#041a0e') : 'transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: settings.phase === p.key ? t.green : 'transparent', border: `2px solid ${settings.phase === p.key ? t.green : t.textMuted}` }}></div>
                <span style={{ fontSize: '13px', fontWeight: 500, color: settings.phase === p.key ? t.green : t.text, fontFamily: t.font }}>{p.label}</span>
              </div>
              <div style={{ fontSize: '12px', color: t.textSecondary, fontFamily: t.font, marginLeft: '18px' }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ border: `1px solid ${t.border}`, borderRadius: t.radiusSm, padding: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: t.text, fontFamily: t.font, marginBottom: '4px' }}>banned words / phrases</div>
        <div style={{ fontSize: '12px', color: t.textSecondary, fontFamily: t.font, marginBottom: '12px' }}>the bot will never use these in auto-drafts</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {(settings.bannedWords || []).map(w => (
            <span key={w} style={{ background: t.pillBg, color: t.pillText, fontSize: '12px', padding: '3px 10px', borderRadius: t.radius, fontFamily: t.font, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {w} <span onClick={() => removeBanned(w)} style={{ cursor: 'pointer', color: t.textMuted, fontSize: '14px' }}>×</span>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input value={newWord} onChange={e => setNewWord(e.target.value)} onKeyDown={e => e.key === 'Enter' && addBanned()} placeholder="add word or phrase..."
            style={{ flex: 1, background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.radiusXs, color: t.text, fontSize: '13px', fontFamily: t.font, padding: '6px 10px', outline: 'none' }} />
          <button onClick={addBanned} style={{ background: t.btnPrimary, color: t.btnPrimaryText, border: 'none', padding: '6px 14px', borderRadius: t.radius, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: t.font }}>add</button>
        </div>
      </div>

      <div style={{ border: `1px solid ${t.border}`, borderRadius: t.radiusSm, padding: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: t.text, fontFamily: t.font, marginBottom: '4px' }}>x api</div>
        <div style={{ fontSize: '12px', color: t.textSecondary, fontFamily: t.font }}>
          {settings.xApiConfigured ? 'x api is configured. bot can post directly.' : 'not configured yet. set up in phase 2 (part 3). for now, copy-paste tweets manually.'}
        </div>
      </div>
    </div>
  );
}
