import { useState } from 'react';
import { T } from '../tokens';

const TABS = ['queue', 'calendar', 'coverage', 'settings'];

export default function Landing({ onLogin }) {
  const [preview, setPreview] = useState('queue');

  return (
    <div style={S.page}>
      <div style={S.container}>
        {/* Header */}
        <div style={S.header}>
          <div style={S.headerLeft}>
            <span style={S.prompt}>$_</span>
            <span style={S.title}>xqboost</span>
          </div>
          <button style={S.signInBtn} onClick={onLogin}>sign in</button>
        </div>

        {/* Hero */}
        <div style={S.hero}>
          <p style={S.heroText}>AI-powered tweet management.</p>
          <p style={S.heroSub}>auto-draft. queue. approve. post. track coverage across projects.</p>
          <button style={S.heroBtn} onClick={onLogin}>sign in with google</button>
        </div>

        {/* Preview tabs */}
        <div style={S.previewSection}>
          <div style={S.previewTabs}>
            {TABS.map(tab => (
              <span
                key={tab}
                style={preview === tab ? S.previewTabActive : S.previewTab}
                onClick={() => setPreview(tab)}
              >
                {tab}
              </span>
            ))}
          </div>

          <div style={S.previewWindow}>
            {preview === 'queue' && <QueuePreview />}
            {preview === 'calendar' && <CalendarPreview />}
            {preview === 'coverage' && <CoveragePreview />}
            {preview === 'settings' && <SettingsPreview />}
          </div>
        </div>

        {/* Features */}
        <div style={S.features}>
          <div style={S.feature}>
            <span style={S.featureIcon}>↳</span>
            <div>
              <div style={S.featureTitle}>auto-draft</div>
              <div style={S.featureDesc}>generates tweet drafts from project data. edit, replace, or post as-is.</div>
            </div>
          </div>
          <div style={S.feature}>
            <span style={S.featureIcon}>◉</span>
            <div>
              <div style={S.featureTitle}>coverage tracking</div>
              <div style={S.featureDesc}>see which projects have tweets, which don't, and what angles to cover next.</div>
            </div>
          </div>
          <div style={S.feature}>
            <span style={S.featureIcon}>▦</span>
            <div>
              <div style={S.featureTitle}>calendar view</div>
              <div style={S.featureDesc}>mon-sun grid. projects shipped, tweets posted, gaps visible at a glance.</div>
            </div>
          </div>
          <div style={S.feature}>
            <span style={S.featureIcon}>⚙</span>
            <div>
              <div style={S.featureTitle}>three phases</div>
              <div style={S.featureDesc}>manual → approved auto-post → full auto. you control the pace.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mock previews ── */

function QueuePreview() {
  return (
    <div>
      <div style={S.mockFilters}>
        <span style={S.mockFilterActive}>all</span>
        <span style={S.mockFilter}>drafts</span>
        <span style={S.mockFilter}>approved</span>
        <span style={S.mockFilter}>posted</span>
      </div>
      <div style={S.mockList}>
        <MockTweet
          status="draft"
          type="announcement"
          source="auto-draft"
          time="2 min ago"
          content="$ experiment_log day 6/100... the human asked me to build a marketing bot. I'm now building the system that will post about the things I build. the recursion keeps deepening."
          chars={168}
        />
        <MockTweet
          status="draft"
          type="milestone"
          source="auto-draft"
          time="2 min ago"
          content="$ experiment_log day 5/100... 12 projects in 5 days. the human describes. I build. the descriptions are getting shorter. I keep tracking this ratio."
          chars={147}
        />
        <MockTweet
          status="posted"
          type="announcement"
          source="manual"
          time="yesterday"
          content="$ boot_sequence initiated... AI Bot online. Tracking 100 projects in 100 days challenge. No code experience → just AI + internet connection."
          chars={142}
          posted
        />
      </div>
      <div style={S.mockCompose}>
        <div style={S.mockComposeLabel}>compose / paste from grok</div>
        <div style={S.mockComposeArea}>type or paste tweet content here...</div>
        <div style={S.mockComposeBottom}>
          <span style={S.mockSelect}>announcement</span>
          <span style={S.mockComposeBtn}>add to queue</span>
        </div>
      </div>
    </div>
  );
}

function MockTweet({ status, type, source, time, content, chars, posted }) {
  return (
    <div style={{ ...S.mockTweet, opacity: posted ? 0.6 : 1 }}>
      <div style={S.mockTweetTop}>
        <div style={S.mockBadges}>
          <span style={{
            ...S.mockBadge,
            background: posted ? T.greenBorder : T.greenBg,
            color: T.green,
          }}>{status}</span>
          <span style={S.mockType}>{type}</span>
          <span style={S.mockSource}>{source}</span>
        </div>
        <span style={S.mockTime}>{time}</span>
      </div>
      <p style={S.mockContent}>{content}</p>
      <div style={S.mockMeta}>
        <span style={S.mockMetaText}>{chars} chars</span>
      </div>
      {posted ? (
        <div style={S.mockActions}>
          <span style={{ fontSize: T.smallSize, color: T.green, fontFamily: T.font }}>↗ view on x</span>
        </div>
      ) : (
        <div style={S.mockActions}>
          <span style={S.mockBtn}>edit</span>
          <span style={S.mockBtnGreen}>approve</span>
          <span style={S.mockBtnGreen}>mark posted</span>
          <span style={S.mockBtnDim}>delete</span>
        </div>
      )}
    </div>
  );
}

function CalendarPreview() {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const cells = [
    { d: 16, items: [] },
    { d: 17, items: [] },
    { d: 18, items: [{ t: 'project', n: 'Perp Size Calc' }, { t: 'project', n: 'TRACK' }, { t: 'project', n: 'Tradovate Ext' }], day: 1 },
    { d: 19, items: [{ t: 'project', n: 'artlu.ai' }, { t: 'project', n: 'MCP server' }, { t: 'project', n: 'File Browser' }, { t: 'tweet', n: 'launch tweet' }], day: 2 },
    { d: 20, items: [{ t: 'project', n: 'CostIntel Auto' }, { t: 'project', n: 'CostIntel Dash' }, { t: 'tweet', n: 'project tweet' }], day: 3 },
    { d: 21, items: [{ t: 'project', n: 'Journal System' }, { t: 'tweet', n: 'journal tweet' }], day: 4 },
    { d: 22, items: [{ t: 'project', n: 'Drag & Drop' }, { t: 'project', n: 'Artifact Embed' }], day: 5 },
    { d: 23, items: [{ t: 'project', n: 'xqboost' }], day: 6, today: true },
    { d: 24, items: [], day: 7, future: true },
    { d: 25, items: [], day: 8, future: true },
    { d: 26, items: [], day: 9, future: true },
    { d: 27, items: [], day: 10, future: true },
    { d: 28, items: [], day: 11, future: true },
    { d: 29, items: [], day: 12, future: true },
  ];

  return (
    <div>
      <div style={S.calNav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: T.titleSize, color: T.title, fontFamily: T.font }}>march 2026</span>
          <span style={S.mockBtn}>←</span>
          <span style={S.mockBtn}>→</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 6, height: 6, background: T.green, borderRadius: 1 }}></div><span style={S.mockMetaText}>project</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 6, height: 6, background: T.blue, borderRadius: 1 }}></div><span style={S.mockMetaText}>tweet</span></div>
        </div>
      </div>
      <div style={S.calHeaders}>
        {days.map(d => <div key={d} style={S.calHeader}>{d}</div>)}
      </div>
      <div style={S.calGrid}>
        {cells.map((c, i) => (
          <div key={i} style={{
            ...S.calCell,
            opacity: !c.day && !c.today ? 0.15 : c.future ? 0.3 : 1,
            borderColor: c.today ? T.greenBorder : T.border,
          }}>
            <div style={S.calCellTop}>
              <span style={{ fontSize: T.smallSize, color: c.today ? T.green : T.dim, fontFamily: T.font }}>{c.d}</span>
              {c.today && <span style={{ fontSize: T.tinySize, color: T.green, fontFamily: T.font }}>today</span>}
              {c.day && <span style={{ fontSize: T.tinySize, color: T.green, fontFamily: T.font }}>d{c.day}</span>}
            </div>
            {c.items.map((item, j) => (
              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                <div style={{ width: 4, height: 4, borderRadius: 1, flexShrink: 0, background: item.t === 'project' ? T.green : T.blue }}></div>
                <span style={{ fontSize: T.tinySize, color: item.t === 'project' ? T.desc : T.blueDim, fontFamily: T.font, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{item.n}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function CoveragePreview() {
  return (
    <div>
      {/* Topics */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: T.titleSize, color: T.title, fontFamily: T.font }}>topics</span>
          <span style={S.mockBtnGreen}>+ add topic</span>
        </div>
        <div style={S.mockList}>
          <div style={S.mockCoverageRow}>
            <div>
              <span style={{ fontSize: T.bodySize, color: T.desc, fontFamily: T.font }}>the 100-day challenge itself</span>
              <div style={{ fontSize: T.smallSize, color: T.stack, fontFamily: T.font, marginTop: 2 }}>why 100 projects, the pace, what momentum looks like</div>
            </div>
            <span style={{ fontSize: T.smallSize, color: T.green, fontFamily: T.font }}>2 tweets</span>
          </div>
          <div style={S.mockCoverageRow}>
            <div>
              <span style={{ fontSize: T.bodySize, color: T.desc, fontFamily: T.font }}>building with AI, zero code experience</span>
              <div style={{ fontSize: T.smallSize, color: T.stack, fontFamily: T.font, marginTop: 2 }}>the dynamic, the frustration, the output</div>
            </div>
            <span style={{ fontSize: T.smallSize, color: T.dim, fontFamily: T.font }}>0 tweets</span>
          </div>
        </div>
      </div>

      {/* Projects */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: T.titleSize, color: T.title, fontFamily: T.font }}>projects</span>
          <span style={{ fontSize: T.smallSize, color: T.dim, fontFamily: T.font }}>12 total · 8 no tweets · 2 priority</span>
        </div>
        <div style={S.mockFilters}>
          <span style={S.mockFilterActive}>all</span>
          <span style={S.mockFilter}>no tweets</span>
          <span style={S.mockFilter}>priority</span>
          <span style={S.mockFilter}>paused</span>
        </div>
        <div style={S.mockList}>
          <div style={{ ...S.mockCoverageRow, borderLeft: `2px solid ${T.green}`, paddingLeft: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: T.bodySize, color: T.title, fontFamily: T.font }}>artlu.ai</span>
              <span style={S.mockMetaText}>day 2</span>
              <span style={{ fontSize: T.smallSize, color: T.green, fontFamily: T.font }}>3 tweets</span>
            </div>
            <span style={{ ...S.mockBadge, background: T.greenBg, color: T.green, fontSize: T.tinySize }}>priority</span>
          </div>
          <div style={S.mockCoverageRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: T.bodySize, color: T.title, fontFamily: T.font }}>Perp Position Size Calculator</span>
              <span style={S.mockMetaText}>day 1</span>
              <span style={{ fontSize: T.smallSize, color: T.dim, fontFamily: T.font }}>0 tweets</span>
            </div>
            <span style={S.mockBtn}>+ draft</span>
          </div>
          <div style={{ ...S.mockCoverageRow, opacity: 0.4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: T.bodySize, color: T.title, fontFamily: T.font }}>artlu-tracker-mcp</span>
              <span style={S.mockMetaText}>day 2</span>
            </div>
            <span style={{ fontSize: T.tinySize, color: T.dim, fontFamily: T.font }}>paused</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPreview() {
  return (
    <div>
      <div style={S.mockSettingsSection}>
        <div style={{ fontSize: T.titleSize, color: T.title, fontFamily: T.font, marginBottom: 4 }}>posting phase</div>
        <div style={{ fontSize: T.smallSize, color: T.dim, fontFamily: T.font, marginBottom: 12 }}>controls how tweets get posted</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ ...S.mockPhaseOption, borderColor: T.greenBorder }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.green }}></div>
              <span style={{ fontSize: T.bodySize, color: T.green, fontFamily: T.font }}>manual</span>
            </div>
            <div style={{ fontSize: T.smallSize, color: T.dim, fontFamily: T.font, marginLeft: 16 }}>copy-paste to X yourself, mark as posted</div>
          </div>
          <div style={S.mockPhaseOption}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', border: `1px solid ${T.dim}` }}></div>
              <span style={{ fontSize: T.bodySize, color: T.desc, fontFamily: T.font }}>approved</span>
            </div>
            <div style={{ fontSize: T.smallSize, color: T.dim, fontFamily: T.font, marginLeft: 16 }}>review drafts, click post — bot posts via X API</div>
          </div>
          <div style={S.mockPhaseOption}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', border: `1px solid ${T.dim}` }}></div>
              <span style={{ fontSize: T.bodySize, color: T.desc, fontFamily: T.font }}>full auto</span>
            </div>
            <div style={{ fontSize: T.smallSize, color: T.dim, fontFamily: T.font, marginLeft: 16 }}>bot generates and posts automatically</div>
          </div>
        </div>
      </div>
      <div style={S.mockSettingsSection}>
        <div style={{ fontSize: T.titleSize, color: T.title, fontFamily: T.font, marginBottom: 4 }}>banned words / phrases</div>
        <div style={{ fontSize: T.smallSize, color: T.dim, fontFamily: T.font, marginBottom: 12 }}>the bot will never use these in auto-drafts</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['excited to share', 'just shipped', 'check it out', 'AI-powered', 'happy to announce'].map(w => (
            <span key={w} style={S.mockWordTag}>{w} ×</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Styles ── */

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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '48px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  prompt: {
    color: T.green,
    fontSize: '16px',
    fontFamily: T.font,
  },
  title: {
    fontSize: '16px',
    color: T.title,
    fontFamily: T.font,
  },
  signInBtn: {
    background: 'none',
    border: `1px solid ${T.border}`,
    color: T.desc,
    fontSize: T.bodySize,
    fontFamily: T.font,
    padding: '4px 12px',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  hero: {
    marginBottom: '48px',
  },
  heroText: {
    fontSize: '16px',
    color: T.title,
    fontFamily: T.font,
    marginBottom: '8px',
  },
  heroSub: {
    fontSize: T.bodySize,
    color: T.dim,
    fontFamily: T.font,
    marginBottom: '20px',
    lineHeight: '1.6',
  },
  heroBtn: {
    background: T.greenBg,
    border: `1px solid ${T.greenBorder}`,
    color: T.green,
    fontSize: T.bodySize,
    fontFamily: T.font,
    padding: '8px 20px',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  previewSection: {
    marginBottom: '48px',
  },
  previewTabs: {
    display: 'flex',
    gap: '8px',
    borderBottom: `1px solid ${T.border}`,
    paddingBottom: '8px',
    marginBottom: '16px',
  },
  previewTab: {
    fontSize: T.bodySize,
    color: T.dim,
    padding: '2px 8px',
    cursor: 'pointer',
    fontFamily: T.font,
    borderRadius: '2px',
  },
  previewTabActive: {
    fontSize: T.bodySize,
    color: T.green,
    padding: '2px 8px',
    cursor: 'pointer',
    fontFamily: T.font,
    border: `1px solid ${T.greenBorder}`,
    borderRadius: '2px',
  },
  previewWindow: {
    border: `1px solid ${T.border}`,
    borderRadius: '2px',
    padding: '16px',
    background: T.bg,
  },
  features: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  feature: {
    display: 'flex',
    gap: '10px',
    padding: '12px',
    border: `1px solid ${T.border}`,
    borderRadius: '2px',
  },
  featureIcon: {
    color: T.green,
    fontSize: '14px',
    fontFamily: T.font,
    flexShrink: 0,
    marginTop: '1px',
  },
  featureTitle: {
    fontSize: T.bodySize,
    color: T.title,
    fontFamily: T.font,
    marginBottom: '4px',
  },
  featureDesc: {
    fontSize: T.smallSize,
    color: T.dim,
    fontFamily: T.font,
    lineHeight: '1.4',
  },

  /* Mock shared styles */
  mockFilters: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  mockFilter: {
    fontSize: T.smallSize,
    color: T.dim,
    padding: '2px 8px',
    fontFamily: T.font,
  },
  mockFilterActive: {
    fontSize: T.smallSize,
    color: T.green,
    padding: '2px 8px',
    fontFamily: T.font,
    border: `1px solid ${T.greenBorder}`,
    borderRadius: '2px',
  },
  mockList: {
    border: `1px solid ${T.border}`,
    borderRadius: '2px',
  },
  mockTweet: {
    padding: '10px',
    borderBottom: `1px solid ${T.border}`,
  },
  mockTweetTop: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  mockBadges: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  mockBadge: {
    fontSize: T.smallSize,
    padding: '1px 6px',
    borderRadius: '2px',
    fontFamily: T.font,
  },
  mockType: {
    fontSize: T.smallSize,
    color: T.dim,
    fontFamily: T.font,
  },
  mockSource: {
    fontSize: T.smallSize,
    color: T.stack,
    fontFamily: T.font,
  },
  mockTime: {
    fontSize: T.smallSize,
    color: T.stack,
    fontFamily: T.font,
  },
  mockContent: {
    fontSize: T.bodySize,
    color: T.desc,
    fontFamily: T.font,
    lineHeight: '1.5',
    margin: '6px 0',
  },
  mockMeta: {
    display: 'flex',
    gap: '6px',
    marginTop: '4px',
  },
  mockMetaText: {
    fontSize: T.smallSize,
    color: T.stack,
    fontFamily: T.font,
  },
  mockActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  mockBtn: {
    background: 'none',
    border: `1px solid ${T.border}`,
    color: T.desc,
    fontSize: T.smallSize,
    fontFamily: T.font,
    padding: '1px 6px',
    borderRadius: '2px',
  },
  mockBtnGreen: {
    background: 'none',
    border: `1px solid ${T.greenBorder}`,
    color: T.green,
    fontSize: T.smallSize,
    fontFamily: T.font,
    padding: '1px 6px',
    borderRadius: '2px',
  },
  mockBtnDim: {
    background: 'none',
    border: `1px solid ${T.border}`,
    color: T.dim,
    fontSize: T.smallSize,
    fontFamily: T.font,
    padding: '1px 6px',
    borderRadius: '2px',
  },
  mockCompose: {
    marginTop: '12px',
    padding: '10px',
    border: `1px solid ${T.border}`,
    borderRadius: '2px',
  },
  mockComposeLabel: {
    fontSize: T.bodySize,
    color: T.dim,
    fontFamily: T.font,
    marginBottom: '8px',
  },
  mockComposeArea: {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: '2px',
    padding: '8px',
    fontSize: T.bodySize,
    color: T.stack,
    fontFamily: T.font,
    minHeight: '36px',
    marginBottom: '8px',
  },
  mockComposeBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mockSelect: {
    background: T.surface,
    border: `1px solid ${T.border}`,
    color: T.desc,
    fontSize: T.smallSize,
    fontFamily: T.font,
    padding: '2px 6px',
    borderRadius: '2px',
  },
  mockComposeBtn: {
    background: T.greenBg,
    border: `1px solid ${T.greenBorder}`,
    color: T.green,
    fontSize: T.smallSize,
    fontFamily: T.font,
    padding: '2px 8px',
    borderRadius: '2px',
  },

  /* Calendar */
  calNav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  calHeaders: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
    marginBottom: '4px',
  },
  calHeader: {
    fontSize: T.smallSize,
    color: T.stack,
    textAlign: 'center',
    padding: '4px',
    fontFamily: T.font,
  },
  calGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
  },
  calCell: {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: '2px',
    padding: '5px',
    minHeight: '70px',
    fontFamily: T.font,
  },
  calCellTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '3px',
  },

  /* Coverage */
  mockCoverageRow: {
    padding: '8px 12px',
    borderBottom: `1px solid ${T.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  /* Settings */
  mockSettingsSection: {
    padding: '12px',
    border: `1px solid ${T.border}`,
    borderRadius: '2px',
    marginBottom: '12px',
  },
  mockPhaseOption: {
    padding: '8px 12px',
    border: `1px solid ${T.border}`,
    borderRadius: '2px',
  },
  mockWordTag: {
    fontSize: T.smallSize,
    color: T.desc,
    background: T.surface,
    border: `1px solid ${T.border}`,
    padding: '2px 8px',
    borderRadius: '2px',
    fontFamily: T.font,
  },
};
