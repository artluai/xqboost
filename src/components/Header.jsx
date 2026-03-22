import { T } from '../tokens';
import { useAuth } from '../auth';

export default function Header({ activeTab, onTabChange, stats }) {
  const { user, login, logout } = useAuth();

  return (
    <div style={S.wrap}>
      <div style={S.top}>
        <div style={S.left}>
          <span style={S.prompt}>$_</span>
          <span style={S.title}>xqboost</span>
          {stats && (
            <span style={S.stats}>
              day {stats.currentDay}/100 · {stats.draftCount} drafts · {stats.postedCount} posted
            </span>
          )}
        </div>
        <div style={S.right}>
          {user ? (
            <button style={S.authBtn} onClick={logout}>sign out</button>
          ) : (
            <button style={S.authBtn} onClick={login}>sign in</button>
          )}
        </div>
      </div>
      <div style={S.tabs}>
        {['queue', 'calendar', 'coverage', 'settings'].map(tab => (
          <span
            key={tab}
            style={activeTab === tab ? S.tabActive : S.tab}
            onClick={() => onTabChange(tab)}
          >
            {tab}
          </span>
        ))}
      </div>
    </div>
  );
}

const S = {
  wrap: {
    marginBottom: '24px',
  },
  top: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  prompt: {
    color: T.green,
    fontSize: T.titleSize,
    fontFamily: T.font,
  },
  title: {
    fontSize: T.titleSize,
    color: T.title,
    fontFamily: T.font,
  },
  stats: {
    fontSize: T.bodySize,
    color: T.dim,
    marginLeft: '8px',
    fontFamily: T.font,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
  },
  authBtn: {
    background: 'none',
    border: `1px solid ${T.border}`,
    color: T.desc,
    fontSize: T.smallSize,
    fontFamily: T.font,
    padding: '3px 10px',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    borderBottom: `1px solid ${T.border}`,
    paddingBottom: '8px',
  },
  tab: {
    fontSize: T.bodySize,
    color: T.dim,
    padding: '2px 8px',
    cursor: 'pointer',
    fontFamily: T.font,
    borderRadius: '2px',
  },
  tabActive: {
    fontSize: T.bodySize,
    color: T.green,
    padding: '2px 8px',
    cursor: 'pointer',
    fontFamily: T.font,
    border: `1px solid ${T.greenBorder}`,
    borderRadius: '2px',
  },
};
