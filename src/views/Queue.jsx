import { useState } from 'react';
import { useTheme } from '../theme';
import { useTweets } from '../hooks/useTweets';
import TweetCard from '../components/TweetCard';
import ComposeBox from '../components/ComposeBox';

export default function Queue({ showCompose }) {
  const { t } = useTheme();
  const [filter, setFilter] = useState(null);
  const { tweets, loading } = useTweets();

  const visible = filter === 'dismissed'
    ? tweets.filter(tw => tw.status === 'dismissed')
    : filter
      ? tweets.filter(tw => tw.status === filter)
      : tweets.filter(tw => tw.status !== 'dismissed');

  const sorted = [...visible].sort((a, b) => {
    const dayA = a.dayNumber || 999;
    const dayB = b.dayNumber || 999;
    if (dayA !== dayB) return dayA - dayB;
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  });

  const approved = sorted.filter(tw => tw.status === 'approved');
  const drafts = sorted.filter(tw => tw.status === 'draft');
  const posted = sorted.filter(tw => tw.status === 'posted');
  const failed = sorted.filter(tw => tw.status === 'failed');

  const filters = [
    { key: null, label: 'all' },
    { key: 'draft', label: 'drafts' },
    { key: 'approved', label: 'approved' },
    { key: 'posted', label: 'posted' },
    { key: 'dismissed', label: 'dismissed' },
  ];

  const px = 24; // horizontal padding for content

  const sectionTitle = (label, badge) => (
    <div style={{ padding: `16px ${px}px 8px`, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 16, fontWeight: 800, fontFamily: t.font, color: t.text }}>{label}</span>
      {badge != null && (
        <span style={{ fontSize: 12, background: '#1d9bf0', color: '#fff', borderRadius: 9999, padding: '2px 10px', fontWeight: 700 }}>{badge}</span>
      )}
    </div>
  );

  if (loading) return <div style={{ padding: 40, fontSize: 13, color: t.textSecondary, textAlign: 'center', fontFamily: t.font }}>loading...</div>;

  if (filter) {
    return (
      <div>
        <Tabs filters={filters} filter={filter} setFilter={setFilter} t={t} />
        {sorted.length === 0 ? (
          <div style={{ padding: 40, fontSize: 13, color: t.textSecondary, textAlign: 'center', fontFamily: t.font }}>no {filter} tweets</div>
        ) : (
          sorted.map(tw => <div key={tw.id} style={{ padding: `0 ${px}px` }}><TweetCard tweet={tw} /></div>)
        )}
        {showCompose && <div style={{ padding: `16px ${px}px` }}><ComposeBox /></div>}
      </div>
    );
  }

  return (
    <div>
      <Tabs filters={filters} filter={filter} setFilter={setFilter} t={t} />

      {approved.length > 0 && (
        <div style={{ borderBottom: `1px solid ${t.border}` }}>
          {sectionTitle('Up next', `${approved.length} queued`)}
          <div style={{ padding: `0 ${px}px 12px`, fontSize: 13, color: t.textMuted, fontFamily: t.font }}>Approved and ready to post.</div>
          {approved.map(tw => <div key={tw.id} style={{ padding: `0 ${px}px` }}><TweetCard tweet={tw} /></div>)}
        </div>
      )}

      {drafts.length > 0 && (
        <div style={{ borderBottom: `1px solid ${t.border}` }}>
          {sectionTitle('Needs review')}
          {drafts.map(tw => <div key={tw.id} style={{ padding: `0 ${px}px` }}><TweetCard tweet={tw} /></div>)}
        </div>
      )}

      {failed.length > 0 && (
        <div style={{ borderBottom: `1px solid ${t.border}` }}>
          {sectionTitle('Failed')}
          {failed.map(tw => <div key={tw.id} style={{ padding: `0 ${px}px` }}><TweetCard tweet={tw} /></div>)}
        </div>
      )}

      {posted.length > 0 && (
        <div style={{ borderBottom: `1px solid ${t.border}` }}>
          {sectionTitle('Posted')}
          {posted.map(tw => <div key={tw.id} style={{ padding: `0 ${px}px` }}><TweetCard tweet={tw} /></div>)}
        </div>
      )}

      {sorted.length === 0 && (
        <div style={{ padding: 40, fontSize: 13, color: t.textSecondary, textAlign: 'center', fontFamily: t.font }}>no tweets yet. compose one below or generate drafts.</div>
      )}

      {showCompose && <div style={{ padding: `16px ${px}px` }}><ComposeBox /></div>}
    </div>
  );
}

function Tabs({ filters, filter, setFilter, t }) {
  return (
    <div style={{ display: 'flex', borderBottom: `1px solid ${t.border}` }}>
      {filters.map(f => (
        <span
          key={f.label}
          onClick={() => setFilter(f.key)}
          style={{
            flex: 1, textAlign: 'center', padding: '16px 0',
            fontSize: 15, fontWeight: filter === f.key ? 700 : 500,
            cursor: 'pointer', fontFamily: t.font,
            color: filter === f.key ? t.text : t.textSecondary,
            position: 'relative',
          }}
        >
          {f.label}
          {filter === f.key && (
            <span style={{
              position: 'absolute', bottom: 0, left: '50%',
              transform: 'translateX(-50%)', width: 56, height: 4,
              background: '#1d9bf0', borderRadius: 9999,
            }} />
          )}
        </span>
      ))}
    </div>
  );
}
