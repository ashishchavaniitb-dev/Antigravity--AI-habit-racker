import React, { useState } from 'react';
import './JournalView.css';
import { getTodayString } from '../utils/dates';
import { PencilLine } from '@phosphor-icons/react';

function JournalView({ habits, journals, onSaveJournal }) {
  const [selectedHabitId, setSelectedHabitId] = useState(habits.length > 0 ? habits[0].id : '');
  const [entryText, setEntryText] = useState('');

  const selectedHabit = habits.find(h => h.id === selectedHabitId);
  const todayStr = getTodayString();

  const handleSave = () => {
    if (!entryText.trim() || !selectedHabitId) return;

    onSaveJournal({
      id: crypto.randomUUID(),
      habitId: selectedHabitId,
      date: new Date().toISOString(), // store precise ISO string for sorting
      text: entryText.trim()
    });

    setEntryText(''); // Reset after save
  };

  // Filter and sort journals
  const habitJournals = journals
    .filter(j => j.habitId === selectedHabitId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (habits.length === 0) {
    return (
      <div className="journal-empty">
        <p>No habits available. Create a habit first to start journaling!</p>
      </div>
    );
  }

  return (
    <div className="journal-view">
      
      {/* Compose Section */}
      <div className="journal-compose-card">
        <div className="compose-header">
          <h3>Write an Entry</h3>
          <div className="habit-selector">
            <span className="selector-label">Regarding:</span>
            <select 
              value={selectedHabitId} 
              onChange={(e) => setSelectedHabitId(e.target.value)}
              className="habit-dropdown"
            >
              {habits.map(h => (
                <option key={h.id} value={h.id}>
                  {h.emoji} {h.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="compose-body mt-4">
          <textarea 
            className="journal-textarea" 
            placeholder={`How did your habit of "${selectedHabit?.name || 'this'}" go recently?`}
            value={entryText}
            onChange={e => setEntryText(e.target.value)}
            rows={4}
          />
          <div className="compose-footer mt-3">
            <span className="today-date">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <button 
              className="btn-primary" 
              onClick={handleSave}
              disabled={!entryText.trim()}
            >
              Save Entry
            </button>
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="journal-history mt-6">
        <h3 className="section-title mb-4">Past Entries for {selectedHabit?.emoji} {selectedHabit?.name}</h3>
        
        {habitJournals.length === 0 ? (
          <div className="history-empty">
            <PencilLine size={32} weight="light" className="mb-2" />
            <p>You haven't journaled about this habit yet.</p>
          </div>
        ) : (
          <div className="timeline">
            {habitJournals.map(journal => {
              const d = new Date(journal.date);
              const dateDisplay = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
              const timeDisplay = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div key={journal.id} className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <div className="timeline-meta">{dateDisplay} at {timeDisplay}</div>
                    <p className="timeline-text">{journal.text}</p>
                    {journal.aiInsights && (
                      <div className="ai-insight-bubble">
                        <div className="ai-insight-header">
                          <span className="sparkle-icon">✨</span>
                          <strong>AI Coach Insight</strong>
                        </div>
                        <p>{journal.aiInsights}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

export default JournalView;
