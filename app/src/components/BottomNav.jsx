import React from 'react';
import { CheckSquare, ChartLineUp, BookOpen, Robot, Gear } from '@phosphor-icons/react';
import './BottomNav.css';

function BottomNav({ currentView, onViewChange }) {
  const tabs = [
    { id: 'habits', label: 'Habits', icon: CheckSquare },
    { id: 'analytics', label: 'Analytics', icon: ChartLineUp },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'coach', label: 'AI Coach', icon: Robot },
    { id: 'settings', label: 'Settings', icon: Gear },
  ];

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-container">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onViewChange(tab.id)}
            >
              <Icon size={24} weight={isActive ? 'fill' : 'regular'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
