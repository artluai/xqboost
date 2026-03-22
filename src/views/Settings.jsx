import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { T } from '../tokens';

export default function Settings() {
  const [settings, setSettings] = useState({
    bannedWords: [],
    phase: 'manual',
    xApiConfigured: false,
  });
  const [newWord, setNewWord] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const ref = doc(db, 'settings', 'global');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setSettings(snap.data());
        }
      } catch (e) {
        console.error('settings load error:', e);
      }
      setLoading(false);
    };
    load();
  }, []);

  const save = async (updates) => {
    const newSettings = { ...settings, ...updates, updatedAt: serverTimestamp() };
    setSettings(newSettings);
    const ref = doc(db, 'settings', 'global');
    await setDoc(ref, newSettings, { merge: true });
  };

  const addBannedWord = () => {
    if (!newWord.trim()) return;
    const updated = [...(settings.bannedWords || []), newWord.trim().toLowerCase()];
    save({ bannedWords: updated });
    setNewWord('');
  };

  const removeBannedWord = (word) => {
    const updated = (settings.bannedWords || []).filter(w => w !== word);
    save({ bannedWords: updated });
  };

  if (loading) return <div style={S.loading}>loading settings...</div>;

  return (
    <div>
      {/* Phase toggle */}
      <div style={S.section}>
        <div style={S.sectionTitle}>posting phase</div>
        <div style={S.sectionHint}>controls how tweets get posted</div>
        <div style={S.phaseOptions}>
          {[
            { key: 'manual', label: 'manual', desc: 'copy-paste to X yourself, mark as posted' },
            { key: 'approved', label: 'approved', desc: 'review drafts, click post — bot posts via X API' },
            { key: 'auto', label: 'full auto', desc: 'bot generates and posts automatically' },
          ].map(p => (
            <div
              key={p.key}
              style={{
                ...S.phaseOption,
                borderColor: settings.phase === p.key ? T.greenBorder : T.border,
              }}
              onClick={() => save({ phase: p.key })}
            >
              <div style={S.phaseHeader}>
                <div style={{
                  ...S.phaseRadio,
                  background: settings.phase === p.key ? T.green : 'transparent',
                  borderColor: settings.phase === p.key ? T.green : T.dim,
                }}></div>
                <span style={{
                  ...S.phaseLabel,
                  color: settings.phase === p.key ? T.green : T.desc,
                }}>{p.label}</span>
              </div>
              <div style={S.phaseDesc}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Banned words */}
      <div style={S.section}>
        <div style={S.sectionTitle}>banned words / phrases</div>
        <div style={S.sectionHint}>the bot will never use these in auto-drafts</div>
        <div style={S.wordsList}>
          {(settings.bannedWords || []).map(word => (
            <span key={word} style={S.wordTag}>
              {word}
              <span style={S.wordRemove} onClick={() => removeBannedWord(word)}>×</span>
            </span>
          ))}
        </div>
        <div style={S.addWordRow}>
          <input
            style={S.input}
            placeholder="add word or phrase..."
            value={newWord}
            onChange={e => setNewWord(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addBannedWord()}
          />
          <button style={S.addBtn} onClick={addBannedWord}>add</button>
        </div>
      </div>

      {/* X API status */}
      <div style={S.section}>
        <div style={S.sectionTitle}>x api</div>
        <div style={S.sectionHint}>
          {settings.xApiConfigured
            ? 'x api is configured. bot can post directly.'
            : 'not configured yet. set up in phase 2. for now, copy-paste tweets manually.'}
        </div>
      </div>
    </div>
  );
}

const S = {
  loading: {
    fontSize: T.bodySize,
    color: T.dim,
    fontFamily: T.font,
    padding: '24px',
    textAlign: 'center',
  },
  section: {
    marginBottom: '24px',
    padding: '12px',
    border: `1px solid ${T.border}`,
    borderRadius: '2px',
  },
  sectionTitle: {
    fontSize: T.titleSize,
    color: T.title,
    fontFamily: T.font,
    marginBottom: '4px',
  },
  sectionHint: {
    fontSize: T.smallSize,
    color: T.dim,
    fontFamily: T.font,
    marginBottom: '12px',
  },
  phaseOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  phaseOption: {
    padding: '8px 12px',
    border: `1px solid ${T.border}`,
    borderRadius: '2px',
    cursor: 'pointer',
  },
  phaseHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '2px',
  },
  phaseRadio: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    border: '1px solid',
  },
  phaseLabel: {
    fontSize: T.bodySize,
    fontFamily: T.font,
  },
  phaseDesc: {
    fontSize: T.smallSize,
    color: T.dim,
    fontFamily: T.font,
    marginLeft: '16px',
  },
  wordsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '10px',
  },
  wordTag: {
    fontSize: T.smallSize,
    color: T.desc,
    background: T.surface,
    border: `1px solid ${T.border}`,
    padding: '2px 8px',
    borderRadius: '2px',
    fontFamily: T.font,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  wordRemove: {
    color: T.dim,
    cursor: 'pointer',
    fontSize: T.titleSize,
  },
  addWordRow: {
    display: 'flex',
    gap: '8px',
  },
  input: {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: '2px',
    color: T.desc,
    fontSize: T.bodySize,
    fontFamily: T.font,
    padding: '4px 8px',
    flex: 1,
  },
  addBtn: {
    background: T.greenBg,
    border: `1px solid ${T.greenBorder}`,
    color: T.green,
    fontSize: T.smallSize,
    fontFamily: T.font,
    padding: '2px 8px',
    cursor: 'pointer',
    borderRadius: '2px',
  },
};
