import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { useTheme, getDayNumber } from './theme';
import { useAuth } from './auth';
import { useTweets } from './hooks/useTweets';
import Header from './components/Header';
import Landing from './components/Landing';
import Queue from './views/Queue';
import Calendar from './views/Calendar';
import Coverage from './views/Coverage';
import Settings from './views/Settings';

export default function App() {
  const { t } = useTheme();
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState('queue');
  const { tweets } = useTweets();
  const [sources, setSources] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'sources'), orderBy('dayNumber', 'desc')), (snap) => {
      setSources(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, []);

  const stats = { currentDay: getDayNumber(new Date()), draftCount: tweets.filter(x => x.status === 'draft').length, postedCount: tweets.filter(x => x.status === 'posted').length };

  if (!user) return <Landing onLogin={login} />;

  return (
    <div style={{ background: t.bg, minHeight: '100vh', fontFamily: t.font, color: t.text }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px' }}>
        <Header activeTab={activeTab} onTabChange={setActiveTab} stats={stats} />
        {activeTab === 'queue' && <Queue />}
        {activeTab === 'calendar' && <Calendar sources={sources} />}
        {activeTab === 'coverage' && <Coverage sources={sources} tweets={tweets} />}
        {activeTab === 'settings' && <Settings />}
      </div>
    </div>
  );
}
