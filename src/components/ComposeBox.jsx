import { useState } from 'react';
import { T, getDayNumber } from '../tokens';
import { addTweet } from '../hooks/useTweets';

export default function ComposeBox() {
  const [content, setContent] = useState('');
  const [type, setType] = useState('announcement');
  const [isThread, setIsThread] = useState(false);

  const charCount = content.length;
  const today = new Date();
  const dayNum = getDayNumber(today);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    if (isThread) {
      // Split by double newline or numbered parts
      const parts = content.split(/\n\s*\n/).filter(p => p.trim());
      const first = parts[0] || '';
      const rest = parts.slice(1);
      await addTweet({
        content: first,
        threadParts: rest,
        type: 'thread',
        source: 'manual',
        dayNumber: dayNum,
      });
    } else {
      await addTweet({
        content: content.trim(),
        type,
        source: 'manual',
        dayNumber: dayNum,
      });
    }

    setContent('');
    setIsThread(false);
  };

  return (
    <div style={S.wrap}>
      <div style={S.label}>compose / paste from grok</div>
      <textarea
        style={S.area}
        placeholder="type or paste tweet content here..."
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={3}
      />
      <div style={S.bottom}>
        <div style={S.controls}>
          <select
            style={S.select}
            value={type}
            onChange={e => setType(e.target.value)}
            disabled={isThread}
          >
            <option value="announcement">announcement</option>
            <option value="milestone">milestone</option>
            <option value="journal">journal</option>
            <option value="personality">personality</option>
            <option value="punch">punch</option>
          </select>
          <label style={S.threadToggle}>
            <input
              type="checkbox"
              checked={isThread}
              onChange={e => setIsThread(e.target.checked)}
              style={{ marginRight: '4px' }}
            />
            <span>thread</span>
          </label>
          <span style={S.chars}>{charCount} chars</span>
          {charCount > 280 && !isThread && (
            <span style={S.charWarn}>over 280</span>
          )}
        </div>
        <button
          style={content.trim() ? S.submitBtn : S.submitBtnDisabled}
          onClick={handleSubmit}
          disabled={!content.trim()}
        >
          add to queue
        </button>
      </div>
      {isThread && (
        <div style={S.threadHint}>
          separate thread parts with blank lines. first part = first tweet.
        </div>
      )}
    </div>
  );
}

const S = {
  wrap: {
    padding: '10px',
    border: `1px solid ${T.border}`,
    borderRadius: '2px',
  },
  label: {
    fontSize: T.bodySize,
    color: T.dim,
    marginBottom: '8px',
    fontFamily: T.font,
  },
  area: {
    width: '100%',
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: '2px',
    color: T.desc,
    fontSize: T.bodySize,
    fontFamily: T.font,
    padding: '10px',
    resize: 'vertical',
    lineHeight: '1.5',
    boxSizing: 'border-box',
    minHeight: '48px',
  },
  bottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
  },
  controls: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  select: {
    background: T.surface,
    border: `1px solid ${T.border}`,
    color: T.desc,
    fontSize: T.smallSize,
    fontFamily: T.font,
    padding: '2px 6px',
    borderRadius: '2px',
  },
  threadToggle: {
    fontSize: T.smallSize,
    color: T.dim,
    fontFamily: T.font,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  chars: {
    fontSize: T.smallSize,
    color: T.stack,
    fontFamily: T.font,
  },
  charWarn: {
    fontSize: T.smallSize,
    color: T.red,
    fontFamily: T.font,
  },
  submitBtn: {
    background: T.greenBg,
    border: `1px solid ${T.greenBorder}`,
    color: T.green,
    fontSize: T.smallSize,
    fontFamily: T.font,
    padding: '3px 10px',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  submitBtnDisabled: {
    background: 'none',
    border: `1px solid ${T.border}`,
    color: T.stack,
    fontSize: T.smallSize,
    fontFamily: T.font,
    padding: '3px 10px',
    cursor: 'default',
    borderRadius: '2px',
  },
  threadHint: {
    fontSize: T.tinySize,
    color: T.stack,
    fontFamily: T.font,
    marginTop: '6px',
  },
};
