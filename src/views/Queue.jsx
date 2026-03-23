import { useState } from 'react';
import { useTheme } from '../theme';
import { useTweets } from '../hooks/useTweets';
import TweetCard from '../components/TweetCard';
import ComposeBox from '../components/ComposeBox';

export default function Queue() {
  const { t } = useTheme();
  const [filter, setFilter] = useState(null);
  const { tweets, loading } = useTweets();
  const filtered = filter ? tweets.filter(tw => tw.status === filter) : tweets;

  const filters = [
    { key: null, label: 'all' }, { key: 'draft', label: 'drafts' },
    { key: 'approved', label: 'approved' }, { key: 'posted', label: 'posted' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        {filters.map(f => (
          <span key={f.label} onClick={() => setFilter(f.key)} style={{
            padding: '4px 12px', fontSize: '12px', borderRadius: t.radius, cursor: 'pointer', fontFamily: t.font, fontWeight: filter === f.key ? 500 : 400,
            background: filter === f.key ? t.pillActiveBg : 'transparent',
            color: filter === f.key ? t.pillActiveText : t.pillText,
          }}>{f.label}</span>
        ))}
      </div>
      <div>
        {loading ? (
          <div style={{ padding: '24px', fontSize: '13px', color: t.textSecondary, fontFamily: t.font, textAlign: 'center' }}>loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '24px', fontSize: '13px', color: t.textSecondary, fontFamily: t.font, textAlign: 'center' }}>
            {filter ? `no ${filter} tweets` : 'no tweets yet. compose one below or generate drafts.'}
          </div>
        ) : (
          filtered.map(tw => <TweetCard key={tw.id} tweet={tw} />)
        )}
      </div>
      <div style={{ marginTop: '16px' }}><ComposeBox /></div>
    </div>
  );
}
