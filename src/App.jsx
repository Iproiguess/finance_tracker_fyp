
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { formatDateToDDMMYYYY } from './utils/dateFormatter';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { useTransactions } from './hooks/usetransactions';
import { useBudgets } from './hooks/usebudgets';
import { useAutomations } from './hooks/useAutomations';
import Login from './login';
import UpdatePassword from './updatepassword';
import { CategoryExplorer } from './components/categoryexplorer';
import BudgetPage from './components/budget';
import Analysis from './components/analysis';
import { appStyles } from './styles/appStyles';

function App() {
  const [session, setSession] = useState(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [view, setView] = useState('explorer'); // 'explorer' | 'budget' | 'analysis'
  const [activeFeatures, setActiveFeatures] = useState({ forecast: false, simulation: false, heatmap: false }); // toggle states

  // Get current month in YYYY-MM format
  const getCurrentMonthString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // Get today's date in YYYY-MM format
  const getTodayMonthString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // Fetch transactions to calculate oldest date
  const { transactions, fetchTransactions } = useTransactions();

  // Get today's month for default "to" date
  const getTodayMonth = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, []);

  // Calculate oldest transaction date - memoized to prevent recalculation on every render
  const getOldestTransactionMonth = useCallback(() => {
    if (!transactions || transactions.length === 0) {
      return null;
    }
    let oldestDate = null;
    transactions.forEach(tx => {
      if (tx.date) {
        const txDate = new Date(tx.date);
        if (!oldestDate || txDate < oldestDate) {
          oldestDate = txDate;
        }
      }
    });
    if (!oldestDate) {
      return null;
    }
    const year = oldestDate.getFullYear();
    const month = String(oldestDate.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, [transactions]);

  // Calculate newest/most recent transaction date - memoized to prevent recalculation on every render
  const getNewestTransactionMonth = useCallback(() => {
    if (!transactions || transactions.length === 0) {
      return getTodayMonth();
    }
    let newestDate = null;
    transactions.forEach(tx => {
      if (tx.date) {
        const txDate = new Date(tx.date);
        if (!newestDate || txDate > newestDate) {
          newestDate = txDate;
        }
      }
    });
    if (!newestDate) {
      return getTodayMonth();
    }
    const year = newestDate.getFullYear();
    const month = String(newestDate.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, [transactions, getTodayMonth]);

  // Memoize the date values to prevent recalculation
  const oldestMonth = useMemo(() => getOldestTransactionMonth(), [getOldestTransactionMonth]);
  const newestMonth = useMemo(() => getNewestTransactionMonth(), [getNewestTransactionMonth]);
  const todayMonth = useMemo(() => getTodayMonth(), [getTodayMonth]);

  const [selectedStartMonth, setSelectedStartMonth] = useState('all');
  const [selectedEndMonth, setSelectedEndMonth] = useState(newestMonth);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [analysisSelectedBudgetIds, setAnalysisSelectedBudgetIds] = useState(new Set());

  const updateAnalysisMonthFromDate = useCallback((dateValue, setMonth) => {
    if (!dateValue) {
      setMonth('all');
      return;
    }

    const normalized = String(dateValue).trim();
    const parts = normalized.split('-');
    if (parts.length >= 2) {
      const year = parts[0];
      const month = String(parts[1]).padStart(2, '0');
      if (year && month) {
        setMonth(`${year}-${month}`);
        return;
      }
    }

    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      setMonth(`${year}-${month}`);
      return;
    }

    setMonth('all');
  }, []);

  // Fetch all budgets to use for date calculations
  const { budgets } = useBudgets();

  // Get automation functions for daily execution
  const { executeDueAutomations } = useAutomations();

  // Callback for Analysis to report selected budget IDs
  const handleAnalysisBudgetsChanged = useCallback((budgetIds) => {
    setAnalysisSelectedBudgetIds(budgetIds);
    console.log('Analysis budgets changed:', budgetIds);
  }, []);

  // Calculate and update dates when analysis budgets change
  useEffect(() => {
    if (view !== 'analysis') {
      return;
    }

    console.log('Calculating dates for budgets:', analysisSelectedBudgetIds);

    if (analysisSelectedBudgetIds.size === 0) {
      // No budgets selected - reset to show all transactions
      console.log('No budgets selected, resetting to oldest/newest');
      setSelectedStartMonth(oldestMonth || 'all');
      setSelectedEndMonth(newestMonth || todayMonth);
      return;
    }

    // Get transactions for selected budget categories
    const selectedBudgetCategoryIds = new Set();
    budgets.forEach(budget => {
      if (analysisSelectedBudgetIds.has(budget.budget_id)) {
        (budget.category_ids || []).forEach(catId => selectedBudgetCategoryIds.add(catId));
      }
    });

    console.log('Selected category IDs:', selectedBudgetCategoryIds);

    const relevantTransactions = transactions.filter(tx => selectedBudgetCategoryIds.has(tx.category_id));
    console.log('Relevant transactions for selected budgets:', relevantTransactions.length);

    if (relevantTransactions.length === 0) {
      console.log('No transactions for selected budgets, resetting to full range');
      setSelectedStartMonth(oldestMonth || 'all');
      setSelectedEndMonth(newestMonth || todayMonth);
      return;
    }

    // Find oldest and newest dates
    let oldestDate = null;
    let newestDate = null;

    relevantTransactions.forEach(tx => {
      if (tx.date) {
        const txDate = new Date(tx.date);
        if (!oldestDate || txDate < oldestDate) oldestDate = txDate;
        if (!newestDate || txDate > newestDate) newestDate = txDate;
      }
    });

    if (oldestDate && newestDate) {
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
      };

      const startMonth = formatDate(oldestDate);
      const endMonth = formatDate(newestDate);

      console.log('Updating dates to:', startMonth, endMonth);
      setSelectedStartMonth(startMonth);
      setSelectedEndMonth(endMonth);
    }
  }, [analysisSelectedBudgetIds, view, budgets, transactions, oldestMonth, newestMonth, todayMonth]);

  // Refresh transactions only when switching to Analysis view and data is stale (5 seconds)
  useEffect(() => {
    if (view === 'analysis' && fetchTransactions) {
      const now = Date.now();
      // Only fetch if more than 5 seconds have passed since last fetch
      if (now - lastFetchTime > 5000) {
        fetchTransactions();
        setLastFetchTime(now);
      }
    }
  }, [view, fetchTransactions, lastFetchTime]);

  // Update dates whenever transactions change (only when NOT in analysis view)
  useEffect(() => {
    if (view !== 'analysis') {
      // Update "from" date to oldest transaction
      setSelectedStartMonth(oldestMonth || 'all');
      
      // Update "to" date to newest transaction
      setSelectedEndMonth(newestMonth || todayMonth);
    }
  }, [oldestMonth, newestMonth, todayMonth, view]);

  // Initialize flatpickr on the start/end date inputs so the displayed format is dd/MM/yyyy
  useEffect(() => {
    try {
      const opts = {
        altInput: true,
        altFormat: 'd/m/Y',
        dateFormat: 'Y-m-d',
        allowInput: true,
        altInputClass: 'analysis-flatpickr-input'
      };
      const startEl = document.getElementById('start-date');
      const endEl = document.getElementById('end-date');
      const startFp = startEl ? flatpickr(startEl, {
        ...opts,
        defaultDate: startEl.value || null,
        onChange: (selectedDates, dateStr) => {
          updateAnalysisMonthFromDate(dateStr, setSelectedStartMonth);
        }
      }) : null;
      const endFp = endEl ? flatpickr(endEl, {
        ...opts,
        defaultDate: endEl.value || null,
        onChange: (selectedDates, dateStr) => {
          updateAnalysisMonthFromDate(dateStr, setSelectedEndMonth);
        }
      }) : null;

      // Defensive: ensure any created alt inputs have our scoped class immediately
      try {
        if (startFp && startFp.altInput) startFp.altInput.classList.add('analysis-flatpickr-input');
        if (endFp && endFp.altInput) endFp.altInput.classList.add('analysis-flatpickr-input');
        // also guard in case flatpickr didn't attach altInput yet but DOM sibling exists
        if (startEl && startEl.nextElementSibling) startEl.nextElementSibling.classList.add('analysis-flatpickr-input');
        if (endEl && endEl.nextElementSibling) endEl.nextElementSibling.classList.add('analysis-flatpickr-input');
        // If end didn't get an alt input (observed race), retry once after a short delay
        if (endEl && !endEl._flatpickr) {
          setTimeout(() => {
            try {
              const retryFp = flatpickr(endEl, { ...opts, defaultDate: endEl.value || null });
              if (retryFp && retryFp.altInput) retryFp.altInput.classList.add('analysis-flatpickr-input');
            } catch (e) {}
          }, 80);
        }
      } catch (e) {}

      // Additional delayed safeguard: ensure both start and end have a flatpickr instance.
      setTimeout(() => {
        try {
          if (startEl && !startEl._flatpickr) {
            const s = flatpickr(startEl, {
              ...opts,
              defaultDate: startEl.value || null,
              onChange: (selectedDates, dateStr) => {
                updateAnalysisMonthFromDate(dateStr, setSelectedStartMonth);
              }
            });
            if (s && s.altInput) s.altInput.classList.add('analysis-flatpickr-input');
          }
          if (endEl && !endEl._flatpickr) {
            const e = flatpickr(endEl, {
              ...opts,
              defaultDate: endEl.value || null,
              onChange: (selectedDates, dateStr) => {
                updateAnalysisMonthFromDate(dateStr, setSelectedEndMonth);
              }
            });
            if (e && e.altInput) e.altInput.classList.add('analysis-flatpickr-input');
          }
        } catch (e) {}
      }, 120);

      return () => {
        if (startFp) startFp.destroy();
        if (endFp) endFp.destroy();
      };
    } catch (e) {
      // ignore if flatpickr not available
      console.warn('flatpickr init failed', e);
    }
  }, [view]);

  // Keep flatpickr inputs in sync when selected months change
  useEffect(() => {
    const startEl = document.getElementById('start-date');
    if (startEl && startEl._flatpickr) {
      const val = selectedStartMonth === 'all' ? '' : selectedStartMonth + '-01';
      try { startEl._flatpickr.setDate(val, false); } catch(e) {}
    }
    const endEl = document.getElementById('end-date');
    if (endEl && endEl._flatpickr) {
      const val = selectedEndMonth === 'all' ? '' : selectedEndMonth + '-01';
      try { endEl._flatpickr.setDate(val, false); } catch(e) {}
    }
  }, [selectedStartMonth, selectedEndMonth]);

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
      console.log('Auth state changed:', event, session?.user?.email);
      setSession(session);
      if (event === "PASSWORD_RECOVERY") setIsRecoveryMode(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Execute due automations when session is established
  useEffect(() => {
    if (session && session.user) {
      // Execute daily automations on app load
      executeDueAutomations();
    }
  }, [session, executeDueAutomations]);


  if (isRecoveryMode) {
    return (
      <div style={appStyles.center}>
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

  if (!session) {
    return (
      <Login onAuthSuccess={() => {}} />
    );
  }

  return (
    <div style={appStyles.appContainer}>
      <div style={appStyles.navbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <h1 style={appStyles.logo}>Finance Tracker</h1>
          {session && (
            <span style={appStyles.welcomeText}>
              Welcome, {session.user.user_metadata?.display_name || 'User'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'stretch', marginLeft: 'auto', gap: 0, justifyContent: 'flex-end' }}>
          <button
            onClick={() => setView('explorer')}
            style={view === 'explorer'
              ? { ...appStyles.menuBtn, ...appStyles.menuBtnActive, minWidth: 120 }
              : { ...appStyles.menuBtn, ...appStyles.menuBtnInactive, minWidth: 120 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >Explorer</button>
          <button
            onClick={() => setView('analysis')}
            style={view === 'analysis'
              ? { ...appStyles.menuBtn, ...appStyles.menuBtnActive, minWidth: 120 }
              : { ...appStyles.menuBtn, ...appStyles.menuBtnInactive, minWidth: 120 }}
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
              ? { ...appStyles.menuBtn, ...appStyles.menuBtnActive, minWidth: 120 }
              : { ...appStyles.menuBtn, ...appStyles.menuBtnInactive, minWidth: 120 }}
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
              style={{ ...appStyles.logoutBtn, minWidth: 120, height: '64px', alignItems: 'center' }}
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
      {view === 'analysis' && (
        <div style={{...appStyles.submenu, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{ display: 'flex', gap: '0' }}>
            <button
              onClick={() => setActiveFeatures(prev => ({ ...prev, forecast: !prev.forecast }))}
              style={activeFeatures.forecast ? appStyles.featureBtnActive : appStyles.featureBtnInactive}
              onMouseEnter={(e) => {
                if (!activeFeatures.forecast) {
                  e.currentTarget.style.background = '#f0f2f7';
                }
              }}
              onMouseLeave={(e) => {
                if (!activeFeatures.forecast) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >Forecast</button>
            <button
              onClick={() => setActiveFeatures(prev => ({ ...prev, simulation: !prev.simulation }))}
              style={activeFeatures.simulation ? appStyles.featureBtnActive : appStyles.featureBtnInactive}
              onMouseEnter={(e) => {
                if (!activeFeatures.simulation) {
                  e.currentTarget.style.background = '#f0f2f7';
                }
              }}
              onMouseLeave={(e) => {
                if (!activeFeatures.simulation) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >Simulation</button>
            <button
              onClick={() => setActiveFeatures(prev => ({ ...prev, heatmap: !prev.heatmap }))}
              style={activeFeatures.heatmap ? appStyles.featureBtnActive : appStyles.featureBtnInactive}
              onMouseEnter={(e) => {
                if (!activeFeatures.heatmap) {
                  e.currentTarget.style.background = '#f0f2f7';
                }
              }}
              onMouseLeave={(e) => {
                if (!activeFeatures.heatmap) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >Heatmap</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="start-date" style={{ color: '#000', fontWeight: '500', whiteSpace: 'nowrap', fontSize: '12px' }}>From:</label>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <input
                  id="start-date"
                  type="text"
                  lang="en-GB"
                  value={selectedStartMonth === 'all' ? '' : selectedStartMonth + '-01'}
                  onChange={e => {
                    updateAnalysisMonthFromDate(e.target.value, setSelectedStartMonth);
                  }}
                  style={{
                    padding: '4px 6px',
                    borderRadius: '4px',
                    border: '1px solid #bdc3c7',
                    backgroundColor: '#fff',
                    color: '#000',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minWidth: '120px'
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    const dateInput = document.getElementById('start-date');
                    if (!dateInput) return;
                    if (dateInput && dateInput._flatpickr) {
                      dateInput._flatpickr.open();
                    } else if (typeof flatpickr === 'function') {
                      try {
                        const opts = {
                          altInput: true,
                          altFormat: 'd/m/Y',
                          dateFormat: 'Y-m-d',
                          allowInput: true,
                          altInputClass: 'analysis-flatpickr-input'
                        };
                        const fp = flatpickr(dateInput, { ...opts, defaultDate: dateInput.value || null });
                        fp.open();
                      } catch (e) {
                        if (dateInput && dateInput.showPicker) dateInput.showPicker();
                        else dateInput.click();
                      }
                    } else if (dateInput && dateInput.showPicker) {
                      dateInput.showPicker();
                    } else {
                      dateInput.click();
                    }
                  }}
                  style={{
                    position: 'absolute',
                    right: '4px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none'
                  }}
                  title="Open calendar"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="3" width="14" height="12" rx="1" stroke="#000" strokeWidth="1.5"/>
                    <line x1="1" y1="5" x2="15" y2="5" stroke="#000" strokeWidth="1.5"/>
                    <line x1="5" y1="1" x2="5" y2="4" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="11" y1="1" x2="11" y2="4" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
                {selectedStartMonth !== oldestMonth && selectedStartMonth !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedStartMonth(oldestMonth || 'all')}
                    style={{
                      position: 'absolute',
                      right: '4px',
                      top: '8px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#95a5a6',
                      padding: '0px 1px',
                      transition: 'color 0.2s ease',
                      outline: 'none',
                      lineHeight: '1',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#7f8c8d'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#95a5a6'}
                    onMouseDown={(e) => e.currentTarget.style.outline = 'none'}
                    title="Clear date"
                  >
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <line x1="1" y1="1" x2="13" y2="13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                      <line x1="13" y1="1" x2="1" y2="13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="end-date" style={{ color: '#000', fontWeight: '500', whiteSpace: 'nowrap', fontSize: '12px' }}>To:</label>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <input
                  id="end-date"
                  type="text"
                  lang="en-GB"
                  value={selectedEndMonth === 'all' ? '' : selectedEndMonth + '-01'}
                  onChange={e => {
                    updateAnalysisMonthFromDate(e.target.value, setSelectedEndMonth);
                  }}
                  style={{
                    padding: '4px 6px',
                    borderRadius: '4px',
                    border: '1px solid #bdc3c7',
                    backgroundColor: '#fff',
                    color: '#000',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minWidth: '120px'
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    const dateInput = document.getElementById('end-date');
                    if (!dateInput) return;
                    if (dateInput && dateInput._flatpickr) {
                      dateInput._flatpickr.open();
                    } else if (typeof flatpickr === 'function') {
                      try {
                        const opts = {
                          altInput: true,
                          altFormat: 'd/m/Y',
                          dateFormat: 'Y-m-d',
                          allowInput: true,
                          altInputClass: 'analysis-flatpickr-input'
                        };
                        const fp = flatpickr(dateInput, { ...opts, defaultDate: dateInput.value || null });
                        fp.open();
                      } catch (e) {
                        if (dateInput && dateInput.showPicker) dateInput.showPicker();
                        else dateInput.click();
                      }
                    } else if (dateInput && dateInput.showPicker) {
                      dateInput.showPicker();
                    } else {
                      dateInput.click();
                    }
                  }}
                  style={{
                    position: 'absolute',
                    right: '4px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none'
                  }}
                  title="Open calendar"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="3" width="14" height="12" rx="1" stroke="#000" strokeWidth="1.5"/>
                    <line x1="1" y1="5" x2="15" y2="5" stroke="#000" strokeWidth="1.5"/>
                    <line x1="5" y1="1" x2="5" y2="4" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="11" y1="1" x2="11" y2="4" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
                {selectedEndMonth !== newestMonth && selectedEndMonth !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedEndMonth(newestMonth || todayMonth)}
                    style={{
                      position: 'absolute',
                      right: '4px',
                      top: '8px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#95a5a6',
                      padding: '0px 1px',
                      transition: 'color 0.2s ease',
                      outline: 'none',
                      lineHeight: '1',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#7f8c8d'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#95a5a6'}
                    onMouseDown={(e) => e.currentTarget.style.outline = 'none'}
                    title="Clear date"
                  >
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <line x1="1" y1="1" x2="13" y2="13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                      <line x1="13" y1="1" x2="1" y2="13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <div style={appStyles.mainContent}>
        {view === 'explorer' && (
          <CategoryExplorer />
        )}

        {view === 'budget' && (
          <BudgetPage />
        )}

        {view === 'analysis' && (
          <Analysis activeFeatures={activeFeatures} setActiveFeatures={setActiveFeatures} selectedStartMonth={selectedStartMonth} selectedEndMonth={selectedEndMonth} fetchTransactions={fetchTransactions} handleBudgetsChanged={handleAnalysisBudgetsChanged} />
        )}
      </div>
    </div>
  );
}

// ...existing code...
export default App;