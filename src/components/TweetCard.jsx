import { useState } from 'react';
import { useTheme, formatTimeAgo } from '../theme';
import { updateTweet, deleteTweet, approveTweet, markAsPosted } from '../hooks/useTweets';

export default function TweetCard({ tweet }) {
  const { t } = useTheme();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(tweet.content);
  const [showPostUrl, setShowPostUrl] = useState(false);
  const [postUrl, setPostUrl] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isPosted = tweet.status === 'posted';
  const isApproved = tweet.status === 'approved';
  const isThread = tweet.type === 'thread' && tweet.threadParts?.length > 0;
  const [threadExpanded, setThreadExpanded] = useState(false);
  const charCount = (tweet.content || '').length;

  const badge = {
    draft: { bg: t.greenBg, color: t.greenText },
    approved: { bg: t.orangeBg, color: t.orangeText },
    posted: { bg: t.blueBg, color: t.blueText },
    failed: { bg: t.redBg, color: t.redText },
  }[tweet.status] || { bg: t.greenBg, color: t.greenText };

  const handleSave = async () => { await updateTweet(tweet.id, { content: editContent }); setEditing(false); };
  const handleApprove = () => approveTweet(tweet.id);
  const handleMarkPosted = async () => {
    if (!showPostUrl) { setShowPostUrl(true); return; }
    await markAsPosted(tweet.id, postUrl); setShowPostUrl(false); setPostUrl('');
  };
  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    await deleteTweet(tweet.id);
  };

  const btnStyle = { background: t.btnBg, border: `1px solid ${t.btnBorder}`, color: t.btnText, fontSize: '12px', padding: '4px 14px', borderRadius: t.radius, cursor: 'pointer', fontFamily: t.font, fontWeight: 500 };
  const btnPrimary = { ...btnStyle, background: t.btnPrimary, border: 'none', color: t.btnPrimaryText, fontWeight: 600 };
  const btnDanger = { ...btnStyle, border: `1px solid ${t.redBorder}`, color: t.redText };

  return (
    <div style={{ padding: '14px 0', borderBottom: `1px solid ${t.border}`, opacity: isPosted ? 0.55 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: t.radius, fontWeight: 600, fontFamily: t.font, background: badge.bg, color: badge.color }}>{tweet.status}</span>
          <span style={{ fontSize: '12px', color: t.textMuted, fontFamily: t.font }}>{tweet.type}</span>
          <span style={{ fontSize: '12px', color: t.textSecondary, fontFamily: t.font }}>via {tweet.source || 'manual'}</span>
        </div>
        <span style={{ fontSize: '12px', color: t.textSecondary, fontFamily: t.font }}>{formatTimeAgo(tweet.createdAt)}</span>
      </div>

      {editing ? (
        <div style={{ margin: '8px 0' }}>
          <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={4}
            style={{ width: '100%', background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.radiusXs, color: t.text, fontSize: '14px', fontFamily: t.font, padding: '10px', resize: 'vertical', lineHeight: '1.5', boxSizing: 'border-box', outline: 'none' }} />
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: t.textMuted, fontFamily: t.font, marginRight: 'auto' }}>{editContent.length} chars</span>
            <button style={btnPrimary} onClick={handleSave}>save</button>
            <button style={btnStyle} onClick={() => { setEditing(false); setEditContent(tweet.content); }}>cancel</button>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: '14px', color: t.text, lineHeight: '1.55', margin: '0 0 8px', fontFamily: t.font, whiteSpace: 'pre-wrap' }}>{tweet.content}</p>
      )}

      {isThread && !threadExpanded && (
        <p style={{ fontSize: '13px', color: t.textMuted, fontStyle: 'italic', margin: '4px 0', fontFamily: t.font }}>+ {tweet.threadParts.length} more parts in thread</p>
      )}
      {isThread && threadExpanded && (
        <div style={{ borderLeft: `2px solid ${t.border}`, paddingLeft: '12px', margin: '8px 0' }}>
          {tweet.threadParts.map((part, i) => (
            <p key={i} style={{ fontSize: '14px', color: t.text, margin: '6px 0', lineHeight: '1.5', fontFamily: t.font }}>{i + 2}/ {part}</p>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', color: t.textSecondary, fontFamily: t.font }}>{charCount} chars</span>
        {tweet.sourceRef && (
          <>
            <span style={{ fontSize: '12px', color: t.textSecondary, fontFamily: t.font }}>·</span>
            <span style={{ fontSize: '12px', color: t.blueLink, fontFamily: t.font }}>↳ {tweet.sourceRef.name}</span>
          </>
        )}
        {tweet.media?.length > 0 && (
          <>
            <span style={{ fontSize: '12px', color: t.textSecondary }}>·</span>
            <span style={{ fontSize: '12px', color: t.textSecondary, fontFamily: t.font }}>{tweet.media.length} media</span>
          </>
        )}
      </div>

      {isPosted ? (
        tweet.xPostUrl ? (
          <a href={tweet.xPostUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: t.blueLink, fontFamily: t.font, textDecoration: 'none', fontWeight: 500 }}>view on x ↗</a>
        ) : (
          <span style={{ fontSize: '12px', color: t.textSecondary, fontFamily: t.font }}>posted</span>
        )
      ) : (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {!editing && <button style={btnStyle} onClick={() => setEditing(true)}>edit</button>}
          {isThread && <button style={btnStyle} onClick={() => setThreadExpanded(!threadExpanded)}>{threadExpanded ? 'collapse' : 'expand thread'}</button>}
          {tweet.status === 'draft' && <button style={btnPrimary} onClick={handleApprove}>approve</button>}
          {isApproved && <button style={btnPrimary} onClick={handleMarkPosted}>post now</button>}
          {tweet.status === 'draft' && (
            <>
              <button style={btnStyle} onClick={handleMarkPosted}>{showPostUrl ? 'confirm' : 'mark posted'}</button>
              {showPostUrl && (
                <input placeholder="paste x url (optional)" value={postUrl} onChange={e => setPostUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleMarkPosted()}
                  style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.radiusXs, color: t.text, fontSize: '12px', fontFamily: t.font, padding: '4px 8px', flex: 1, minWidth: '140px', outline: 'none' }} />
              )}
            </>
          )}
          <button style={confirmDelete ? btnDanger : { ...btnStyle, color: t.textMuted, borderColor: t.border }} onClick={handleDelete}>
            {confirmDelete ? 'confirm delete' : 'delete'}
          </button>
          {confirmDelete && <button style={btnStyle} onClick={() => setConfirmDelete(false)}>cancel</button>}
        </div>
      )}
    </div>
  );
}
