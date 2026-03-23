import { useTheme } from '../theme';
import { useAuth } from '../auth';

export default function Header({ activeTab, onTabChange, stats }) {
  const { t, theme, toggle } = useTheme();
  const { user, login, logout } = useAuth();

  const tabs = ['queue', 'calendar', 'coverage', 'settings'];

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {theme === 'dark' ? (
            <span style={{ color: t.green, fontSize: '13px', fontFamily: t.font }}>$_</span>
          ) : (
            <div style={{ width: 28, height: 28, background: t.btnPrimary, borderRadius: t.radiusXs, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: t.btnPrimaryText, fontSize: '11px', fontWeight: 700, fontFamily: t.font }}>xq</span>
            </div>
          )}
          <span style={{ fontSize: '15px', fontWeight: 600, color: t.text, fontFamily: t.font }}>xqboost</span>
          {stats && (
            <span style={{ fontSize: '12px', color: t.textSecondary, fontFamily: t.font, marginLeft: '4px' }}>
              day {stats.currentDay}/100 · {stats.draftCount} drafts · {stats.postedCount} posted
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={toggle} style={{ background: 'none', border: `1px solid ${t.border}`, color: t.textSecondary, padding: '4px 10px', borderRadius: t.radius, fontSize: '11px', cursor: 'pointer', fontFamily: t.font }}>
            {theme === 'light' ? 'dark' : 'light'}
          </button>
          {user ? (
            <button onClick={logout} style={{ background: 'none', border: `1px solid ${t.borderHover}`, color: t.text, padding: '5px 14px', borderRadius: t.radius, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: t.font }}>sign out</button>
          ) : (
            <button onClick={login} style={{ background: t.btnPrimary, color: t.btnPrimaryText, border: 'none', padding: '5px 14px', borderRadius: t.radius, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: t.font }}>sign in</button>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${t.border}` }}>
        {tabs.map(tab => (
          <span key={tab} onClick={() => onTabChange(tab)} style={{
            padding: '10px 16px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: t.font,
            color: activeTab === tab ? t.text : t.textSecondary,
            borderBottom: activeTab === tab ? `2px solid ${t.text}` : '2px solid transparent',
          }}>{tab}</span>
        ))}
      </div>
    </div>
  );
}
