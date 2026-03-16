import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where, 
  deleteDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
  addDoc
} from "firebase/firestore";

// Helper to get collection references per user
const getHabitRef = (userId) => collection(db, "users", userId, "habits");
const getJournalRef = (userId) => collection(db, "users", userId, "journals");

export const subscribeToHabits = (userId, callback) => {
  if (!userId) return () => {};
  const q = query(getHabitRef(userId));
  return onSnapshot(q, (snapshot) => {
    const habits = [];
    snapshot.forEach((doc) => {
      habits.push({ id: doc.id, ...doc.data() });
    });
    callback(habits);
  });
};

export const saveHabitFirestore = async (userId, habit) => {
  if (!userId) return;
  const habitRef = doc(db, "users", userId, "habits", habit.id);
  await setDoc(habitRef, {
    ...habit,
    updatedAt: serverTimestamp()
  });
};

export const deleteHabitFirestore = async (userId, habitId) => {
  if (!userId) return;
  const habitRef = doc(db, "users", userId, "habits", habitId);
  await deleteDoc(habitRef);
};

export const subscribeToJournals = (userId, callback) => {
  if (!userId) return () => {};
  const q = query(getJournalRef(userId), orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    const journals = [];
    snapshot.forEach((doc) => {
      journals.push({ id: doc.id, ...doc.data() });
    });
    callback(journals);
  });
};

export const saveJournalFirestore = async (userId, journal) => {
  if (!userId) return;
  const journalRef = doc(db, "users", userId, "journals", journal.id);
  await setDoc(journalRef, {
    ...journal,
    updatedAt: serverTimestamp()
  });
};


// --- AI Chat Methods ---

export const getMessagesRef = (userId) => collection(db, "users", userId, "messages");

export const subscribeToMessages = (userId, callback) => {
  if (!userId) return () => {};
  const q = query(getMessagesRef(userId), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    callback(messages);
  });
};

export const sendMessageFirestore = async (userId, text) => {
  if (!userId || !text.trim()) return;
  const messagesRef = getMessagesRef(userId);
  await addDoc(messagesRef, {
    text: text.trim(),
    sender: "user",
    createdAt: serverTimestamp()
  });
};
