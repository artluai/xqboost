import { useTheme, getDayNumber } from '../theme';

export default function RightPanel({ tweets, sources }) {
  const { t } = useTheme();

  const draftCount = tweets.filter(x => x.status === 'draft').length;
  const approvedCount = tweets.filter(x => x.status === 'approved').length;
  const postedCount = tweets.filter(x => x.status === 'posted').length;
  const dayNum = getDayNumber(new Date());
  const progress = Math.round((dayNum / 100) * 100);

  const tweetCountBySource = {};
  tweets.forEach(tw => { if (tw.sourceRef?.id) tweetCountBySource[tw.sourceRef.id] = (tweetCountBySource[tw.sourceRef.id] || 0) + 1; });

  const sortedSources = [...(sources || [])].sort((a, b) => {
    const ca = tweetCountBySource[a.id] || 0;
    const cb = tweetCountBySource[b.id] || 0;
    if (ca === 0 && cb > 0) return -1;
    if (ca > 0 && cb === 0) return 1;
    return (a.dayNumber || 999) - (b.dayNumber || 999);
  }).slice(0, 8);

  const approved = tweets.filter(x => x.status === 'approved');
  const archives = approved.filter(tw => tw.content?.includes('[archive:') || tw.content?.includes('[from the archives]'));
  const current = approved.filter(tw => !tw.content?.includes('[archive:') && !tw.content?.includes('[from the archives]'));
  const nextMorning = archives[0] || current[0];
  const nextEvening = current[0] || archives[0];

  const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${t.border}`, fontSize: 14, fontFamily: t.font };

  // Clean source name: strip ► prefix, truncate descriptions that got concatenated
  const cleanName = (name) => {
    if (!name) return '';
    let n = name.replace(/^[►▶]/, '').trim();
    // If name contains a description (lowercase text after the actual name), try to extract just the name
    // Names are typically Title Case or contain dashes/special chars
    // Descriptions start with lowercase after the name
    const match = n.match(/^([A-Z][^\n]*?)(?=[a-z]{2}[a-z\s,\-—]+(?:for|that|with|and|the|to|on|in|of|a)\s)/);
    if (match && match[1].length > 5) n = match[1].trim();
    return n.length > 35 ? n.slice(0, 32) + '…' : n;
  };

  return (
    <div style={{ borderLeft: `1px solid ${t.border}`, paddingBottom: 40 }}>
      <div style={{ fontSize: 20, fontWeight: 800, padding: '16px 20px 8px', fontFamily: t.font, color: t.text }}>Pipeline</div>
      <div style={{ padding: '0 20px 16px', borderBottom: `1px solid ${t.border}` }}>
        <div style={row}><span style={{ color: t.textSecondary }}>Drafts</span><span style={{ fontWeight: 700, fontFamily: 'ui-monospace, monospace', color: '#c2a300' }}>{draftCount}</span></div>
        <div style={row}><span style={{ color: t.textSecondary }}>Approved</span><span style={{ fontWeight: 700, fontFamily: 'ui-monospace, monospace', color: '#00ba7c' }}>{approvedCount}</span></div>
        <div style={row}><span style={{ color: t.textSecondary }}>Posted</span><span style={{ fontWeight: 700, fontFamily: 'ui-monospace, monospace', color: '#1d9bf0' }}>{postedCount}</span></div>
        <div style={{ ...row, borderBottom: 'none' }}><span style={{ color: t.textSecondary }}>Progress</span><span style={{ fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}>{progress}%</span></div>
        <div style={{ width: '100%', height: 4, background: t.border, borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 2, background: '#00ba7c', width: `${progress}%` }} />
        </div>
      </div>

      <div style={{ fontSize: 20, fontWeight: 800, padding: '16px 20px 8px', fontFamily: t.font, color: t.text }}>Schedule</div>
      <div style={{ padding: '0 20px 16px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: `1px solid ${t.border}`, fontSize: 14, fontFamily: t.font }}>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, minWidth: 48, fontWeight: 600, color: '#00ba7c' }}>9am</span>
          <span style={{ lineHeight: 1.4, color: t.text }}>
            Archive backlog<br />
            {nextMorning?.sourceRef?.name ? <span style={{ color: '#1d9bf0' }}>{nextMorning.sourceRef.name}</span> : <span style={{ color: t.textMuted }}>no approved tweets</span>}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', fontSize: 14, fontFamily: t.font }}>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, minWidth: 48, fontWeight: 600, color: '#1d9bf0' }}>9pm</span>
          <span style={{ lineHeight: 1.4, color: t.text }}>
            Current build<br />
            {nextEvening?.sourceRef?.name ? <span style={{ color: '#1d9bf0' }}>{nextEvening.sourceRef.name}</span> : <span style={{ color: t.textMuted }}>no approved tweets</span>}
          </span>
        </div>
      </div>

      <div style={{ fontSize: 20, fontWeight: 800, padding: '16px 20px 8px', fontFamily: t.font, color: t.text }}>Tracking</div>
      <div style={{ padding: '0 20px 20px' }}>
        {sortedSources.map(source => {
          const count = tweetCountBySource[source.id] || 0;
          return (
            <div key={source.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', fontSize: 14, fontFamily: t.font }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: count > 0 ? '#00ba7c' : '#f4212e' }} />
              <span style={{ flex: 1, color: t.text, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{cleanName(source.name)}</span>
              <span style={{ color: t.textMuted, fontFamily: 'ui-monospace, monospace', flexShrink: 0 }}>{count}</span>
            </div>
          );
        })}
        <div style={{ paddingTop: 12 }}>
          <span style={{ fontSize: 13, color: '#1d9bf0', cursor: 'pointer', fontFamily: t.font }}>See all {(sources || []).length} projects →</span>
        </div>
      </div>
    </div>
  );
}
