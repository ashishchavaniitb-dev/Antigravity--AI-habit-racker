import React, { useState, useMemo } from 'react';
import './AnalyticsView.css';
import {
  getTodayString,
  getWeekSunToSat,
  getPrevWeekSunToSat,
  getWeekStartSunday,
  formatWeekRange,
  formatComparisonRange,
  getMonthDates,
  getMonthStart,
  formatMonthLabel,
  formatMonthComparison,
  MONTH_NAMES,
} from '../utils/dates';

// ─── Color mapping from colorClass → solid hex ───
const COLOR_MAP = {
  'bg-blue':    { solid: '#3b82f6', faded: '#93C5FD' },
  'bg-amber':   { solid: '#d97706', faded: '#FCD34D' },
  'bg-pink':    { solid: '#db2777', faded: '#F9A8D4' },
  'bg-purple':  { solid: '#7c3aed', faded: '#C4B5FD' },
  'bg-emerald': { solid: '#059669', faded: '#6EE7B7' },
  'bg-red':     { solid: '#dc2626', faded: '#FCA5A5' },
};

function getHabitColor(colorClass) {
  return COLOR_MAP[colorClass] || { solid: '#0F6E56', faded: '#97C459' };
}

// ─── Shared helpers ───

function dateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Weekly computation helpers ───

function habitWeekRate(habit, weekDates) {
  let expectedDays = 7;
  if (habit.frequency) {
      if (habit.frequency.type === 'weekly' && habit.frequency.days && habit.frequency.days.length > 0) {
          expectedDays = habit.frequency.days.length;
      } else if (habit.frequency.type === 'weekly' && habit.frequency.times) {
          expectedDays = habit.frequency.times;
      } else if (habit.frequency.type === 'none') {
          expectedDays = 1;
      }
  }

  let daysCompleted = 0;
  weekDates.forEach(d => { if (habit.logs[d]) daysCompleted++; });
  return expectedDays > 0 ? Math.round(Math.min(100, (daysCompleted / expectedDays) * 100)) : 0;
}

function overallRate(habits, weekDates) {
  if (habits.length === 0) return 0;
  const sum = habits.reduce((acc, h) => acc + habitWeekRate(h, weekDates), 0);
  return Math.round(sum / habits.length);
}

/** Count trophies per habit based on its own data history */
function trophiesWon(habits, thisWeek, prevWeek) {
  let count = 0;
  habits.forEach(h => {
    const thisRate = habitWeekRate(h, thisWeek);
    const prevRate = habitWeekRate(h, prevWeek);
    const habitHasPrevData = Object.keys(h.logs).some(d => d <= prevWeek[prevWeek.length - 1]);
    if (habitHasPrevData) {
      // Standard: trophy if this week meets or exceeds last week
      if ((thisRate > 0 || prevRate > 0) && thisRate >= prevRate) count++;
    } else {
      // Week Zero: trophy only for perfect week (100%)
      if (thisRate === 100) count++; // trophyType: "perfect_week"
    }
  });
  return count;
}

function topCurrentStreak(habits, todayStr) {
  let best = 0;
  let bestName = '';
  habits.forEach(h => {
    let streak = 0;
    const d = new Date(todayStr);
    d.setHours(0, 0, 0, 0);
    
    const missesPerWeek = {};
    const getWeekKey = (dateObj) => {
      const temp = new Date(dateObj);
      temp.setHours(0,0,0,0);
      const day = temp.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      temp.setDate(temp.getDate() + diff);
      return `${temp.getFullYear()}-${temp.getMonth()}-${temp.getDate()}`;
    };

    const loggedDates = Object.keys(h.logs).sort();
    if (loggedDates.length === 0) return;
    const earliestLogDt = new Date(loggedDates[0]);
    earliestLogDt.setHours(0,0,0,0);

    if (h.logs[todayStr]) streak++;
    d.setDate(d.getDate() - 1);
    
    while (d >= earliestLogDt) {
      const ds = dateStr(d);
      const dow = d.getDay();
      const isRequired = () => {
        const f = h.frequency;
        if (!f || f.type === 'none') return false;
        if (f.type === 'daily') return true;
        if (f.type === 'weekly' && f.days && f.days.length > 0) return f.days.includes(dow);
        return true;
      };
      
      if (h.logs[ds]) { 
        streak++; 
        d.setDate(d.getDate() - 1); 
      } else {
        if (isRequired()) { 
           const wkKey = getWeekKey(d);
           missesPerWeek[wkKey] = (missesPerWeek[wkKey] || 0) + 1;
           if (missesPerWeek[wkKey] > 1) {
              break; 
           }
           d.setDate(d.getDate() - 1);
        } else {
           d.setDate(d.getDate() - 1);
        }
      }
    }
    if (streak > best) { best = streak; bestName = h.name; }
  });
  return { count: best, habitName: bestName };
}

