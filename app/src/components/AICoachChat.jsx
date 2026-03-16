import React, { useState, useEffect, useRef } from 'react';
import { PaperPlaneRight, Robot, User } from '@phosphor-icons/react';
import { subscribeToMessages, sendMessageFirestore } from '../utils/firestoreStore';
import './AICoachChat.css';

function AICoachChat({ user }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = subscribeToMessages(user.uid, (fetchedMessages) => {
      setMessages(fetchedMessages);
      
      // Simulate typing indicator: if last message is from user and we don't have an AI response yet
      // Firebase functions usually take a second to process and write back.
      if (fetchedMessages.length > 0) {
        const lastMsg = fetchedMessages[fetchedMessages.length - 1];
        if (lastMsg.sender === 'user') {
          setIsTyping(true);
        } else {
          setIsTyping(false);
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const textToSend = inputText;
    setInputText('');
    
    // Optimistic UI updates are handled by Firestore's local cache
    await sendMessageFirestore(user.uid, textToSend);
  };

  return (
    <div className="ai-chat-container">
      <header className="ai-chat-header">
        <Robot size={32} weight="fill" className="ai-chat-icon" />
        <div>
          <h2>AI Habit Coach</h2>
          <p>Powered by James Clear's "Atomic Habits" principles.</p>
        </div>
      </header>
      
      <div className="ai-chat-messages">
        {messages.length === 0 && (
          <div className="ai-chat-empty">
            <Robot size={48} weight="duotone" />
            <h3>Welcome to your Coaching Session!</h3>
            <p>Tell me what habit you are struggling with, or simply ask for advice on how to improve your daily routines.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`ai-message-row ${msg.sender === 'user' ? 'user-row' : 'ai-row'}`}>
            {msg.sender === 'ai' && (
              <div className="ai-avatar">
                <Robot size={24} weight="fill" />
              </div>
            )}
            
            <div className={`ai-message-bubble ${msg.sender === 'user' ? 'user-bubble' : 'ai-bubble'}`}>
              <p>{msg.text}</p>
              <span className="ai-message-time">
                {msg.createdAt ? new Date(msg.createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
              </span>
            </div>

            {msg.sender === 'user' && (
              <div className="user-avatar">
                <User size={24} weight="fill" />
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="ai-message-row ai-row">
            <div className="ai-avatar">
              <Robot size={24} weight="fill" />
            </div>
            <div className="ai-message-bubble ai-bubble typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="ai-chat-input-area" onSubmit={handleSend}>
        <input 
          type="text" 
          placeholder="Ask your coach anything..." 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button type="submit" disabled={!inputText.trim()} className="ai-send-btn">
          <PaperPlaneRight size={24} weight="fill" />
        </button>
      </form>
    </div>
  );
}

export default AICoachChat;
