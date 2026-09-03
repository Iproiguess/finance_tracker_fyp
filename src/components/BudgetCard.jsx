import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { styles } from './styles/budgetStyles';
import { formatCurrency } from '../config/constants';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { 
  getProgressColor, 
  getProgressPercentage,
  getEffectiveBudget,
  getBudgetPeriodDisplay
} from './utils/budgetUtils';

export default function BudgetCard({
  budget,
  categories,
  transactions,
  budgets,
  onEdit,
  onDelete
}) {
  const [selectedBadges, setSelectedBadges] = useState({});
  const [viewAll, setViewAll] = useState(false);

  const getLocalDateString = useCallback((date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const normalizeBudgetDate = useCallback((dateValue) => {
    if (!dateValue) return '';

    const value = String(dateValue).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return getLocalDateString(parsed);
    }

    return value;
  }, [getLocalDateString]);

  const [fromDate, setFromDate] = useState(() => {
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return getLocalDateString(firstDayOfMonth);
  });
  const [toDate, setToDate] = useState(() => getLocalDateString(new Date()));

  const fromPickerId = `from-date-picker-${budget.budget_id}`;
  const toPickerId = `to-date-picker-${budget.budget_id}`;

  const fromFpRef = useRef(null);
  const toFpRef = useRef(null);

  // Initialize Flatpickr once per budget card so the visible date box matches the analysis UI.
  useEffect(() => {
    try {
      const fromEl = document.getElementById(fromPickerId);
      const toEl = document.getElementById(toPickerId);
      const baseOpts = {
        altInput: true,
        altFormat: 'd/m/Y',
        dateFormat: 'Y-m-d',
        allowInput: true,
        altInputClass: 'budget-flatpickr-input'
      };

      // Apply inline styles to alt inputs
      const styleAltInput = (fp) => {
        if (!fp || !fp.altInput) return;
        fp.altInput.classList.add('budget-flatpickr-input');
        fp.altInput.style.display = 'block';
        fp.altInput.style.visibility = 'visible';
        fp.altInput.style.opacity = '1';
        fp.altInput.style.width = '100%';
        fp.altInput.style.minWidth = '80px';
        fp.altInput.style.padding = '5px 12px 5px 8px';
        fp.altInput.style.border = '1px solid #ccc';
        fp.altInput.style.borderRadius = '4px';
        fp.altInput.style.backgroundColor = '#fff';
        fp.altInput.style.color = '#000';
        fp.altInput.style.fontSize = '12px';
        fp.altInput.style.fontWeight = '500';
        fp.altInput.style.boxSizing = 'border-box';
        fp.altInput.style.pointerEvents = 'auto';
      };

      if (fromEl) {
        fromFpRef.current = flatpickr(fromEl, {
          ...baseOpts,
          defaultDate: fromDate || null,
          onChange: (_selectedDates, dateStr) => {
            setFromDate(normalizeBudgetDate(dateStr));
            if (viewAll) setViewAll(false);
          }
        });
        styleAltInput(fromFpRef.current);
      }

      if (toEl) {
        toFpRef.current = flatpickr(toEl, {
          ...baseOpts,
          defaultDate: toDate || null,
          onChange: (_selectedDates, dateStr) => {
            setToDate(normalizeBudgetDate(dateStr));
            if (viewAll) setViewAll(false);
          }
        });
        styleAltInput(toFpRef.current);
      }

      return () => {
        if (fromFpRef.current) fromFpRef.current.destroy();
        if (toFpRef.current) toFpRef.current.destroy();
      };
    } catch {
      console.warn('flatpickr init failed');
    }
  }, [fromPickerId, toPickerId, fromDate, toDate, normalizeBudgetDate, viewAll]);

  // sync values when state changes
  useEffect(() => {
    if (fromFpRef.current) {
      try { fromFpRef.current.setDate(fromDate, false); } catch { /* flatpickr may be unavailable during unmount */ }
    }
  }, [fromDate]);

  useEffect(() => {
    if (toFpRef.current) {
      try { toFpRef.current.setDate(toDate, false); } catch { /* flatpickr may be unavailable during unmount */ }
    }
  }, [toDate]);

  const categoryIds = useMemo(() => budget.category_ids || [], [budget.category_ids]);
  
  const selectedCategories = useMemo(() => {
    return categoryIds
      .map(id => categories.find(cat => cat.category_id === id))
      .filter(Boolean);
  }, [categoryIds, categories]);

  const selectedCategoryIds = useMemo(() => {
    const selected = selectedCategories
      .filter(c => selectedBadges[`${budget.budget_id}-${c.category_id}`])
      .map(c => c.category_id);

    return selected.length > 0 ? selected : categoryIds;
  }, [selectedBadges, selectedCategories, categoryIds, budget.budget_id]);

  const currentSpending = useMemo(() => {
    if (viewAll) {
      return selectedCategoryIds.reduce((sum, categoryId) => {
        const categoryExpenses = transactions.filter(txn => {
          return txn.category_id === categoryId && txn.type === 'expense';
        });
        return sum + categoryExpenses.reduce((catSum, txn) => catSum + parseFloat(txn.amount), 0);
      }, 0);
    } else {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      
      return selectedCategoryIds.reduce((sum, categoryId) => {
        const categoryExpenses = transactions.filter(txn => {
          const txnDate = new Date(txn.date);
          return txn.category_id === categoryId && 
                 txn.type === 'expense' &&
                 txnDate >= from &&
                 txnDate <= to;
        });
        return sum + categoryExpenses.reduce((catSum, txn) => catSum + parseFloat(txn.amount), 0);
      }, 0);
    }
  }, [selectedCategoryIds, viewAll, fromDate, toDate, transactions]);

  const effectiveBudget = useMemo(() => {
    return getEffectiveBudget(budget, budgets, transactions);
  }, [budget, budgets, transactions]);

  if (selectedCategories.length === 0) return null;

  const remaining = effectiveBudget - currentSpending;
  const isOverBudget = remaining < 0;
  const progressColor = getProgressColor(currentSpending, effectiveBudget);
  const progressPercentage = getProgressPercentage(currentSpending, effectiveBudget);

  return (
    <div 
      className="budget-card"
      style={styles.budgetCard}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f8f9fa';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.2)';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = '#3498db';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = styles.budgetCard.backgroundColor;
        e.currentTarget.style.boxShadow = styles.budgetCard.boxShadow;
        e.currentTarget.style.transform = styles.budgetCard.transform;
        e.currentTarget.style.borderColor = styles.budgetCard.border.split(' ')[2];
      }}
    >
      <div style={styles.budgetHeader}>
        <h3 style={styles.categoryName}>
          {budget.budget_name}
        </h3>
        <div style={styles.actions}>
          <button
            onClick={() => onEdit(budget)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2176ae',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              marginRight: 8,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(33, 118, 174, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1a5a8a';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(33, 118, 174, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2176ae';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(33, 118, 174, 0.2)';
            }}
            title="Edit this budget"
          >
            Edit
          </button>
          <button onClick={() => onDelete(budget)} 
            style={styles.deleteButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = styles.deleteButton.backgroundColor;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <div style={styles.budgetDetails}>
        <p style={styles.period}>Date created: {getBudgetPeriodDisplay(budget)}</p>
        
        <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#f5f8fa', borderRadius: '6px' }}>
          <p style={{ margin: '0 0 8px 0', color: '#000', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' }}>
            View Expenses By Date Range
          </p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', overflow: 'visible' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'visible' }}>
              <label style={{ color: '#000', fontWeight: '500', whiteSpace: 'nowrap', fontSize: '12px' }}>From:</label>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative', overflow: 'visible' }}>
                <input
                  id={fromPickerId}
                  type="text"
                  lang="en-GB"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(normalizeBudgetDate(e.target.value));
                    if (viewAll) setViewAll(false);
                  }}
                  className="budget-flatpickr-input"
                  style={{
                    display: 'none',
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
                    const dateInput = document.getElementById(fromPickerId);
                    if (!dateInput) return;
                    if (dateInput._flatpickr) {
                      dateInput._flatpickr.open();
                    } else if (typeof flatpickr === 'function') {
                      try {
                        const opts = {
                          altInput: true,
                          altFormat: 'd/m/Y',
                          dateFormat: 'Y-m-d',
                          allowInput: true,
                          altInputClass: 'budget-flatpickr-input'
                        };
                        const fp = flatpickr(dateInput, { ...opts, defaultDate: dateInput.value || null });
                        fp.open();
                      } catch {
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
                    left: '6px',
                    right: 'auto',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none',
                    zIndex: 2
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
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'visible' }}>
              <label style={{ color: '#000', fontWeight: '500', whiteSpace: 'nowrap', fontSize: '12px' }}>To:</label>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative', overflow: 'visible' }}>
                <input
                  id={toPickerId}
                  type="text"
                  lang="en-GB"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(normalizeBudgetDate(e.target.value));
                    if (viewAll) setViewAll(false);
                  }}
                  className="budget-flatpickr-input"
                  style={{
                    display: 'none',
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
                    const dateInput = document.getElementById(toPickerId);
                    if (!dateInput) return;
                    if (dateInput._flatpickr) {
                      dateInput._flatpickr.open();
                    } else if (typeof flatpickr === 'function') {
                      try {
                        const opts = {
                          altInput: true,
                          altFormat: 'd/m/Y',
                          dateFormat: 'Y-m-d',
                          allowInput: true,
                          altInputClass: 'budget-flatpickr-input'
                        };
                        const fp = flatpickr(dateInput, { ...opts, defaultDate: dateInput.value || null });
                        fp.open();
                      } catch {
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
                    left: '6px',
                    right: 'auto',
                    top: '50%',
                    transform: 'translateY(-50%)',
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
              </div>
            </div>
            <button
              onClick={() => setViewAll(!viewAll)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                backgroundColor: viewAll ? '#28a745' : '#e3e7ed',
                color: viewAll ? '#fff' : '#000',
                border: '1px solid ' + (viewAll ? '#20c997' : '#d3d6de'),
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = viewAll ? '#20c997' : '#d3d6de';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = viewAll ? '#28a745' : '#e3e7ed';
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
            >
              {viewAll ? '✓ View All' : 'View All'}
            </button>
          </div>
        </div>
        
        <div style={styles.categoriesSection}>
          <p style={{ margin: '0 0 8px 0', color: '#000', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' }}>
            Categories
          </p>
          <div style={styles.categoryBadges}>
            {selectedCategories.map(c => {
              const badgeKey = `${budget.budget_id}-${c.category_id}`;
              const isSelected = selectedBadges[badgeKey];
              return (
                <button
                  key={c.category_id}
                  onClick={() => setSelectedBadges({
                    ...selectedBadges,
                    [badgeKey]: !isSelected
                  })}
                  style={{
                    ...styles.categoryBadge,
                    backgroundColor: isSelected ? c.color_code : c.color_code + '30',
                    borderColor: c.color_code,
                    color: isSelected ? '#fff' : '#333',
                    fontWeight: '500'
                  }}
                >
                  {c.category_name}
                </button>
              );
            })}
          </div>
        </div>

        <div style={styles.amounts}>
          <div style={{...styles.amountRow, marginBottom: '8px', padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '4px'}}>
            <span style={{ fontWeight: '600', color: '#333' }}>Spent:</span>
            <span style={{ fontWeight: '700', color: '#007bff' }}>{formatCurrency(currentSpending)}</span>
          </div>
          <div style={{...styles.amountRow, marginBottom: '8px', padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '4px'}}>
            <span style={{ fontWeight: '600', color: '#333' }}>Limit:</span>
            <span style={{ fontWeight: '700', color: '#007bff' }}>{formatCurrency(effectiveBudget)}</span>
          </div>
          <div style={{...styles.amountRow, padding: '8px', backgroundColor: '#f0f8ff', borderRadius: '4px'}}>
            <span style={{ fontWeight: '600', color: '#333' }}>Remaining:</span>
            <span style={{ 
              fontWeight: 'bold', 
              fontSize: '16px',
              color: isOverBudget ? '#dc3545' : '#28a745' 
            }}>
              {formatCurrency(remaining)}
            </span>
          </div>
        </div>

        {(budget.rollover ?? budget.rollover_enabled) && (
          <p style={styles.rolloverNote}>
            Rollover enabled - unused budget from previous month is carried over
          </p>
        )}
      </div>

      <div style={styles.progressBar}>
        <div
          style={{
            ...styles.progressFill,
            width: `${progressPercentage}%`,
            backgroundColor: progressColor
          }}
        />
      </div>
    </div>
  );
}
