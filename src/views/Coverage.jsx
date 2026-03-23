import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useTheme } from '../theme';
import { addTweet } from '../hooks/useTweets';
import { seedSources, seedDefaultTopics } from '../seed';

export default function Coverage({ sources, tweets }) {
  const { t } = useTheme();
  const [topics, setTopics] = useState([]);
  const [filter, setFilter] = useState(null);
  const [expandedProject, setExpandedProject] = useState(null);
  const [newAngle, setNewAngle] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'topics'), orderBy('createdAt', 'desc')), (snap) => {
      setTopics(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const tweetCountBySource = {};
  (tweets || []).forEach(tw => { if (tw.sourceRef?.id) tweetCountBySource[tw.sourceRef.id] = (tweetCountBySource[tw.sourceRef.id] || 0) + 1; });

  const filtered = (sources || []).filter(s => {
    if (!filter) return true;
    if (filter === 'no-tweets') return !tweetCountBySource[s.id];
    if (filter === 'priority') return s.status === 'priority';
    if (filter === 'paused') return s.status === 'paused';
    return true;
  });

  const counts = {
    total: (sources || []).length,
    noTweets: (sources || []).filter(s => !tweetCountBySource[s.id]).length,
    priority: (sources || []).filter(s => s.status === 'priority').length,
    paused: (sources || []).filter(s => s.status === 'paused').length,
  };

  const handleSeed = async () => {
    setSeeding(true); setSeedMsg('seeding...');
    try {
      const a = await seedSources(); const b = await seedDefaultTopics();
      setSeedMsg(`${a.message}. ${b.message}.`);
    } catch (e) { setSeedMsg(`error: ${e.message}`); }
    setSeeding(false);
  };

  const handleStatusChange = async (id, status) => { await updateDoc(doc(db, 'sources', id), { status, updatedAt: serverTimestamp() }); };

  const handleAddAngle = async (id, angles) => {
    if (!newAngle.trim()) return;
    await updateDoc(doc(db, 'sources', id), { angles: [...(angles || []), newAngle.trim()], updatedAt: serverTimestamp() });
    setNewAngle('');
  };

  const handleAddTopic = async () => {
    if (!newTopicName.trim()) return;
    await addDoc(collection(db, 'topics'), { name: newTopicName.trim(), description: newTopicDesc.trim(), tweetCount: 0, createdAt: serverTimestamp() });
    setNewTopicName(''); setNewTopicDesc(''); setShowAddTopic(false);
  };

  const handleDraft = async (source) => {
    await addTweet({ content: `day ${source.dayNumber || '?'}/100. ${source.name?.toLowerCase()}. artlu.ai`, type: 'announcement', source: 'auto-draft', sourceRef: { id: source.id, name: source.name }, dayNumber: source.dayNumber });
  };

  const btnStyle = { background: 'none', border: `1px solid ${t.btnBorder}`, color: t.btnText, fontSize: '11px', padding: '3px 10px', borderRadius: t.radius, cursor: 'pointer', fontFamily: t.font };
  const btnPrimary = { background: t.btnPrimary, border: 'none', color: t.btnPrimaryText, fontSize: '11px', padding: '4px 12px', borderRadius: t.radius, cursor: 'pointer', fontFamily: t.font, fontWeight: 600 };

  return (
    <div>
      {(sources || []).length === 0 && (
        <div style={{ marginBottom: '24px', padding: '16px', border: `1px solid ${t.green}`, borderRadius: t.radiusSm, textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: t.text, fontFamily: t.font, marginBottom: '4px' }}>no projects loaded</div>
          <div style={{ fontSize: '12px', color: t.textSecondary, fontFamily: t.font, marginBottom: '12px' }}>seed the database with your projects</div>
          <button style={btnPrimary} onClick={handleSeed} disabled={seeding}>{seeding ? 'seeding...' : 'seed from artlu.ai'}</button>
          {seedMsg && <div style={{ fontSize: '12px', color: t.green, fontFamily: t.font, marginTop: '8px' }}>{seedMsg}</div>}
        </div>
      )}

      {/* Topics */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: t.font, color: t.text }}>Topics</span>
          <button style={btnPrimary} onClick={() => setShowAddTopic(!showAddTopic)}>{showAddTopic ? 'cancel' : '+ add topic'}</button>
        </div>
        <div style={{ fontSize: '12px', color: t.textSecondary, fontFamily: t.font, marginBottom: '12px' }}>standalone topics the bot can tweet about</div>

        {showAddTopic && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
            <input placeholder="topic name" value={newTopicName} onChange={e => setNewTopicName(e.target.value)} style={{ flex: 1, background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.radiusXs, color: t.text, fontSize: '13px', fontFamily: t.font, padding: '6px 10px', outline: 'none' }} />
            <input placeholder="description" value={newTopicDesc} onChange={e => setNewTopicDesc(e.target.value)} style={{ flex: 1, background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.radiusXs, color: t.text, fontSize: '13px', fontFamily: t.font, padding: '6px 10px', outline: 'none' }} />
            <button style={btnPrimary} onClick={handleAddTopic}>add</button>
          </div>
        )}

        <div style={{ border: `1px solid ${t.border}`, borderRadius: t.radiusSm, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', color: t.text, fontWeight: 500, fontFamily: t.font }}>default — bot picks its own topic</div>
              <div style={{ fontSize: '11px', color: t.textSecondary, fontFamily: t.font, marginTop: '2px' }}>personality-driven. whatever the bot wants to say today.</div>
            </div>
            <button style={btnStyle}>+ draft</button>
          </div>
          {topics.map(topic => (
            <div key={topic.id} style={{ padding: '12px 14px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', color: t.text, fontWeight: 500, fontFamily: t.font }}>{topic.name}</div>
                {topic.description && <div style={{ fontSize: '11px', color: t.textSecondary, fontFamily: t.font, marginTop: '2px' }}>{topic.description}</div>}
              </div>
              <button style={btnStyle}>+ draft</button>
            </div>
          ))}
        </div>
      </div>

      {/* Projects */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: t.font, color: t.text }}>Projects</span>
          <span style={{ fontSize: '12px', color: t.textSecondary, fontFamily: t.font }}>{counts.total} total · {counts.noTweets} no tweets · {counts.priority} priority · {counts.paused} paused</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {[{ key: null, label: 'all' }, { key: 'no-tweets', label: 'no tweets' }, { key: 'priority', label: 'priority' }, { key: 'paused', label: 'paused' }].map(f => (
            <span key={f.label} onClick={() => setFilter(f.key)} style={{
              padding: '4px 12px', fontSize: '12px', borderRadius: t.radius, cursor: 'pointer', fontFamily: t.font, fontWeight: filter === f.key ? 500 : 400,
              background: filter === f.key ? t.pillActiveBg : 'transparent', color: filter === f.key ? t.pillActiveText : t.pillText,
            }}>{f.label}</span>
          ))}
        </div>

        <div style={{ border: `1px solid ${t.border}`, borderRadius: t.radiusSm, overflow: 'hidden' }}>
          {filtered.map(source => {
            const count = tweetCountBySource[source.id] || 0;
            const isPaused = source.status === 'paused';
            const isPriority = source.status === 'priority';
            const isExpanded = expandedProject === source.id;

            return (
              <div key={source.id} style={{ padding: '12px 14px', borderBottom: `1px solid ${t.border}`, opacity: isPaused ? 0.4 : 1, borderLeft: isPriority ? `3px solid ${t.green}` : '3px solid transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div onClick={() => setExpandedProject(isExpanded ? null : source.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    <span style={{ fontSize: '13px', color: t.text, fontWeight: isPriority ? 600 : 500, fontFamily: t.font }}>{source.name}</span>
                    <span style={{ fontSize: '11px', color: t.textSecondary, fontFamily: t.font }}>day {source.dayNumber || '?'}</span>
                    <span style={{ fontSize: '11px', fontWeight: 500, fontFamily: t.font, color: count > 0 ? t.green : t.red }}>{count} tweet{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {isPriority && <span style={{ background: t.greenBg, color: t.greenText, fontSize: '10px', padding: '2px 8px', borderRadius: t.radius, fontWeight: 600, fontFamily: t.font }}>priority</span>}
                    <select value={source.status || 'active'} onChange={e => handleStatusChange(source.id, e.target.value)}
                      style={{ background: t.surface, border: `1px solid ${t.border}`, color: t.textSecondary, fontSize: '11px', fontFamily: t.font, padding: '2px 6px', borderRadius: t.radiusXs }}>
                      <option value="active">active</option>
                      <option value="priority">priority</option>
                      <option value="paused">paused</option>
                    </select>
                    {!isPaused && <button style={btnStyle} onClick={() => handleDraft(source)}>+ draft</button>}
                  </div>
                </div>
                {isExpanded && !isPaused && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: '12px', color: t.textSecondary, fontFamily: t.font, marginBottom: '6px' }}>angles to cover:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      {(source.angles || []).map((a, i) => (
                        <span key={i} style={{ background: t.pillBg, color: t.pillText, fontSize: '11px', padding: '2px 8px', borderRadius: t.radiusXs, fontFamily: t.font }}>{a}</span>
                      ))}
                      <input placeholder="+ add angle" value={newAngle} onChange={e => setNewAngle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddAngle(source.id, source.angles)}
                        style={{ background: 'transparent', border: `1px dashed ${t.border}`, color: t.textSecondary, fontSize: '11px', fontFamily: t.font, padding: '2px 8px', borderRadius: t.radiusXs, width: '120px', outline: 'none' }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
