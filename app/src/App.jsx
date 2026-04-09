/* Habit Tracker v1.1.2 - Spaces Update */
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import HabitList from './components/HabitList';
import AddHabitModal from './components/AddHabitModal';
import HabitDetailModal from './components/HabitDetailModal';
import AnalyticsView from './components/AnalyticsView';
import JournalView from './components/JournalView';
import AICoachChat from './components/AICoachChat';
import LoginScreen from './components/LoginScreen';
import BottomNav from './components/BottomNav';
import SettingsView from './components/SettingsView';
import { auth } from './utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useCallback } from 'react';
import { 
  subscribeToHabits, 
  saveHabitFirestore, 
  deleteHabitFirestore, 
  subscribeToJournals, 
  saveJournalFirestore,
  subscribeToSpaces,
  saveSpaceFirestore,
} from './utils/firestoreStore';
import { getPastNDays, getTodayString } from './utils/dates';

// ─── View constants ───
const VIEW_HABITS = 'habits';
const VIEW_ANALYTICS = 'analytics';
const VIEW_JOURNAL = 'journal';
const VIEW_COACH = 'coach';
const VIEW_SETTINGS = 'settings';

// ─── ID generator ───
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  const [habits, setHabits] = useState([]);
  const [journals, setJournals] = useState([]);
  const defaultSpaceId = 'default_space';
  const [spaces, setSpaces] = useState([
    { id: defaultSpaceId, name: 'My Habits', createdAt: getTodayString() }
  ]);
  const [activeSpaceId, setActiveSpaceId] = useState(defaultSpaceId);

  const [isModalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [currentView, setCurrentView] = useState(VIEW_HABITS);
  const [habitFilter, setHabitFilter] = useState('today');
  const [selectedHabitId, setSelectedHabitId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Prevent migration from running more than once per session
  const migrationRan = useRef(false);

  // ─── Auth listener ───
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) {
        // Reset space state on logout
        setSpaces([{ id: defaultSpaceId, name: 'My Habits', createdAt: getTodayString() }]);
        setActiveSpaceId(defaultSpaceId);
        migrationRan.current = false;
      }
    });
    return () => unsubscribe();
  }, []);

  // ─── Seed sample habits for brand-new users ───
  // Now creates a default "My Habits" space first, then seeds habits into it
  const handleSeedSamples = useCallback(async (uid, spaceId) => {
    const dates = getPastNDays(56); // 8 weeks of history
    const habitId1 = generateId();
    const habitId2 = generateId();
    const habitId3 = generateId();
    const habitId4 = generateId();
    const habitId5 = generateId();

    // Helper to generate randomized logs
    const generateLogs = (type, targetValue, frequencyType, allowedDays = []) => {
      const logs = {};
      dates.forEach(dateString => {
        const dateObj = new Date(dateString);
        const dayOfWeek = dateObj.getDay();

        // Frequency check
        if (frequencyType === 'weekly' && allowedDays.length > 0) {
          if (!allowedDays.includes(dayOfWeek)) return;
        }

        const rand = Math.random();
        if (type === 'measurable') {
          if (rand < 0.7) { // 70% chance of meeting target
            logs[dateString] = targetValue;
          } else if (rand < 0.85) { // 15% chance of partial
            logs[dateString] = Math.round(targetValue * (0.3 + Math.random() * 0.6));
          }
          // 15% chance of nothing
        } else {
          if (rand < 0.8) { // 80% completion rate for check-ins
            logs[dateString] = true;
          }
        }
      });
      return logs;
    };

    const habitsData = [
      {
        id: habitId1,
        name: 'Meditate 10 mins',
        emoji: '🧘',
        colorClass: 'bg-purple',
        createdAt: dates[0],
        spaceId,
        frequency: { type: 'daily', times: 1, days: [] },
        target: null,
        logs: generateLogs('checkin', null, 'daily')
      },
      {
        id: habitId2,
        name: 'Run 3km',
        emoji: '🏃',
        colorClass: 'bg-orange',
        createdAt: dates[0],
        spaceId,
        frequency: { type: 'daily', times: 1, days: [] },
        target: { amount: 3, unit: 'km' },
        logs: generateLogs('measurable', 3, 'daily')
      },
      {
        id: habitId3,
        name: 'Learn music',
        emoji: '🎸',
        colorClass: 'bg-blue',
        createdAt: dates[0],
        spaceId,
        frequency: { type: 'weekly', times: 3, days: [1, 3, 5] },
        target: null,
        logs: generateLogs('checkin', null, 'weekly', [1, 3, 5])
      },
      {
        id: habitId4,
        name: 'No nicotine',
        emoji: '🚭',
        colorClass: 'bg-rose',
        createdAt: dates[0],
        spaceId,
        frequency: { type: 'daily', times: 1, days: [] },
        target: null,
        logs: generateLogs('checkin', null, 'daily')
      },
      {
        id: habitId5,
        name: 'Read 20 pages',
        emoji: '📚',
        colorClass: 'bg-emerald',
        createdAt: dates[0],
        spaceId,
        frequency: { type: 'daily', times: 1, days: [] },
        target: { amount: 20, unit: 'pages' },
        logs: generateLogs('measurable', 20, 'daily')
      }
    ];

    for (const h of habitsData) {
      await saveHabitFirestore(uid, h);
    }
  }, []);

  // ─── Firestore subscriptions ───
  useEffect(() => {
    if (!user) {
      setHabits([]);
      setJournals([]);
      setSpaces([]);
      return;
    }

    // Subscribe to spaces
    const unsubSpaces = subscribeToSpaces(user.uid, async (data) => {
      // 1. Handle no spaces: Create "My Habits" and return
      if (!data || data.length === 0) {
        const spaceId = defaultSpaceId; // Use standard ID for parity with initial state
        const defaultSpace = { id: spaceId, name: 'My Habits', createdAt: getTodayString() };
        setSpaces([defaultSpace]);
        setActiveSpaceId(spaceId);
        try {
          await saveSpaceFirestore(user.uid, defaultSpace);
        } catch (e) {
          console.error("Error creating default space:", e);
        }
        setDataLoading(false);
        return;
      }
      
      // 2. Load existing spaces
      setSpaces(data);

      // 3. Auto-select logic
      setActiveSpaceId(prev => {
        // Keep selection if it exists in new data
        if (prev && data.some(s => s.id === prev)) return prev;
        // Or fallback to first space
        return data[0].id;
      });
      setDataLoading(false);
    });

    // Subscribe to habits
    const unsubHabits = subscribeToHabits(user.uid, (data) => {
      setHabits(data);
    });

    const unsubJournals = subscribeToJournals(user.uid, (data) => {
      setJournals(data);
    });

    return () => {
      unsubSpaces();
      unsubHabits();
      unsubJournals();
    };
  }, [user, handleSeedSamples]);

  // ─── Seeding Logic: 8-Week Sample Habits ───
  useEffect(() => {
    if (!user || habits.length > 0 || spaces.length === 0) return;

    const seededKeyV3 = `seeded_v3_8w_${user.uid}`;
    if (!localStorage.getItem(seededKeyV3)) {
      localStorage.setItem(seededKeyV3, 'true');
      
      const targetSpace = spaces.find(s => s.name === 'My Habits') || spaces[0];
      if (targetSpace) {
        handleSeedSamples(user.uid, targetSpace.id);
      }
    }
  }, [user, habits.length, spaces, handleSeedSamples]);

  // ─── Migration: assign existing habits (no spaceId) to "My Habits" ───
  useEffect(() => {
    if (!user) return;
    if (migrationRan.current) return;

    const migrationKey = `spaces_migrated_${user.uid}`;
    if (localStorage.getItem(migrationKey)) {
      migrationRan.current = true;
      return;
    }

    // Wait until habits and spaces are loaded
    if (habits.length === 0 || spaces.length === 0) return;

    const unassigned = habits.filter(h => !h.spaceId);

    if (unassigned.length === 0) {
      // No legacy habits — mark as done
      localStorage.setItem(migrationKey, 'true');
      migrationRan.current = true;
      return;
    }

    // Mark immediately so subsequent renders don't re-trigger
    localStorage.setItem(migrationKey, 'true');
    migrationRan.current = true;

    const runMigration = async () => {
      // Find "My Habits" space or fallback to first space
      let targetSpace = spaces.find(s => s.name === 'My Habits') || spaces[0];

      // Stamp all unassigned habits with this space
      for (const habit of unassigned) {
        await saveHabitFirestore(user.uid, { ...habit, spaceId: targetSpace.id });
      }

      // Switch to it
      setActiveSpaceId(targetSpace.id);
    };

    runMigration();
  }, [habits, spaces, user]);

  // ─── Space management handlers ───
  const handleCreateSpace = async (spaceData) => {
    if (!user) return;
    const spaceId = generateId();
    const newSpace = {
      id: spaceId,
      name: spaceData.name,
      createdAt: getTodayString(),
    };
    
    // Optimistic UI update
    setSpaces(prev => [...prev, newSpace]);
    setActiveSpaceId(spaceId);

    try {
      await saveSpaceFirestore(user.uid, newSpace);
    } catch (e) {
      console.error("Failed to save new space:", e);
      alert("Error saving Space to Firestore: " + e.message + "\nCheck if Firestore rules block writes to the 'spaces' collection.");
    }
  };

  // ─── Filtering ───
  // Habits scoped to the currently active space
  const getSpaceScopedHabits = () => {
    if (!activeSpaceId) return habits;
    return habits.filter(h => {
      // Legacy habits without a spaceId belong to the default space implicitly
      if (activeSpaceId === defaultSpaceId && !h.spaceId) return true;
      return h.spaceId === activeSpaceId;
    });
  };

  // Filtered + sorted list for the habit list view
  const getFilteredHabits = () => {
    const spaceHabits = getSpaceScopedHabits();

    const sorted = [...spaceHabits].sort((a, b) => {
      const colorA = a.colorClass || '';
      const colorB = b.colorClass || '';
      if (colorA !== colorB) return colorA.localeCompare(colorB);
      return (a.createdAt || '') > (b.createdAt || '') ? 1 : -1;
    });

    if (currentView !== VIEW_HABITS) return [];

    if (habitFilter === 'all') return sorted;
    if (habitFilter === 'today') {
      const todayNum = new Date().getDay();
      return sorted.filter(habit => {
        const f = habit.frequency;
        if (!f || f.type === 'none') return false;
        if (f.type === 'daily') return true;
        if (f.type === 'weekly') {
          if (!f.days || f.days.length === 0) return true;
          return f.days.includes(todayNum);
        }
        if (f.type === 'monthly') return true;
        return true;
      });
    }
    return sorted;
  };

  // ─── CRUD handlers ───
  const handleSaveHabit = async (savedHabit) => {
    if (!user) return;
    // Stamp spaceId if creating (editing preserves existing)
    const habitToSave = savedHabit.spaceId
      ? savedHabit
      : { ...savedHabit, spaceId: activeSpaceId };
    await saveHabitFirestore(user.uid, habitToSave);
  };

  const handleDeleteHabit = async (habitId) => {
    if (!user) return;
    const confirmDelete = window.confirm('Are you sure you want to delete this habit?');
    if (!confirmDelete) return;
    await deleteHabitFirestore(user.uid, habitId);
    setModalOpen(false);
    setEditingHabit(null);
  };

  const openAddModal = () => {
    setEditingHabit(null);
    setModalOpen(true);
  };

  const openEditModal = (habit) => {
    setSelectedHabitId(null);
    setEditingHabit(habit);
    setModalOpen(true);
  };

  const handleCheckIn = async (habitId, dateString, newValue) => {
    if (!user) return;
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const currentLogs = { ...habit.logs };

    if (newValue === null) {
      delete currentLogs[dateString];
    } else if (typeof newValue === 'number') {
      if (newValue <= 0) {
        delete currentLogs[dateString];
      } else {
        currentLogs[dateString] = newValue;
      }
    } else {
      if (currentLogs[dateString]) {
        delete currentLogs[dateString];
      } else {
        currentLogs[dateString] = true;
      }
    }

    await saveHabitFirestore(user.uid, { ...habit, logs: currentLogs });
  };

  const handleSaveJournal = async (newJournal) => {
    if (!user) return;
    await saveJournalFirestore(user.uid, newJournal);
  };

  // ─── Routing ───
  const renderContent = () => {
    const scopedHabits = getSpaceScopedHabits();

    if (currentView === VIEW_ANALYTICS) {
      return <AnalyticsView habits={scopedHabits} />;
    }
    if (currentView === VIEW_JOURNAL) {
      return (
        <JournalView
          habits={scopedHabits}
          journals={journals}
          onSaveJournal={handleSaveJournal}
        />
      );
    }
    if (currentView === VIEW_COACH) {
      return <AICoachChat user={user} />;
    }

    if (currentView === VIEW_SETTINGS) {
      return <SettingsView onLogout={() => auth.signOut()} />;
    }

    return (
      <HabitList
        habits={getFilteredHabits()}
        onCheckIn={handleCheckIn}
        onHabitClick={(habit) => setSelectedHabitId(habit.id)}
        habitFilter={habitFilter}
        setHabitFilter={setHabitFilter}
      />
    );
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  // ─── Guards ───
  if (authLoading) return <div className="loading-screen">Loading UpHabit…</div>;
  if (!user) return <LoginScreen />;

  const selectedHabit = habits.find(h => h.id === selectedHabitId) || null;

  return (
    <div className="app-container">
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        onLogout={() => auth.signOut()}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="main-content">
        <div className="content-wrapper">
          <Header
            onAddClick={openAddModal}
            currentView={currentView}
            onMenuClick={() => setIsSidebarOpen(true)}
            spaces={spaces}
            activeSpaceId={activeSpaceId}
            onSpaceChange={setActiveSpaceId}
            onCreateSpace={handleCreateSpace}
          />
          {renderContent()}
        </div>
      </main>

      <BottomNav
        currentView={currentView}
        onViewChange={handleViewChange}
      />

      <AddHabitModal
        isOpen={isModalOpen}
        onClose={() => { setModalOpen(false); setEditingHabit(null); }}
        onSave={handleSaveHabit}
        onDelete={handleDeleteHabit}
        editingHabit={editingHabit}
        currentSpaceId={activeSpaceId}
      />

      <HabitDetailModal
        habit={selectedHabit}
        isOpen={!!selectedHabit}
        onClose={() => setSelectedHabitId(null)}
        onCheckIn={handleCheckIn}
        onEdit={() => openEditModal(selectedHabit)}
      />
    </div>
  );
}

export default App;
