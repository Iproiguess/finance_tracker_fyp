import { getCurrentSpending, getEffectiveBudget } from '../components/utils/budgetUtils';

const getCurrentBudgetPeriod = () => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

const formatBudgetPeriodText = () => 'for the current month';

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

const buildLargeExpenseNotifications = (budgets, transactions) => {
  const notifications = [];
  const notifiedTransactions = new Set();

  transactions.forEach((transaction) => {
    const transactionKey = transaction.transaction_id || `${transaction.date}-${transaction.category_id}-${transaction.amount}`;
    if (transaction.type !== 'expense' || notifiedTransactions.has(transactionKey)) return;

    const amount = Number(transaction.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const matchingBudget = budgets.find((budget) =>
      (budget.category_ids || []).includes(transaction.category_id) &&
      Number(budget.monthly_limit) > 0 &&
      amount >= Number(budget.monthly_limit)
    );
    if (!matchingBudget) return;

    const budgetName = matchingBudget.budget_name || `Budget ${matchingBudget.budget_id}`;
    notifiedTransactions.add(transactionKey);
    notifications.push({
      id: `expense-${transactionKey}-over-budget`,
      text: `An expense of ${amount.toFixed(2)} meets or exceeds the ${budgetName} limit. Review this transaction and your budget.`,
      context: budgetName,
      related: budgetName,
    });
  });

  return notifications;
};

export function buildAdviceNotifications(budgets = [], transactions = []) {
  if (!budgets || budgets.length === 0) return [];

  const notifications = buildLargeExpenseNotifications(budgets, transactions);

  const currentMonthBudgets = budgets.filter((budget) => (budget.category_ids || []).length > 0);
  const relevantBudgets = currentMonthBudgets;
  if (relevantBudgets.length === 0) return notifications;

  const overlapNotifications = buildCategoryOverlapNotifications(currentMonthBudgets);
  notifications.push(...overlapNotifications);

  relevantBudgets.forEach((budget) => {
    const categoryIds = budget.category_ids || [];
    const { month: budgetMonth, year: budgetYear } = getCurrentBudgetPeriod();

    if (!categoryIds.length) {
      return;
    }

    const normalizedBudget = {
      ...budget,
      month: budgetMonth,
      year: budgetYear,
    };

    const currentSpending = getCurrentSpending(categoryIds, budgetMonth, budgetYear, transactions);
    const effectiveLimit = getEffectiveBudget(normalizedBudget, budgets, transactions);
    const budgetName = normalizedBudget.budget_name || `Budget ${normalizedBudget.budget_id}`;

    if (effectiveLimit > 0) {
      const percent = currentSpending / effectiveLimit;
      const periodText = formatBudgetPeriodText();
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
        txnDate.getMonth() + 1 === budgetMonth &&
        txnDate.getFullYear() === budgetYear;
    });

    if (monthTransactions.length === 0) {
      notifications.push({
        id: `budget-${budget.budget_id}-no-activity`,
        text: `${budgetName} has no recorded transactions for the current month.`,
        context: budgetName,
        related: budgetName,
      });
    }

    const rolloverEnabled = budget.rollover ?? budget.rollover_enabled;
    const rolloverAmount = Math.max(0, effectiveLimit - (budget.monthly_limit || 0));
    if (rolloverEnabled && rolloverAmount > 0 && currentSpending < effectiveLimit * 0.7) {
      notifications.push({
        id: `budget-${budget.budget_id}-rollover`,
        text: `${budgetName} has rolled over ${rolloverAmount.toFixed(2)} available for the current month.`,
        context: budgetName,
        related: budgetName,
      });
    }

  });

  return notifications;
}
