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
      if (!m[k]) m[k] = []; m[k].push(tw);
    });
    return m;
  }, [tweets]);

  const pill = (text, bg, color) => (
    <span style={{ background: bg, color, fontSize: '10px', padding: '2px 8px', borderRadius: t.radius, fontWeight: 500, fontFamily: t.font }}>{text}</span>
  );

  // Mobile: vertical cards for days with content
  if (isMobile) {
    const activeDays = calendarDays.filter(({ date, inMonth }) => {
      if (!inMonth) return false;
      const k = date.toISOString().split('T')[0];
      return (sourcesByDate[k]?.length > 0) || (tweetsByDate[k]?.length > 0) || isToday(date);
    }).reverse();

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, fontFamily: t.font, color: t.text }}>{monthName}</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{ background: 'none', border: `1px solid ${t.borderHover}`, color: t.text, padding: '3px 10px', borderRadius: t.radius, fontSize: '12px', cursor: 'pointer', fontFamily: t.font }}>←</button>
              <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ background: 'none', border: `1px solid ${t.borderHover}`, color: t.text, padding: '3px 10px', borderRadius: t.radius, fontSize: '12px', cursor: 'pointer', fontFamily: t.font }}>→</button>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activeDays.map(({ date }, i) => {
            const k = date.toISOString().split('T')[0];
            const dp = sourcesByDate[k] || [];
            const dt = tweetsByDate[k] || [];
            const dayNum = isInChallenge(date) ? getDayNumber(date) : null;
            const todayCell = isToday(date);
            const posted = dt.filter(tw => tw.status === 'posted').length;
            const drafts = dt.filter(tw => tw.status === 'draft').length;

            return (
              <div key={i} style={{ border: `1px solid ${todayCell ? t.green : t.border}`, borderRadius: t.radiusSm, padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: t.font, color: t.text }}>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    {todayCell && <span style={{ fontSize: '11px', color: t.green, fontWeight: 600, fontFamily: t.font }}>today</span>}
                    {dayNum && <span style={{ fontSize: '11px', color: t.green, fontWeight: 600, fontFamily: t.font }}>d{dayNum}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {dp.length > 0 && pill(`${dp.length} project${dp.length > 1 ? 's' : ''}`, t.greenBg, t.greenText)}
                    {posted > 0 && pill(`${posted} posted`, t.blueBg, t.blueText)}
                    {drafts > 0 && pill(`${drafts} draft${drafts > 1 ? 's' : ''}`, t.blueBg, t.blueText)}
                    {dp.length > 0 && dt.length === 0 && pill('0 tweets', t.redBg, t.redText)}
                  </div>
                </div>
                {dp.map((p, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                    <div style={{ width: 5, height: 5, background: t.green, borderRadius: '50%', flexShrink: 0 }}></div>
                    <span style={{ fontSize: '12px', color: t.textSecondary, fontFamily: t.font }}>{p.name}</span>
                  </div>
                ))}
                {dt.map((tw, j) => (
                  <div key={`t${j}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: tw.status === 'posted' ? t.blue : 'transparent', border: tw.status !== 'posted' ? `1.5px solid ${t.blue}` : 'none', boxSizing: 'border-box' }}></div>
                    <span style={{ fontSize: '12px', color: t.blueLink, fontFamily: t.font }}>{tw.status === 'posted' ? 'posted' : 'draft'}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop: 7-column grid
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '15px', fontWeight: 600, fontFamily: t.font, color: t.text }}>{monthName}</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{ background: 'none', border: `1px solid ${t.borderHover}`, color: t.text, padding: '3px 10px', borderRadius: t.radius, fontSize: '12px', cursor: 'pointer', fontFamily: t.font }}>←</button>
            <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ background: 'none', border: `1px solid ${t.borderHover}`, color: t.text, padding: '3px 10px', borderRadius: t.radius, fontSize: '12px', cursor: 'pointer', fontFamily: t.font }}>→</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, background: t.green, borderRadius: '50%' }}></div><span style={{ fontSize: '11px', color: t.textSecondary, fontFamily: t.font }}>project</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, background: t.blue, borderRadius: '50%' }}></div><span style={{ fontSize: '11px', color: t.textSecondary, fontFamily: t.font }}>tweet</span></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: t.border, border: `1px solid ${t.border}`, borderRadius: t.radiusXs, overflow: 'hidden' }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} style={{ background: t.surface, padding: '8px', textAlign: 'center', fontSize: '11px', color: t.textSecondary, fontWeight: 500, fontFamily: t.font }}>{d}</div>
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
              background: todayCell ? (t.name === 'light' ? '#f0fdf4' : '#041a0e') : t.bg,
              padding: '8px', minHeight: '80px', cursor: 'pointer', fontFamily: t.font,
              opacity: !inMonth ? 0.2 : future ? 0.3 : 1,
              borderLeft: todayCell ? `2px solid ${t.green}` : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: todayCell ? t.text : t.textSecondary, fontWeight: todayCell ? 600 : 400 }}>{date.getDate()}</span>
                {todayCell && <span style={{ fontSize: '10px', color: t.green, fontWeight: 600 }}>today</span>}
                {dayNum && dayNum > 0 && dayNum <= 100 && !todayCell && <span style={{ fontSize: '10px', color: t.green, fontWeight: 600 }}>d{dayNum}</span>}
                {todayCell && dayNum && <span style={{ fontSize: '10px', color: t.green, fontWeight: 600 }}>d{dayNum}</span>}
              </div>
              {dp.slice(0, 3).map((p, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
                  <div style={{ width: 4, height: 4, background: t.green, borderRadius: '50%', flexShrink: 0 }}></div>
                  <span style={{ fontSize: '10px', color: t.textSecondary, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.name?.length > 12 ? p.name.slice(0, 12) + '…' : p.name}</span>
                </div>
              ))}
              {dt.slice(0, 2).map((tw, j) => (
                <div key={`t${j}`} style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', flexShrink: 0, background: tw.status === 'posted' ? t.blue : 'transparent', border: tw.status !== 'posted' ? `1.5px solid ${t.blue}` : 'none', boxSizing: 'border-box' }}></div>
                  <span style={{ fontSize: '10px', color: t.blueLink }}>{tw.status === 'posted' ? 'posted' : 'draft'}</span>
                </div>
              ))}
              {dp.length > 0 && dt.length === 0 && !future && inMonth && (
                <div style={{ fontSize: '10px', color: t.red, marginTop: '2px' }}>0 tweets</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
