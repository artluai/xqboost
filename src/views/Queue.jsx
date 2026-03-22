import { useState } from 'react';
import { T } from '../tokens';
import { useTweets } from '../hooks/useTweets';
import TweetCard from '../components/TweetCard';
import ComposeBox from '../components/ComposeBox';

export default function Queue() {
  const [filter, setFilter] = useState(null);
  const { tweets, loading } = useTweets();

  const filtered = filter ? tweets.filter(t => t.status === filter) : tweets;
  const filters = [
    { key: null, label: 'all' },
    { key: 'draft', label: 'drafts' },
    { key: 'approved', label: 'approved' },
    { key: 'posted', label: 'posted' },
  ];

  return (
    <div>
      {/* Filter tabs */}
      <div style={S.filters}>
        {filters.map(f => (
          <span
            key={f.label}
            style={filter === f.key ? S.filterActive : S.filter}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </span>
        ))}
      </div>

      {/* Tweet list */}
      <div style={S.list}>
        {loading ? (
          <div style={S.empty}>loading...</div>
        ) : filtered.length === 0 ? (
          <div style={S.empty}>
            {filter ? `no ${filter} tweets` : 'no tweets yet. compose one below or generate drafts.'}
          </div>
        ) : (
          filtered.map(tweet => (
            <TweetCard key={tweet.id} tweet={tweet} />
          ))
        )}
      </div>

      {/* Compose box */}
      <div style={S.compose}>
        <ComposeBox />
      </div>
    </div>
  );
}

const S = {
  filters: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  filter: {
    fontSize: T.smallSize,
    color: T.dim,
    padding: '2px 8px',
    cursor: 'pointer',
    fontFamily: T.font,
    borderRadius: '2px',
  },
  filterActive: {
    fontSize: T.smallSize,
    color: T.green,
    padding: '2px 8px',
    cursor: 'pointer',
    fontFamily: T.font,
    border: `1px solid ${T.greenBorder}`,
    borderRadius: '2px',
  },
  list: {
    border: `1px solid ${T.border}`,
    borderRadius: '2px',
    marginBottom: '12px',
  },
  empty: {
    padding: '24px',
    fontSize: T.bodySize,
    color: T.dim,
    fontFamily: T.font,
    textAlign: 'center',
  },
  compose: {
    marginTop: '16px',
  },
};
