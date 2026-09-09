export const generateBudgetName = (categoryIds, categories) => {
  if (categoryIds.length === 0) return '';
  const selectedCategories = categoryIds
    .map(id => categories.find(c => c.category_id === id)?.category_name)
    .filter(Boolean);
  return selectedCategories.join(', ');
};

const getTransactionsByType = (categoryIds, month, year, transactions, type) => {
  return transactions.filter(txn => {
    const txnDate = new Date(txn.date);
    return categoryIds.includes(txn.category_id) &&
           txn.type === type &&
           txnDate.getMonth() + 1 === month &&
           txnDate.getFullYear() === year;
  }).reduce((sum, txn) => sum + parseFloat(txn.amount), 0);
};

export const getCurrentSpending = (categoryIds, month, year, transactions) => {
  return getTransactionsByType(categoryIds, month, year, transactions, 'expense');
};

export const getCurrentIncome = (categoryIds, month, year, transactions) => {
  return getTransactionsByType(categoryIds, month, year, transactions, 'income');
};

export const getProgressColor = (spent, limit) => {
  const percentage = (spent / limit) * 100;
  if (percentage >= 100) return '#dc3545';
  if (percentage >= 70) return '#ffc107';
  return '#28a745';
};

export const getProgressPercentage = (spent, limit) => {
  return Math.min((spent / limit) * 100, 100);
};

const normalizeRolloverMode = (budget) => {
  const mode = budget?.rollover_mode ?? budget?.rolloverMode ?? 'previous-month';
  return mode === 'full' ? 'full' : 'previous-month';
};

const sameCategorySet = (a = [], b = []) => {
  if (a.length !== b.length) return false;
  return a.every((id) => b.includes(id));
};

const getBudgetMonthIndex = (budget) => {
  const month = Number(budget.month);
  const year = Number(budget.year);
  if (!Number.isFinite(month) || !Number.isFinite(year)) return Number.NEGATIVE_INFINITY;
  return (year * 12) + month;
};

const getCurrentBudgetMonth = () => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

const getPreviousMonth = (month, year) => {
  return month === 1
    ? { month: 12, year: year - 1 }
    : { month: month - 1, year };
};

const getMatchingPreviousBudgets = (budget, budgets) => {
  const categoryIds = budget.category_ids || [];
  const monthIndex = getBudgetMonthIndex(budget);

  return budgets.filter((candidate) => {
    if (candidate.budget_id === budget.budget_id) return false;
    if (!candidate || !candidate.category_ids) return false;
    const candidateMonthIndex = getBudgetMonthIndex(candidate);
    if (candidateMonthIndex >= monthIndex) return false;
    if ((candidate.rollover ?? candidate.rollover_enabled) !== (budget.rollover ?? budget.rollover_enabled)) return false;
    return sameCategorySet(categoryIds, candidate.category_ids || []);
  });
};

export const getEffectiveBudget = (budget, budgets, transactions) => {
  const hasRollover = budget.rollover ?? budget.rollover_enabled;
  if (!hasRollover) {
    return budget.monthly_limit;
  }

  const mode = normalizeRolloverMode(budget);
  const matchingBudgets = getMatchingPreviousBudgets(budget, budgets);

  if (matchingBudgets.length === 0) {
    const currentPeriod = getCurrentBudgetMonth();
    const budgetStartIndex = getBudgetMonthIndex(budget);
    const currentMonthIndex = getBudgetMonthIndex(currentPeriod);
    if (budgetStartIndex >= currentMonthIndex) {
      return Number(budget.monthly_limit || 0);
    }

    const previousPeriods = [];
    let period = getPreviousMonth(currentPeriod.month, currentPeriod.year);
    let periodIndex = getBudgetMonthIndex(period);
    while (periodIndex >= budgetStartIndex) {
      previousPeriods.push(period);
      period = getPreviousMonth(period.month, period.year);
      periodIndex = getBudgetMonthIndex(period);
    }

    const periodsToCarry = mode === 'full' ? previousPeriods : previousPeriods.slice(0, 1);
    const carryoverAmount = periodsToCarry.reduce((total, previousPeriod) => {
      const spent = getCurrentSpending(
        budget.category_ids || [],
        previousPeriod.month,
        previousPeriod.year,
        transactions
      );
      return total + Math.max(0, Number(budget.monthly_limit || 0) - spent);
    }, 0);

    return Number(budget.monthly_limit || 0) + carryoverAmount;
  }

  const carryoverAmount = matchingBudgets.reduce((total, candidate) => {
    const remaining = Number(candidate.monthly_limit || 0) - getCurrentSpending(candidate.category_ids || [], Number(candidate.month), Number(candidate.year), transactions);
    return total + Math.max(0, remaining);
  }, 0);

  if (mode === 'full') {
    return Number(budget.monthly_limit || 0) + carryoverAmount;
  }

  const lastPreviousBudget = matchingBudgets
    .sort((a, b) => getBudgetMonthIndex(b) - getBudgetMonthIndex(a))[0];

  if (!lastPreviousBudget) {
    return budget.monthly_limit;
  }

  const prevSpending = getCurrentSpending(
    lastPreviousBudget.category_ids || [],
    Number(lastPreviousBudget.month),
    Number(lastPreviousBudget.year),
    transactions
  );
  const prevRemaining = (Number(lastPreviousBudget.monthly_limit || 0) - prevSpending);
  const rolloverAmount = Math.max(0, prevRemaining);

  return Number(budget.monthly_limit || 0) + rolloverAmount;
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
    rollover: false,
    rollover_mode: 'previous-month'
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
  const { month, year } = getCurrentBudgetMonth();
  return getCurrentSpending(categoryIds, month, year, transactions);
};

export const getCurrentIncomeByBudget = (budget, transactions) => {
  const categoryIds = budget.category_ids || [];
  const { month, year } = getCurrentBudgetMonth();
  return getCurrentIncome(categoryIds, month, year, transactions);
};

export const getInitialFormDataCustom = () => {
  return getInitialFormData();
};
