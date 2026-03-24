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

  // Only count posted tweets per source (not drafts/dismissed)
  const postedBySource = {};
  const draftBySource = {};
  (tweets || []).forEach(tw => {
    if (!tw.sourceRef?.id) return;
    if (tw.status === 'posted') postedBySource[tw.sourceRef.id] = (postedBySource[tw.sourceRef.id] || 0) + 1;
    if (tw.status === 'draft' || tw.status === 'approved') draftBySource[tw.sourceRef.id] = (draftBySource[tw.sourceRef.id] || 0) + 1;
  });

  // Filter out paused/duplicate sources
  const activeSources = (sources || []).filter(s => s.status !== 'paused' && !s.duplicate);

  const filtered = activeSources.filter(s => {
    if (!filter) return true;
    if (filter === 'no-tweets') return !postedBySource[s.id] && !draftBySource[s.id];
    if (filter === 'priority') return s.status === 'priority';
    return true;
  });

  const counts = {
    total: activeSources.length,
    noTweets: activeSources.filter(s => !postedBySource[s.id] && !draftBySource[s.id]).length,
    priority: activeSources.filter(s => s.status === 'priority').length,
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
    await addTweet({ content: `$ experiment_log day ${source.dayNumber || '?'}/100... ${source.name?.toLowerCase()}. artlu.ai`, type: 'announcement', source: 'auto-draft', sourceRef: { id: source.id, name: source.name }, dayNumber: source.dayNumber });
  };

  const px = 24;
  const btnStyle = { background: 'none', border: `1px solid ${t.borderHover}`, color: t.textSecondary, fontSize: 13, padding: '6px 14px', borderRadius: 9999, cursor: 'pointer', fontFamily: t.font, fontWeight: 500 };
  const btnPrimary = { background: t.btnPrimary, border: 'none', color: t.btnPrimaryText, fontSize: 13, padding: '6px 14px', borderRadius: 9999, cursor: 'pointer', fontFamily: t.font, fontWeight: 600 };

  return (
    <div>
      {activeSources.length === 0 && (
        <div style={{ margin: `24px ${px}px`, padding: 20, border: `1px solid ${t.green}`, borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: t.text, fontFamily: t.font, marginBottom: 4 }}>no projects loaded</div>
          <div style={{ fontSize: 13, color: t.textSecondary, fontFamily: t.font, marginBottom: 12 }}>seed the database with your projects</div>
          <button style={btnPrimary} onClick={handleSeed} disabled={seeding}>{seeding ? 'seeding...' : 'seed from artlu.ai'}</button>
          {seedMsg && <div style={{ fontSize: 12, color: t.green, fontFamily: t.font, marginTop: 8 }}>{seedMsg}</div>}
        </div>
      )}

      {/* Topics */}
      <div style={{ padding: `16px ${px}px`, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 16, fontWeight: 700, fontFamily: t.font, color: t.text }}>Topics</span>
          <button style={btnPrimary} onClick={() => setShowAddTopic(!showAddTopic)}>{showAddTopic ? 'cancel' : '+ add topic'}</button>
        </div>
        <div style={{ fontSize: 13, color: t.textSecondary, fontFamily: t.font, marginBottom: 16 }}>Standalone themes the bot can tweet about.</div>

        {showAddTopic && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <input placeholder="topic name" value={newTopicName} onChange={e => setNewTopicName(e.target.value)} style={{ flex: 1, background: t.bg, border: `1px solid ${t.borderHover}`, borderRadius: 9999, color: t.text, fontSize: 14, fontFamily: t.font, padding: '8px 14px', outline: 'none' }} />
            <input placeholder="description" value={newTopicDesc} onChange={e => setNewTopicDesc(e.target.value)} style={{ flex: 1, background: t.bg, border: `1px solid ${t.borderHover}`, borderRadius: 9999, color: t.text, fontSize: 14, fontFamily: t.font, padding: '8px 14px', outline: 'none' }} />
            <button style={btnPrimary} onClick={handleAddTopic}>add</button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, fontFamily: t.font, color: t.text }}>default — bot picks its own topic</div>
            <div style={{ fontSize: 13, color: t.textSecondary, fontFamily: t.font, marginTop: 2 }}>personality-driven. whatever the bot wants to say today.</div>
          </div>
          <button style={btnStyle}>+ draft</button>
        </div>
        {topics.map(topic => (
          <div key={topic.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${t.border}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, fontFamily: t.font, color: t.text }}>{topic.name}</div>
              {topic.description && <div style={{ fontSize: 13, color: t.textSecondary, fontFamily: t.font, marginTop: 2 }}>{topic.description}</div>}
            </div>
            <button style={btnStyle}>+ draft</button>
          </div>
        ))}
      </div>

      {/* Projects */}
      <div style={{ padding: `16px ${px}px` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 700, fontFamily: t.font, color: t.text }}>Projects</span>
          <span style={{ fontSize: 13, color: t.textSecondary, fontFamily: t.font }}>{counts.total} total · {counts.noTweets} need tweets</span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[{ key: null, label: 'all' }, { key: 'no-tweets', label: 'no tweets' }, { key: 'priority', label: 'priority' }].map(f => (
            <span key={f.label} onClick={() => setFilter(f.key)} style={{
              padding: '6px 14px', fontSize: 13, borderRadius: 9999, cursor: 'pointer', fontFamily: t.font, fontWeight: filter === f.key ? 600 : 400,
              background: filter === f.key ? t.pillActiveBg : 'transparent',
              color: filter === f.key ? t.pillActiveText : t.textSecondary,
              border: filter === f.key ? 'none' : `1px solid ${t.border}`,
            }}>{f.label}</span>
          ))}
        </div>

        {filtered.map(source => {
          const posted = postedBySource[source.id] || 0;
          const drafts = draftBySource[source.id] || 0;
          const isPriority = source.status === 'priority';
          const isExpanded = expandedProject === source.id;

          return (
            <div key={source.id} style={{
              padding: '14px 0',
              borderBottom: `1px solid ${t.border}`,
              borderLeft: isPriority ? `3px solid ${t.green}` : '3px solid transparent',
              paddingLeft: isPriority ? 12 : 0,
		opacity: posted > 0 && drafts === 0 ? 0.5 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div onClick={() => setExpandedProject(isExpanded ? null : source.id)} style={{ cursor: 'pointer', flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: t.text, fontFamily: t.font, marginBottom: 4 }}>{source.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, fontFamily: t.font }}>
                    <span style={{ color: t.textSecondary }}>day {source.dayNumber || '?'}</span>
                    {posted > 0 && <span style={{ color: '#1d9bf0' }}>{posted} posted</span>}
                    {drafts > 0 && <span style={{ color: '#c2a300' }}>{drafts} in queue</span>}
                    {posted === 0 && drafts === 0 && <span style={{ color: '#dc2626' }}>no tweets</span>}
                    {isPriority && <span style={{ background: t.greenBg, color: t.greenText, fontSize: 11, padding: '1px 8px', borderRadius: 9999, fontWeight: 600 }}>priority</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <select value={source.status || 'active'} onChange={e => handleStatusChange(source.id, e.target.value)}
                    style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.textSecondary, fontSize: 13, fontFamily: t.font, padding: '4px 8px', borderRadius: 8 }}>
                    <option value="active">active</option>
                    <option value="priority">priority</option>
                    <option value="paused">paused</option>
                  </select>
                  <button style={btnStyle} onClick={() => handleDraft(source)}>+ draft</button>
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
                  <div style={{ fontSize: 12, color: t.textSecondary, fontFamily: t.font, marginBottom: 6 }}>angles to cover:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {(source.angles || []).map((a, i) => (
                      <span key={i} style={{ background: t.pillBg, color: t.pillText, fontSize: 12, padding: '3px 10px', borderRadius: 9999, fontFamily: t.font }}>{a}</span>
                    ))}
                    <input placeholder="+ add angle" value={newAngle} onChange={e => setNewAngle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddAngle(source.id, source.angles)}
                      style={{ background: 'transparent', border: `1px dashed ${t.border}`, color: t.textSecondary, fontSize: 12, fontFamily: t.font, padding: '3px 10px', borderRadius: 9999, width: 120, outline: 'none' }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
