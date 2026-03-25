import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { useTheme, getDayNumber } from './theme';
import { useAuth } from './auth';
import { useTweets } from './hooks/useTweets';
import './layout.css';
import Sidebar, { icons, NAV_ITEMS } from './components/Sidebar';
import RightPanel from './components/RightPanel';
import Header from './components/Header';
import Landing from './components/Landing';
import GenerateModal from './components/GenerateModal';
import Queue from './views/Queue';
import Calendar from './views/Calendar';
import Coverage from './views/Coverage';
import Notes from './views/Notes';
import Settings from './views/Settings';

export default function App() {
  const { t } = useTheme();
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState('queue');
  const [showCompose, setShowCompose] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const { tweets } = useTweets();
  const [sources, setSources] = useState([]);
  const [noteCount, setNoteCount] = useState(0);
  const [topicCount, setTopicCount] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'sources'), orderBy('dayNumber', 'desc')), (snap) => {
      setSources(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'notes'), (snap) => setNoteCount(snap.size), () => {});
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'topics'), (snap) => setTopicCount(snap.size), () => {});
    return unsub;
  }, []);

  const stats = {
    currentDay: getDayNumber(new Date()),
    draftCount: tweets.filter(x => x.status === 'draft').length,
    approvedCount: tweets.filter(x => x.status === 'approved').length,
    postedCount: tweets.filter(x => x.status === 'posted').length,
    sourceCount: sources.length,
    noteCount,
    topicCount,
  };

  if (!user) return <Landing onLogin={login} />;

  const handleCompose = () => {
    setShowGenModal(true);
  };

  return (
    <div className="xq-layout" style={{ background: t.bg, fontFamily: t.font, color: t.text }}>
      <div className="xq-layout-inner">

        {/* Left sidebar */}
        <aside className="xq-sidebar">
          <Sidebar
            activeTab={activeTab}
            onTabChange={(tab) => { setActiveTab(tab); setShowCompose(false); }}
            stats={stats}
            onCompose={handleCompose}
          />
        </aside>

        {/* Main feed */}
        <main className="xq-main" style={{ borderLeft: `1px solid ${t.border}`, borderRight: `1px solid ${t.border}` }}>
          <Header activeTab={activeTab} stats={stats} />
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeTab === 'queue' && <Queue showCompose={showCompose} />}
            {activeTab === 'calendar' && <Calendar sources={sources} />}
            {activeTab === 'topics' && <Coverage sources={sources} tweets={tweets} />}
            {activeTab === 'notes' && <Notes />}
            {activeTab === 'settings' && <Settings />}
          </div>
        </main>

        {/* Right panel */}
        <aside className="xq-right">
          <RightPanel tweets={tweets} sources={sources} />
        </aside>

      </div>

      {/* Mobile bottom nav */}
      <nav className="xq-mobnav" style={{ background: t.bg, borderTop: `1px solid ${t.border}` }}>
        <div className="xq-mobnav-inner">
          {NAV_ITEMS.map(item => (
            <div
              key={item.key}
              onClick={() => { setActiveTab(item.key); setShowCompose(false); }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                fontSize: 11, cursor: 'pointer', padding: '4px 12px',
                color: activeTab === item.key ? t.text : t.textSecondary,
                fontFamily: t.font,
              }}
            >
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === item.key ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
                {item.icon}
              </svg>
              {item.label}
            </div>
          ))}
        </div>
      </nav>

      {/* Generate modal */}
      <GenerateModal open={showGenModal} onClose={() => setShowGenModal(false)} />
    </div>
  );
}
