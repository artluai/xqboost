import { useState } from 'react';
import { T, statusColors, formatTimeAgo } from '../tokens';
import { updateTweet, deleteTweet, approveTweet, markAsPosted } from '../hooks/useTweets';

export default function TweetCard({ tweet }) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(tweet.content);
  const [showPostUrl, setShowPostUrl] = useState(false);
  const [postUrl, setPostUrl] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isPosted = tweet.status === 'posted';
  const isThread = tweet.type === 'thread' && tweet.threadParts?.length > 0;
  const [threadExpanded, setThreadExpanded] = useState(false);
  const sc = statusColors[tweet.status] || statusColors.draft;
  const charCount = (tweet.content || '').length;

  const handleSave = async () => {
    await updateTweet(tweet.id, { content: editContent });
    setEditing(false);
  };

  const handleApprove = async () => {
    await approveTweet(tweet.id);
  };

  const handleMarkPosted = async () => {
    if (!showPostUrl) {
      setShowPostUrl(true);
      return;
    }
    await markAsPosted(tweet.id, postUrl);
    setShowPostUrl(false);
    setPostUrl('');
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deleteTweet(tweet.id);
  };

  return (
    <div style={{ ...S.card, opacity: isPosted ? 0.6 : 1 }}>
      {/* Top row: status, type, source, time */}
      <div style={S.topRow}>
        <div style={S.badges}>
          <span style={{ ...S.badge, background: sc.bg, color: sc.text, border: `1px solid ${sc.border || 'transparent'}` }}>
            {tweet.status}
          </span>
          <span style={S.typeBadge}>{tweet.type}</span>
          <span style={S.sourceBadge}>{tweet.source || 'manual'}</span>
        </div>
        <span style={S.time}>{formatTimeAgo(tweet.createdAt)}</span>
      </div>

      {/* Content */}
      {editing ? (
        <div style={S.editWrap}>
          <textarea
            style={S.editArea}
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            rows={4}
          />
          <div style={S.editActions}>
            <span style={S.charCount}>{editContent.length} chars</span>
            <button style={S.btnGreen} onClick={handleSave}>save</button>
            <button style={S.btn} onClick={() => { setEditing(false); setEditContent(tweet.content); }}>cancel</button>
          </div>
        </div>
      ) : (
        <p style={S.content}>{tweet.content}</p>
      )}

      {/* Thread indicator */}
      {isThread && !threadExpanded && (
        <p style={S.threadHint}>+ {tweet.threadParts.length} more parts in thread</p>
      )}

      {/* Expanded thread */}
      {isThread && threadExpanded && (
        <div style={S.threadParts}>
          {tweet.threadParts.map((part, i) => (
            <p key={i} style={S.threadPart}>{i + 2}/ {part}</p>
          ))}
        </div>
      )}

      {/* Meta row: source ref, char count */}
      <div style={S.metaRow}>
        {tweet.sourceRef && (
          <>
            <span style={S.meta}>↳ {tweet.sourceRef.name}</span>
            <span style={S.meta}>·</span>
          </>
        )}
        {isThread ? (
          <span style={S.meta}>{(tweet.threadParts?.length || 0) + 1} parts</span>
        ) : (
          <span style={S.meta}>{charCount} chars</span>
        )}
        {tweet.media?.length > 0 && (
          <>
            <span style={S.meta}>·</span>
            <span style={S.meta}>{tweet.media.length} media</span>
          </>
        )}
      </div>

      {/* Actions */}
      {isPosted ? (
        <div style={S.actions}>
          {tweet.xPostUrl ? (
            <a href={tweet.xPostUrl} target="_blank" rel="noopener noreferrer" style={S.xLink}>↗ view on x</a>
          ) : (
            <span style={S.meta}>posted</span>
          )}
        </div>
      ) : (
        <div style={S.actions}>
          {!editing && (
            <button style={S.btn} onClick={() => setEditing(true)}>edit</button>
          )}
          {isThread && (
            <button style={S.btn} onClick={() => setThreadExpanded(!threadExpanded)}>
              {threadExpanded ? 'collapse' : 'expand thread'}
            </button>
          )}
          {tweet.status === 'draft' && (
            <button style={S.btnGreen} onClick={handleApprove}>approve</button>
          )}
          {(tweet.status === 'draft' || tweet.status === 'approved') && (
            <>
              <button style={S.btnGreen} onClick={handleMarkPosted}>
                {showPostUrl ? 'confirm posted' : 'mark posted'}
              </button>
              {showPostUrl && (
                <input
                  style={S.urlInput}
                  placeholder="paste x post url (optional)"
                  value={postUrl}
                  onChange={e => setPostUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleMarkPosted()}
                />
              )}
            </>
          )}
          <button
            style={confirmDelete ? S.btnRed : S.btnDim}
            onClick={handleDelete}
          >
            {confirmDelete ? 'confirm delete' : 'delete'}
          </button>
          {confirmDelete && (
            <button style={S.btnDim} onClick={() => setConfirmDelete(false)}>cancel</button>
          )}
        </div>
      )}
    </div>
  );
}

