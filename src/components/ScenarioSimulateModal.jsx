import React, { useState, useRef, useEffect, useCallback } from 'react';

// Styles object (must be outside the component)

export function ScenarioSimulateModal({
  open,
  onClose,
  onSimulate,
  transactions = [],
  selectedBudgetIds = new Set(),
  allBudgets = [],
}) {
  const [mode, setMode] = useState('percent'); // 'percent' or 'amount'
  const [value, setValue] = useState('');
  const [simulateType, setSimulateType] = useState('expense'); // 'expense', 'income', or 'both'
  // Smart suggestion state
  const [suggested, setSuggested] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [hoveredSimulate, setHoveredSimulate] = useState(false);
  // Modal-level budget selection
  const [modalSelectedBudgetIds, setModalSelectedBudgetIds] = useState(new Set(selectedBudgetIds));
  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);
  // Accessibility: trap focus inside modal
  useEffect(() => {
    if (!open) return;
    const handleTab = (e) => {
      if (!modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [open, onClose]);

  // Handlers with useCallback
  // Toggle badge selection
  // No category toggle needed
  const handleModePercent = useCallback(() => setMode('percent'), []);
  const handleModeAmount = useCallback(() => setMode('amount'), []);
  const handleValueChange = useCallback((e) => setValue(e.target.value), []);
  const handleSimulateTypeChange = useCallback((type) => setSimulateType(type), []);
  
  // Budget selection handlers
  const toggleBudgetSelection = useCallback((budgetId) => {
    setModalSelectedBudgetIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(budgetId)) {
        newSet.delete(budgetId);
      } else {
        newSet.add(budgetId);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (modalSelectedBudgetIds.size === allBudgets.length) {
      // Deselect all
      setModalSelectedBudgetIds(new Set());
    } else {
      // Select all
      const allIds = new Set(allBudgets.map(b => b.budget_id));
      setModalSelectedBudgetIds(allIds);
    }
  }, [allBudgets, modalSelectedBudgetIds.size]);
  
  const handleSimulate = useCallback(() => {
    onSimulate({ mode, value: Number(value), simulateType, selectedBudgetIds: Array.from(modalSelectedBudgetIds) });
    onClose();
  }, [onSimulate, mode, value, simulateType, modalSelectedBudgetIds, onClose]);

  // Suggestion logic: analyze up to 12 months of historical data
  const handleSuggest = useCallback(() => {
    // If budgets are selected in modal, filter transactions to only those budgets
    let relevantTransactions = transactions;
    if (modalSelectedBudgetIds.size > 0) {
      const selectedCategoryIds = new Set();
      allBudgets
        .filter(b => modalSelectedBudgetIds.has(b.budget_id))
        .forEach(b => (b.category_ids || []).forEach(id => selectedCategoryIds.add(id)));
      relevantTransactions = transactions.filter(tx => selectedCategoryIds.has(tx.category_id));
    }
    
    if (!relevantTransactions || relevantTransactions.length === 0) return setSuggested('No data for selected budgets');
    
    const now = new Date();
    // Look back max 12 months for performance
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    
    // Analyze BOTH expense and income trends separately
    const expenseFiltered = relevantTransactions.filter(tx => {
      const d = new Date(tx.date);
      return d >= twelveMonthsAgo && tx.type === 'expense';
    });
    
    const incomeFiltered = relevantTransactions.filter(tx => {
      const d = new Date(tx.date);
      return d >= twelveMonthsAgo && tx.type === 'income';
    });
    
    // Group expenses by month
    const expenseMonthly = {};
    expenseFiltered.forEach(tx => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!expenseMonthly[key]) expenseMonthly[key] = 0;
      expenseMonthly[key] += parseFloat(tx.amount || 0);
    });
    const expenseVals = Object.values(expenseMonthly).sort((a, b) => a - b);
    
    // Group income by month
    const incomeMonthly = {};
    incomeFiltered.forEach(tx => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!incomeMonthly[key]) incomeMonthly[key] = 0;
      incomeMonthly[key] += parseFloat(tx.amount || 0);
    });
    const incomeVals = Object.values(incomeMonthly).sort((a, b) => a - b);
    
    // Calculate expense trend
    let expenseTrend = 0;
    if (expenseVals.length >= 2) {
      let changes = [];
      for (let i = 1; i < expenseVals.length; ++i) {
        const change = (expenseVals[i] - expenseVals[i - 1]) / expenseVals[i - 1];
        changes.push(Math.max(-0.5, Math.min(0.5, change)));
      }
      expenseTrend = changes.reduce((a, b) => a + b, 0) / changes.length;
    } else if (expenseVals.length === 1) {
      expenseTrend = -0.05; // Conservative -5% if only 1 month
    }
    
    // Calculate income trend
    let incomeTrend = 0;
    if (incomeVals.length >= 2) {
      let changes = [];
      for (let i = 1; i < incomeVals.length; ++i) {
        const change = (incomeVals[i] - incomeVals[i - 1]) / incomeVals[i - 1];
        changes.push(Math.max(-0.5, Math.min(0.5, change)));
      }
      incomeTrend = changes.reduce((a, b) => a + b, 0) / changes.length;
    } else if (incomeVals.length === 1) {
      incomeTrend = -0.05; // Conservative -5% if only 1 month
    }
    
    // Smart suggestion: Reduce expenses to stay within budget limits
    // Get the latest month's expenses and budget limit
    const expenseMonthKeys = Object.keys(expenseMonthly).sort();
    const latestMonthKey = expenseMonthKeys[expenseMonthKeys.length - 1];
    const currentMonthExpense = latestMonthKey ? expenseMonthly[latestMonthKey] : 0;
    
    // Get total budget limit for selected budgets
    let totalBudgetLimit = 0;
    if (modalSelectedBudgetIds.size > 0) {
      allBudgets
        .filter(b => modalSelectedBudgetIds.has(b.budget_id))
        .forEach(b => totalBudgetLimit += b.monthly_limit);
    } else {
      allBudgets.forEach(b => totalBudgetLimit += b.monthly_limit);
    }
    
    // Calculate suggestion based on budget vs current expenses
    let suggestedType = 'expense';
    let suggestedValue = 0;
    let suggestionMessage = '';
    
    if (totalBudgetLimit > 0 && currentMonthExpense > 0) {
      // If current expenses exceed 80% of budget, suggest reduction to get to 75% of budget
      const targetExpense = totalBudgetLimit * 0.75;
      const reductionPercentage = ((currentMonthExpense - targetExpense) / currentMonthExpense) * 100;
      
      if (reductionPercentage > 0) {
        // Expenses are above target - suggest reduction
        suggestedValue = Math.round(-reductionPercentage);
        suggestionMessage = `Reduce expenses by ${Math.abs(suggestedValue)}% to reach 75% of budget`;
      } else if (expenseTrend > 0.1) {
        // Expenses trending upward - suggest preventive reduction
        suggestedValue = Math.round(expenseTrend * -100);
        suggestionMessage = `Expenses trending upward. Reduce by ${Math.abs(suggestedValue)}% to stay within budget`;
      } else {
        suggestionMessage = 'Your expenses are within budget. Good control!';
        suggestedValue = 0;
      }
    } else if (expenseTrend > 0.1) {
      // No budget limit set, use trend-based suggestion
      suggestedValue = Math.round(expenseTrend * -50);
      suggestionMessage = `Expenses trending upward. Reduce by ${Math.abs(suggestedValue)}%`;
    } else {
      suggestionMessage = 'Expenses are stable. No reduction needed.';
      suggestedValue = 0;
    }
    
    setSuggested(suggestionMessage);
    setMode('percent');
    setValue(suggestedValue);
    setSimulateType(suggestedType);
  }, [transactions, modalSelectedBudgetIds, allBudgets]);

  if (!open) return null;

  return (
    <div style={styles.overlay} aria-modal="true" role="dialog">
      <div style={styles.modal} ref={modalRef}>
        <button
          ref={closeBtnRef}
          style={{ 
            ...styles.closeBtn, 
            backgroundColor: '#dc3545',
            color: '#fff',
            ...(hoveredBtn === 'close' && {
              backgroundColor: '#c0392b',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
            })
          }}
          onClick={onClose}
          onMouseEnter={() => setHoveredBtn('close')}
          onMouseLeave={() => setHoveredBtn(null)}
          aria-label="Close"
        >
          ×
        </button>
        <h3 style={styles.title}>Scenario Simulation</h3>
        <div style={styles.descriptionBox}>
          <span>
            Simulate budget scenarios: Select specific budgets, adjust income or expenses by percentage or fixed amount to see real-time impact on your remaining balance.
          </span>
        </div>
        
        {/* Budget Selection */}
        <div style={styles.formRow}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={styles.label}>Select Budgets</label>
            <button
              type="button"
              onClick={toggleSelectAll}
              style={{
                background: 'none',
                border: 'none',
                color: '#2176ae',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
                padding: '4px 8px',
                textDecoration: 'underline'
              }}
              title={modalSelectedBudgetIds.size === allBudgets.length ? 'Deselect all' : 'Select all'}
            >
              {modalSelectedBudgetIds.size === allBudgets.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div style={styles.badgeContainer}>
            {allBudgets.length === 0 ? (
              <div style={{ fontSize: 13, color: '#7f8c8d' }}>No budgets available</div>
            ) : (
              allBudgets.map(budget => (
                <button
                  key={budget.budget_id}
                  type="button"
                  onClick={() => toggleBudgetSelection(budget.budget_id)}
                  style={{
                    ...styles.badge,
                    background: modalSelectedBudgetIds.has(budget.budget_id) ? '#2176ae' : '#f0f4f8',
                    color: modalSelectedBudgetIds.has(budget.budget_id) ? '#fff' : '#333',
                    borderColor: modalSelectedBudgetIds.has(budget.budget_id) ? '#2176ae' : '#d3d6de',
                  }}
                  title={`Click to ${modalSelectedBudgetIds.has(budget.budget_id) ? 'deselect' : 'select'} ${budget.budget_name}`}
                >
                  {budget.budget_name}
                </button>
              ))
            )}
          </div>
        </div>
        
        <div style={styles.formRow}>
          <label style={styles.label}>Simulate</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{ ...styles.toggleBtn, background: simulateType === 'expense' ? '#2176ae' : '#e3e7ed', color: simulateType === 'expense' ? '#fff' : '#333', flex: 1 }}
              onClick={() => handleSimulateTypeChange('expense')}
              type="button"
              title="Simulate expense changes"
            >
              Expenses
            </button>
            <button
              style={{ ...styles.toggleBtn, background: simulateType === 'income' ? '#2176ae' : '#e3e7ed', color: simulateType === 'income' ? '#fff' : '#333', flex: 1 }}
              onClick={() => handleSimulateTypeChange('income')}
              type="button"
              title="Simulate income changes"
            >
              Income
            </button>
            <button
              style={{ ...styles.toggleBtn, background: simulateType === 'both' ? '#2176ae' : '#e3e7ed', color: simulateType === 'both' ? '#fff' : '#333', flex: 1 }}
              onClick={() => handleSimulateTypeChange('both')}
              type="button"
              title="Simulate both income and expenses"
            >
              Both
            </button>
          </div>
        </div>

        <div style={styles.formRow}>
          <label htmlFor="scenario-value-input" style={styles.label}>Change by</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{ ...styles.toggleBtn, background: mode === 'percent' ? '#2176ae' : '#e3e7ed', color: mode === 'percent' ? '#fff' : '#333' }}
              onClick={handleModePercent}
              type="button"
            >
              %
            </button>
            <button
              style={{ ...styles.toggleBtn, background: mode === 'amount' ? '#2176ae' : '#e3e7ed', color: mode === 'amount' ? '#fff' : '#333' }}
              onClick={handleModeAmount}
              type="button"
            >
              Amount
            </button>
            <input
              id="scenario-value-input"
              name="scenario-value-input"
              style={{ ...styles.input, width: 100, marginLeft: 8 }}
              type="number"
              placeholder={mode === 'percent' ? 'e.g. -20' : 'e.g. 100'}
              value={value}
              onChange={handleValueChange}
            />
          </div>
        </div>
        <button
          style={{
            ...styles.simulateBtn,
            opacity: !value ? 0.6 : 1,
            pointerEvents: 'auto',
            ...(hoveredSimulate && value && {
              background: 'linear-gradient(90deg, #1a5a8a 0%, #5ac5dd 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(33,118,174,0.2)'
            })
          }}
          onClick={handleSimulate}
          disabled={!value}
          type="button"
          onMouseEnter={() => value && setHoveredSimulate(true)}
          onMouseLeave={() => setHoveredSimulate(false)}
        >
          Simulate
        </button>
        <button
          style={{ ...styles.simulateBtn, marginTop: 8, background: '#e3e7ed', color: '#2176ae', fontWeight: 600, fontSize: 15, border: '1px solid #2176ae' }}
          type="button"
          onClick={handleSuggest}
          title={selectedBudgetIds.size > 0 ? "Analyze selected budgets' 12-month trend to suggest realistic adjustments" : "Analyze all transactions' 12-month trend to suggest realistic adjustments"}
        >
          Suggest
        </button>
        <div style={{ fontSize: 12, color: '#666', marginTop: 6, lineHeight: 1.4 }}>
          💡 <strong>Smart Suggest:</strong> Analyzes {modalSelectedBudgetIds.size > 0 ? 'your selected budgets' : 'all'} 12-month trend and suggests budget adjustments based on your actual spending patterns.
        </div>
        {suggested && <div style={{ color: '#2176ae', marginTop: 8, fontSize: 13, fontWeight: 500 }}>Suggested: {suggested}</div>}
      </div>
    </div>
  );
}

