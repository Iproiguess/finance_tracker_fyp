import React, { useState, useMemo } from 'react';
import { styles } from './styles/budgetStyles';
import { 
  getCurrentSpendingByBudget,
  getProgressColor, 
  getProgressPercentage,
  getEffectiveBudget,
  getBudgetPeriodDisplay,
  MONTH_NAMES 
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

    // If no badges selected use all categories, otherwise use only selected ones
    return selected.length > 0 ? selected : categoryIds;
  }, [selectedBadges, selectedCategories, categoryIds, budget.budget_id]);

  const currentSpending = useMemo(() => {
    return getCurrentSpendingByBudget(
      { ...budget, category_ids: selectedCategoryIds },
      transactions
    );
  }, [selectedCategoryIds, budget, transactions]);

  const effectiveBudget = useMemo(() => {
    return getEffectiveBudget(budget, budgets, transactions);
  }, [budget, budgets, transactions]);

  // Early return if no categories selected
  if (selectedCategories.length === 0) return null;

  const remaining = effectiveBudget - currentSpending;
  const isOverBudget = remaining < 0;
  const progressColor = getProgressColor(currentSpending, effectiveBudget);
  const progressPercentage = getProgressPercentage(currentSpending, effectiveBudget);

  return (
    <div 
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
            data-budget-id={budget.budget_id}
            onClick={() => onEdit(budget)}
            style={{ display: 'none' }}
            tabIndex={-1}
            aria-hidden="true"
          >Hidden Edit</button>
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
            <span style={{ fontWeight: '700', color: '#007bff' }}>RM{currentSpending.toFixed(2)}</span>
          </div>
          <div style={{...styles.amountRow, marginBottom: '8px', padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '4px'}}>
            <span style={{ fontWeight: '600', color: '#333' }}>Limit:</span>
            <span style={{ fontWeight: '700', color: '#007bff' }}>RM{effectiveBudget.toFixed(2)}</span>
          </div>
          <div style={{...styles.amountRow, padding: '8px', backgroundColor: '#f0f8ff', borderRadius: '4px'}}>
            <span style={{ fontWeight: '600', color: '#333' }}>Remaining:</span>
            <span style={{ 
              fontWeight: 'bold', 
              fontSize: '16px',
              color: isOverBudget ? '#dc3545' : '#28a745' 
            }}>
              RM{remaining.toFixed(2)}
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
