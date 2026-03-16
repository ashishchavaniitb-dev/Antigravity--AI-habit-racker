import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import HabitList from './components/HabitList';
import AddHabitModal from './components/AddHabitModal';
import HabitDetailModal from './components/HabitDetailModal';
import AnalyticsView from './components/AnalyticsView';
import JournalView from './components/JournalView';
import AICoachChat from './components/AICoachChat';
import LoginScreen from './components/LoginScreen';
import { auth } from './utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  subscribeToHabits, 
  saveHabitFirestore, 
  deleteHabitFirestore, 
  subscribeToJournals, 
  saveJournalFirestore
} from './utils/firestoreStore';

// Define our views
const VIEW_TODAY = 'today';
const VIEW_ALL = 'all';
const VIEW_ANALYTICS = 'analytics';
const VIEW_JOURNAL = 'journal';
const VIEW_COACH = 'coach';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [habits, setHabits] = useState([]);
  const [journals, setJournals] = useState([]);
  
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [currentView, setCurrentView] = useState(VIEW_TODAY);
  const [selectedHabitId, setSelectedHabitId] = useState(null); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync to Firestore instead of local storage
  useEffect(() => {
    if (!user) {
      setHabits([]);
      setJournals([]);
      return;
    }

    const unsubHabits = subscribeToHabits(user.uid, (data) => {
      setHabits(data);
    });

    const unsubJournals = subscribeToJournals(user.uid, (data) => {
      setJournals(data);
    });

    return () => {
      unsubHabits();
      unsubJournals();
    };
  }, [user]);

  // View Filtering Logic
  const getFilteredHabits = () => {
    if (currentView === VIEW_ALL) return habits;
    if (currentView === VIEW_TODAY) {
      const todayNum = new Date().getDay(); // 0 = Sun, 1 = Mon, ...
      return habits.filter(habit => {
        // Habits without a specific daily frequency (like 'none' or 'monthly' without specific days) 
        // usually show up in 'All Habits' by the user's request. 
        // But if it's strictly daily -> show today.
        // If it's weekly and specifies days -> check if today is in those days.
        
        const f = habit.frequency;
        if (!f || f.type === 'none') return false; 
        if (f.type === 'daily') return true;
        if (f.type === 'weekly') {
          // If they didn't specify days (just "2 times a week"), show it every day until they complete it?
          // Simplest MVP: if days array is empty, show it every day so they can check it off whenever.
          if (!f.days || f.days.length === 0) return true;
          return f.days.includes(todayNum);
        }
        if (f.type === 'monthly') return true; // Show monthly habits every day until checked? (MVP logic)
        return true;
      });
    }
    return []; // For Analytics, we don't pass the list
  };

  const handleSaveHabit = async (savedHabit) => {
    if (!user) return;
    await saveHabitFirestore(user.uid, savedHabit);
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
    
    // Explicitly handle all check-in scenarios
    if (newValue === null) {
      // Deletion case (e.g. prompt cleared or explicit null)
      delete currentLogs[dateString];
    } else if (typeof newValue === 'number') {
      // Specific amount case
      if (newValue <= 0) {
        delete currentLogs[dateString];
      } else {
        currentLogs[dateString] = newValue;
      }
    } else {
      // Toggle boolean case (happens when newValue is missing/undefined)
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

  const renderContent = () => {
    if (currentView === VIEW_ANALYTICS) {
      return <AnalyticsView habits={habits} />;
    }
    if (currentView === VIEW_JOURNAL) {
      return <JournalView habits={habits} journals={journals} onSaveJournal={handleSaveJournal} />;
    }
    if (currentView === VIEW_COACH) {
      return <AICoachChat user={user} />;
    }
    
    return (
      <HabitList 
        habits={getFilteredHabits()} 
        onCheckIn={handleCheckIn} 
        onHabitClick={(habit) => {
          setSelectedHabitId(habit.id);
        }}
      />
    );
  };

  if (authLoading) return <div className="loading-screen">Loading UpHabit...</div>;

  if (!user) {
    return <LoginScreen />;
  }

  const selectedHabit = habits.find(h => h.id === selectedHabitId) || null;

  const handleViewChange = (view) => {
    setCurrentView(view);
    setIsSidebarOpen(false); // Close sidebar on mobile when navigating
  };

  return (
    <div className="app-container">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
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
          />
          {renderContent()}
        </div>
      </main>

      <AddHabitModal 
        isOpen={isModalOpen} 
        onClose={() => { setModalOpen(false); setEditingHabit(null); }}
        onSave={handleSaveHabit}
        editingHabit={editingHabit}
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