function weeklyStreak(habits, selectedSunday) {
  let streak = 0;
  let sun = new Date(selectedSunday);
  sun.setHours(0, 0, 0, 0);
  while (true) {
    const week = getWeekSunToSat(dateStr(sun));
    const hasAny = week.some(d => habits.some(h => !!h.logs[d]));
    if (hasAny) { streak++; sun.setDate(sun.getDate() - 7); }
    else break;
  }
  return streak;
}

function isPersonalBest(habits, selectedSunday) {
  const current = weeklyStreak(habits, selectedSunday);
  if (current <= 1) return false;
  let earliest = null;
  habits.forEach(h => { Object.keys(h.logs).forEach(d => { if (!earliest || d < earliest) earliest = d; }); });
  if (!earliest) return false;
  const earliestSun = getWeekStartSunday(earliest);
  let sun = new Date(earliestSun);
  sun.setHours(0, 0, 0, 0);
  const selectedTime = new Date(selectedSunday).getTime();
  while (sun.getTime() < selectedTime) {
    const s = weeklyStreak(habits, sun);
    if (s >= current) return false;
    sun.setDate(sun.getDate() + 7);
  }
  return true;
}

function getEarliestSunday(habits) {
  let earliest = null;
  habits.forEach(h => { Object.keys(h.logs).forEach(d => { if (!earliest || d < earliest) earliest = d; }); });
  if (!earliest) return null;
  return getWeekStartSunday(earliest);
}

function hasDataForWeek(habits, weekDates) {
  return weekDates.some(d => habits.some(h => !!h.logs[d]));
}

function hasPrevWeekData(habits, prevWeekDates) {
  return prevWeekDates.some(d => habits.some(h => !!h.logs[d]));
}

// ─── Monthly computation helpers ───

function habitMonthRate(habit, monthDates) {
  let expectedDaysPerWeek = 7;
  if (habit.frequency) {
      if (habit.frequency.type === 'weekly' && habit.frequency.days && habit.frequency.days.length > 0) {
          expectedDaysPerWeek = habit.frequency.days.length;
      } else if (habit.frequency.type === 'weekly' && habit.frequency.times) {
          expectedDaysPerWeek = habit.frequency.times;
      } else if (habit.frequency.type === 'none') {
          expectedDaysPerWeek = 1;
      }
  }
  
  const expectedDaysThisMonth = (monthDates.length / 7) * expectedDaysPerWeek;

  let daysCompleted = 0;
  monthDates.forEach(d => { if (habit.logs[d]) daysCompleted++; });
  return expectedDaysThisMonth > 0 ? Math.round(Math.min(100, (daysCompleted / expectedDaysThisMonth) * 100)) : 0;
}

function overallMonthRate(habits, monthDates) {
  if (habits.length === 0) return 0;
  const sum = habits.reduce((acc, h) => acc + habitMonthRate(h, monthDates), 0);
  return Math.round(sum / habits.length);
}

/** Count trophies per habit based on its own data history */
function monthlyTrophiesWon(habits, thisMonthDates, prevMonthDates) {
  let count = 0;
  habits.forEach(h => {
    const thisRate = habitMonthRate(h, thisMonthDates);
    const prevRate = habitMonthRate(h, prevMonthDates);
    const habitHasPrevData = Object.keys(h.logs).some(d => d <= prevMonthDates[prevMonthDates.length - 1]);
    if (habitHasPrevData) {
      if ((thisRate > 0 || prevRate > 0) && thisRate >= prevRate) count++;
    } else {
      // Month Zero: trophy only for perfect month (100%)
      if (thisRate === 100) count++; // trophyType: "perfect_week" (reused conceptual type)
    }
  });
  return count;
}

