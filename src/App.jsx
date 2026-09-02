import 'flatpickr/dist/flatpickr.min.css';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTransactions } from './hooks/usetransactions';
import { useBudgets } from './hooks/usebudgets';
import { useCategories } from './hooks/usecategories';
import { useAutomations } from './hooks/useAutomations';
import { buildAdviceNotifications } from './utils/adviceEngine';
import Login from './login';
import UpdatePassword from './updatepassword';
import { CategoryExplorer } from './components/categoryexplorer';
import BudgetPage from './components/budget';
import Analysis from './components/analysis';
import { appStyles } from './styles/appStyles';
import { supabase } from './lib/supabase';

function App() {
  const [session, setSession] = useState(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [view, setView] = useState('explorer'); // 'explorer' | 'budget' | 'analysis'
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState([]);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [activeFeatures, setActiveFeatures] = useState({ forecast: false, simulation: false, heatmap: false }); // toggle states
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const [mobileMainMenuOpen, setMobileMainMenuOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [mobileAnalysisBudgetOpen, setMobileAnalysisBudgetOpen] = useState(false);
  const [mobileOpenCategoryManager, setMobileOpenCategoryManager] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hoveredMobileMenuItem, setHoveredMobileMenuItem] = useState(null);

  const isMobile = viewportWidth <= 768;

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile && view !== 'explorer') {
      setMobileCategoryOpen(false);
    }
  }, [isMobile, view]);

  useEffect(() => {
    if (isMobile && view !== 'analysis') {
      setMobileAnalysisBudgetOpen(false);
    }
  }, [isMobile, view]);

  const handleMobileNavSelect = (newView) => {
    setView(newView);
    setMobileMainMenuOpen(false);
    setMobileCategoryOpen(false);
  };

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

  // Fetch transactions and categories used by the advice engine.
  const { transactions, fetchTransactions, categoryStats } = useTransactions();
  const { categories } = useCategories();

  useEffect(() => {
    if (!selectedCategory && categories.length > 0) {
      setSelectedCategory(categories[0].category_id);
    }
  }, [categories, selectedCategory]);

  // Get all budgets before building notification advice.
  const { budgets } = useBudgets();

  // Build advice-based notifications from budgets, transactions, and categories.
  const derivedNotifications = useMemo(() => {
    return buildAdviceNotifications(budgets, transactions, categories);
  }, [budgets, transactions, categories]);

  const activeNotifications = useMemo(() => {
    return derivedNotifications.filter((item) => !dismissedNotificationIds.includes(item.id));
  }, [derivedNotifications, dismissedNotificationIds]);

  const unreadCount = useMemo(() => {
    return activeNotifications.filter((item) => !readNotificationIds.includes(item.id)).length;
  }, [activeNotifications, readNotificationIds]);

  const formatCurrencyValue = useCallback((value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  }, []);

  const getMobileMenuButtonStyle = useCallback((key, isActive) => {
    const baseStyle = {
      ...appStyles.mobileMenuItem,
      width: '100%',
      margin: 0,
      borderRadius: '0',
      padding: '22px 22px 18px 22px',
      border: 'none',
      backgroundColor: 'rgba(255,255,255,0.08)',
      boxShadow: 'none',
      textAlign: 'left',
      transition: 'background-color 160ms ease, color 160ms ease',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      lineHeight: 1.2,
      fontSize: '20px',
      cursor: 'pointer',
      color: '#f8fafc',
    };

    if (isActive) {
      return { ...baseStyle, backgroundColor: 'rgba(255,255,255,0.12)' };
    }

    if (hoveredMobileMenuItem === key) {
      return { ...baseStyle, backgroundColor: 'rgba(255,255,255,0.18)' };
    }

    return baseStyle;
  }, [hoveredMobileMenuItem]);

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
            )
          }
  if (!session) {
    return (
      <Login onAuthSuccess={() => {}} />
    );
  }

  const handleNotificationToggle = () => {
    setNotificationOpen((open) => {
      const nextOpen = !open;
      if (nextOpen) {
        // Mark all active notifications as read when the list is opened.
        setReadNotificationIds(activeNotifications.map((item) => item.id));
      }
      return nextOpen;
    });
  };

  const dismissNotification = (id) => {
    setDismissedNotificationIds((prev) => [...prev, id]);
  };

  return (
    <div style={appStyles.appContainer}>
      <div style={isMobile ? { ...appStyles.navbar, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 } : appStyles.navbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isMobile && view === 'explorer' && (
            <button
              type="button"
              onClick={() => setMobileCategoryOpen(true)}
              style={{
                ...appStyles.mobileEdgeRailButton,
                left: 0,
                right: 'auto',
                borderRight: '1px solid rgba(255,255,255,0.08)',
                borderLeft: 'none',
                borderRadius: 0,
              }}
              aria-label="Open categories"
            >
              <span style={appStyles.mobileEdgeRailHandle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateX(-1px)' }}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </span>
            </button>
          )}
          {isMobile && view === 'analysis' && (
            <button
              type="button"
              onClick={() => setMobileAnalysisBudgetOpen(true)}
              style={{
                ...appStyles.mobileEdgeRailButton,
                left: 0,
                right: 'auto',
                borderRight: '1px solid rgba(255,255,255,0.08)',
                borderLeft: 'none',
                borderRadius: 0,
              }}
              aria-label="Open budgets"
            >
              <span style={appStyles.mobileEdgeRailHandle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateX(-1px)' }}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </span>
            </button>
          )}
          <h1 style={{ ...appStyles.logo, fontSize: isMobile ? '16px' : '18px', lineHeight: isMobile ? '1.2' : '64px' }}>Finance Tracker</h1>
          {session && !isMobile && (
            <span style={appStyles.welcomeText}>
              Welcome, {session.user.user_metadata?.display_name || 'User'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : 0, marginLeft: 'auto', justifyContent: 'flex-end', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={appStyles.notificationContainer}>
              <button
                type="button"
                onClick={handleNotificationToggle}
                style={notificationOpen ? { ...appStyles.notificationBtn, ...appStyles.notificationBtnActive } : appStyles.notificationBtn}
                aria-label="Notification center"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={notificationOpen ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ display: 'block' }}
                >
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {activeNotifications.length > 0 && (
                  <span style={appStyles.notificationCount}>{activeNotifications.length}</span>
                )}
                {unreadCount > 0 && <span style={appStyles.notificationDot} />}
              </button>

              {notificationOpen && (
                <div style={appStyles.notificationPanel}>
                  <div style={appStyles.notificationHeader}>Notifications</div>
                  {activeNotifications.length === 0 ? (
                    <div style={appStyles.notificationEmpty}>No notifications yet</div>
                  ) : (
                    activeNotifications.map((item, index) => {
                      const isAlternate = index % 2 === 1;
                      const isUnread = !readNotificationIds.includes(item.id);
                      const itemStyle = isUnread
                        ? isAlternate ? appStyles.notificationItemNewAlternate : appStyles.notificationItemNew
                        : isAlternate ? appStyles.notificationItemAlternate : appStyles.notificationItem;
                      return (
                        <div key={item.id} style={itemStyle}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                            <div style={appStyles.notificationText}>{item.text}</div>
                            <button
                              type="button"
                              onClick={() => dismissNotification(item.id)}
                              style={appStyles.notificationDismissBtn}
                              aria-label="Dismiss notification"
                            >
                              ×
                            </button>
                          </div>
                          <div style={appStyles.notificationMeta}>{item.context}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            {isMobile && (
              <button
                type="button"
                onClick={() => setMobileMainMenuOpen(true)}
                style={{
                  ...appStyles.mobileEdgeRailButton,
                  right: 0,
                  left: 'auto',
                  borderLeft: '1px solid rgba(255,255,255,0.08)',
                  borderRight: 'none',
                  borderRadius: 0,
                }}
                aria-label="Open main menu"
              >
                <span style={appStyles.mobileEdgeRailHandle}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateX(1px)' }}>
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </span>
              </button>
            )}
            {!isMobile && (
              <div style={{ display: 'flex', gap: 0 }}>
                <button
                  onClick={() => handleMobileNavSelect('explorer')}
                  style={view === 'explorer'
                    ? { ...appStyles.menuBtn, ...appStyles.menuBtnActive, ...appStyles.menuBtnOverlap, minWidth: 120 }
                    : { ...appStyles.menuBtn, ...appStyles.menuBtnInactive, ...appStyles.menuBtnOverlap, minWidth: 120 }}
                >Explorer</button>
                <button
                  onClick={() => handleMobileNavSelect('analysis')}
                  style={view === 'analysis'
                    ? { ...appStyles.menuBtn, ...appStyles.menuBtnActive, ...appStyles.menuBtnOverlap, minWidth: 120 }
                    : { ...appStyles.menuBtn, ...appStyles.menuBtnInactive, ...appStyles.menuBtnOverlap, minWidth: 120 }}
                >Analysis</button>
                <button
                  onClick={() => handleMobileNavSelect('budget')}
                  style={view === 'budget'
                    ? { ...appStyles.menuBtn, ...appStyles.menuBtnActive, ...appStyles.menuBtnOverlap, minWidth: 120 }
                    : { ...appStyles.menuBtn, ...appStyles.menuBtnInactive, ...appStyles.menuBtnOverlap, minWidth: 120 }}
                >Budget</button>
                {session && (
                  <button
                    onClick={() => supabase.auth.signOut()}
                    style={{ ...appStyles.logoutBtn, ...appStyles.menuBtnOverlap, minWidth: 120, height: '64px', alignItems: 'center' }}
                  >
                    Logout
                  </button>
                )}
                </div>
            )
          }
          </div>
        </div>
      </div>
      {isMobile && mobileCategoryOpen && view === 'explorer' && (
        <>
          <div style={appStyles.mobileDrawerBackdrop} onClick={() => setMobileCategoryOpen(false)} />
          <div style={{
            ...appStyles.mobileCategoryDrawer,
            ...appStyles.mobileDrawerOpen,
            opacity: view === 'budget' && isMobile ? 0.55 : 1,
            filter: view === 'budget' && isMobile ? 'grayscale(0.2)' : 'none',
          }}>
            <div style={{ padding: '8px 12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ padding: '6px 0 10px', color: '#8a93a8', fontSize: '10px', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                Category List:
              </div>
            </div>
            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
              {categories.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#bdc3c7' }}>
                  <p>No categories yet.</p>
                  <p style={{ fontSize: '13px', marginTop: '8px' }}>Click "+ New Category" to get started!</p>
                </div>
              ) : (
                categories.map(category => {
                  const stats = categoryStats[category.category_id] || { income: 0, expense: 0 };
                  const isActive = selectedCategory === category.category_id;
                  const categoryColor = category.color_code || '#3498db';

                  return (
                    <div
                      key={category.category_id}
                      onClick={() => {
                        setSelectedCategory(category.category_id);
                        setView('explorer');
                        setMobileCategoryOpen(false);
                      }}
                      style={{
                        padding: '12px',
                        borderRadius: '0',
                        borderLeft: `4px solid ${categoryColor}`,
                        borderRight: isActive ? `1px solid ${categoryColor}` : '1px solid rgba(255,255,255,0.08)',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                        color: '#f8fafc',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '0', background: categoryColor, display: 'inline-block' }} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: '#f8fafc' }}>{category.category_name}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Income & expense</div>
                          </div>
                        </div>
                        {isActive && <span style={{ padding: '4px 8px', background: 'rgba(125, 211, 252, 0.16)', color: '#7dd3fc', fontSize: '11px', fontWeight: 700 }}>Selected</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '12px' }}>
                        <span style={{ padding: '4px 8px', background: 'rgba(34,197,94,0.16)', color: '#4ade80', fontWeight: 700 }}>↑ {formatCurrencyValue(stats.income)}</span>
                        <span style={{ padding: '4px 8px', background: 'rgba(248,113,113,0.16)', color: '#fda4af', fontWeight: 700 }}>↓ {formatCurrencyValue(stats.expense)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                type="button"
                onClick={() => {
                  setMobileOpenCategoryManager(true);
                  setMobileCategoryOpen(false);
                  setView('explorer');
                }}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #5468ff 0%, #3f5dff 100%)',
                  color: '#e7eaf1',
                  border: '1px solid rgba(255,255,255,0.12)',
                  padding: '10px 12px',
                  borderRadius: '0',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  boxShadow: 'none',
                }}
              >
                + New Category
              </button>
            </div>
          </div>
        </>
      )}
      {isMobile && mobileMainMenuOpen && (
        <>
          <div style={{ ...appStyles.mobileDrawerBackdrop, zIndex: 103 }} onClick={() => setMobileMainMenuOpen(false)} />
          <div style={{ ...appStyles.mobileDrawer, ...appStyles.mobileDrawerOpen, zIndex: 104 }}>
            <div style={{ padding: '8px 12px 0', marginBottom: '12px' }}>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', paddingBottom: '12px', color: '#8a93a8', fontSize: '10px', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                Menu
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: '4px', width: '100%', boxSizing: 'border-box' }}>
              <button
                type="button"
                onClick={() => handleMobileNavSelect('explorer')}
                style={getMobileMenuButtonStyle('explorer', view === 'explorer')}
                onMouseEnter={() => setHoveredMobileMenuItem('explorer')}
                onMouseLeave={() => setHoveredMobileMenuItem(null)}
              >
                Explorer
              </button>
              <button
                type="button"
                onClick={() => handleMobileNavSelect('analysis')}
                style={getMobileMenuButtonStyle('analysis', view === 'analysis')}
                onMouseEnter={() => setHoveredMobileMenuItem('analysis')}
                onMouseLeave={() => setHoveredMobileMenuItem(null)}
              >
                Analysis
              </button>
              <button
                type="button"
                onClick={() => handleMobileNavSelect('budget')}
                style={getMobileMenuButtonStyle('budget', view === 'budget')}
                onMouseEnter={() => setHoveredMobileMenuItem('budget')}
                onMouseLeave={() => setHoveredMobileMenuItem(null)}
              >
                Budget
              </button>
              {session && (
                <button
                  type="button"
                  onClick={() => { setMobileMainMenuOpen(false); supabase.auth.signOut(); }}
                  style={{
                    ...getMobileMenuButtonStyle('logout', false),
                    background: 'linear-gradient(135deg, #ff3b30 0%, #d11b1b 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    boxShadow: 'none',
                    borderRadius: '0',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </>
      )}
      {view === 'analysis' && (
        <div style={{...appStyles.submenu, display: 'flex', flexDirection: 'column', gap: '0px', height: 'auto', alignItems: 'stretch', position: 'relative', zIndex: 101, ...(isMobile && { marginTop: '64px' })}}>
          <div style={{ display: 'flex', gap: '0', flexWrap: 'wrap' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', marginBottom: '0px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap', paddingLeft: '20px', paddingTop: '0px', paddingBottom: '0px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '170px' }}>
                <label htmlFor="start-date" style={{ color: '#000', fontWeight: '500', whiteSpace: 'nowrap', fontSize: '12px' }}>From:</label>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flex: 1, minWidth: '120px' }}>
                  <input
                    id="start-date"
                    type="text"
                    lang="en-GB"
                    value={selectedStartMonth === 'all' ? '' : selectedStartMonth + '-01'}
                    onChange={e => {
                      updateAnalysisMonthFromDate(e.target.value, setSelectedStartMonth);
                    }}
                    style={{
                      padding: '4px 26px 4px 30px',
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
                      left: '4px',
                      right: 'auto',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '170px' }}>
                <label htmlFor="end-date" style={{ color: '#000', fontWeight: '500', whiteSpace: 'nowrap', fontSize: '12px' }}>To:</label>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flex: 1, minWidth: '120px' }}>
                  <input
                    id="end-date"
                    type="text"
                    lang="en-GB"
                    value={selectedEndMonth === 'all' ? '' : selectedEndMonth + '-01'}
                    onChange={e => {
                      updateAnalysisMonthFromDate(e.target.value, setSelectedEndMonth);
                    }}
                    style={{
                      padding: '4px 26px 4px 30px',
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
                      left: '4px',
                      right: 'auto',
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
        </div>
      )}
      <div style={isMobile ? { ...appStyles.mainContent, marginTop: view === 'analysis' ? '8px' : '64px' } : appStyles.mainContent}>
        {view === 'explorer' && (
          <CategoryExplorer
            selectedCategoryId={selectedCategory}
            onCategorySelect={setSelectedCategory}
            isMobile={isMobile}
            openCategoryManager={mobileOpenCategoryManager}
            onCategoryManagerHandled={() => setMobileOpenCategoryManager(false)}
          />
        )}

        {view === 'budget' && (
          <BudgetPage />
        )}

        {view === 'analysis' && (
          <Analysis
            activeFeatures={activeFeatures}
            setActiveFeatures={setActiveFeatures}
            selectedStartMonth={selectedStartMonth}
            selectedEndMonth={selectedEndMonth}
            fetchTransactions={fetchTransactions}
            handleBudgetsChanged={handleAnalysisBudgetsChanged}
            isMobile={isMobile}
            mobileBudgetSidebarOpen={mobileAnalysisBudgetOpen}
            onMobileBudgetSidebarToggle={setMobileAnalysisBudgetOpen}
          />
        )}
      </div>
    </div>
  );
}

// ...existing code...
export default App;