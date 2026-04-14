

const menuBtn = {
  border: 'none',
  borderRadius: '0',
  padding: '0 18px',
  fontWeight: 500,
  cursor: 'pointer',
  fontSize: '16px',
  margin: 0,
  background: 'none',
  color: '#23273a',
  boxShadow: 'none',
  outline: 'none',
  height: '64px',
  display: 'flex',
  alignItems: 'center', // vertical center
  justifyContent: 'center', // horizontal center
  transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
};
const styles = {
  appContainer: { width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' },
  navbar: {
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #ddd',
    paddingLeft: '20px',
    paddingRight: '0',
    display: 'flex',
    alignItems: 'center',
    height: '64px',
    gap: '24px',
    justifyContent: 'space-between',
  },
  logo: {
    margin: 0,
    fontSize: '28px',
    color: 'black',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    lineHeight: '64px', // Vertically center
  },
  userInfo: {
    display: 'none', // No longer used, handled inline
  },
  welcomeText: {
    margin: 0,
    color: 'black',
    fontSize: '16px',
    fontWeight: 400,
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    lineHeight: '64px',
  },
  menuBtn,
  logoutBtn: {
    ...menuBtn,
    background: '#dc3545',
    color: 'white',
    borderRadius: '0',
    minHeight: '40px',
    fontWeight: 500,
    boxShadow: '0 2px 8px rgba(30,34,47,0.10)',
    transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
    borderLeft: 'none',
    marginLeft: 0,
  },
  mainContent: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '0 0 0 0',
    outline: 'none',
    height: '100%',
    minWidth: 0,
    minHeight: '64px',
    letterSpacing: '0.2px',
    display: 'block', // Restore default block layout
    transition: 'all 0.18s cubic-bezier(.4,0,.2,1)',
    position: 'relative',
    // flex: 1 removed to restore previous width
  },
  menuBtnActive: {
    background: '#d3d6de', // slightly darker grey
    color: '#23273a',
    fontWeight: 500,
    border: 'none',
    boxShadow: '0 2px 8px rgba(30,34,47,0.10)',
    zIndex: 1,
    outline: 'none',
  },
  menuBtnInactive: {
    background: '#e3e7ed', // slightly darker grey than before
    color: '#23273a',
    fontWeight: 500,
    border: 'none',
    boxShadow: 'none',
    outline: 'none',
  },
  center: { width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }
};

import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Login from './login';
import UpdatePassword from './updatepassword';
import { CategoryExplorer } from './components/categoryexplorer';
import BudgetPage from './components/budget';
import Analysis from './components/analysis';
import { useToast } from './hooks/useToast';
import { ToastContainer } from './components/ToastContainer';
import { ToastProvider } from './lib/ToastContext.jsx';

function App() {
  const [session, setSession] = useState(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'budget' | 'analysis'
  const { toasts, removeToast, success, error } = useToast();

  useEffect(() => {
    const handleInitialSession = async () => {
      // Get existing session first
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      setSession(existingSession);
      
      const rawHash = window.location.hash;
      const recoveryRequested = rawHash && rawHash.includes('type=recovery');

      if (rawHash) {
        const params = new URLSearchParams(rawHash.replace('#', '?'));
        const at = params.get('access_token');
        const rt = params.get('refresh_token');
        if (at) {
          const payload = { access_token: at };
          if (rt) payload.refresh_token = rt;
          await supabase.auth.setSession(payload);
          const { data: { session: manual } } = await supabase.auth.getSession();
          setSession(manual);
        }
      }
      if (recoveryRequested) setIsRecoveryMode(true);
    };

    handleInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === "PASSWORD_RECOVERY") setIsRecoveryMode(true);
    });

    return () => subscription.unsubscribe();
  }, []);


  if (isRecoveryMode) {
    return (
      <div style={styles.center}>
        <UpdatePassword 
          onComplete={async () => {
            await supabase.auth.signOut();
            setIsRecoveryMode(false);
            window.location.hash = ''; 
            alert("Success! Password changed. Please log in.");
          }} 
        />
      </div>
    );
  }

  return (
    <ToastProvider toast={{ success, error }}>
      <div style={styles.appContainer}>
      <div style={styles.navbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <h1 style={styles.logo}>Finance Tracker</h1>
          {session && (
            <span style={styles.welcomeText}>
              Welcome, {session.user.user_metadata?.display_name || 'User'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'stretch', marginLeft: 'auto', gap: 0, justifyContent: 'flex-end' }}>
          <button
            onClick={() => setView('dashboard')}
            style={view === 'dashboard'
              ? { ...styles.menuBtn, ...styles.menuBtnActive, minWidth: 120 }
              : { ...styles.menuBtn, ...styles.menuBtnInactive, minWidth: 120 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >Dashboard</button>
          <button
            onClick={() => setView('analysis')}
            style={view === 'analysis'
              ? { ...styles.menuBtn, ...styles.menuBtnActive, minWidth: 120 }
              : { ...styles.menuBtn, ...styles.menuBtnInactive, minWidth: 120 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >Analysis</button>
          <button
            onClick={() => setView('budget')}
            style={view === 'budget'
              ? { ...styles.menuBtn, ...styles.menuBtnActive, minWidth: 120 }
              : { ...styles.menuBtn, ...styles.menuBtnInactive, minWidth: 120 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >Budget</button>
          {session && (
            <button 
              onClick={() => supabase.auth.signOut()} 
              style={{ ...styles.logoutBtn, minWidth: 120, height: '64px', alignItems: 'center' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(30,34,47,0.10)';
              }}
            >
              Logout
            </button>
          )}
        </div>
      </div>
      <div style={styles.mainContent}>
        {view === 'dashboard' && (
          <CategoryExplorer />
        )}

        {view === 'budget' && (
          <BudgetPage />
        )}

        {view === 'analysis' && (
          <Analysis />
        )}
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
    </ToastProvider>
  );
}

// ...existing code...
export default App;