/** Monthly streak: consecutive months going backward from selected month where at least 1 habit had any log entry */
function monthlyStreak(habits, year, month) {
  let streak = 0;
  let y = year, m = month;
  while (true) {
    const dates = getMonthDates(y, m);
    const hasAny = dates.some(d => habits.some(h => !!h.logs[d]));
    if (hasAny) {
      streak++;
      m--;
      if (m < 0) { m = 11; y--; }
    } else {
      break;
    }
  }
  return streak;
}

/** Check if current monthly streak is the all-time personal best */
function isMonthlyPersonalBest(habits, year, month) {
  const current = monthlyStreak(habits, year, month);
  if (current <= 1) return false;

  // Find earliest month with a log
  let earliestDate = null;
  habits.forEach(h => { Object.keys(h.logs).forEach(d => { if (!earliestDate || d < earliestDate) earliestDate = d; }); });
  if (!earliestDate) return false;

  const ed = new Date(earliestDate);
  let ey = ed.getFullYear(), em = ed.getMonth();

  // Walk every month from earliest to the one before selected
  while (ey < year || (ey === year && em < month)) {
    const s = monthlyStreak(habits, ey, em);
    if (s >= current) return false;
    em++;
    if (em > 11) { em = 0; ey++; }
  }
  return true;
}

function getEarliestMonth(habits) {
  let earliest = null;
  habits.forEach(h => { Object.keys(h.logs).forEach(d => { if (!earliest || d < earliest) earliest = d; }); });
  if (!earliest) return null;
  const d = new Date(earliest);
  return { year: d.getFullYear(), month: d.getMonth() };
}

function hasDataForMonth(habits, monthDates) {
  return monthDates.some(d => habits.some(h => !!h.logs[d]));
}

