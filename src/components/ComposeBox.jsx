import { useState } from 'react';
import { useTheme, getDayNumber } from '../theme';
import { addTweet } from '../hooks/useTweets';

export default function ComposeBox() {
  const { t } = useTheme();
  const [content, setContent] = useState('');
  const [type, setType] = useState('announcement');
  const [isThread, setIsThread] = useState(false);
  const charCount = content.length;
  const dayNum = getDayNumber(new Date());

  const handleSubmit = async () => {
    if (!content.trim()) return;
    if (isThread) {
      const parts = content.split(/\n\s*\n/).filter(p => p.trim());
      await addTweet({ content: parts[0] || '', threadParts: parts.slice(1), type: 'thread', source: 'manual', dayNumber: dayNum });
    } else {
      await addTweet({ content: content.trim(), type, source: 'manual', dayNumber: dayNum });
    }
    setContent(''); setIsThread(false);
  };

  return (
    <div style={{ border: `1px solid ${t.border}`, borderRadius: t.radiusSm, padding: '14px' }}>
      <div style={{ fontSize: '12px', color: t.textSecondary, marginBottom: '8px', fontFamily: t.font }}>compose / paste from grok</div>
      <textarea value={content} onChange={e => setContent(e.target.value)} rows={2} placeholder="type or paste tweet content here..."
        style={{ width: '100%', border: `1px solid ${t.border}`, borderRadius: t.radiusXs, padding: '10px 12px', fontSize: '14px', color: t.text, fontFamily: t.font, background: t.surface, boxSizing: 'border-box', minHeight: '44px', resize: 'vertical', outline: 'none', lineHeight: '1.5' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select value={type} onChange={e => setType(e.target.value)} disabled={isThread}
            style={{ background: t.pillBg, padding: '4px 10px', borderRadius: t.radius, fontSize: '12px', color: t.pillText, border: 'none', fontFamily: t.font }}>
            <option value="announcement">announcement</option>
            <option value="milestone">milestone</option>
            <option value="personality">personality</option>
            <option value="journal">journal</option>
          </select>
          <label style={{ fontSize: '12px', color: t.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: t.font }}>
            <input type="checkbox" checked={isThread} onChange={e => setIsThread(e.target.checked)} /> thread
          </label>
          <span style={{ fontSize: '12px', color: t.textMuted, fontFamily: t.font }}>{charCount} chars</span>
          {charCount > 280 && !isThread && <span style={{ fontSize: '12px', color: t.red, fontFamily: t.font }}>over 280</span>}
        </div>
        <button onClick={handleSubmit} disabled={!content.trim()}
          style={{ background: content.trim() ? t.btnPrimary : t.pillBg, color: content.trim() ? t.btnPrimaryText : t.textMuted, border: 'none', padding: '6px 16px', borderRadius: t.radius, fontSize: '12px', fontWeight: 600, cursor: content.trim() ? 'pointer' : 'default', fontFamily: t.font }}>
          add to queue
        </button>
      </div>
      {isThread && <div style={{ fontSize: '11px', color: t.textMuted, marginTop: '6px', fontFamily: t.font }}>separate thread parts with blank lines</div>}
    </div>
  );
}