// Styles object
const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.25)',
    zIndex: 1001,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    background: '#fff',
    borderRadius: 12,
    padding: '24px 18px 18px 18px',
    minWidth: 300,
    maxWidth: 360,
    boxShadow: '0 8px 32px rgba(30,34,47,0.18)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    border: 'none',
    borderRadius: 6,
    background: '#dc3545',
    color: '#fff',
    fontSize: 18,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    placeItems: 'center',
    justifyContent: 'center',
    padding: 0,
    lineHeight: 'normal',
    transition: 'all 0.2s ease',
    outline: 'none',
    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.1)',
    transformOrigin: 'center',
    fontVariantNumeric: 'tabular-nums'
  },
  title: {
    margin: '0 0 14px 0',
    fontSize: 18,
    fontWeight: 700,
    color: '#23273a',
    textAlign: 'center',
  },
  formRow: {
    marginBottom: 14,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  label: {
    fontWeight: 600,
    fontSize: 13,
    marginBottom: 5,
    color: '#23273a',
  },
  input: {
    border: '1px solid #d3d6de',
    borderRadius: 6,
    padding: '7px 9px',
    fontSize: 14,
    outline: 'none',
    marginBottom: 0,
    background: '#f8f9fa',
    color: '#23273a',
  },
  toggleBtn: {
    border: 'none',
    borderRadius: 6,
    padding: '7px 14px',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'background 0.18s',
  },
  badgeContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: 6,
    maxHeight: 75,
    overflowY: 'auto',
    paddingBottom: 3,
  },
  badge: {
    display: 'inline-block',
    padding: '6px 13px',
    borderRadius: 999,
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    userSelect: 'none',
    border: '2px solid #e3e7ed',
    transition: 'background 0.18s, color 0.18s, border 0.18s',
    marginBottom: 2,
    whiteSpace: 'nowrap',
  },
  simulateBtn: {
    marginTop: 14,
    background: 'linear-gradient(90deg, #2176ae 0%, #6dd5ed 100%)',
    color: '#232323',
    border: 'none',
    borderRadius: 12,
    padding: '11px',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    width: '100%',
    boxShadow: '0 4px 16px rgba(33,118,174,0.10)',
    outline: 'none',
    opacity: 1,
    letterSpacing: '0.5px',
    transformOrigin: 'center',
  },
  descriptionBox: {
    background: '#f8f9fa',
    color: '#23273a',
    borderRadius: 6,
    padding: '9px',
    marginBottom: 14,
    fontSize: 12,
    lineHeight: 1.4,
    border: '1px solid #e3e7ed',
  },
};
