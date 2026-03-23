import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useTheme } from '../theme';

export default function Notes() {
  const { t } = useTheme();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'notes'), orderBy('createdAt', 'desc')),
      (snap) => { setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
      () => setLoading(false)
    );
    return unsub;
  }, []);

  if (loading) return <div style={{ padding: 24, fontSize: 13, color: t.textSecondary, textAlign: 'center', fontFamily: t.font }}>loading...</div>;

  if (notes.length === 0) return <div style={{ padding: 24, fontSize: 13, color: t.textSecondary, textAlign: 'center', fontFamily: t.font }}>no session notes yet.</div>;

  return (
    <div>
      {notes.map(note => (
        <div key={note.id} style={{ padding: '14px 16px', borderBottom: `1px solid ${t.border}`, transition: 'background 0.1s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13, flexWrap: 'wrap' }}>
            <span style={{ color: t.textSecondary, fontFamily: 'ui-monospace, monospace' }}>{note.session || ''}</span>
            {note.projectRef?.name && (
              <span style={{ color: '#1d9bf0', fontFamily: t.font }}>→ {note.projectRef.name}</span>
            )}
            {(note.tags || []).map(tag => (
              <span key={tag} style={{
                fontSize: 11, padding: '1px 8px', borderRadius: 9999,
                background: t.surface, color: t.textSecondary,
                border: `1px solid ${t.border}`, fontFamily: t.font,
              }}>{tag}</span>
            ))}
            {note.usedInTweet && (
              <span style={{ fontSize: 11, color: t.textMuted, fontFamily: t.font }}>• used in tweet</span>
            )}
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: t.text, fontFamily: t.font, margin: 0 }}>{note.content}</p>
        </div>
      ))}
    </div>
  );
}
