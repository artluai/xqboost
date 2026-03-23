import { useState, useMemo, useEffect } from 'react';
import { useTheme, CHALLENGE_START, getDayNumber } from '../theme';
import { useTweets } from '../hooks/useTweets';

export default function Calendar({ sources }) {
  const { t } = useTheme();
  const { tweets } = useTweets();
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' }).toLowerCase();

  const challengeEnd = new Date(CHALLENGE_START);
  challengeEnd.setDate(challengeEnd.getDate() + 99);
  const isInChallenge = (d) => d >= CHALLENGE_START && d <= challengeEnd;
  const isToday = (d) => d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  const isFuture = (d) => d > today;

  const calendarDays = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    let pad = (first.getDay() + 6) % 7;
    const days = [];
    for (let i = pad - 1; i >= 0; i--) days.push({ date: new Date(year, month, -i), inMonth: false });
    for (let i = 1; i <= last.getDate(); i++) days.push({ date: new Date(year, month, i), inMonth: true });
    while (days.length % 7 !== 0) days.push({ date: new Date(year, month + 1, days.length - pad - last.getDate() + 1), inMonth: false });
    return days;
  }, [year, month]);

  const sourcesByDate = useMemo(() => {
    const m = {};
    (sources || []).forEach(s => { if (s.date) { if (!m[s.date]) m[s.date] = []; m[s.date].push(s); } });
    return m;
  }, [sources]);

  const tweetsByDate = useMemo(() => {
    const m = {};
    tweets.forEach(tw => {
      if (!tw.createdAt) return;
      const d = tw.createdAt.toDate ? tw.createdAt.toDate() : new Date(tw.createdAt);
      const k = d.toISOString().split('T')[0];
      if (!m[k]) m[k] = [];
      m[k].push(tw);
    });
    return m;
  }, [tweets]);

  const px = 24;

  // Mobile: date list view
  if (isMobile) {
    const datesWithContent = calendarDays
      .filter(({ inMonth }) => inMonth)
      .map(({ date }) => {
        const k = date.toISOString().split('T')[0];
        const dp = sourcesByDate[k] || [];
        const dt = tweetsByDate[k] || [];
        const dayNum = isInChallenge(date) ? getDayNumber(date) : null;
        return { date, k, dp, dt, dayNum, isToday: isToday(date) };
      })
      .filter(d => d.dp.length > 0 || d.dt.length > 0 || d.isToday);

    return (
      <div style={{ padding: `0 ${px}px` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 600, fontFamily: t.font, color: t.text }}>{monthName}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{ background: 'none', border: `1px solid ${t.borderHover}`, color: t.text, padding: '4px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer', fontFamily: t.font }}>←</button>
              <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ background: 'none', border: `1px solid ${t.borderHover}`, color: t.text, padding: '4px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer', fontFamily: t.font }}>→</button>
            </div>
          </div>
        </div>

        {datesWithContent.map(d => {
          const posted = d.dt.filter(tw => tw.status === 'posted').length;
          const draftCount = d.dt.filter(tw => tw.status === 'draft' || tw.status === 'approved').length;
          return (
            <div key={d.k} style={{
              padding: 16, marginBottom: 12,
              border: `1px solid ${d.isToday ? '#22c55e' : t.border}`,
              borderRadius: 8, background: d.isToday ? '#f0fdf4' : t.bg,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: t.text, fontFamily: t.font }}>
                    {d.date.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                  </span>
                  {d.isToday && <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, fontFamily: t.font }}>today</span>}
                  {d.dayNum && <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, fontFamily: t.font }}>d{d.dayNum}</span>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {d.dp.length > 0 && <span style={{ fontSize: 12, color: '#22c55e', background: '#e8f5e9', padding: '2px 8px', borderRadius: 4, fontFamily: t.font }}>{d.dp.length} project{d.dp.length !== 1 ? 's' : ''}</span>}
                  {posted > 0 && <span style={{ fontSize: 12, color: '#1d9bf0', background: '#e3f2fd', padding: '2px 8px', borderRadius: 4, fontFamily: t.font }}>{posted} posted</span>}
                  {draftCount > 0 && <span style={{ fontSize: 12, color: '#c2a300', background: '#fef9e7', padding: '2px 8px', borderRadius: 4, fontFamily: t.font }}>{draftCount} draft{draftCount !== 1 ? 's' : ''}</span>}
                </div>
              </div>
              {d.dp.map((p, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ width: 5, height: 5, background: '#22c55e', borderRadius: '50%', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: t.textSecondary, fontFamily: t.font }}>{p.name}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  // Desktop: 7-column grid
  return (
    <div style={{ padding: `0 ${px}px` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600, fontFamily: t.font, color: t.text }}>{monthName}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{ background: 'none', border: `1px solid ${t.borderHover}`, color: t.text, padding: '4px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer', fontFamily: t.font }}>←</button>
            <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ background: 'none', border: `1px solid ${t.borderHover}`, color: t.text, padding: '4px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer', fontFamily: t.font }}>→</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%', display: 'inline-block' }} /><span style={{ fontSize: 11, color: t.textSecondary, fontFamily: t.font }}>project</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: '#3b82f6', borderRadius: '50%', display: 'inline-block' }} /><span style={{ fontSize: 11, color: t.textSecondary, fontFamily: t.font }}>tweet</span></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', border: `1px solid ${t.border}`, borderRadius: 6, overflow: 'hidden' }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} style={{ background: t.surface, padding: 8, textAlign: 'center', fontSize: 12, color: t.textSecondary, fontWeight: 500, fontFamily: t.font, borderBottom: `1px solid ${t.border}` }}>{d}</div>
        ))}
        {calendarDays.map(({ date, inMonth }, i) => {
          const k = date.toISOString().split('T')[0];
          const dp = sourcesByDate[k] || [];
          const dt = tweetsByDate[k] || [];
          const dayNum = isInChallenge(date) ? getDayNumber(date) : null;
          const todayCell = isToday(date);
          const future = isFuture(date);

          return (
            <div key={i} style={{
              background: todayCell ? '#f0fdf4' : t.bg,
              padding: 6, minHeight: 80,
              fontFamily: t.font,
              opacity: !inMonth ? 0.2 : future ? 0.35 : 1,
              borderBottom: `1px solid ${t.border}`,
              borderRight: (i + 1) % 7 !== 0 ? `1px solid ${t.border}` : 'none',
              borderLeft: todayCell ? '2px solid #22c55e' : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: todayCell ? t.text : t.textSecondary, fontWeight: todayCell ? 600 : 400 }}>{date.getDate()}</span>
                {todayCell && <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>today</span>}
                {dayNum && dayNum > 0 && dayNum <= 100 && !todayCell && <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>d{dayNum}</span>}
                {todayCell && dayNum && <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>d{dayNum}</span>}
              </div>
              {dp.slice(0, 2).map((p, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                  <span style={{ width: 4, height: 4, background: '#22c55e', borderRadius: '50%', flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: t.textSecondary, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.name?.length > 14 ? p.name.slice(0, 12) + '…' : p.name}</span>
                </div>
              ))}
              {dp.length > 2 && <span style={{ fontSize: 10, color: t.textMuted }}>+{dp.length - 2} more</span>}
              {dt.length > 0 && (
                <div style={{ fontSize: 10, marginTop: 2 }}>
                  {dt.filter(tw => tw.status === 'posted').length > 0 && (
                    <span style={{ color: '#3b82f6' }}>{dt.filter(tw => tw.status === 'posted').length} posted</span>
                  )}
                  {dt.filter(tw => tw.status === 'draft' || tw.status === 'approved').length > 0 && (
                    <span style={{ color: '#c2a300', marginLeft: 4 }}>{dt.filter(tw => tw.status === 'draft' || tw.status === 'approved').length} draft{dt.filter(tw => tw.status === 'draft' || tw.status === 'approved').length !== 1 ? 's' : ''}</span>
                  )}
                </div>
              )}
              {dp.length > 0 && dt.filter(tw => tw.status === 'posted').length === 0 && !future && inMonth && (
                <div style={{ fontSize: 10, color: '#dc2626', marginTop: 2 }}>0 tweets</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
