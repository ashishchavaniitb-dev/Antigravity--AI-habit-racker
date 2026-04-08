import React, { useState, useEffect } from 'react';
import HabitCard from './HabitCard';

function HabitList({ 
  habits = [], 
  onCheckIn, 
  onHabitClick, 
  onReorder, 
  habitFilter, 
  setHabitFilter
}) {
  const [items, setItems] = useState(habits || []);
  const [promptData, setPromptData] = useState(null);

  useEffect(() => {
    setItems(habits);
  }, [habits]);

  return (
    <div className="habit-list-container">
      <div className="habit-list-controls">
        <select 
          value={habitFilter} 
          onChange={(e) => setHabitFilter(e.target.value)}
          className="habit-filter-select"
        >
          <option value="today">Today's Habits</option>
          <option value="all">All Habits</option>
        </select>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
          <p>{habitFilter === 'today' ? "No habits for today. You're all caught up or check 'All Habits'!" : "No habits added yet. Click '+ Add Habit' to get started!"}</p>
        </div>
      ) : (
        <div className="habit-list">
          <div className="habit-list-header">
            <div className="col-habit">Habit</div>
            <div className="col-progress">Last 7 Days</div>
          </div>
          
          <div style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
            {items.map((habit) => (
              <div key={habit.id} style={{  }}>
                <HabitCard 
                  habit={habit} 
                  onCheckIn={onCheckIn} 
                  onClick={onHabitClick}
                  onPromptRequest={(id, dateStr, target) => {
                    const h = items.find(hx => hx.id === id);
                    const currentVal = (h && h.logs && h.logs[dateStr]) > 0 ? h.logs[dateStr] : '';
                    setPromptData({ habitId: id, dateStr, target, currentVal });
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {promptData && (
        <div 
          onClick={(e) => { e.stopPropagation(); setPromptData(null); }}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const inputEl = e.target.elements.amountInput;
              if (inputEl) inputEl.blur(); // Programmatically dismiss the keyboard
              const val = inputEl.value;
              const num = parseFloat(val);
              if (!isNaN(num) && num >= 0) {
                onCheckIn(promptData.habitId, promptData.dateStr, num);
              } else if (val === '') {
                onCheckIn(promptData.habitId, promptData.dateStr, null);
              }
              setPromptData(null);
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-bg, #ffffff)', padding: '24px', borderRadius: '16px',
              width: '90%', maxWidth: '320px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--color-text-main)' }}>Log Amount</h3>
            <p style={{ margin: '0 0 16px 0', color: 'var(--color-text-muted)', fontSize: '14px' }}>
              Target: {promptData.target.amount} {promptData.target.unit}
            </p>
            <input 
              name="amountInput"
              type="number" 
              step="any"
              inputMode="decimal"
              autoFocus
              defaultValue={promptData.currentVal}
              style={{
                width: '100%', padding: '12px', fontSize: '18px', borderRadius: '8px',
                border: '1px solid var(--color-border)', outline: 'none', color: 'var(--color-text-main)'
              }} 
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button 
                type="button"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  const inputEl = e.currentTarget.parentElement.previousSibling;
                  if (inputEl) inputEl.blur(); 
                  setPromptData(null); 
                }}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#f3f4f6', color: '#374151', cursor: 'pointer', fontWeight: 600 }}
              >Cancel</button>
              <button 
                type="submit"
                onClick={(e) => e.stopPropagation()}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-primary, #4F46E5)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
              >Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default HabitList;
