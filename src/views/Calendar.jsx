import { useState, useMemo } from 'react';
import { T, CHALLENGE_START, getDayNumber } from '../tokens';
import { useTweets } from '../hooks/useTweets';

export default function Calendar({ sources }) {
  const { tweets } = useTweets();
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' }).toLowerCase();

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // Monday = 0, Sunday = 6 (ISO week)
    let startPad = (firstDay.getDay() + 6) % 7;
    const days = [];

    // Padding before month starts
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, inMonth: false });
    }

    // Days in month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), inMonth: true });
    }

    // Padding after month ends (fill to complete week)
    while (days.length % 7 !== 0) {
      const d = new Date(year, month + 1, days.length - startPad - lastDay.getDate() + 1);
      days.push({ date: d, inMonth: false });
    }

    return days;
  }, [year, month]);

  // Group sources by date
  const sourcesByDate = useMemo(() => {
    const map = {};
    (sources || []).forEach(s => {
      if (!s.date) return;
      const key = s.date;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [sources]);

  // Group tweets by date
  const tweetsByDate = useMemo(() => {
    const map = {};
    tweets.forEach(t => {
      if (!t.createdAt) return;
      const d = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
      const key = d.toISOString().split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tweets]);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const isToday = (d) => {
    return d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
  };

  const challengeEnd = new Date(CHALLENGE_START);
  challengeEnd.setDate(challengeEnd.getDate() + 99);

  const isInChallenge = (d) => d >= CHALLENGE_START && d <= challengeEnd;
  const isFuture = (d) => d > today;

  return (
    <div>
      {/* Month nav */}
      <div style={S.nav}>
        <div style={S.navLeft}>
          <span style={S.monthName}>{monthName}</span>
          <div style={S.navBtns}>
            <button style={S.navBtn} onClick={prevMonth}>←</button>
            <button style={S.navBtn} onClick={nextMonth}>→</button>
          </div>
        </div>
        <div style={S.legend}>
          <div style={S.legendItem}>
            <div style={{ ...S.dot, background: T.green }}></div>
            <span style={S.legendText}>project</span>
          </div>
          <div style={S.legendItem}>
            <div style={{ ...S.dot, background: T.blue }}></div>
            <span style={S.legendText}>tweet</span>
          </div>
        </div>
      </div>

      {/* Day headers */}
      <div style={S.grid}>
        {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(d => (
          <div key={d} style={S.dayHeader}>{d}</div>
        ))}
      </div>

      {/* Calendar cells */}
      <div style={S.grid}>
        {calendarDays.map(({ date, inMonth }, i) => {
          const dateStr = date.toISOString().split('T')[0];
          const dayProjects = sourcesByDate[dateStr] || [];
          const dayTweets = tweetsByDate[dateStr] || [];
          const dayNum = isInChallenge(date) ? getDayNumber(date) : null;
          const todayCell = isToday(date);
          const future = isFuture(date);

          return (
            <div
              key={i}
              style={{
                ...S.cell,
                opacity: !inMonth ? 0.15 : future ? 0.3 : 1,
                borderColor: todayCell ? T.greenBorder : T.border,
              }}
            >
              <div style={S.cellHeader}>
                <span style={{ ...S.cellDate, color: todayCell ? T.green : T.dim }}>
                  {date.getDate()}
                </span>
                {todayCell && <span style={S.todayLabel}>today</span>}
                {dayNum && dayNum > 0 && dayNum <= 100 && (
                  <span style={S.dayNum}>d{dayNum}</span>
                )}
              </div>

              <div style={S.cellContent}>
                {dayProjects.slice(0, 3).map((p, j) => (
                  <div key={j} style={S.cellItem}>
                    <div style={{ ...S.dotSmall, background: T.green }}></div>
                    <span style={S.cellItemText}>{p.name?.length > 14 ? p.name.slice(0, 14) + '…' : p.name}</span>
                  </div>
                ))}
                {dayProjects.length > 3 && (
                  <span style={S.moreText}>+{dayProjects.length - 3} more</span>
                )}

                {dayTweets.slice(0, 2).map((t, j) => (
                  <div key={`t${j}`} style={S.cellItem}>
                    <div style={{
                      ...S.dotSmall,
                      background: t.status === 'posted' ? T.blue : 'transparent',
                      border: t.status !== 'posted' ? `1px solid ${T.blue}` : 'none',
                    }}></div>
                    <span style={{ ...S.cellItemText, color: T.blueDim }}>
                      {t.status === 'posted' ? 'posted' : 'draft'}
                    </span>
                  </div>
                ))}
                {dayTweets.length > 2 && (
                  <span style={S.moreText}>+{dayTweets.length - 2} more</span>
                )}
              </div>

              {dayProjects.length > 0 && dayTweets.length === 0 && !future && inMonth && (
                <div style={S.gapLabel}>0 tweets</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const S = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  monthName: {
    fontSize: T.titleSize,
    color: T.title,
    fontFamily: T.font,
  },
  navBtns: {
    display: 'flex',
    gap: '4px',
  },
  navBtn: {
    background: 'none',
    border: `1px solid ${T.border}`,
    color: T.desc,
    fontSize: T.smallSize,
    fontFamily: T.font,
    padding: '1px 6px',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  legend: {
    display: 'flex',
    gap: '8px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  legendText: {
    fontSize: T.smallSize,
    color: T.dim,
    fontFamily: T.font,
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '1px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
  },
  dayHeader: {
    fontSize: T.smallSize,
    color: T.stack,
    textAlign: 'center',
    padding: '4px',
    fontFamily: T.font,
  },
  cell: {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: '2px',
    padding: '6px',
    minHeight: '90px',
    cursor: 'pointer',
    fontFamily: T.font,
  },
  cellHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  cellDate: {
    fontSize: T.smallSize,
    fontFamily: T.font,
  },
  todayLabel: {
    fontSize: T.tinySize,
    color: T.green,
    fontFamily: T.font,
  },
  dayNum: {
    fontSize: T.tinySize,
    color: T.green,
    fontFamily: T.font,
  },
  cellContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  cellItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
  },
  dotSmall: {
    width: '4px',
    height: '4px',
    borderRadius: '1px',
    flexShrink: 0,
    boxSizing: 'border-box',
  },
  cellItemText: {
    fontSize: T.tinySize,
    color: T.desc,
    fontFamily: T.font,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  moreText: {
    fontSize: T.tinySize,
    color: T.stack,
    fontFamily: T.font,
  },
  gapLabel: {
    fontSize: T.tinySize,
    color: T.dim,
    fontFamily: T.font,
    marginTop: '4px',
  },
};
