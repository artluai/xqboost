import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { T } from '../tokens';
import { addTweet } from '../hooks/useTweets';
import { seedSources, seedDefaultTopics } from '../seed';

export default function Coverage({ sources, tweets }) {
  const [topics, setTopics] = useState([]);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');
  const [filter, setFilter] = useState(null);
  const [expandedProject, setExpandedProject] = useState(null);
  const [newAngle, setNewAngle] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [showAddTopic, setShowAddTopic] = useState(false);

  // Listen to topics collection
  useEffect(() => {
    const col = collection(db, 'topics');
    const q = query(col, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setTopics(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  // Count tweets per source
  const tweetCountBySource = {};
  (tweets || []).forEach(t => {
    if (t.sourceRef?.id) {
      tweetCountBySource[t.sourceRef.id] = (tweetCountBySource[t.sourceRef.id] || 0) + 1;
    }
  });

  // Count tweets per topic
  const tweetCountByTopic = {};
  (tweets || []).forEach(t => {
    if (t.sourceRef?.topicId) {
      tweetCountByTopic[t.sourceRef.topicId] = (tweetCountByTopic[t.sourceRef.topicId] || 0) + 1;
    }
  });

  // Filter sources
  const filtered = (sources || []).filter(s => {
    if (!filter) return true;
    if (filter === 'no-tweets') return !tweetCountBySource[s.id];
    if (filter === 'priority') return s.status === 'priority';
    if (filter === 'paused') return s.status === 'paused';
    return true;
  });

  const statusCounts = {
    total: (sources || []).length,
    active: (sources || []).filter(s => s.status !== 'paused').length,
    priority: (sources || []).filter(s => s.status === 'priority').length,
    paused: (sources || []).filter(s => s.status === 'paused').length,
    noTweets: (sources || []).filter(s => !tweetCountBySource[s.id]).length,
  };

  const handleStatusChange = async (sourceId, newStatus) => {
    const ref = doc(db, 'sources', sourceId);
    await updateDoc(ref, { status: newStatus, updatedAt: serverTimestamp() });
  };

  const handleAddAngle = async (sourceId, angles) => {
    if (!newAngle.trim()) return;
    const ref = doc(db, 'sources', sourceId);
    await updateDoc(ref, { angles: [...(angles || []), newAngle.trim()], updatedAt: serverTimestamp() });
    setNewAngle('');
  };

  const handleAddTopic = async () => {
    if (!newTopicName.trim()) return;
    const col = collection(db, 'topics');
    await addDoc(col, {
      name: newTopicName.trim(),
      description: newTopicDesc.trim(),
      tweetCount: 0,
      createdAt: serverTimestamp(),
    });
    setNewTopicName('');
    setNewTopicDesc('');
    setShowAddTopic(false);
  };

  const handleDraftFromSource = async (source) => {
    await addTweet({
      content: `day ${source.dayNumber || '?'}/100. ${source.name?.toLowerCase()}. artlu.ai`,
      type: 'announcement',
      source: 'auto-draft',
      sourceRef: { id: source.id, name: source.name },
      dayNumber: source.dayNumber,
    });
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMsg('seeding...');
    try {
      const srcResult = await seedSources();
      const topicResult = await seedDefaultTopics();
      setSeedMsg(`${srcResult.message}. ${topicResult.message}.`);
    } catch (e) {
      setSeedMsg(`error: ${e.message}`);
    }
    setSeeding(false);
  };

  return (
    <div>
      {/* Seed button — shown when no sources exist */}
      {(sources || []).length === 0 && (
        <div style={S.seedBox}>
          <div style={S.sectionTitle}>no projects loaded</div>
          <div style={S.sectionHint}>seed the database with your 12 artlu.ai projects</div>
          <button style={S.addBtn} onClick={handleSeed} disabled={seeding}>
            {seeding ? 'seeding...' : 'seed from artlu.ai'}
          </button>
          {seedMsg && <div style={{ ...S.sectionHint, marginTop: '8px', color: T.green }}>{seedMsg}</div>}
        </div>
      )}

      {/* Topics section */}
      <div style={S.section}>
        <div style={S.sectionHeader}>
          <span style={S.sectionTitle}>topics</span>
          <button style={S.addBtn} onClick={() => setShowAddTopic(!showAddTopic)}>
            {showAddTopic ? 'cancel' : '+ add topic'}
          </button>
        </div>
        <div style={S.sectionHint}>standalone topics the bot can tweet about — not tied to a specific project</div>

        {showAddTopic && (
          <div style={S.addTopicForm}>
            <input
              style={S.input}
              placeholder="topic name"
              value={newTopicName}
              onChange={e => setNewTopicName(e.target.value)}
            />
            <input
              style={S.input}
              placeholder="description (optional)"
              value={newTopicDesc}
              onChange={e => setNewTopicDesc(e.target.value)}
            />
            <button style={S.addBtn} onClick={handleAddTopic}>add</button>
          </div>
        )}

        <div style={S.list}>
          {/* Default bot topic */}
          <div style={S.topicRow}>
            <div>
              <span style={S.topicName}>default — bot picks its own topic</span>
              <div style={S.topicDesc}>personality-driven. whatever the bot wants to say today.</div>
            </div>
            <div style={S.topicRight}>
              <span style={S.tweetCount}>{tweetCountByTopic['default'] || 0} tweets</span>
            </div>
          </div>

          {topics.map(topic => (
            <div key={topic.id} style={S.topicRow}>
              <div>
                <span style={S.topicName}>{topic.name}</span>
                {topic.description && <div style={S.topicDesc}>{topic.description}</div>}
              </div>
              <div style={S.topicRight}>
                <span style={S.tweetCount}>{tweetCountByTopic[topic.id] || 0} tweets</span>
                <button style={S.smallBtn}>+ draft</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Projects section */}
      <div style={S.section}>
        <div style={S.sectionHeader}>
          <span style={S.sectionTitle}>projects</span>
          <span style={S.sectionStats}>
            {statusCounts.total} total · {statusCounts.noTweets} no tweets · {statusCounts.priority} priority · {statusCounts.paused} paused
          </span>
        </div>

        <div style={S.filters}>
          {[
            { key: null, label: 'all' },
            { key: 'no-tweets', label: 'no tweets' },
            { key: 'priority', label: 'priority' },
            { key: 'paused', label: 'paused' },
          ].map(f => (
            <span
              key={f.label}
              style={filter === f.key ? S.filterActive : S.filter}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </span>
          ))}
        </div>

        <div style={S.list}>
          {filtered.map(source => {
            const count = tweetCountBySource[source.id] || 0;
            const isPaused = source.status === 'paused';
            const isPriority = source.status === 'priority';
            const isExpanded = expandedProject === source.id;

            return (
              <div
                key={source.id}
                style={{
                  ...S.sourceRow,
                  opacity: isPaused ? 0.4 : 1,
                  borderLeft: isPriority ? `2px solid ${T.green}` : '2px solid transparent',
                }}
              >
                <div style={S.sourceTop}>
                  <div
                    style={S.sourceInfo}
                    onClick={() => setExpandedProject(isExpanded ? null : source.id)}
                  >
                    <div style={S.sourceNameRow}>
                      <span style={S.sourceName}>{source.name}</span>
                      <span style={S.sourceDay}>day {source.dayNumber || '?'}</span>
                      <span style={{ ...S.tweetCount, color: count > 0 ? T.green : T.dim }}>
                        {count} tweet{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div style={S.sourceActions}>
                    <select
                      style={{
                        ...S.statusSelect,
                        borderColor: isPriority ? T.greenBorder : T.border,
                        color: isPriority ? T.green : isPaused ? T.dim : T.desc,
                      }}
                      value={source.status || 'active'}
                      onChange={e => handleStatusChange(source.id, e.target.value)}
                    >
                      <option value="active">active</option>
                      <option value="priority">priority</option>
                      <option value="paused">paused</option>
                    </select>
                    {!isPaused && count === 0 && (
                      <button style={S.smallBtn} onClick={() => handleDraftFromSource(source)}>+ draft</button>
                    )}
                  </div>
                </div>

                {/* Expanded: angles */}
                {isExpanded && !isPaused && (
                  <div style={S.anglesSection}>
                    <div style={S.anglesLabel}>angles to cover:</div>
                    <div style={S.anglesList}>
                      {(source.angles || []).map((angle, i) => (
                        <span key={i} style={S.angleTag}>{angle}</span>
                      ))}
                      <div style={S.addAngleWrap}>
                        <input
                          style={S.angleInput}
                          placeholder="+ add angle"
                          value={newAngle}
                          onChange={e => setNewAngle(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddAngle(source.id, source.angles)}
                        />
                      </div>
                    </div>
                    <button style={S.smallBtn}>+ draft from angle</button>
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

const S = {
  seedBox: {
    marginBottom: '24px',
    padding: '16px',
    border: `1px solid ${T.greenBorder}`,
    borderRadius: '2px',
    textAlign: 'center',
  },
  section: {
    marginBottom: '24px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  sectionTitle: {
    fontSize: T.titleSize,
    color: T.title,
    fontFamily: T.font,
  },
  sectionStats: {
    fontSize: T.smallSize,
    color: T.dim,
    fontFamily: T.font,
  },
  sectionHint: {
    fontSize: T.smallSize,
    color: T.dim,
    fontFamily: T.font,
    marginBottom: '10px',
  },
  addBtn: {
    background: T.greenBg,
    border: `1px solid ${T.greenBorder}`,
    color: T.green,
    fontSize: T.smallSize,
    fontFamily: T.font,
    padding: '2px 8px',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  addTopicForm: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
    alignItems: 'center',
  },
  input: {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: '2px',
    color: T.desc,
    fontSize: T.bodySize,
    fontFamily: T.font,
    padding: '4px 8px',
    flex: 1,
  },
  list: {
    border: `1px solid ${T.border}`,
    borderRadius: '2px',
  },
  filters: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
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
  topicRow: {
    padding: '8px 12px',
    borderBottom: `1px solid ${T.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicName: {
    fontSize: T.bodySize,
    color: T.desc,
    fontFamily: T.font,
  },
  topicDesc: {
    fontSize: T.smallSize,
    color: T.stack,
    fontFamily: T.font,
    marginTop: '2px',
  },
  topicRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  tweetCount: {
    fontSize: T.smallSize,
    fontFamily: T.font,
  },
  smallBtn: {
    background: 'none',
    border: `1px solid ${T.border}`,
    color: T.desc,
    fontSize: T.tinySize,
    fontFamily: T.font,
    padding: '1px 6px',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  sourceRow: {
    padding: '10px 12px',
    borderBottom: `1px solid ${T.border}`,
  },
  sourceTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sourceInfo: {
    cursor: 'pointer',
    flex: 1,
  },
  sourceNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sourceName: {
    fontSize: T.bodySize,
    color: T.title,
    fontFamily: T.font,
  },
  sourceDay: {
    fontSize: T.smallSize,
    color: T.stack,
    fontFamily: T.font,
  },
  sourceActions: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  statusSelect: {
    background: T.surface,
    border: `1px solid ${T.border}`,
    color: T.desc,
    fontSize: T.tinySize,
    fontFamily: T.font,
    padding: '1px 4px',
    borderRadius: '2px',
  },
  anglesSection: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: `1px solid ${T.border}`,
  },
  anglesLabel: {
    fontSize: T.smallSize,
    color: T.dim,
    fontFamily: T.font,
    marginBottom: '4px',
  },
  anglesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginBottom: '6px',
  },
  angleTag: {
    fontSize: T.smallSize,
    color: T.desc,
    background: T.surface,
    padding: '1px 6px',
    borderRadius: '2px',
    border: `1px solid ${T.border}`,
    fontFamily: T.font,
  },
  addAngleWrap: {},
  angleInput: {
    background: T.surface,
    border: `1px dashed ${T.border}`,
    borderRadius: '2px',
    color: T.dim,
    fontSize: T.smallSize,
    fontFamily: T.font,
    padding: '1px 6px',
    width: '120px',
  },
};
