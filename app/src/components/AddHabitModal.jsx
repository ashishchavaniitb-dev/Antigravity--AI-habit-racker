import React, { useState } from 'react';
import { X } from '@phosphor-icons/react';
import './AddHabitModal.css';
import { getTodayString } from '../utils/dates';

const COLORS = [
  { id: 'bg-blue', label: 'Blue' },
  { id: 'bg-emerald', label: 'Green' },
  { id: 'bg-amber', label: 'Yellow' },
  { id: 'bg-pink', label: 'Pink' },
  { id: 'bg-purple', label: 'Purple' },
  { id: 'bg-red', label: 'Red' },
];

const DAYS_OF_WEEK = [
  { val: 1, label: 'Mon' },
  { val: 2, label: 'Tue' },
  { val: 3, label: 'Wed' },
  { val: 4, label: 'Thu' },
  { val: 5, label: 'Fri' },
  { val: 6, label: 'Sat' },
  { val: 0, label: 'Sun' },
];

function AddHabitModal({ isOpen, onClose, onSave, editingHabit }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🔥');
  const [colorClass, setColorClass] = useState('bg-blue');
  
  // Frequency State
  const [freqType, setFreqType] = useState('daily'); // daily, weekly, monthly, none
  const [freqTimes, setFreqTimes] = useState(1);
  const [freqDays, setFreqDays] = useState([]);

  // Target State
  const [hasTarget, setHasTarget] = useState(false);
  const [targetAmount, setTargetAmount] = useState(1);
  const [targetUnit, setTargetUnit] = useState('times');


  React.useEffect(() => {
    if (isOpen) {
      if (editingHabit) {
        setName(editingHabit.name || '');
        setEmoji(editingHabit.emoji || '🔥');
        setColorClass(editingHabit.colorClass || 'bg-blue');
        if (editingHabit.frequency) {
          setFreqType(editingHabit.frequency.type || 'daily');
          setFreqTimes(editingHabit.frequency.times || 1);
          setFreqDays(editingHabit.frequency.days || []);
        }
        if (editingHabit.target) {
          setHasTarget(true);
          setTargetAmount(editingHabit.target.amount || 1);
          setTargetUnit(editingHabit.target.unit || 'times');
        } else {
          setHasTarget(false);
          setTargetAmount(1);
          setTargetUnit('times');
        }
      } else {
        setName('');
        setEmoji('🔥');
        setColorClass('bg-blue');
        setFreqType('daily');
        setFreqTimes(1);
        setFreqDays([]);
        setHasTarget(false);
        setTargetAmount(1);
        setTargetUnit('times');

      }
    }
  }, [isOpen, editingHabit]);

  if (!isOpen) return null;

  const handleDayToggle = (dayVal) => {
    setFreqDays(prev => 
      prev.includes(dayVal) 
        ? prev.filter(d => d !== dayVal)
        : [...prev, dayVal]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return Date.now().toString(36) + Math.random().toString(36).substring(2);
    };

    onSave({
      id: editingHabit ? editingHabit.id : generateId(),
      name: name.trim(),
      emoji,
      colorClass,
      createdAt: editingHabit ? editingHabit.createdAt : getTodayString(),
      frequency: {
        type: freqType,
        times: freqTimes,
        days: freqDays
      },
      target: hasTarget ? {
        amount: targetAmount,
        unit: targetUnit.trim() || 'times'
      } : null,

      logs: editingHabit ? editingHabit.logs : {} // Preserve logs if editing
    });
    
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{editingHabit ? 'Edit Habit' : 'Create New Habit'}</h2>
          <button className="btn-close" onClick={onClose}><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Habit Name</label>
            <input 
              type="text" 
              placeholder="e.g. Read 20 pages" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              maxLength={40}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>Icon (Emoji)</label>
              <input 
                type="text" 
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={2}
                className="emoji-input"
              />
            </div>
            
            <div className="form-group half">
              <label>Theme</label>
              <div className="color-picker">
                {COLORS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className={`color-swatch ${c.id} ${colorClass === c.id ? 'selected' : ''}`}
                    onClick={() => setColorClass(c.id)}
                    aria-label={c.label}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* V2 Frequency Settings */}
          <div className="frequency-section">
            <h3 className="section-label">Frequency Options (Optional)</h3>
            
            <div className="form-row">
              <div className="form-group half">
                <label>Recurrence</label>
                <select 
                  value={freqType} 
                  onChange={(e) => setFreqType(e.target.value)}
                  className="freq-select"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="none">None (Ad-hoc)</option>
                </select>
              </div>

              {freqType !== 'none' && freqType !== 'daily' && (
                <div className="form-group half">
                  <label>Times per {freqType === 'weekly' ? 'week' : 'month'}</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="31"
                    value={freqTimes}
                    onChange={(e) => setFreqTimes(parseInt(e.target.value) || 1)}
                    className="freq-input"
                  />
                </div>
              )}
            </div>

            {freqType === 'weekly' && (
              <div className="form-group mt-3">
                <label>Specific Days (Select if applicable)</label>
                <div className="days-picker">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day.val}
                      type="button"
                      className={`day-btn ${freqDays.includes(day.val) ? 'active' : ''}`}
                      onClick={() => handleDayToggle(day.val)}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <p className="helper-text">
              {freqType === 'none' 
                ? "This habit won't be strictly scheduled. It appears in 'All Habits'."
                : `You want to do this ${freqTimes} time(s) ${freqType}.${freqDays.length > 0 ? " Set days specific." : " No specific days."}`
              }
            </p>
          </div>

          {/* V3 Target Settings */}
          <div className="frequency-section mt-3">
            <div className="target-toggle-header">
              <h3 className="section-label mb-0">Measurement Target</h3>
              <label className="target-toggle">
                <input 
                  type="checkbox" 
                  checked={hasTarget}
                  onChange={(e) => setHasTarget(e.target.checked)}
                />
                <span className="toggle-label">Enable</span>
              </label>
            </div>
            
            {hasTarget && (
              <div className="form-row mt-3">
                <div className="form-group half">
                  <label>Amount (e.g., 5)</label>
                  <input 
                    type="number" 
                    min="0.1"
                    step="0.1"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(parseFloat(e.target.value) || 1)}
                    className="freq-input"
                  />
                </div>
                <div className="form-group half">
                  <label>Unit (e.g., km, hrs, pages)</label>
                  <input 
                    type="text" 
                    value={targetUnit}
                    onChange={(e) => setTargetUnit(e.target.value)}
                    className="freq-input"
                    placeholder="km"
                    maxLength={15}
                  />
                </div>
              </div>
            )}
            {hasTarget && (
              <p className="helper-text">
                Instead of a simple checkmark, you'll be prompted to enter how much you completed (e.g., 2.5 of 5 km).
              </p>
            )}
          </div>



          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!name.trim()}>Save Habit</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddHabitModal;
