/**
 * Utility functions for budget calculations and operations
 */

export const generateBudgetName = (categoryIds, categories) => {
  if (categoryIds.length === 0) return '';
  const selectedCategories = categoryIds
    .map(id => categories.find(c => c.category_id === id)?.category_name)
    .filter(Boolean);
  return selectedCategories.join(', ');
};

export const getCurrentSpending = (categoryIds, month, year, transactions) => {
  const filtered = transactions.filter(txn => {
    const txnDate = new Date(txn.date);
    return categoryIds.includes(txn.category_id) &&
           txn.type === 'expense' &&
           txnDate.getMonth() + 1 === month &&
           txnDate.getFullYear() === year;
  });
  
  return filtered.reduce((sum, txn) => sum + parseFloat(txn.amount), 0);
};

export const getCurrentIncome = (categoryIds, month, year, transactions) => {
  const filtered = transactions.filter(txn => {
    const txnDate = new Date(txn.date);
    return categoryIds.includes(txn.category_id) &&
           txn.type === 'income' &&
           txnDate.getMonth() + 1 === month &&
           txnDate.getFullYear() === year;
  });
  
  return filtered.reduce((sum, txn) => sum + parseFloat(txn.amount), 0);
};

export const getProgressColor = (spent, limit) => {
  const percentage = (spent / limit) * 100;
  if (percentage >= 100) return '#dc3545'; // overspent
  if (percentage >= 70) return '#ffc107'; // warning
  return '#28a745'; // ok
};

export const getProgressPercentage = (spent, limit) => {
  return Math.min((spent / limit) * 100, 100);
};

export const getEffectiveBudget = (budget, budgets, transactions) => {
  const hasRollover = budget.rollover ?? budget.rollover_enabled;
  if (!hasRollover) {
    return budget.monthly_limit;
  }

  const prevMonth = budget.month === 1 ? 12 : budget.month - 1;
  const prevYear = budget.month === 1 ? budget.year - 1 : budget.year;
  const categoryIds = budget.category_ids || [];

  const prevBudget = budgets.find(b => {
    const prevBudgetCategoryIds = b.category_ids || [];
    return b.month === prevMonth &&
           b.year === prevYear &&
           (b.rollover ?? b.rollover_enabled) &&
           prevBudgetCategoryIds.length === categoryIds.length &&
           prevBudgetCategoryIds.every(id => categoryIds.includes(id));
  });

  if (!prevBudget) {
    return budget.monthly_limit;
  }

  const prevSpending = getCurrentSpending(
    prevBudget.category_ids || [],
    prevMonth,
    prevYear,
    transactions
  );
  const prevRemaining = prevBudget.monthly_limit - prevSpending;
  const rolloverAmount = Math.max(0, prevRemaining);

  return budget.monthly_limit + rolloverAmount;
};

export const validateCategoriesExist = (categoryIds, categories) => {
  return categoryIds.every(id => categories.some(cat => cat.category_id === id));
};

export const getInitialFormData = () => {
  const today = new Date();
  return {
    budget_name: '',
    category_ids: [],
    monthly_limit: '',
    month: today.getMonth() + 1,
    year: today.getFullYear(),
    rollover: false
  };
};

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const getBudgetPeriodDisplay = (budget) => {
  return `${MONTH_NAMES[budget.month - 1]} ${budget.year}`;
};

export const getCurrentSpendingByBudget = (budget, transactions) => {
  const categoryIds = budget.category_ids || [];
  return getCurrentSpending(categoryIds, budget.month, budget.year, transactions);
};

export const getCurrentIncomeByBudget = (budget, transactions) => {
  const categoryIds = budget.category_ids || [];
  return getCurrentIncome(categoryIds, budget.month, budget.year, transactions);
};

export const getInitialFormDataCustom = () => {
  return getInitialFormData();
};
