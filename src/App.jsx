import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { T, getDayNumber } from './tokens';
import { useAuth } from './auth';
import { useTweets } from './hooks/useTweets';
import Header from './components/Header';
import Landing from './components/Landing';
import Queue from './views/Queue';
import Calendar from './views/Calendar';
import Coverage from './views/Coverage';
import Settings from './views/Settings';

export default function App() {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState('queue');
  const { tweets } = useTweets();
  const [sources, setSources] = useState([]);

  useEffect(() => {
    const col = collection(db, 'sources');
    const q = query(col, orderBy('dayNumber', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setSources(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error('sources listener error:', err);
    });
    return unsub;
  }, []);

  const today = new Date();
  const currentDay = getDayNumber(today);
  const draftCount = tweets.filter(t => t.status === 'draft').length;
  const postedCount = tweets.filter(t => t.status === 'posted').length;
  const stats = { currentDay, draftCount, postedCount };

  if (!user) {
    return <Landing onLogin={login} />;
  }

  return (
    <div style={S.page}>
      <div style={S.container}>
        <Header activeTab={activeTab} onTabChange={setActiveTab} stats={stats} />
        {activeTab === 'queue' && <Queue />}
        {activeTab === 'calendar' && <Calendar sources={sources} />}
        {activeTab === 'coverage' && <Coverage sources={sources} tweets={tweets} />}
        {activeTab === 'settings' && <Settings />}
      </div>
    </div>
  );
}

const S = {
  page: {
    background: T.bg,
    minHeight: '100vh',
    fontFamily: T.font,
    color: T.title,
  },
  container: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '48px 24px',
  },
};
