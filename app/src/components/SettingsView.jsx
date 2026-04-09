import React from 'react';
import { SignOut } from '@phosphor-icons/react';
import './SettingsView.css';

function SettingsView({ onLogout }) {
  return (
    <div className="settings-view">
      <div className="settings-card">
        <h3>Account Settings</h3>
        <p className="settings-description">Manage your account preferences and session.</p>
        
        <div className="settings-actions">
          <button className="btn-logout" onClick={onLogout}>
            <SignOut size={20} />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsView;
