import React, { useState } from 'react';
import { X, LockKey, PencilSimple, CaretLeft, CaretRight } from '@phosphor-icons/react';
import './HabitDetailModal.css';
import { 
  isPastOrToday, 
  getTodayString, 
  getDaysInMonth, 
  getFirstDayOfMonth, 
  formatMonthYear 
} from '../utils/dates';

function HabitDetailModal({ habit, isOpen, onClose, onCheckIn, onEdit }) {
  if (!isOpen || !habit) return null;

  const todayStr = getTodayString();
  const { id, name, emoji, colorClass, logs } = habit;

  // Track which month we are viewing
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  // Generate days for the current view month
  const generateMonthDays = () => {
    const days = [];
    const numDays = getDaysInMonth(viewYear, viewMonth);
    const firstDayIdx = getFirstDayOfMonth(viewYear, viewMonth);

    // Add empty padding for days before the 1st of the month
    for (let i = 0; i < firstDayIdx; i++) {
      days.push({ isPadding: true, id: `pad-${i}` });
    }

    for (let d = 1; d <= numDays; d++) {
      const year = viewYear;
      const month = String(viewMonth + 1).padStart(2, '0');
      const dayNum = String(d).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayNum}`;
      
      const dateObj = new Date(year, viewMonth, d);
      
      days.push({
        dateStr,
        label: dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        dayOfWeek: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        dateNum: d,
        isDone: !!logs[dateStr],
        isEditable: isPastOrToday(dateStr),
        isToday: dateStr === todayStr,
        isPadding: false
      });
    }
    return days;
  };

  const handleDayClick = (day) => {
    if (day.isPadding || !day.isEditable) return;

    if (!habit.target) {
      onCheckIn(id, day.dateStr);
      return;
    }

    const currentVal = logs[day.dateStr] || 0;
    const promptText = `Enter amount for ${day.dateStr} (Target: ${habit.target.amount} ${habit.target.unit})`;
    const input = window.prompt(promptText, currentVal > 0 ? currentVal : '');
    
    if (input !== null) {
      const num = parseFloat(input);
      if (!isNaN(num) && num >= 0) {
        onCheckIn(id, day.dateStr, num);
      } else if (input === '') {
        onCheckIn(id, day.dateStr, null);
      }
    }
  };

  const calendarDays = generateMonthDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="modal-overlay">
      <div className="modal-content detail-modal">
        <div className="modal-header">
          <div className="detail-title">
            <span className="detail-emoji">{emoji}</span>
            <h2>{name}</h2>
          </div>
          <div className="modal-actions">
            <button className="btn-icon" onClick={onEdit} title="Edit Habit">
              <PencilSimple size={24} />
            </button>
            <button className="btn-close" onClick={onClose} title="Close">
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="modal-body">
          <div className="calendar-controls">
            <button className="btn-nav" onClick={handlePrevMonth}>
              <CaretLeft size={20} weight="bold" />
            </button>
            <h3 className="current-month-label">{formatMonthYear(viewYear, viewMonth)}</h3>
            <button className="btn-nav" onClick={handleNextMonth}>
              <CaretRight size={20} weight="bold" />
            </button>
          </div>

          <div className="weekday-labels">
            {weekDays.map(day => (
              <span key={day} className="weekday-label">{day}</span>
            ))}
          </div>

          <div className="calendar-grid month-view">
            {calendarDays.map((day, idx) => {
              if (day.isPadding) {
                return <div key={day.id} className="cal-day padding"></div>;
              }

              let isFullyDone = false;
              let isPartiallyDone = false;
              if (day.isDone) {
                 if (habit.target && typeof logs[day.dateStr] === 'number') {
                    const amt = logs[day.dateStr];
                    isFullyDone = amt >= habit.target.amount;
                    isPartiallyDone = amt > 0 && !isFullyDone;
                 } else {
                    isFullyDone = true;
                 }
              }

              return (
                <div 
                  key={day.dateStr} 
                  className={`cal-day ${day.isEditable ? 'editable' : 'locked'} ${isFullyDone ? colorClass : ''} ${isPartiallyDone ? 'partial-border' : ''} ${day.isToday ? 'today' : ''}`}
                  onClick={() => handleDayClick(day)}
                  title={day.isEditable ? 
                    (habit.target && day.isDone ? `${logs[day.dateStr]} / ${habit.target.amount} ${habit.target.unit} on ${day.label}` : `${day.label} - Click to toggle`) 
                  : `${day.label} - Locked`}
                >
                  <span className="cal-date">{day.dateNum}</span>
                  
                  {isFullyDone && <span className="cal-check">✓</span>}
                  {isPartiallyDone && <span className="cal-check detail-partial">○</span>}
                  {day.isEditable === false && day.isDone === false && <LockKey size={10} className="lock-icon" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HabitDetailModal;
