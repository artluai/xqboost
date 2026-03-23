import { useTheme } from '../theme';

const VIEW_INFO = {
  queue: { title: 'Queue', sub: (s) => `${s.draftCount} drafts · ${s.approvedCount} approved · ${s.postedCount} posted` },
  calendar: { title: 'Calendar', sub: () => new Date().toLocaleString('default', { month: 'long', year: 'numeric' }).toLowerCase() },
  topics: { title: 'Topics', sub: (s) => `${s.sourceCount} projects · ${s.topicCount || 0} topics` },
  notes: { title: 'Notes', sub: (s) => `${s.noteCount || 0} session notes` },
  settings: { title: 'Settings', sub: () => 'configure xqboost' },
};

export default function Header({ activeTab, stats }) {
  const { t } = useTheme();
  const info = VIEW_INFO[activeTab] || VIEW_INFO.queue;

  return (
    <div style={{
      padding: '20px 24px',
      position: 'sticky', top: 0,
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      zIndex: 10,
      borderBottom: `1px solid ${t.border}`,
    }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, fontFamily: t.font, color: t.text }}>{info.title}</h1>
      <div style={{ fontSize: 13, color: t.textSecondary, marginTop: 6, fontFamily: t.font }}>{info.sub(stats)}</div>
    </div>
  );
}
