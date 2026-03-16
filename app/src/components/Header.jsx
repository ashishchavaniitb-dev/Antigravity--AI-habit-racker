import React from 'react';
import { Plus, List } from '@phosphor-icons/react';
import './Header.css';

function Header({ onAddClick, currentView, onMenuClick }) {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  const getTitle = () => {
    if (currentView === 'today') return "Today's Habits";
    if (currentView === 'all') return "All Habits";
    if (currentView === 'analytics') return "Analytics Dashboard";
    if (currentView === 'journal') return "Habit Journal";
    return "Habits";
  };

  return (
    <header className="page-header">
      <div className="header-left">
        <button className="menu-toggle-btn" onClick={onMenuClick} aria-label="Open menu">
          <List size={28} />
          <span>Menu</span>
        </button>
        <div className="header-title">
          <h1>{getTitle()}</h1>
          <p className="date-subtitle">{today}</p>
        </div>
      </div>
      
      <div className="header-actions">
        <button className="btn-primary" onClick={onAddClick}>
          <Plus size={20} weight="bold" />
          <span>Add Habit</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
