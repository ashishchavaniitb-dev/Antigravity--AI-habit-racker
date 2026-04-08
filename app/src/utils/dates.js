// Date utilities 

// Get an array of date strings (YYYY-MM-DD) for the past N days (ending with today)
export const getPastNDays = (n) => {
  const dates = [];
  const today = new Date();
  
  const d = new Date(today);
  d.setDate(today.getDate() - (n - 1));
  d.setHours(0, 0, 0, 0);

  for (let i = 0; i < n; i++) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    d.setDate(d.getDate() + 1);
  }
  return dates;
};

// Get an array of date strings (YYYY-MM-DD) for the past 7 days (ending with today)
export const getPast7Days = () => getPastNDays(7);

// Get an array of date strings (YYYY-MM-DD) for the current week (Monday to Sunday)
export const getCurrentWeekMonToSun = (dateStr) => {
  const dates = [];
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  const d = new Date(targetDate);
  d.setHours(0, 0, 0, 0);

  const dayOfWeek = d.getDay(); // 0 is Sunday, 1 is Monday
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  d.setDate(d.getDate() + diffToMonday);

  for (let i = 0; i < 7; i++) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    d.setDate(d.getDate() + 1);
  }
  return dates;
};

// Get an array of date strings (YYYY-MM-DD) for the previous week (Monday to Sunday)
export const getLastWeekMonToSun = (dateStr) => {
  const dates = [];
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  const d = new Date(targetDate);
  d.setHours(0, 0, 0, 0);

  const dayOfWeek = d.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  d.setDate(d.getDate() + diffToMonday - 7);

  for (let i = 0; i < 7; i++) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    d.setDate(d.getDate() + 1);
  }
  return dates;
};

// Check if a date string is today or in the past
// Returns true if editable, false if locked (future dates)
export const isPastOrToday = (dateString) => {
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Future dates aren't editable
  return targetDate <= today;
};

// Get today's date string YYYY-MM-DD
export const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get the number of days in a given month (month is 0-indexed)
export const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

// Get the weekday index of the first day of a month (0-6)
export const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
};

// Format as "Month Year"
export const formatMonthYear = (year, month) => {
  const date = new Date(year, month);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

// ─── Sunday-to-Saturday week helpers (for Analytics) ───

// Get the Sunday that starts the week containing the given date
export const getWeekStartSunday = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  return d;
};

// Return array of 7 YYYY-MM-DD strings for Sun–Sat week containing dateStr
export const getWeekSunToSat = (dateStr) => {
  const sun = getWeekStartSunday(dateStr);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const c = new Date(sun);
    c.setDate(sun.getDate() + i);
    const y = c.getFullYear();
    const m = String(c.getMonth() + 1).padStart(2, '0');
    const dd = String(c.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${dd}`);
    }
  return dates;
};

// Previous Sun–Sat week
export const getPrevWeekSunToSat = (dateStr) => {
  const sun = getWeekStartSunday(dateStr);
  sun.setDate(sun.getDate() - 7);
  const y = sun.getFullYear();
  const m = String(sun.getMonth() + 1).padStart(2, '0');
  const dd = String(sun.getDate()).padStart(2, '0');
  return getWeekSunToSat(`${y}-${m}-${dd}`);
};

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// "Mar 24 – Mar 30, 2026"
export const formatWeekRange = (datesArr) => {
  if (!datesArr || datesArr.length === 0) return '';
  const s = new Date(datesArr[0]);
  const e = new Date(datesArr[6]);
  s.setHours(0,0,0,0);
  e.setHours(0,0,0,0);
  const sM = MONTH_SHORT[s.getMonth()];
  const eM = MONTH_SHORT[e.getMonth()];
  if (sM === eM) {
    return `${sM} ${s.getDate()} – ${e.getDate()}, ${e.getFullYear()}`;
  }
  return `${sM} ${s.getDate()} – ${eM} ${e.getDate()}, ${e.getFullYear()}`;
};

// "Mar 24 – 30, 2026 · vs Mar 17 – 23"
export const formatComparisonRange = (currentDates, prevDates) => {
  const cur = formatWeekRange(currentDates);
  if (!prevDates || prevDates.length === 0) return cur;
  const ps = new Date(prevDates[0]);
  const pe = new Date(prevDates[6]);
  ps.setHours(0,0,0,0);
  pe.setHours(0,0,0,0);
  const psM = MONTH_SHORT[ps.getMonth()];
  const peM = MONTH_SHORT[pe.getMonth()];
  let prev;
  if (psM === peM) {
    prev = `${psM} ${ps.getDate()} – ${pe.getDate()}`;
  } else {
    prev = `${psM} ${ps.getDate()} – ${peM} ${pe.getDate()}`;
  }
  return `${cur}  ·  vs ${prev}`;
};

// ─── Month-based helpers (for Monthly Analytics) ───

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
export { MONTH_NAMES };

/** Return array of YYYY-MM-DD strings for every day in a given month (0-indexed month) */
export const getMonthDates = (year, month) => {
  const days = new Date(year, month + 1, 0).getDate();
  const dates = [];
  for (let d = 1; d <= days; d++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    dates.push(`${year}-${mm}-${dd}`);
  }
  return dates;
};

/** Return { year, month } (0-indexed month) for the 1st of the month containing dateStr */
export const getMonthStart = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setHours(0, 0, 0, 0);
  return { year: d.getFullYear(), month: d.getMonth() };
};

/** "March 2026" */
export const formatMonthLabel = (year, month) => {
  return `${MONTH_NAMES[month]} ${year}`;
};

/** "March 2026 · vs February 2026" */
export const formatMonthComparison = (year, month) => {
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  return `${MONTH_NAMES[month]} ${year}  ·  vs ${MONTH_NAMES[prevMonth]} ${prevYear}`;
};
