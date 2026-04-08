import React from 'react';
import { SquaresFour, CheckSquare, ChartLineUp, BookOpen, Gear, Robot, X } from '@phosphor-icons/react';
import './Sidebar.css';

function Sidebar({ currentView, onViewChange, onLogout, isOpen, onClose }) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header" style={{ justifyContent: 'space-between', width: '100%' }}>
        <h2>UpHabit</h2>
        <button className="mobile-close-btn" onClick={onClose} aria-label="Close menu">
          <X size={24} />
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-section">
          <h3 className="section-title">Views</h3>
          <button 
            className={`nav-item ${currentView === 'habits' ? 'active' : ''}`}
            onClick={() => onViewChange('habits')}
          >
            <CheckSquare size={20} />
            <span>Habits</span>
          </button>
        </div>

        <div className="nav-section">
          <h3 className="section-title">Insights</h3>
          <button 
            className={`nav-item ${currentView === 'analytics' ? 'active' : ''}`}
            onClick={() => onViewChange('analytics')}
          >
            <ChartLineUp size={20} />
            <span>Analytics</span>
          </button>
          
          <button 
            className={`nav-item ${currentView === 'journal' ? 'active' : ''}`}
            onClick={() => onViewChange('journal')}
          >
            <BookOpen size={20} />
            <span>Journal</span>
          </button>
          
          <button 
            className={`nav-item ${currentView === 'coach' ? 'active' : ''}`}
            onClick={() => onViewChange('coach')}
          >
            <Robot size={20} />
            <span>AI Coach</span>
          </button>
        </div>
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item" onClick={onLogout}>
          <Gear size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
