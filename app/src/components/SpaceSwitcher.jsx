import React, { useState, useRef, useEffect } from 'react';
import { CaretDown, Plus, Check } from '@phosphor-icons/react';
import './SpaceSwitcher.css';

function SpaceSwitcher({ spaces, activeSpaceId, onSpaceChange, onCreateSpace }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const dropdownRef = useRef(null);
  const nameInputRef = useRef(null);

  const activeSpace = spaces.find(s => s.id === activeSpaceId);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsCreating(false);
        setNewName('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus the name input when create form opens
  useEffect(() => {
    if (isCreating && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isCreating]);

  const handleOpenCreate = () => {
    setIsCreating(true);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreateSpace({ name: newName.trim() });
    setNewName('');
    setIsCreating(false);
    setIsOpen(false);
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewName('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') handleCancelCreate();
  };

  const handleSelectSpace = (spaceId) => {
    onSpaceChange(spaceId);
    setIsOpen(false);
    setIsCreating(false);
  };

  return (
    <div className="space-switcher" ref={dropdownRef}>
      <button
        className={`space-pill ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Current space: ${activeSpace?.name || 'None'}`}
      >
        <span className="space-pill-name">{activeSpace?.name || 'Select Space'}</span>
        <CaretDown size={13} className={`space-pill-caret ${isOpen ? 'rotated' : ''}`} weight="bold" />
      </button>

      {isOpen && (
        <div className="space-dropdown" role="listbox" aria-label="Spaces">
          {/* Space list */}
          <div className="space-dropdown-list">
            {spaces.length === 0 && (
              <div className="space-empty-hint">No spaces yet. Create one below!</div>
            )}
            {spaces.map(space => (
              <button
                key={space.id}
                className={`space-option ${space.id === activeSpaceId ? 'active' : ''}`}
                onClick={() => handleSelectSpace(space.id)}
                role="option"
                aria-selected={space.id === activeSpaceId}
              >
                <span className="space-option-name">{space.name}</span>
                {space.id === activeSpaceId && (
                  <Check size={13} className="space-option-check" weight="bold" />
                )}
              </button>
            ))}
          </div>

          {/* Divider + action area */}
          {isCreating ? (
            <div className="space-create-form">
              <div className="space-create-row">
                <input
                  ref={nameInputRef}
                  type="text"
                  className="space-name-input"
                  placeholder="Space name…"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={30}
                  aria-label="Space name"
                />
              </div>
              <div className="space-create-actions">
                <button className="space-btn-cancel" onClick={handleCancelCreate}>
                  Cancel
                </button>
                <button
                  className="space-btn-save"
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                >
                  Create
                </button>
              </div>
            </div>
          ) : (
            <button className="space-new-btn" onClick={handleOpenCreate}>
              <Plus size={14} weight="bold" />
              New Space
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default SpaceSwitcher;
