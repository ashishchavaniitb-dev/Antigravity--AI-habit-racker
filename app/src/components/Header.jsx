import React from 'react';
import { Plus, List } from '@phosphor-icons/react';
import SpaceSwitcher from './SpaceSwitcher';

import './Header.css';

function Header({ 
  onAddClick, 
  currentView, 
  onMenuClick,
  spaces = [],
  activeSpaceId,
  onSpaceChange,
  onCreateSpace
}) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const getTitle = () => {
    if (currentView === 'habits') return 'Habits';
    if (currentView === 'analytics') return 'Analytics Dashboard';
    if (currentView === 'journal') return 'Habit Journal';
    if (currentView === 'coach') return 'AI Coach';
    return 'Habits';
  };

  return (
    <header className="page-header">
      <div className="header-left">
        <div className="header-title-row">
          <div className="header-title">
            <h1>{getTitle()}</h1>
            <p className="date-subtitle">{today}</p>
          </div>
        </div>
      </div>

      <div className="header-actions">
        {currentView === 'habits' && (
          <div className="header-space-area">
            <SpaceSwitcher
              spaces={spaces}
              activeSpaceId={activeSpaceId}
              onSpaceChange={onSpaceChange}
              onCreateSpace={onCreateSpace}
            />
          </div>
        )}
        <button className="btn-primary" onClick={onAddClick} id="add-habit-btn">
          <Plus size={20} weight="bold" />
          <span>Add Habit</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
