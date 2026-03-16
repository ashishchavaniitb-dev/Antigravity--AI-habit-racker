import React from 'react';
import { Flame } from '@phosphor-icons/react';
import './HabitCard.css';
import { getPast7Days, getTodayString } from '../utils/dates';

function HabitCard({ habit, onCheckIn, onClick }) {
  const { id, name, emoji, colorClass, logs } = habit;
  
  const weekDates = getPast7Days(); // Array of last 7 'YYYY-MM-DD' strings ending today
  const todayStr = getTodayString();
  
  // Calculate current streak based on logs
  // Simple logic: count backwards from today until we hit a missed day
  const calculateStreak = () => {
    let streak = 0;
    const d = new Date(todayStr); // Start evaluating from today
    d.setHours(0,0,0,0);
    
    // Check if today is done.
    const todayDone = !!logs[todayStr];
    if (todayDone) {
      streak++;
    }
    // We always step back to evaluate yesterday and beyond
    d.setDate(d.getDate() - 1); 
    
    // Count continuously backwards
    while (true) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayOfWeek = d.getDay();
      
      const isRequiredDay = () => {
         const freq = habit.frequency;
         if (!freq || freq.type === 'none') return false; // Doesn't require streaks in same way
         if (freq.type === 'daily') return true;
         if (freq.type === 'weekly' && freq.days && freq.days.length > 0) {
           return freq.days.includes(dayOfWeek);
         }
         // Fallback for weekly without specific days or monthly -> assume standard streak logic
         return true; 
      };

      if (logs[dateStr]) {
        streak++;
        d.setDate(d.getDate() - 1); // Move to previous day
      } else {
        if (isRequiredDay()) {
           break; // Streak broken because a required day was missed
        } else {
           // Skip this day without breaking the streak, it wasn't required
           d.setDate(d.getDate() - 1);
        }
      }
    }
    return streak;
  };

  const streakCount = calculateStreak();
  const completedToday = !!logs[todayStr];
  
  // V3 Target Calculation Additions
  const renderCheckbox = (dateStr, index, isFuture) => {
    const isDone = !!logs[dateStr];
    const isToday = dateStr === todayStr;
    const dateObj = new Date(dateStr);
    const dayLabel = ["S","M","T","W","T","F","S"][dateObj.getDay()];
    
    let isFullyDone = false;
    let isPartiallyDone = false;
    let fillPct = 0;

    if (isDone) {
      if (habit.target && typeof logs[dateStr] === 'number') {
        const amt = logs[dateStr];
        fillPct = Math.min(100, (amt / habit.target.amount) * 100);
        isFullyDone = amt >= habit.target.amount;
        isPartiallyDone = amt > 0 && !isFullyDone;
      } else {
        isFullyDone = true;
        fillPct = 100;
      }
    }

    const handleClick = (e) => {
      e.stopPropagation(); // don't open details modal
      if (isFuture) return;
      
      // If no target, default boolean toggle
      if (!habit.target) {
        onCheckIn(id, dateStr);
        return;
      }
      
      // If it's a target habit, prompt for the amount
      const currentVal = logs[dateStr] || 0;
      const promptText = `Enter amount for ${dateStr} (Target: ${habit.target.amount} ${habit.target.unit})`;
      // Provide current value if it exists, otherwise empty
      const input = window.prompt(promptText, currentVal > 0 ? currentVal : '');
      
      if (input !== null) { // if not cancelled
        const num = parseFloat(input);
        if (!isNaN(num) && num >= 0) {
          // Send special payload to onCheckIn
          onCheckIn(id, dateStr, num);
        } else if (input === '') {
          // Empty string clears it
          onCheckIn(id, dateStr, null); // We will update App.jsx to handle null to delete
        }
      }
    };

    return (
      <div key={dateStr} className="day-checkbox-container">
        <span className={`day-label ${isToday ? 'is-today' : ''}`}>{dayLabel}</span>
        <button 
          className={`day-checkbox ${isFullyDone ? 'checked' : ''} ${isPartiallyDone ? 'partial' : ''} ${isFuture ? 'disabled' : ''}`}
          onClick={handleClick}
          disabled={isFuture}
          title={habit.target && isDone ? `${logs[dateStr]} / ${habit.target.amount} ${habit.target.unit}` : dateStr}
        >
          {isPartiallyDone && (
            <div className="partial-fill" style={{ height: `${fillPct}%` }}></div>
          )}
          {isFullyDone && <span className="check-mark"></span>}
        </button>
      </div>
    );
  };

  // Calculate overall weekly background fill for visual progress
  // If target-based, we sum the numeric logs vs (7 * daily target equivalent)
  const getWeeklyFill = () => {
    if (!habit.target) {
      const thisWeekCompleted = weekDates.filter(date => logs[date]).length;
      return `${Math.min(100, Math.max(5, (thisWeekCompleted / 7) * 100))}%`;
    } else {
      let totalAmountLogged = 0;
      weekDates.forEach(d => {
        if (typeof logs[d] === 'number') totalAmountLogged += logs[d];
      });
      // We assume weekly target is 7 * daily amount if daily freq.
      // Easiest approximation: amount * times a week.
      let weeklyTarget = habit.target.amount;
      if (habit.frequency && habit.frequency.type === 'daily') weeklyTarget *= 7;
      if (habit.frequency && habit.frequency.type === 'weekly') weeklyTarget *= (habit.frequency.times || 1);
      
      const pct = weeklyTarget > 0 ? (totalAmountLogged / weeklyTarget) * 100 : 0;
      return `${Math.min(100, Math.max(5, pct))}%`;
    }
  };

  const fillPercentage = getWeeklyFill();

  return (
    <div className="habit-card" onClick={() => onClick(habit)}>
      {/* Background color representative of the weekly progress */}
      <div 
        className={`habit-background ${colorClass}`} 
        style={{ width: fillPercentage }}
      ></div>
      
      <div className="habit-content">
        <div className="habit-info">
          <span className="habit-emoji">{emoji}</span>
          <div className="habit-name-group">
            <span className="habit-name">{name}</span>

            {habit.target && (
              <span className="habit-target">
                Target: {habit.target.amount} {habit.target.unit} {habit.frequency && habit.frequency.type !== 'none' ? `/ ${habit.frequency.type}` : ''}
              </span>
            )}
          </div>
        </div>
        
        <div className="habit-stats">
          <div className="stat-group streak-stat" title="Current Streak">
            <Flame 
              size={18} 
              weight={streakCount > 0 ? "fill" : "regular"} 
              color={streakCount > 0 ? "var(--color-warning)" : "var(--color-text-muted)"} 
            />
            <span className="stat-value">{streakCount}</span>
          </div>

        </div>

        <div className="habit-week-grid" onClick={e => e.stopPropagation()}>
          {weekDates.map((dateStr, index) => {
            const isFuture = dateStr > todayStr;
            return renderCheckbox(dateStr, index, isFuture);
          })}
        </div>
      </div>
    </div>
  );
}

export default HabitCard;