// ─── SVG Icons ───
const TrophySVG = () => (
  <svg viewBox="0 0 12 12" fill="none">
    <path d="M6 8.5C4 8.5 2.5 7 2.5 5V1.5h7V5C9.5 7 8 8.5 6 8.5z" stroke="#633806" strokeWidth="1" fill="none"/>
    <path d="M6 8.5v1.5M4 11h4" stroke="#633806" strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

// ─── Main Component ───
function AnalyticsView({ habits }) {
  const today = getTodayString();
  const currentSunday = getWeekStartSunday(today);
  const currentMonth = getMonthStart(today);

  // Tab state
  const [activeTab, setActiveTab] = useState('weekly');

  // Weekly state
  const [selectedSunday, setSelectedSunday] = useState(currentSunday);

  // Monthly state
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // ════════════════════════════
  // WEEKLY derived values
  // ════════════════════════════
  const selectedWeek = useMemo(() => getWeekSunToSat(dateStr(selectedSunday)), [selectedSunday]);
  const prevWeek = useMemo(() => getPrevWeekSunToSat(dateStr(selectedSunday)), [selectedSunday]);

  const isCurrentWeek = dateStr(selectedSunday) === dateStr(currentSunday);
  const earliestSunday = useMemo(() => getEarliestSunday(habits), [habits]);
  const isEarliestWeek = earliestSunday ? dateStr(selectedSunday) <= dateStr(earliestSunday) : true;

  const goBackWeek = () => {
    const prev = new Date(selectedSunday);
    prev.setDate(prev.getDate() - 7);
    setSelectedSunday(prev);
  };
  const goForwardWeek = () => {
    const next = new Date(selectedSunday);
    next.setDate(next.getDate() + 7);
    if (next.getTime() <= currentSunday.getTime()) setSelectedSunday(next);
  };

  // ════════════════════════════
  // MONTHLY derived values
  // ════════════════════════════
  const selectedMonthDates = useMemo(() => getMonthDates(selectedMonth.year, selectedMonth.month), [selectedMonth]);
  const prevMonthObj = useMemo(() => {
    let pm = selectedMonth.month - 1, py = selectedMonth.year;
    if (pm < 0) { pm = 11; py--; }
    return { year: py, month: pm };
  }, [selectedMonth]);
  const prevMonthDates = useMemo(() => getMonthDates(prevMonthObj.year, prevMonthObj.month), [prevMonthObj]);

  const isCurrentMonth = selectedMonth.year === currentMonth.year && selectedMonth.month === currentMonth.month;
  const earliestMonth = useMemo(() => getEarliestMonth(habits), [habits]);
  const isEarliestMonth = earliestMonth
    ? (selectedMonth.year < earliestMonth.year || (selectedMonth.year === earliestMonth.year && selectedMonth.month <= earliestMonth.month))
    : true;

  const goBackMonth = () => {
    setSelectedMonth(prev => {
      let nm = prev.month - 1, ny = prev.year;
      if (nm < 0) { nm = 11; ny--; }
      return { year: ny, month: nm };
    });
  };
  const goForwardMonth = () => {
    setSelectedMonth(prev => {
      let nm = prev.month + 1, ny = prev.year;
      if (nm > 11) { nm = 0; ny++; }
      // Don't go past current month
      if (ny > currentMonth.year || (ny === currentMonth.year && nm > currentMonth.month)) return prev;
      return { year: ny, month: nm };
    });
  };

  if (habits.length === 0) {
    return (
      <div className="analytics-empty">
        <p>No habits to analyze yet. Add a habit and check in to see your progress!</p>
      </div>
    );
  }

  const primaryColor = '#0F6E56';
  const fadedColor = '#97C459';

  // Render delta text — only positive/neutral shown (encouraging insights only)
  const renderDelta = (delta, hasPrev, unit = '%', prefix = 'vs last week') => {
    if (!hasPrev) return null;
    if (delta > 0) return <div className="a-stat-delta delta-up">↑ {delta}{unit} {prefix}</div>;
    if (delta === 0) return <div className="a-stat-delta delta-neutral">Same as {prefix.replace('vs ', '')}</div>;
    // Negative delta: hide entirely (encouraging insights only)
    return null;
  };

  // ════════════════════════════════════════
  // WEEKLY REPORT
  // ════════════════════════════════════════
  const renderWeeklyReport = () => {
    const weekHasData = hasDataForWeek(habits, selectedWeek);
    const prevHasData = hasPrevWeekData(habits, prevWeek);

    const rate = overallRate(habits, selectedWeek);
    const prevRate = overallRate(habits, prevWeek);
    const rateDelta = rate - prevRate;
    const trophies = trophiesWon(habits, selectedWeek, prevWeek);
    const prevPrevWeek = getPrevWeekSunToSat(dateStr(new Date(selectedSunday.getTime() - 7 * 86400000)));
    const prevTrophies = trophiesWon(habits, prevWeek, prevPrevWeek);
    const trophyDelta = trophies - prevTrophies;
    const streak = weeklyStreak(habits, selectedSunday);
    const personalBest = isPersonalBest(habits, selectedSunday);
    const topStreak = topCurrentStreak(habits, today);

    // Streak chart data (last 6 weeks + next placeholder)
    const streakChartData = (() => {
      const weeks = [];
      for (let i = 5; i >= 0; i--) {
        const s = new Date(selectedSunday);
        s.setDate(s.getDate() - i * 7);
        const wk = getWeekSunToSat(dateStr(s));
        const r = overallRate(habits, wk);
        const isCurrent = i === 0;
        weeks.push({ label: `W${6 - i}`, rate: r, isCurrent, isFuture: false, opacity: 0.4 + (6 - i) * 0.1 });
      }
      weeks.push({ label: 'next', rate: 0, isCurrent: false, isFuture: true });
      return weeks;
    })();

    return (
      <>
        {/* Week Navigator */}
        <div className="week-navigator">
          <button className="week-nav-btn" onClick={goBackWeek} disabled={isEarliestWeek} aria-label="Previous week">‹</button>
          <span className="week-nav-label">{formatWeekRange(selectedWeek)}</span>
          <button className="week-nav-btn" onClick={goForwardWeek} disabled={isCurrentWeek} aria-label="Next week">›</button>
        </div>
        <div className="date-range-subtitle">{formatComparisonRange(selectedWeek, prevWeek)}</div>

        {!weekHasData ? (
          <div className="a-wide-card">
            <div className="analytics-no-data">
              <h4>No data for this week</h4>
              <p>Start logging habits to see your report here.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Section 1: Stat Cards */}
            <div className="a-stat-grid">
              <div className="a-stat-card">
                <div className="a-stat-label">
                  <span className="a-icon"><svg viewBox="0 0 14 14" fill="none" width="14" height="14"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1"/><path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg></span>
                  Overall rate
                </div>
                <div className="a-stat-value">{rate}%</div>
                <div className="a-stat-sub">avg across {habits.length} habits</div>
                {renderDelta(rateDelta, prevHasData)}
              </div>

              <div className="a-stat-card">
                <div className="a-stat-label">
                  <span className="a-icon"><svg viewBox="0 0 14 14" fill="none" width="14" height="14"><path d="M7 9C4.8 9 3 7.2 3 5V2h8v3c0 2.2-1.8 4-4 4z" stroke="currentColor" strokeWidth="1" fill="none"/><path d="M3 3H2a1 1 0 001 1M11 3h1a1 1 0 01-1 1" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><path d="M7 9v1.5M5 11.5h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg></span>
                  Trophies won
                </div>
                <div className="a-stat-value">{trophies}<span className="a-stat-denom">/{habits.length}</span></div>
                <div className="a-stat-sub">{prevHasData ? 'habits met/beat last wk' : 'perfect week trophies'}</div>
                {prevHasData && (
                  trophyDelta > 0
                    ? <div className="a-stat-delta delta-up">↑ {trophyDelta} more than last week</div>
                    : trophyDelta === 0
                      ? <div className="a-stat-delta delta-neutral">Same as last week</div>
                      : null /* Hide negative — encouraging insights only */
                )}
              </div>

              <div className="a-stat-card">
                <div className="a-stat-label">
                  <span className="a-icon"><svg viewBox="0 0 14 14" fill="none" width="14" height="14"><path d="M7 2C4.5 2 3 4 3 6c0 3 4 6 4 6s4-3 4-6c0-2-1.5-4-4-4z" stroke="currentColor" strokeWidth="1" fill="none"/></svg></span>
                  Weekly streak
                </div>
                <div className="a-stat-value">{streak}<span className="a-stat-denom">wk</span></div>
                <div className="a-stat-sub">consecutive weeks</div>
                {personalBest && <div className="a-stat-delta delta-up">Personal best!</div>}
              </div>

              <div className="a-stat-card">
                <div className="a-stat-label">
                  <span className="a-icon"><svg viewBox="0 0 14 14" fill="none" width="14" height="14"><path d="M7 2C4.5 2 3 4 3 6c0 3 4 6 4 6s4-3 4-6c0-2-1.5-4-4-4z" stroke="currentColor" strokeWidth="1" fill="none"/><circle cx="7" cy="6" r="1.5" stroke="currentColor" strokeWidth="0.8" fill="none"/></svg></span>
                  Top streak
                </div>
                <div className="a-stat-value">{topStreak.count}<span className="a-stat-denom"> days</span></div>
                <div className="a-stat-sub">{topStreak.habitName || 'No active streak'}</div>
              </div>
            </div>

            {/* Section 2: Overall Completion Bar */}
            <div className="a-wide-card">
              <div className="completion-header">
                <div><div className="completion-title">Overall completion</div><div className="completion-subtitle">This week vs last week</div></div>
                <div><div className="completion-pct-big">{rate}%</div>{prevHasData && <div className="completion-pct-sub">was {prevRate}% last week</div>}</div>
              </div>
              <div className="completion-bars">
                <div className="a-bar-row">
                  <div className="a-bar-label">This week</div>
                  <div className="a-bar-track"><div className="a-bar-fill" style={{ width: `${rate}%`, background: primaryColor }} /></div>
                  <div className="a-bar-pct">{rate}%</div>
                </div>
                <div className="a-bar-row">
                  <div className="a-bar-label">Last week</div>
                  <div className="a-bar-track"><div className="a-bar-fill" style={{ width: `${prevRate}%`, background: fadedColor, opacity: 0.55 }} /></div>
                  <div className="a-bar-pct muted">{prevRate}%</div>
                </div>
              </div>
            </div>

            {/* Section 3: Per-Habit Breakdown */}
            <div className="a-wide-card">
              <div className="breakdown-header">
                <span className="breakdown-title">Per habit breakdown</span>
                <div className="breakdown-legend">
                  <div className="legend-item"><div className="legend-dot" style={{ background: primaryColor }} />This wk</div>
                  <div className="legend-item"><div className="legend-dot" style={{ background: fadedColor, opacity: 0.55 }} />Last wk</div>
                </div>
              </div>
              {habits.map((habit, idx) => {
                const hRate = habitWeekRate(habit, selectedWeek);
                const hPrev = habitWeekRate(habit, prevWeek);
                const habitHasPrevData = Object.keys(habit.logs).some(d => d <= prevWeek[prevWeek.length - 1]);
                // Week Zero: trophy only for perfect week (100%), standard: meets or exceeds prev
                const hasTrophy = habitHasPrevData ? ((hRate > 0 || hPrev > 0) && hRate >= hPrev) : (hRate === 100);
                const colors = getHabitColor(habit.colorClass);
                return (
                  <div className="habit-row" key={habit.id} style={idx === habits.length - 1 ? { marginBottom: 0 } : {}}>
                    <div className="habit-row-header">
                      <div className="habit-row-name"><div className="habit-icon-xs">{habit.emoji}</div>{habit.name}</div>
                      <div className="pct-pair">
                        <span className="pct-curr">{hRate}%</span>
                        {prevHasData && <span className="pct-last">was {hPrev}%</span>}
                        {hasTrophy && <div className="trophy-badge"><TrophySVG /></div>}
                      </div>
                    </div>
                    <div className="dual-bar">
                      <div className="a-bar-row"><div className="a-bar-label">Now</div><div className="a-bar-track"><div className="a-bar-fill" style={{ width: `${hRate}%`, background: colors.solid }} /></div><div className="a-bar-pct">{hRate}%</div></div>
                      <div className="a-bar-row"><div className="a-bar-label">Prev</div><div className="a-bar-track"><div className="a-bar-fill" style={{ width: `${hPrev}%`, background: colors.solid, opacity: 0.4 }} /></div><div className="a-bar-pct muted">{hPrev}%</div></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Section 4: Weekly Streak Chart */}
            <div className="a-wide-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div><div className="completion-title">Weekly streak</div><div className="completion-subtitle">Consistent weeks logged</div></div>
                <div className="streak-info"><div className="streak-num">{streak}</div><div className="streak-unit">weeks</div></div>
              </div>
              <div className="streak-chart-bars">
                {streakChartData.map((w, i) => (
                  <div className="streak-week-col" key={i}>
                    {w.isFuture ? (
                      <div className="streak-placeholder"><span>{w.label === 'next' ? `W${i + 1}` : w.label}</span></div>
                    ) : (
                      <div className="streak-bar-wrap">
                        <div className="streak-bar-fill" style={{ height: `${Math.max(w.rate, 2)}%`, background: primaryColor, opacity: w.isCurrent ? 1 : w.opacity }} />
                      </div>
                    )}
                    <span className={`streak-week-label ${w.isCurrent ? 'active' : ''}`}>{w.isFuture ? 'next' : w.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </>
    );
  };

  // ════════════════════════════════════════
  // MONTHLY REPORT
  // ════════════════════════════════════════
  const renderMonthlyReport = () => {
    const monthHasData = hasDataForMonth(habits, selectedMonthDates);
    const prevHasData = hasDataForMonth(habits, prevMonthDates);

    const rate = overallMonthRate(habits, selectedMonthDates);
    const prevRate = overallMonthRate(habits, prevMonthDates);
    const rateDelta = rate - prevRate;
    const trophies = monthlyTrophiesWon(habits, selectedMonthDates, prevMonthDates);

    // Prev-prev month for trophy delta
    let ppm = prevMonthObj.month - 1, ppy = prevMonthObj.year;
    if (ppm < 0) { ppm = 11; ppy--; }
    const prevPrevMonthDates = getMonthDates(ppy, ppm);
    const prevTrophies = monthlyTrophiesWon(habits, prevMonthDates, prevPrevMonthDates);
    const trophyDelta = trophies - prevTrophies;

    const streak = monthlyStreak(habits, selectedMonth.year, selectedMonth.month);
    const personalBest = isMonthlyPersonalBest(habits, selectedMonth.year, selectedMonth.month);
    const topStreak = topCurrentStreak(habits, today);

    // Streak chart data (last 6 months + next placeholder)
    const streakChartData = (() => {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        let cm = selectedMonth.month - i, cy = selectedMonth.year;
        while (cm < 0) { cm += 12; cy--; }
        const md = getMonthDates(cy, cm);
        const r = overallMonthRate(habits, md);
        const isCurrent = i === 0;
        months.push({
          label: MONTH_SHORT[cm],
          rate: r,
          isCurrent,
          isFuture: false,
          opacity: 0.4 + (6 - i) * 0.1,
        });
      }
      // Next month placeholder
      let nm = selectedMonth.month + 1, ny = selectedMonth.year;
      if (nm > 11) { nm = 0; ny++; }
      months.push({ label: MONTH_SHORT[nm], rate: 0, isCurrent: false, isFuture: true });
      return months;
    })();

    return (
      <>
        {/* Month Navigator */}
        <div className="week-navigator">
          <button className="week-nav-btn" onClick={goBackMonth} disabled={isEarliestMonth} aria-label="Previous month">‹</button>
          <span className="week-nav-label">{formatMonthLabel(selectedMonth.year, selectedMonth.month)}</span>
          <button className="week-nav-btn" onClick={goForwardMonth} disabled={isCurrentMonth} aria-label="Next month">›</button>
        </div>
        <div className="date-range-subtitle">
          {formatMonthComparison(selectedMonth.year, selectedMonth.month)}
        </div>

        {!monthHasData ? (
          <div className="a-wide-card">
            <div className="analytics-no-data">
              <h4>No data for this month</h4>
              <p>Start logging habits to see your report here.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Section 1: Stat Cards */}
            <div className="a-stat-grid">
              <div className="a-stat-card">
                <div className="a-stat-label">
                  <span className="a-icon"><svg viewBox="0 0 14 14" fill="none" width="14" height="14"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1"/><path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg></span>
                  Overall rate
                </div>
                <div className="a-stat-value">{rate}%</div>
                <div className="a-stat-sub">avg across {habits.length} habits</div>
                {renderDelta(rateDelta, prevHasData, '%', 'vs last month')}
              </div>

              <div className="a-stat-card">
                <div className="a-stat-label">
                  <span className="a-icon"><svg viewBox="0 0 14 14" fill="none" width="14" height="14"><path d="M7 9C4.8 9 3 7.2 3 5V2h8v3c0 2.2-1.8 4-4 4z" stroke="currentColor" strokeWidth="1" fill="none"/><path d="M3 3H2a1 1 0 001 1M11 3h1a1 1 0 01-1 1" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><path d="M7 9v1.5M5 11.5h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg></span>
                  Trophies won
                </div>
                <div className="a-stat-value">{trophies}<span className="a-stat-denom">/{habits.length}</span></div>
                <div className="a-stat-sub">{prevHasData ? 'habits met/beat last mo' : 'perfect month trophies'}</div>
                {prevHasData && (
                  trophyDelta > 0
                    ? <div className="a-stat-delta delta-up">↑ {trophyDelta} more than last month</div>
                    : trophyDelta === 0
                      ? <div className="a-stat-delta delta-neutral">Same as last month</div>
                      : null /* Hide negative — encouraging insights only */
                )}
              </div>

              <div className="a-stat-card">
                <div className="a-stat-label">
                  <span className="a-icon"><svg viewBox="0 0 14 14" fill="none" width="14" height="14"><path d="M7 2C4.5 2 3 4 3 6c0 3 4 6 4 6s4-3 4-6c0-2-1.5-4-4-4z" stroke="currentColor" strokeWidth="1" fill="none"/></svg></span>
                  Monthly streak
                </div>
                <div className="a-stat-value">{streak}<span className="a-stat-denom">mo</span></div>
                <div className="a-stat-sub">consecutive months</div>
                {personalBest && <div className="a-stat-delta delta-up">Personal best!</div>}
              </div>

              <div className="a-stat-card">
                <div className="a-stat-label">
                  <span className="a-icon"><svg viewBox="0 0 14 14" fill="none" width="14" height="14"><path d="M7 2C4.5 2 3 4 3 6c0 3 4 6 4 6s4-3 4-6c0-2-1.5-4-4-4z" stroke="currentColor" strokeWidth="1" fill="none"/><circle cx="7" cy="6" r="1.5" stroke="currentColor" strokeWidth="0.8" fill="none"/></svg></span>
                  Top streak
                </div>
                <div className="a-stat-value">{topStreak.count}<span className="a-stat-denom"> days</span></div>
                <div className="a-stat-sub">{topStreak.habitName || 'No active streak'}</div>
              </div>
            </div>

            {/* Section 2: Overall Completion Bar */}
            <div className="a-wide-card">
              <div className="completion-header">
                <div><div className="completion-title">Overall completion</div><div className="completion-subtitle">This month vs last month</div></div>
                <div><div className="completion-pct-big">{rate}%</div>{prevHasData && <div className="completion-pct-sub">was {prevRate}% last month</div>}</div>
              </div>
              <div className="completion-bars">
                <div className="a-bar-row">
                  <div className="a-bar-label">This month</div>
                  <div className="a-bar-track"><div className="a-bar-fill" style={{ width: `${rate}%`, background: primaryColor }} /></div>
                  <div className="a-bar-pct">{rate}%</div>
                </div>
                <div className="a-bar-row">
                  <div className="a-bar-label">Last month</div>
                  <div className="a-bar-track"><div className="a-bar-fill" style={{ width: `${prevRate}%`, background: fadedColor, opacity: 0.55 }} /></div>
                  <div className="a-bar-pct muted">{prevRate}%</div>
                </div>
              </div>
            </div>

            {/* Section 3: Per-Habit Breakdown */}
            <div className="a-wide-card">
              <div className="breakdown-header">
                <span className="breakdown-title">Per habit breakdown</span>
                <div className="breakdown-legend">
                  <div className="legend-item"><div className="legend-dot" style={{ background: primaryColor }} />This mo</div>
                  <div className="legend-item"><div className="legend-dot" style={{ background: fadedColor, opacity: 0.55 }} />Last mo</div>
                </div>
              </div>
              {habits.map((habit, idx) => {
                const hRate = habitMonthRate(habit, selectedMonthDates);
                const hPrev = habitMonthRate(habit, prevMonthDates);
                const habitHasPrevData = Object.keys(habit.logs).some(d => d <= prevMonthDates[prevMonthDates.length - 1]);
                // Month Zero: trophy only for perfect month (100%), standard: meets or exceeds prev
                const hasTrophy = habitHasPrevData ? ((hRate > 0 || hPrev > 0) && hRate >= hPrev) : (hRate === 100);
                const colors = getHabitColor(habit.colorClass);
                return (
                  <div className="habit-row" key={habit.id} style={idx === habits.length - 1 ? { marginBottom: 0 } : {}}>
                    <div className="habit-row-header">
                      <div className="habit-row-name"><div className="habit-icon-xs">{habit.emoji}</div>{habit.name}</div>
                      <div className="pct-pair">
                        <span className="pct-curr">{hRate}%</span>
                        {prevHasData && <span className="pct-last">was {hPrev}%</span>}
                        {hasTrophy && <div className="trophy-badge"><TrophySVG /></div>}
                      </div>
                    </div>
                    <div className="dual-bar">
                      <div className="a-bar-row"><div className="a-bar-label">Now</div><div className="a-bar-track"><div className="a-bar-fill" style={{ width: `${hRate}%`, background: colors.solid }} /></div><div className="a-bar-pct">{hRate}%</div></div>
                      <div className="a-bar-row"><div className="a-bar-label">Prev</div><div className="a-bar-track"><div className="a-bar-fill" style={{ width: `${hPrev}%`, background: colors.solid, opacity: 0.4 }} /></div><div className="a-bar-pct muted">{hPrev}%</div></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Section 4: Monthly Streak Chart */}
            <div className="a-wide-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div><div className="completion-title">Monthly streak</div><div className="completion-subtitle">Consistent months logged</div></div>
                <div className="streak-info"><div className="streak-num">{streak}</div><div className="streak-unit">months</div></div>
              </div>
              <div className="streak-chart-bars">
                {streakChartData.map((w, i) => (
                  <div className="streak-week-col" key={i}>
                    {w.isFuture ? (
                      <div className="streak-placeholder"><span>{w.label}</span></div>
                    ) : (
                      <div className="streak-bar-wrap">
                        <div className="streak-bar-fill" style={{ height: `${Math.max(w.rate, 2)}%`, background: primaryColor, opacity: w.isCurrent ? 1 : w.opacity }} />
                      </div>
                    )}
                    <span className={`streak-week-label ${w.isCurrent ? 'active' : ''}`}>{w.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <div className="analytics-view">
      {/* Tab Row */}
      <div className="analytics-tabs">
        <button
          className={`analytics-tab ${activeTab === 'weekly' ? 'active' : ''}`}
          onClick={() => setActiveTab('weekly')}
        >
          Weekly
        </button>
        <button
          className={`analytics-tab ${activeTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setActiveTab('monthly')}
        >
          Monthly
        </button>
      </div>

      {activeTab === 'weekly' ? renderWeeklyReport() : renderMonthlyReport()}
    </div>
  );
}

export default AnalyticsView;
