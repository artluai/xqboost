import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useTheme, getDayNumber } from '../theme';
import { addTweet } from '../hooks/useTweets';
import { generateDraft, fetchModelStatus } from '../hooks/useGenerate';

const MODELS = [
  { key: 'claude-sonnet', name: 'Claude Sonnet', provider: 'Anthropic' },
  { key: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { key: 'kimi-k2.5', name: 'Kimi K2.5', provider: 'Moonshot' },
];

export default function GenerateModal({ open, onClose }) {
  const { t } = useTheme();
  const [tab, setTab] = useState('generate');

  // Write tab state
  const [writeContent, setWriteContent] = useState('');
  const [writeType, setWriteType] = useState('announcement');
  const [isThread, setIsThread] = useState(false);

  // Generate tab state
  const [sources, setSources] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSource, setSelectedSource] = useState('__bot_picks__');
  const [selectedModel, setSelectedModel] = useState('claude-sonnet');
  const [searchQuery, setSearchQuery] = useState('');
  const [genState, setGenState] = useState('idle'); // idle | loading | success | error
  const [genResult, setGenResult] = useState(null);
  const [genError, setGenError] = useState('');
  const [modelStatus, setModelStatus] = useState({});

  const dayNum = getDayNumber(new Date());

  // Load sources + topics
  useEffect(() => {
    if (!open) return;
    const unsub1 = onSnapshot(query(collection(db, 'sources'), orderBy('dayNumber', 'desc')), (snap) => {
      setSources(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => s.status !== 'paused' && !s.duplicate));
    }, () => {});
    const unsub2 = onSnapshot(collection(db, 'topics'), (snap) => {
      setTopics(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return () => { unsub1(); unsub2(); };
  }, [open]);

  // Load model status
  useEffect(() => {
    if (!open) return;
    fetchModelStatus().then(setModelStatus).catch(() => {});
  }, [open]);

  // Count tweets per source
  const [tweetCounts, setTweetCounts] = useState({});
  useEffect(() => {
    if (!open) return;
    const unsub = onSnapshot(collection(db, 'tweets'), (snap) => {
      const counts = {};
      snap.docs.forEach(d => {
        const refId = d.data().sourceRef?.id;
        if (refId) counts[refId] = (counts[refId] || 0) + 1;
      });
      setTweetCounts(counts);
    }, () => {});
    return unsub;
  }, [open]);

  // Filter + group sources
  const filteredSources = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let list = sources;
    if (q) list = list.filter(s => s.name?.toLowerCase().includes(q));
    const needsTweets = list.filter(s => !(tweetCounts[s.id] > 0));
    const hasTweets = list.filter(s => tweetCounts[s.id] > 0);
    return { needsTweets, hasTweets };
  }, [sources, searchQuery, tweetCounts]);

  if (!open) return null;

  // ── Handlers ──

  const handleWrite = async () => {
    if (!writeContent.trim()) return;
    if (isThread) {
      const parts = writeContent.split(/\n\s*\n/).filter(p => p.trim());
      await addTweet({ content: parts[0] || '', threadParts: parts.slice(1), type: 'thread', source: 'manual', dayNumber: dayNum });
    } else {
      await addTweet({ content: writeContent.trim(), type: writeType, source: 'manual', dayNumber: dayNum });
    }
    setWriteContent('');
    onClose();
  };

  const handleGenerate = async () => {
    setGenState('loading');
    setGenError('');

    try {
      let params;

      if (selectedSource === '__bot_picks__') {
        params = { mode: 'topic', topicName: '', model: selectedModel };
      } else {
        const source = sources.find(s => s.id === selectedSource);
        if (!source) throw new Error('source not found');

        const today = new Date().toISOString().split('T')[0];
        const isArchive = source.date && source.date < today;

        params = {
          sourceId: source.id,
          sourceName: source.name,
          dayNumber: source.dayNumber || getDayNumber(source.date) || dayNum,
          model: selectedModel,
          isArchive,
          url: source.url || '',
          angles: source.angles || [],
        };
      }

      const result = await generateDraft(params);

      if (result.ok) {
        setGenResult(result);
        setGenState('success');
      } else {
        setGenError(result.error || 'generation failed');
        setGenState('error');
      }
    } catch (e) {
      setGenError(e.message || 'something went wrong');
      setGenState('error');
    }
  };

  const handleAnother = () => {
    setGenState('idle');
    setGenResult(null);
    setSelectedSource('__bot_picks__');
    setSearchQuery('');
  };

  const handleClose = () => {
    setGenState('idle');
    setGenResult(null);
    setSearchQuery('');
    setWriteContent('');
    onClose();
  };

  // ── Styles ──

  const overlay = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.4)', zIndex: 1000,
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    paddingTop: '5vh',
  };

  const modal = {
    width: '100%', maxWidth: 560, background: t.bg,
    borderRadius: 16, overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  };

  const topBar = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px', borderBottom: `1px solid ${t.border}`,
  };

  const closeBtn = {
    width: 34, height: 34, borderRadius: 9999, display: 'flex',
    alignItems: 'center', justifyContent: 'center', background: 'none',
    border: 'none', fontSize: 18, color: t.textSecondary, cursor: 'pointer',
    fontFamily: t.font,
  };

  const tabRow = { display: 'flex', borderBottom: `1px solid ${t.border}` };

  const tabStyle = (active) => ({
    flex: 1, textAlign: 'center', padding: '14px 0', fontSize: 15,
    fontWeight: active ? 700 : 500, color: active ? t.text : t.textSecondary,
    position: 'relative', border: 'none', background: 'none',
    cursor: 'pointer', fontFamily: t.font,
  });

  const tabUnderline = {
    position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
    width: 64, height: 4, background: '#1d9bf0', borderRadius: 9999,
  };

  const stepLabel = {
    fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 10,
    display: 'flex', alignItems: 'center', gap: 8, fontFamily: t.font,
  };

  const stepNum = {
    width: 22, height: 22, borderRadius: '50%', background: t.text, color: t.bg,
    fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0,
  };

  const sourceRow = (isSelected) => ({
    display: 'flex', alignItems: 'center', padding: '10px 14px',
    cursor: 'pointer', transition: 'background 0.1s',
    borderBottom: `1px solid ${t.surface}`,
    background: isSelected ? (t.name === 'light' ? '#f0f7ff' : '#0c1929') : 'transparent',
  });

  const checkCircle = (isSelected) => ({
    width: 20, height: 20, borderRadius: '50%',
    border: `2px solid ${isSelected ? t.text : t.borderHover}`,
    background: isSelected ? t.text : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginLeft: 10, transition: 'all 0.15s',
  });

  const modelCard = (isSelected, isDisabled) => ({
    flex: 1, padding: 12, borderRadius: t.radiusSm, textAlign: 'center',
    border: `1px solid ${isSelected ? t.text : t.border}`,
    background: isSelected ? t.surface : 'transparent',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.4 : 1,
    transition: 'border-color 0.15s, background 0.15s',
  });

  const genBtn = (enabled) => ({
    width: '100%', padding: 14, borderRadius: 9999,
    background: t.text, color: t.bg, border: 'none',
    fontSize: 15, fontWeight: 700, fontFamily: t.font,
    cursor: enabled ? 'pointer' : 'default',
    opacity: enabled ? 1 : 0.35,
  });

  // ── Render ──

  const renderSourceOption = (s) => {
    const count = tweetCounts[s.id] || 0;
    const isSelected = selectedSource === s.id;
    const today = new Date().toISOString().split('T')[0];
    const isToday = s.date === today;
    const isArchive = s.date && s.date < today;

    return (
      <div key={s.id} onClick={() => setSelectedSource(isSelected ? '__bot_picks__' : s.id)} style={sourceRow(isSelected)}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, fontFamily: t.font, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 6 }}>
            {s.status === 'priority' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />}
            {s.name}
          </div>
          <div style={{ fontSize: 12, color: t.textSecondary, fontFamily: t.font, marginTop: 1 }}>
            {s.dayNumber ? `day ${s.dayNumber}` : ''}{isArchive ? ' · archive' : ''}{isToday ? ' · today' : ''}{s.status === 'priority' ? ' · priority' : ''}
          </div>
        </div>
        <span style={{
          fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, flexShrink: 0, marginLeft: 12,
          background: count === 0 ? (t.name === 'light' ? '#fef2f2' : '#2a0a0a') : (t.name === 'light' ? '#e3f2fd' : '#0c1929'),
          color: count === 0 ? t.red : t.blueLink, fontFamily: t.font,
        }}>
          {count} tweet{count !== 1 ? 's' : ''}
        </span>
        <div style={checkCircle(isSelected)}>
          {isSelected && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5 4.5-5" stroke={t.bg} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
      </div>
    );
  };

  return (
    <div style={overlay} onClick={handleClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        {/* Top bar */}
        <div style={topBar}>
          <button style={closeBtn} onClick={handleClose}>✕</button>
          <span style={{ fontSize: 15, fontWeight: 700, fontFamily: t.font }}>Draft tweet</span>
          <div style={{ width: 34 }} />
        </div>

        {/* Tabs */}
        <div style={tabRow}>
          <button style={tabStyle(tab === 'write')} onClick={() => setTab('write')}>
            Write
            {tab === 'write' && <span style={tabUnderline} />}
          </button>
          <button style={tabStyle(tab === 'generate')} onClick={() => setTab('generate')}>
            Generate
            {tab === 'generate' && <span style={tabUnderline} />}
          </button>
        </div>

        {/* ── WRITE TAB ── */}
        {tab === 'write' && (
          <div style={{ padding: 16 }}>
            <textarea
              value={writeContent}
              onChange={e => setWriteContent(e.target.value)}
              placeholder="What's happening in the lab..."
              style={{
                width: '100%', border: 'none', outline: 'none', fontSize: 18,
                color: t.text, fontFamily: t.font, minHeight: 140, resize: 'none',
                lineHeight: 1.5, padding: 0, background: 'transparent',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select value={writeType} onChange={e => setWriteType(e.target.value)} disabled={isThread}
                  style={{ background: t.pillBg, padding: '4px 10px', borderRadius: t.radius, fontSize: 12, color: t.pillText, border: 'none', fontFamily: t.font }}>
                  <option value="announcement">announcement</option>
                  <option value="milestone">milestone</option>
                  <option value="personality">personality</option>
                  <option value="journal">journal</option>
                </select>
                <label style={{ fontSize: 12, color: t.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: t.font }}>
                  <input type="checkbox" checked={isThread} onChange={e => setIsThread(e.target.checked)} /> thread
                </label>
                <span style={{ fontSize: 12, color: writeContent.length > 280 ? t.red : t.textMuted, fontFamily: t.font }}>
                  {writeContent.length} / 280
                </span>
              </div>
              <button onClick={handleWrite} disabled={!writeContent.trim()}
                style={{
                  background: writeContent.trim() ? t.text : t.pillBg,
                  color: writeContent.trim() ? t.bg : t.textMuted,
                  border: 'none', padding: '8px 20px', borderRadius: 9999,
                  fontSize: 14, fontWeight: 700, fontFamily: t.font, cursor: writeContent.trim() ? 'pointer' : 'default',
                }}>
                Add to queue
              </button>
            </div>
          </div>
        )}

        {/* ── GENERATE TAB ── */}
        {tab === 'generate' && (
          <div style={{ padding: 16 }}>

            {/* Idle / form state */}
            {genState === 'idle' && <>
              {/* Step 1 */}
              <div style={{ marginBottom: 20 }}>
                <div style={stepLabel}><span style={stepNum}>1</span> Pick a project</div>

                {/* Bot picks default */}
                <div
                  onClick={() => setSelectedSource('__bot_picks__')}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '12px 14px',
                    borderRadius: t.radiusSm, cursor: 'pointer', marginBottom: 4,
                    border: `1px solid ${selectedSource === '__bot_picks__' ? t.text : t.border}`,
                    background: selectedSource === '__bot_picks__' ? t.surface : 'transparent',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, fontFamily: t.font, color: t.text }}>Bot picks for me</div>
                    <div style={{ fontSize: 12, color: t.textSecondary, fontFamily: t.font }}>AI chooses a project that needs a tweet, or freestyles</div>
                  </div>
                  <div style={checkCircle(selectedSource === '__bot_picks__')}>
                    {selectedSource === '__bot_picks__' && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5 4.5-5" stroke={t.bg} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                </div>

                <div style={{ fontSize: 12, color: t.textMuted, textAlign: 'center', padding: '8px 0', fontFamily: t.font }}>or pick a specific project</div>

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.textMuted }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search projects..."
                    style={{
                      width: '100%', padding: '10px 14px 10px 36px',
                      border: `1px solid ${t.borderHover}`, borderRadius: 9999,
                      fontSize: 14, color: t.text, fontFamily: t.font,
                      outline: 'none', background: t.bg,
                    }}
                  />
                </div>

                {/* Scrollable project list */}
                <div style={{ border: `1px solid ${t.border}`, borderRadius: t.radiusSm, maxHeight: 280, overflowY: 'auto' }}>
                  {filteredSources.needsTweets.length > 0 && <>
                    <div style={{ padding: '8px 14px 4px', fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, position: 'sticky', top: 0, background: t.bg, zIndex: 1, borderBottom: `1px solid ${t.border}`, fontFamily: t.font }}>Needs tweets</div>
                    {filteredSources.needsTweets.map(renderSourceOption)}
                  </>}
                  {filteredSources.hasTweets.length > 0 && <>
                    <div style={{ padding: '8px 14px 4px', fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, position: 'sticky', top: 0, background: t.bg, zIndex: 1, borderBottom: `1px solid ${t.border}`, fontFamily: t.font }}>Has tweets</div>
                    {filteredSources.hasTweets.map(renderSourceOption)}
                  </>}
                  {filteredSources.needsTweets.length === 0 && filteredSources.hasTweets.length === 0 && (
                    <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: t.textMuted, fontFamily: t.font }}>
                      No projects match "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ marginBottom: 20 }}>
                <div style={stepLabel}><span style={stepNum}>2</span> Pick a model</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {MODELS.map(m => {
                    const isAvailable = modelStatus[m.key]?.connected;
                    return (
                      <div key={m.key}
                        onClick={() => isAvailable && setSelectedModel(m.key)}
                        style={modelCard(selectedModel === m.key, !isAvailable)}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, fontFamily: t.font, color: t.text, marginBottom: 2 }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: t.textSecondary, fontFamily: t.font }}>
                          {isAvailable ? m.provider : 'no key'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!selectedSource}
                style={genBtn(!!selectedSource)}
              >
                Generate draft
              </button>
            </>}

            {/* Loading state */}
            {genState === 'loading' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', gap: 16 }}>
                <div style={{
                  width: 32, height: 32, border: `3px solid ${t.border}`,
                  borderTopColor: t.text, borderRadius: '50%',
                  animation: 'xq-spin 0.8s linear infinite',
                }} />
                <div style={{ fontSize: 14, color: t.textSecondary, textAlign: 'center', lineHeight: 1.5, fontFamily: t.font }}>
                  Generating draft for <strong style={{ color: t.text }}>
                    {selectedSource === '__bot_picks__' ? "bot's choice" : sources.find(s => s.id === selectedSource)?.name || 'unknown'}
                  </strong><br />via {MODELS.find(m => m.key === selectedModel)?.name}...
                </div>
                <style>{`@keyframes xq-spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {/* Success state */}
            {genState === 'success' && genResult && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: t.name === 'light' ? '#e8f5e9' : '#062b12',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M6 12l4 4 8-8" stroke={t.greenText} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: t.greenText, fontFamily: t.font }}>Draft added to queue</div>
                <div style={{ fontSize: 13, color: t.textSecondary, fontFamily: t.font, textAlign: 'center' }}>
                  {genResult.charCount} chars · {MODELS.find(m => m.key === genResult.model)?.name}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={handleAnother} style={{
                    padding: '10px 24px', borderRadius: 9999,
                    background: t.text, color: t.bg, border: 'none',
                    fontSize: 14, fontWeight: 700, fontFamily: t.font, cursor: 'pointer',
                  }}>Generate another</button>
                  <button onClick={handleClose} style={{
                    padding: '10px 24px', borderRadius: 9999,
                    background: 'transparent', color: t.textSecondary,
                    border: `1px solid ${t.borderHover}`,
                    fontSize: 14, fontWeight: 500, fontFamily: t.font, cursor: 'pointer',
                  }}>Close</button>
                </div>
              </div>
            )}

            {/* Error state */}
            {genState === 'error' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: t.name === 'light' ? '#fef2f2' : '#2a0a0a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke={t.red} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: t.red, fontFamily: t.font }}>Generation failed</div>
                <div style={{ fontSize: 13, color: t.textSecondary, fontFamily: t.font, textAlign: 'center' }}>{genError}</div>
                <button onClick={() => setGenState('idle')} style={{
                  padding: '10px 24px', borderRadius: 9999, marginTop: 8,
                  background: t.text, color: t.bg, border: 'none',
                  fontSize: 14, fontWeight: 700, fontFamily: t.font, cursor: 'pointer',
                }}>Try again</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
