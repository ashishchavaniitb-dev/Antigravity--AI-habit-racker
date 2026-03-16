import React from 'react';
import HabitCard from './HabitCard';

function HabitList({ habits, onCheckIn, onHabitClick }) {
  if (habits.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
        <p>No habits added yet. Click "+ Add Habit" to get started!</p>
      </div>
    );
  }

  return (
    <div className="habit-list">
      <div className="habit-list-header">
        <div className="col-habit">Habit</div>
        <div className="col-progress">Last 7 Days</div>
      </div>
      
      {habits.map((habit) => (
        <HabitCard 
          key={habit.id} 
          habit={habit} 
          onCheckIn={onCheckIn} 
          onClick={onHabitClick}
        />
      ))}
    </div>
  );
}

export default HabitList;
