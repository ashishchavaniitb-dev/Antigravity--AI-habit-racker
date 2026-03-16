import { getTodayString } from './dates';

const STORAGE_KEY = 'antigravity_habits_v2';

// Default habits for empty state (V2 schema)
export const DEFAULT_HABITS = [
  { 
    id: crypto.randomUUID(), 
    name: 'Morning Jog (3km)', 
    emoji: '🏃', 
    colorClass: 'bg-blue', 
    createdAt: getTodayString(),
    frequency: { type: 'daily', times: 1, days: [] },
    logs: {} // e.g. '2026-03-15': true
  },
  { 
    id: crypto.randomUUID(), 
    name: 'Read 20 pages', 
    emoji: '📚', 
    colorClass: 'bg-amber', 
    createdAt: getTodayString(),
    frequency: { type: 'weekly', times: 2, days: [1, 3] }, // Mon, Wed
    logs: {} 
  },
];

export const loadHabits = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return DEFAULT_HABITS;
    
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading habits', err);
    return DEFAULT_HABITS;
  }
};

export const saveHabits = (habits) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  } catch (err) {
    console.error('Error saving habits', err);
  }
};

const JOURNAL_STORAGE_KEY = 'antigravity_journals_v1';

export const loadJournals = () => {
  try {
    const data = localStorage.getItem(JOURNAL_STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error loading journals', err);
    return [];
  }
};

export const saveJournals = (journals) => {
  try {
    localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(journals));
  } catch (err) {
    console.error('Error saving journals', err);
  }
};