const S = {
  card: {
    padding: '12px',
    borderBottom: `1px solid ${T.border}`,
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '6px',
  },
  badges: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  badge: {
    fontSize: T.smallSize,
    padding: '1px 6px',
    borderRadius: '2px',
    fontFamily: T.font,
  },
  typeBadge: {
    fontSize: T.smallSize,
    color: T.dim,
    fontFamily: T.font,
  },
  sourceBadge: {
    fontSize: T.smallSize,
    color: T.stack,
    fontFamily: T.font,
  },
  time: {
    fontSize: T.smallSize,
    color: T.stack,
    fontFamily: T.font,
  },
  content: {
    fontSize: T.bodySize,
    color: T.desc,
    margin: '8px 0',
    lineHeight: '1.5',
    fontFamily: T.font,
    whiteSpace: 'pre-wrap',
  },
  threadHint: {
    fontSize: T.bodySize,
    color: T.dim,
    margin: '4px 0',
    lineHeight: '1.5',
    fontFamily: T.font,
    fontStyle: 'italic',
  },
  threadParts: {
    borderLeft: `2px solid ${T.border}`,
    paddingLeft: '10px',
    margin: '8px 0',
  },
  threadPart: {
    fontSize: T.bodySize,
    color: T.desc,
    margin: '6px 0',
    lineHeight: '1.5',
    fontFamily: T.font,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '8px',
  },
  meta: {
    fontSize: T.smallSize,
    color: T.stack,
    fontFamily: T.font,
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  btn: {
    background: 'none',
    border: `1px solid ${T.border}`,
    color: T.desc,
    fontSize: T.smallSize,
    fontFamily: T.font,
    padding: '2px 8px',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  btnGreen: {
    background: 'none',
    border: `1px solid ${T.greenBorder}`,
    color: T.green,
    fontSize: T.smallSize,
    fontFamily: T.font,
    padding: '2px 8px',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  btnDim: {
    background: 'none',
    border: `1px solid ${T.border}`,
    color: T.dim,
    fontSize: T.smallSize,
    fontFamily: T.font,
    padding: '2px 8px',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  btnRed: {
    background: T.redBg,
    border: `1px solid ${T.redBorder}`,
    color: T.red,
    fontSize: T.smallSize,
    fontFamily: T.font,
    padding: '2px 8px',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  xLink: {
    fontSize: T.smallSize,
    color: T.green,
    fontFamily: T.font,
    textDecoration: 'none',
  },
  editWrap: {
    margin: '8px 0',
  },
  editArea: {
    width: '100%',
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: '2px',
    color: T.desc,
    fontSize: T.bodySize,
    fontFamily: T.font,
    padding: '8px',
    resize: 'vertical',
    lineHeight: '1.5',
    boxSizing: 'border-box',
  },
  editActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '6px',
    alignItems: 'center',
  },
  charCount: {
    fontSize: T.smallSize,
    color: T.stack,
    fontFamily: T.font,
    marginRight: 'auto',
  },
  urlInput: {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: '2px',
    color: T.desc,
    fontSize: T.smallSize,
    fontFamily: T.font,
    padding: '2px 6px',
    flex: 1,
    minWidth: '150px',
  },
};
