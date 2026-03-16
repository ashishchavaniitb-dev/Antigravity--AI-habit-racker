import React from 'react';
import './AnalyticsView.css';
import { getTodayString } from '../utils/dates';

function AnalyticsView({ habits }) {
  if (habits.length === 0) {
    return (
      <div className="analytics-empty">
        <p>No habits to analyze yet. Add a habit and check in to see your progress!</p>
      </div>
    );
  }

  // Calculate simple analytics:
  // 1. Weekly Completion Rate (last 7 days across all habits)
  // 2. Monthly Completion Rate (last 30 days across all habits)
  // 3. Best Streak currently
  const calculateAnalytics = () => {
    let weeklyPossible = 0;
    let weeklyCompleted = 0;
    let monthlyPossible = 0;
    let monthlyCompleted = 0;
    let bestCurrentStreak = 0;
    let bestHabitName = '';

    const todayStr = getTodayString();
    const today = new Date(todayStr);

    habits.forEach(habit => {
      const createdOn = new Date(habit.createdAt || todayStr);
      createdOn.setHours(0,0,0,0);

      // Determine daily capacity for V3 target habits
      let dailyCapacity = 1;
      const isTarget = !!habit.target;
      if (isTarget && habit.frequency) {
        let cycleTarget = habit.target.amount;
        if (habit.frequency.type === 'weekly') cycleTarget *= (habit.frequency.times || 1);
        else if (habit.frequency.type === 'monthly') cycleTarget *= (habit.frequency.times || 1);
        
        if (habit.frequency.type === 'daily') dailyCapacity = cycleTarget;
        else if (habit.frequency.type === 'weekly') dailyCapacity = cycleTarget / 7;
        else if (habit.frequency.type === 'monthly') dailyCapacity = cycleTarget / 30;
      }

      // Analyze last 30 days for completion rates
      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        d.setHours(0,0,0,0);
        
        if (d >= createdOn) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;

          let doneAmt = 0;
          if (habit.logs[dateStr]) {
             if (isTarget && typeof habit.logs[dateStr] === 'number') {
               doneAmt = habit.logs[dateStr];
             } else {
               doneAmt = 1;
             }
          }

          monthlyPossible += dailyCapacity;
          monthlyCompleted += doneAmt;

          if (i < 7) {
            weeklyPossible += dailyCapacity;
            weeklyCompleted += doneAmt;
          }
        }
      }

      // Calculate streak for this habit (frequency aware)
      let streak = 0;
      let checkDate = new Date(today);
      checkDate.setHours(0,0,0,0);
      
      const todayDone = !!habit.logs[todayStr];
      if (todayDone) {
        streak++;
      }
      checkDate.setDate(checkDate.getDate() - 1); 
      
      while (true) {
        const year = checkDate.getFullYear();
        const month = String(checkDate.getMonth() + 1).padStart(2, '0');
        const day = String(checkDate.getDate()).padStart(2, '0');
        const dStr = `${year}-${month}-${day}`;
        const dayOfWeek = checkDate.getDay();
        
        const isRequiredDay = () => {
           const freq = habit.frequency;
           if (!freq || freq.type === 'none') return false; 
           if (freq.type === 'daily') return true;
           if (freq.type === 'weekly' && freq.days && freq.days.length > 0) {
             return freq.days.includes(dayOfWeek);
           }
           return true; 
        };

        if (habit.logs[dStr]) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          if (isRequiredDay()) {
             break;
          } else {
             checkDate.setDate(checkDate.getDate() - 1);
          }
        }
      }

      if (streak > bestCurrentStreak) {
        bestCurrentStreak = streak;
        bestHabitName = habit.name;
      }
    });

    const weeklyRate = weeklyPossible === 0 ? 0 : Math.min(100, Math.round((weeklyCompleted / weeklyPossible) * 100));
    const monthlyRate = monthlyPossible === 0 ? 0 : Math.min(100, Math.round((monthlyCompleted / monthlyPossible) * 100));

    return { weeklyRate, monthlyRate, bestCurrentStreak, bestHabitName };
  };

  const { weeklyRate, monthlyRate, bestCurrentStreak, bestHabitName } = calculateAnalytics();

  return (
    <div className="analytics-view">
      <div className="analytics-cards">
        
        <div className="stat-card primary">
          <h3>Weekly Completion Rate</h3>
          <div className="stat-number">{weeklyRate}%</div>
          <p className="stat-desc">Across all habits in the last 7 days</p>
          
          <div className="progress-bar-container mt-4">
            <div className="progress-bar-fill" style={{ width: `${weeklyRate}%` }}></div>
          </div>
        </div>

        <div className="stat-card secondary">
          <h3>Monthly Completion Rate</h3>
          <div className="stat-number">{monthlyRate}%</div>
          <p className="stat-desc">Across all habits in the last 30 days</p>
          
          <div className="progress-bar-container mt-4">
            <div className="progress-bar-fill bg-success" style={{ width: `${monthlyRate}%` }}></div>
          </div>
        </div>

        <div className="stat-card warning">
          <h3>Top Current Streak 🔥</h3>
          <div className="stat-number">{bestCurrentStreak}</div>
          <p className="stat-desc">{bestHabitName || 'Start checking in to build a streak!'}</p>
        </div>

      </div>

      <div className="analytics-details mt-6">
        <h3 className="section-title">Habit Breakdown (Last 7 Days)</h3>
        
        <div className="breakdown-list mt-4">
          {habits.map(habit => {
            let possible = 0;
            let completed = 0;
            const today = new Date(getTodayString());
            
            // Determine capacity
            let dailyCapacity = 1;
            const isTarget = !!habit.target;
            if (isTarget && habit.frequency) {
              let cycleTarget = habit.target.amount;
              if (habit.frequency.type === 'weekly') cycleTarget *= (habit.frequency.times || 1);
              else if (habit.frequency.type === 'monthly') cycleTarget *= (habit.frequency.times || 1);
              if (habit.frequency.type === 'daily') dailyCapacity = cycleTarget;
              else if (habit.frequency.type === 'weekly') dailyCapacity = cycleTarget / 7;
              else if (habit.frequency.type === 'monthly') dailyCapacity = cycleTarget / 30;
            }

            for (let i = 0; i < 7; i++) {
              const d = new Date(today);
              d.setDate(today.getDate() - i);
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              const dateStr = `${year}-${month}-${day}`;
              
              possible += dailyCapacity;
              if (habit.logs[dateStr]) {
                 if (isTarget && typeof habit.logs[dateStr] === 'number') completed += habit.logs[dateStr];
                 else completed += 1;
              }
            }
            
            const rate = possible === 0 ? 0 : Math.min(100, Math.round((completed / possible) * 100));

            return (
              <div key={habit.id} className="breakdown-item">
                <div className="breakdown-info">
                  <span className="breakdown-emoji">{habit.emoji}</span>
                  <span>{habit.name}</span>
                </div>
                
                <div className="breakdown-bar">
                  <div className={`breakdown-fill ${habit.colorClass}`} style={{ width: `${rate}%` }}></div>
                </div>
                <div className="breakdown-rate">{rate}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AnalyticsView;
