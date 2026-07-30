import { getCurrentSpending, getEffectiveBudget } from '../components/utils/budgetUtils';

const formatBudgetPeriod = (budget) => {
  const month = budget.month ? String(budget.month).padStart(2, '0') : '??';
  const year = budget.year || '????';
  return `${month}/${year}`;
};

const formatBudgetPeriodText = (budget) => {
  const period = `for ${formatBudgetPeriod(budget)}`;
  return `${period} (checked monthly)`;
};

const arraysHaveSameElements = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  return a.every((value) => b.includes(value));
};

const buildCategoryOverlapNotifications = (budgets) => {
  const categoryCounts = {};
  budgets.forEach((budget) => {
    (budget.category_ids || []).forEach((categoryId) => {
      categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
    });
  });

  return Object.entries(categoryCounts)
    .filter(([, count]) => count > 1)
    .map(([categoryId]) => ({
      id: `category-overlap-${categoryId}`,
      text: `Category ${categoryId} appears in multiple budgets. This expense will count toward each budget that includes it.`,
      context: 'Budget overlap',
      related: categoryId,
    }));
};

const getPreviousBudgetExists = (budget, budgets) => {
  if (!budget.month || !budget.year) return false;
  const prevMonth = budget.month === 1 ? 12 : budget.month - 1;
  const prevYear = budget.month === 1 ? budget.year - 1 : budget.year;
  const categoryIds = budget.category_ids || [];
  const rolloverFlag = budget.rollover ?? budget.rollover_enabled;

  return budgets.some((candidate) => {
    const candidateRollover = candidate.rollover ?? candidate.rollover_enabled;
    return candidate.budget_id !== budget.budget_id &&
      candidate.month === prevMonth &&
      candidate.year === prevYear &&
      (candidateRollover === rolloverFlag) &&
      arraysHaveSameElements(candidate.category_ids || [], categoryIds);
  });
};

const isBudgetInCurrentMonth = (budget) => {
  const now = new Date();
  return Number(budget.month) === now.getMonth() + 1 && Number(budget.year) === now.getFullYear();
};

export function buildAdviceNotifications(budgets = [], transactions = []) {
  if (!budgets || budgets.length === 0) return [];

  const currentMonthBudgets = budgets.filter(isBudgetInCurrentMonth);
  if (currentMonthBudgets.length === 0) return [];

  const notifications = [];
  const overlapNotifications = buildCategoryOverlapNotifications(currentMonthBudgets);
  notifications.push(...overlapNotifications);

  currentMonthBudgets.forEach((budget) => {
    const categoryIds = budget.category_ids || [];
    const budgetMonth = Number(budget.month);
    const budgetYear = Number(budget.year);

    if (!categoryIds.length || !budgetMonth || !budgetYear) {
      return;
    }

    const normalizedBudget = {
      ...budget,
      month: budgetMonth,
      year: budgetYear,
    };

    const currentSpending = getCurrentSpending(categoryIds, budgetMonth, budgetYear, transactions);
    const effectiveLimit = getEffectiveBudget(normalizedBudget, budgets, transactions);
    const periodLabel = formatBudgetPeriod(normalizedBudget);
    const budgetName = normalizedBudget.budget_name || `Budget ${normalizedBudget.budget_id}`;

    if (effectiveLimit > 0) {
      const percent = currentSpending / effectiveLimit;
      const periodText = formatBudgetPeriodText(budget);
      if (percent >= 1) {
        notifications.push({
          id: `budget-${budget.budget_id}-over`,
          text: `${budgetName} has reached or exceeded its effective limit ${periodText}. Review spending or update the budget.`,
          context: budgetName,
          related: budgetName,
        });
      } else if (percent >= 0.9) {
        notifications.push({
          id: `budget-${budget.budget_id}-near-limit`,
          text: `${budgetName} is at ${Math.round(percent * 100)}% of its effective limit ${periodText}.`,
          context: budgetName,
          related: budgetName,
        });
      } else if (percent >= 0.75) {
        notifications.push({
          id: `budget-${budget.budget_id}-warning`,
          text: `${budgetName} is approaching its effective limit (${Math.round(percent * 100)}%) ${periodText}.`,
          context: budgetName,
          related: budgetName,
        });
      }
    }

    const monthTransactions = transactions.filter((txn) => {
      const txnDate = new Date(txn.date);
      return categoryIds.includes(txn.category_id) &&
        txnDate.getMonth() + 1 === budget.month &&
        txnDate.getFullYear() === budget.year;
    });

    if (monthTransactions.length === 0) {
      notifications.push({
        id: `budget-${budget.budget_id}-no-activity`,
        text: `${budgetName} has no recorded transactions for ${periodLabel}.`,
        context: budgetName,
        related: budgetName,
      });
    }

    const rolloverEnabled = budget.rollover ?? budget.rollover_enabled;
    const rolloverAmount = Math.max(0, effectiveLimit - (budget.monthly_limit || 0));
    if (rolloverEnabled && rolloverAmount > 0 && currentSpending < effectiveLimit * 0.7) {
      notifications.push({
        id: `budget-${budget.budget_id}-rollover`,
        text: `${budgetName} has rolled over ${rolloverAmount.toFixed(2)} available for ${periodLabel}.`,
        context: budgetName,
        related: budgetName,
      });
    }

    const previousExists = getPreviousBudgetExists(budget, budgets);
    if (!previousExists) {
      notifications.push({
        id: `budget-${budget.budget_id}-new`,
        text: `${budgetName} is new for ${periodLabel}; track spend this period to establish your baseline.`,
        context: budgetName,
        related: budgetName,
      });
    }
  });

  return notifications;
}
