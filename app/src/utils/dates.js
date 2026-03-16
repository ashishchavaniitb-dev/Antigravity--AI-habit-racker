// Date utilities 

// Get an array of date strings (YYYY-MM-DD) for the past 7 days (ending with today)
export const getPast7Days = () => {
  const dates = [];
  const today = new Date();
  
  const d = new Date(today);
  d.setDate(today.getDate() - 6);
  d.setHours(0, 0, 0, 0);

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
