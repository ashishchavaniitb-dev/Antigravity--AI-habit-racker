import React, { useState } from 'react';
import { auth } from '../utils/firebase';
import { 
  signInAnonymously, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import './LoginScreen.css';

const googleProvider = new GoogleAuthProvider();

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Handle redirect result on mount
  React.useEffect(() => {
    const checkRedirect = async () => {
      // Only set loading if we're likely returning from a redirect
      // (Simplified check: if there's an auth-related hash or query param, or just always check)
      setLoading(true);
      try {
        console.log('Checking for redirect result...');
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('Redirect Sign-In Success:', result.user.email);
          // App.jsx onAuthStateChanged will handle the user state update
        } else {
          console.log('No redirect result found.');
        }
      } catch (err) {
        console.error('Redirect Sign-In Error:', err);
        setError('Sign-in failed. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    checkRedirect();
  }, []);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error('Email Auth Error:', err);
      // Make error messages user-friendly
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try logging in instead.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    console.log('Starting Google Login (Popup)...');
    console.log('Firebase Config Check:', !!import.meta.env.VITE_FIREBASE_API_KEY ? 'Loaded' : 'MISSING');

    try {
      // Trying popup first as it is more reliable for state preservation than redirect on mobile
      await signInWithPopup(auth, googleProvider);
      console.log('Google Sign-In Success (Popup)');
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      
      // Provide more specific error info to help debug mobile loops
      if (err.code === 'auth/popup-blocked') {
        setError('Sign-in popup was blocked. Please allow popups or try again.');
      } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled.');
      } else {
        setError(`Sign-in failed: ${err.code || 'unknown'}. ${err.message || ''}`);
      }
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInAnonymously(auth);
    } catch (err) {
      console.error('Guest Sign-In Error:', err);
      setError('Guest sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="login-card">
        <h1 className="login-title">UpHabit</h1>
        <p className="login-subtitle">Your AI-powered habit coach, built on the science of <strong>Atomic Habits</strong>.</p>

        {error && <div className="login-error">{error}</div>}

        <form className="email-auth-form" onSubmit={handleEmailAuth}>
          <div className="input-group">
            <input 
              type="email" 
              placeholder="Email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="input-group">
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="login-btn login-btn-primary" 
            disabled={loading}
          >
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Log In')}
          </button>
        </form>

        <div className="auth-mode-toggle">
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button 
              type="button" 
              className="toggle-btn"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              disabled={loading}
            >
              {isSignUp ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>

        <div className="login-divider">
          <span>or continue with</span>
        </div>

        <div className="secondary-auth-buttons">
          <button 
            type="button"
            className="login-btn login-btn-google" 
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          <button 
            type="button"
            className="login-btn login-btn-guest" 
            onClick={handleGuestLogin}
            disabled={loading}
          >
            👤 Guest
          </button>
        </div>

        <p className="login-footer">
          Guest data is temporary. Sign up or use Google to save progress permanently.
        </p>
      </div>
    </div>
  );
}
