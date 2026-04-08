import React, { useState } from 'react';
import { Flame, Trophy } from '@phosphor-icons/react';
import './HabitCard.css';
import { getPast7Days, getTodayString } from '../utils/dates';

function HabitCard({ habit, onCheckIn, onClick, onPromptRequest }) {
  const { id, name, emoji, colorClass, logs } = habit;
  const [showTooltip, setShowTooltip] = useState(false);
  
  const weekDates = getPast7Days(); // Array of last 7 'YYYY-MM-DD' strings ending today
  const todayStr = getTodayString();
  
  // Date helpers
  const getWeekStartSunday = (dateStr) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  };

  const getWeekSunToSat = (sunDate) => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
       const c = new Date(sunDate);
       c.setDate(sunDate.getDate() + i);
       const y = c.getFullYear();
       const m = String(c.getMonth() + 1).padStart(2, '0');
       const dd = String(c.getDate()).padStart(2, '0');
       dates.push(`${y}-${m}-${dd}`);
    }
    return dates;
  };

  const calculateWeekRate = (dates) => {
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
    if (!habit.target) {
        dates.forEach(d => { if (logs[d]) daysCompleted++; });
    } else {
        let totalAmountLogged = 0;
        dates.forEach(d => {
            if (typeof logs[d] === 'number') totalAmountLogged += logs[d];
        });
        let weeklyTarget = habit.target.amount;
        if (habit.frequency && habit.frequency.type === 'daily') weeklyTarget *= 7;
        if (habit.frequency && habit.frequency.type === 'weekly') weeklyTarget *= (habit.frequency.times || 1);
        
        return weeklyTarget > 0 ? (totalAmountLogged / weeklyTarget) * 100 : 0;
    }
    return expectedDays > 0 ? (daysCompleted / expectedDays) * 100 : 0;
  };

  // Calculate current streak based on logs
  const calculateStreak = () => {
    let streak = 0;
    const d = new Date(todayStr); // Start evaluating from today
    d.setHours(0,0,0,0);
    
    // Check if today is done.
    if (logs[todayStr]) {
      streak++;
    }
    
    // We always step back to evaluate yesterday and beyond
    d.setDate(d.getDate() - 1); 
    
    let currentWeekSunday = null;
    let missedInCurrentWeek = 0;

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

      const thisWeekSunday = getWeekStartSunday(dateStr).getTime();
      if (currentWeekSunday !== thisWeekSunday) {
         currentWeekSunday = thisWeekSunday;
         missedInCurrentWeek = 0; // reset misses for the new week
      }

      if (logs[dateStr]) {
        streak++;
      } else {
        if (isRequiredDay()) {
           missedInCurrentWeek++;
           if (missedInCurrentWeek > 1) {
              break; // Streak broken because a second required day was missed in the same week
           }
        }
      }
      d.setDate(d.getDate() - 1); // Move to previous day
    }
    return streak;
  };

  const streakCount = calculateStreak();
  const completedToday = !!logs[todayStr];

  // Trophy logic using all historic data to find lifetime trophies
  const calculateTrophyData = () => {
    const currentSun = getWeekStartSunday(todayStr);
    const logDates = Object.keys(logs).sort();
    
    // If no logs, we just have the current week
    if (logDates.length === 0) {
       const dates = getWeekSunToSat(currentSun);
       return { totalTrophies: 0, hasCurrentTrophy: false, prevWeekRate: 0, currentWeekRate: Math.min(100, calculateWeekRate(dates)) };
    }

    const firstLogStr = logDates[0];
    const startSun = getWeekStartSunday(firstLogStr);
    
    let totalTrophyCount = 0;
    let prevRate = null;
    let currentTrophyEarned = false;
    let currentWr = 0;
    let previousWr = 0;

    let evalSun = new Date(startSun);
    while (evalSun <= currentSun) {
      const weekDates = getWeekSunToSat(evalSun);
      const weekRate = Math.min(100, calculateWeekRate(weekDates));
      
      let earned = false;
      if (prevRate === null) {
        // First week of tracking
        earned = weekRate === 100 && weekRate > 0;
      } else {
        // Subsequent weeks
        earned = (weekRate > 0 || prevRate > 0) && (weekRate >= prevRate);
      }
      
      if (earned) {
        totalTrophyCount++;
      }

      if (evalSun.getTime() === currentSun.getTime()) {
         currentTrophyEarned = earned;
         currentWr = weekRate;
         previousWr = prevRate === null ? 0 : prevRate;
      }
      
      prevRate = weekRate;
      evalSun.setDate(evalSun.getDate() + 7); // next week
    }

    return { totalTrophies: totalTrophyCount, hasCurrentTrophy: currentTrophyEarned, currentWeekRate: currentWr, prevWeekRate: previousWr };
  };

  const { totalTrophies, hasCurrentTrophy, currentWeekRate, prevWeekRate } = calculateTrophyData();

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
      if (onPromptRequest) {
        onPromptRequest(id, dateStr, habit.target);
      } else {
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

  return (
    <>
      <div className={`habit-card ${colorClass}`} onClick={() => onClick(habit)}>    
        <div 
        className={`habit-background-last-week ${colorClass}`} 
        style={{ width: `${prevWeekRate}%`, minWidth: prevWeekRate > 0 ? '12px' : '0' }}
      ></div>
      <div 
        className={`habit-background-current-week ${colorClass}`} 
        style={{ width: `${currentWeekRate}%`, minWidth: '12px' }}
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

          <div 
            className={`stat-group trophy-stat ${hasCurrentTrophy ? 'has-trophy' : ''}`} 
            onClick={(e) => { e.stopPropagation(); setShowTooltip(true); }}
          >
            <Trophy size={16} weight={hasCurrentTrophy ? "fill" : "regular"} color={hasCurrentTrophy ? "var(--color-warning)" : "var(--color-text-muted)"} />
            <span className="stat-value">{totalTrophies}</span>
          </div>
        </div>

        <div className="habit-week-grid">
          {weekDates.map((dateStr, index) => {
            const isFuture = dateStr > todayStr;
            return renderCheckbox(dateStr, index, isFuture);
          })}
        </div>
      </div>
    </div>
    
    {showTooltip && (
      <div className="modal-overlay trophy-overlay" onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}>
        <div className="trophy-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="trophy-icon-large">
            <Trophy size={56} weight="fill" color="var(--color-warning)" />
          </div>
          <h3 className="trophy-modal-title">Weekly Progress Trophy</h3>
          <p className="trophy-modal-text">
            You earn a trophy whenever your current week's progress meets or exceeds your previous week's progress. Keep the momentum going!
          </p>
          <button className="btn-awesome" onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}>
            Awesome
          </button>
        </div>
      </div>
    )}
  </>
  );
}

export default HabitCard;
