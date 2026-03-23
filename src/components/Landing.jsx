import { useState } from 'react';
import { useTheme } from '../theme';

const TABS = ['queue', 'calendar', 'coverage', 'settings'];

export default function Landing({ onLogin }) {
  const { t, theme, toggle } = useTheme();
  const [preview, setPreview] = useState('queue');

  return (
    <div style={{ background: t.bg, minHeight: '100vh', fontFamily: t.font, color: t.text }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {theme === 'dark' ? (
              <span style={{ color: t.green, fontSize: '16px' }}>$_</span>
            ) : (
              <div style={{ width: 28, height: 28, background: t.btnPrimary, borderRadius: t.radiusXs, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: t.btnPrimaryText, fontSize: '11px', fontWeight: 700 }}>xq</span>
              </div>
            )}
            <span style={{ fontSize: '16px', fontWeight: 600 }}>xqboost</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={toggle} style={{ background: 'none', border: `1px solid ${t.border}`, color: t.textSecondary, padding: '4px 10px', borderRadius: t.radius, fontSize: '11px', cursor: 'pointer', fontFamily: t.font }}>
              {theme === 'light' ? 'dark' : 'light'}
            </button>
            <button onClick={onLogin} style={{ background: 'none', border: `1px solid ${t.borderHover}`, color: t.text, padding: '5px 14px', borderRadius: t.radius, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: t.font }}>sign in</button>
          </div>
        </div>

        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>AI-powered tweet management.</p>
          <p style={{ fontSize: '14px', color: t.textSecondary, lineHeight: '1.6', marginBottom: '20px' }}>auto-draft. queue. approve. post. track coverage across projects.</p>
          <button onClick={onLogin} style={{ background: t.btnPrimary, color: t.btnPrimaryText, border: 'none', padding: '10px 24px', borderRadius: t.radius, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: t.font }}>sign in with google</button>
        </div>

        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${t.border}`, marginBottom: '16px' }}>
            {TABS.map(tab => (
              <span key={tab} onClick={() => setPreview(tab)} style={{
                padding: '10px 16px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                color: preview === tab ? t.text : t.textSecondary,
                borderBottom: preview === tab ? `2px solid ${t.text}` : '2px solid transparent',
              }}>{tab}</span>
            ))}
          </div>

          <div style={{ border: `1px solid ${t.border}`, borderRadius: t.radiusSm, padding: '16px', position: 'relative', overflow: 'hidden' }}>
            {preview === 'queue' && <QueuePreview t={t} />}
            {preview === 'calendar' && <CalendarPreview t={t} />}
            {preview === 'coverage' && <CoveragePreview t={t} />}
            {preview === 'settings' && <SettingsPreview t={t} />}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { icon: '↳', title: 'auto-draft', desc: 'generates tweet drafts from project data' },
            { icon: '◉', title: 'coverage tracking', desc: 'see which projects have tweets and which don\'t' },
            { icon: '▦', title: 'calendar view', desc: 'projects + tweets mapped to a mon-sun grid' },
            { icon: '⚙', title: 'three phases', desc: 'manual → approved → full auto' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', padding: '14px', border: `1px solid ${t.border}`, borderRadius: t.radiusXs }}>
              <span style={{ color: t.green, fontSize: '14px', flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>{f.title}</div>
                <div style={{ fontSize: '12px', color: t.textSecondary, lineHeight: '1.4' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BlurredLine({ t, width }) {
  return <div style={{ height: '14px', background: t.surface, borderRadius: '4px', width: width || '100%', marginBottom: '6px' }}></div>;
}

function QueuePreview({ t }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <span style={{ padding: '4px 12px', background: t.pillActiveBg, color: t.pillActiveText, borderRadius: t.radius, fontSize: '12px', fontWeight: 500 }}>all</span>
        <span style={{ padding: '4px 12px', fontSize: '12px', color: t.pillText }}>drafts</span>
        <span style={{ padding: '4px 12px', fontSize: '12px', color: t.pillText }}>approved</span>
        <span style={{ padding: '4px 12px', fontSize: '12px', color: t.pillText }}>posted</span>
      </div>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ padding: '14px 0', borderBottom: `1px solid ${t.border}`, opacity: i === 2 ? 0.5 : 1 }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <span style={{ background: i === 2 ? t.blueBg : t.greenBg, color: i === 2 ? t.blueText : t.greenText, fontSize: '11px', padding: '2px 10px', borderRadius: t.radius, fontWeight: 600 }}>{i === 2 ? 'posted' : 'draft'}</span>
            <span style={{ fontSize: '12px', color: t.textMuted }}>announcement</span>
          </div>
          <div style={{ filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none' }}>
            <BlurredLine t={t} width="95%" />
            <BlurredLine t={t} width="80%" />
            <BlurredLine t={t} width="40%" />
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            {i < 2 ? (
              <>
                <span style={{ border: `1px solid ${t.btnBorder}`, color: t.btnText, fontSize: '12px', padding: '4px 14px', borderRadius: t.radius }}>edit</span>
                <span style={{ background: t.btnPrimary, color: t.btnPrimaryText, fontSize: '12px', padding: '4px 14px', borderRadius: t.radius, fontWeight: 600 }}>approve</span>
              </>
            ) : (
              <span style={{ fontSize: '12px', color: t.blueLink }}>view on x ↗</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CalendarPreview({ t }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <div>
      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>march 2026</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: t.border, borderRadius: t.radiusXs, overflow: 'hidden' }}>
        {days.map(d => (
          <div key={d} style={{ background: t.surface, padding: '6px', textAlign: 'center', fontSize: '11px', color: t.textSecondary, fontWeight: 500 }}>{d}</div>
        ))}
        {Array.from({ length: 14 }, (_, i) => {
          const day = i + 16;
          const hasContent = day >= 18 && day <= 23;
          return (
            <div key={i} style={{ background: day === 23 ? (t.name === 'light' ? '#f0fdf4' : '#041a0e') : t.bg, padding: '6px', minHeight: '56px', opacity: day < 18 ? 0.2 : day > 23 ? 0.3 : 1, borderLeft: day === 23 ? `2px solid ${t.green}` : 'none' }}>
              <span style={{ fontSize: '11px', color: day === 23 ? t.green : t.textSecondary, fontWeight: day === 23 ? 600 : 400 }}>{day > 31 ? day - 31 : day}</span>
              {hasContent && (
                <div style={{ filter: 'blur(4px)', marginTop: '4px' }}>
                  <div style={{ width: '80%', height: '6px', background: t.green, borderRadius: '2px', marginBottom: '3px', opacity: 0.5 }}></div>
                  {day % 2 === 0 && <div style={{ width: '60%', height: '6px', background: t.blue, borderRadius: '2px', opacity: 0.5 }}></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CoveragePreview({ t }) {
  return (
    <div>
      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>projects</div>
      <div style={{ border: `1px solid ${t.border}`, borderRadius: t.radiusSm, overflow: 'hidden' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ padding: '12px 14px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: i === 3 ? 0.4 : 1, borderLeft: i === 0 ? `3px solid ${t.green}` : '3px solid transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', filter: 'blur(5px)', userSelect: 'none' }}>
              <div style={{ width: '120px', height: '14px', background: t.surface, borderRadius: '4px' }}></div>
              <div style={{ width: '40px', height: '12px', background: t.surface, borderRadius: '4px' }}></div>
            </div>
            <span style={{ border: `1px solid ${t.btnBorder}`, color: t.btnText, fontSize: '11px', padding: '3px 10px', borderRadius: t.radius }}>+ draft</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPreview({ t }) {
  return (
    <div>
      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>posting phase</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        {['manual', 'approved', 'full auto'].map((p, i) => (
          <div key={p} style={{ padding: '10px 14px', border: `1px solid ${i === 0 ? t.green : t.border}`, borderRadius: t.radiusXs, background: i === 0 ? (t.name === 'light' ? '#f0fdf4' : '#041a0e') : 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: i === 0 ? t.green : 'transparent', border: `2px solid ${i === 0 ? t.green : t.textMuted}` }}></div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: i === 0 ? t.green : t.text }}>{p}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>banned words</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {['excited to share', 'just shipped', 'check it out', 'AI-powered'].map(w => (
          <span key={w} style={{ background: t.pillBg, color: t.pillText, fontSize: '12px', padding: '3px 10px', borderRadius: t.radius }}>{w} ×</span>
        ))}
      </div>
    </div>
  );
}
