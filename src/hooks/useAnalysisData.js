import { useMemo, useState, useEffect } from 'react';
import { getCurrentSpendingByBudget, getCurrentIncomeByBudget, MONTH_NAMES } from '../components/utils/budgetUtils';

const sumByType = (items, type) => items.filter(t => t.type === type).reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

const calculateBudgetStats = (budget, transactions, categories, categoryIds = null) => {
  const ids = categoryIds || budget.category_ids || [];
  const budgetTxs = transactions.filter(tx => ids.includes(tx.category_id));
  const spent = sumByType(budgetTxs, 'expense');
  const income = sumByType(budgetTxs, 'income');
  return { spent, income };
};

const calculateUsage = (spent, limit) => {
  const percent = limit > 0 ? (spent / limit) * 100 : 0;
  return percent >= 100 ? Math.min(percent, 999).toFixed(2) : percent.toFixed(1);
};

const formatBudgetRow = (budget, categories, spent, income, limit) => {
  const remaining = limit - spent;
  const usage = calculateUsage(spent, limit);
  const adjustedSpent = spent - income;
  const adjustedUsage = calculateUsage(adjustedSpent, limit);
  const period = budget.month ? `${MONTH_NAMES[budget.month - 1]} ${budget.year}` : `${budget.year}`;
  return { 
    id: budget.budget_id, 
    name: budget.budget_name || 'Unnamed budget', 
    period, 
    limit, 
    spent, 
    remaining, 
    usage, 
    income, 
    adjustedUsage 
  };
};

export function useAnalysisData(budgets, transactions, categories, budgetsLoading, transactionsLoading, categoriesLoading, selectedStartMonth = 'all', selectedEndMonth = 'all') {
  const [selectedBudgetIds, setSelectedBudgetIds] = useState(new Set());
  const [simulationResult, setSimulationResult] = useState(null);
  const [showScenarioModal, setShowScenarioModal] = useState(false);

  const loading = budgetsLoading || transactionsLoading || categoriesLoading;
  const isSimulation = !!simulationResult;

  useEffect(() => {
    const syncBudgetFromHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#budget-')) {
        const budgetId = hash.replace('#budget-', '');
        if (budgets.some(b => String(b.budget_id) === budgetId)) {
          setSelectedBudgetIds(new Set([budgetId]));
        }
      }
    };
    window.addEventListener('hashchange', syncBudgetFromHash);
    syncBudgetFromHash();
    return () => window.removeEventListener('hashchange', syncBudgetFromHash);
  }, [budgets]);

  const toggleBudgetSelection = (budgetId) => {
    setSelectedBudgetIds(prev => {
      const newSet = new Set(prev);
      newSet.has(budgetId) ? newSet.delete(budgetId) : newSet.add(budgetId);
      return newSet;
    });
  };

  const filteredBudgets = useMemo(() => {
    if (selectedBudgetIds.size === 0) return budgets;
    return budgets.filter(b => selectedBudgetIds.has(b.budget_id));
  }, [budgets, selectedBudgetIds]);

  const selectedCategoryIds = useMemo(() => {
    const ids = new Set();
    filteredBudgets.forEach(b => (b.category_ids || []).forEach(id => ids.add(id)));
    return Array.from(ids);
  }, [filteredBudgets]);

  const filteredTransactions = useMemo(() => {
    let txs = selectedCategoryIds.length === 0 ? transactions : transactions.filter(tx => selectedCategoryIds.includes(tx.category_id));
    if (selectedStartMonth === 'all' || selectedEndMonth === 'all') return txs;
    const [startYear, startMonth] = selectedStartMonth.split('-').map(Number);
    const [endYear, endMonth] = selectedEndMonth.split('-').map(Number);
    const startDate = new Date(startYear, startMonth - 1, 1);
    const endDate = new Date(endYear, endMonth, 0, 23, 59, 59, 999);
    return txs.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= startDate && txDate <= endDate;
    });
  }, [transactions, selectedCategoryIds, selectedStartMonth, selectedEndMonth]);

  const totalBudget = useMemo(() => {
    return filteredBudgets.reduce((sum, b) => sum + parseFloat(b.monthly_limit || 0), 0);
  }, [filteredBudgets]);

  const totalIncome = useMemo(() => sumByType(filteredTransactions, 'income'), [filteredTransactions]);
  const totalExpense = useMemo(() => sumByType(filteredTransactions, 'expense'), [filteredTransactions]);

  const summaryData = useMemo(() => {
    if (isSimulation && simulationResult?.categories) {
      const hasExpense = simulationResult.simulateType === 'expense' || simulationResult.simulateType === 'both';
      const hasIncome = simulationResult.simulateType === 'income' || simulationResult.simulateType === 'both';
      const simulatedExpense = hasExpense ? simulationResult.categories.reduce((sum, c) => sum + c.simulatedExpense, 0) : totalExpense;
      const simulatedIncome = hasIncome ? simulationResult.categories.reduce((sum, c) => sum + c.simulatedIncome, 0) : totalIncome;
      return {
        totalBudget,
        totalSpent: simulatedExpense,
        totalIncome: simulatedIncome,
        transactionsCount: filteredTransactions.length,
        categoriesCount: selectedCategoryIds.length,
        netAmount: simulatedIncome - simulatedExpense
      };
    }
    return {
      totalBudget,
      totalSpent: totalExpense,
      totalIncome,
      transactionsCount: filteredTransactions.length,
      categoriesCount: selectedCategoryIds.length,
      netAmount: totalIncome - totalExpense
    };
  }, [isSimulation, simulationResult, totalBudget, totalExpense, totalIncome, filteredTransactions, selectedCategoryIds]);

  const monthlyTableData = useMemo(() => {
    const getSimulatedStats = (budget, simResult) => {
      const categoryNames = (budget.category_ids || [])
        .map(id => categories.find(c => c.category_id === id)?.category_name)
        .filter(Boolean);
      const simCats = simResult.categories.filter(cat => categoryNames.includes(cat.categoryName));
      const hasExpense = simResult.simulateType === 'expense' || simResult.simulateType === 'both';
      const hasIncome = simResult.simulateType === 'income' || simResult.simulateType === 'both';
      const spent = hasExpense ? simCats.reduce((sum, cat) => sum + cat.simulatedExpense, 0) : 0;
      const income = hasIncome ? simCats.reduce((sum, cat) => sum + cat.simulatedIncome, 0) : 0;
      return { spent, income };
    };

    return filteredBudgets.map((budget) => {
      const limit = parseFloat(budget.monthly_limit || 0);
      let { spent, income } = calculateBudgetStats(budget, isSimulation && simulationResult?.categories ? transactions : filteredTransactions, categories);
      
      if (isSimulation && simulationResult?.categories) {
        const simStats = getSimulatedStats(budget, simulationResult);
        if (simulationResult.simulateType === 'expense' || simulationResult.simulateType === 'both') {
          spent = simStats.spent;
        }
        if (simulationResult.simulateType === 'income' || simulationResult.simulateType === 'both') {
          income = simStats.income;
        }
      }
      
      return formatBudgetRow(budget, categories, spent, income, limit);
    });
  }, [filteredBudgets, filteredTransactions, isSimulation, simulationResult, categories, transactions]);

  const categoryChartData = useMemo(() => {
    const relevantCategories = categories.filter(cat => selectedCategoryIds.includes(cat.category_id));
    const getTxsByCategory = (catId) => filteredTransactions.filter(tx => tx.category_id === catId);
    
    return relevantCategories.map(cat => {
      let spent = 0, income = 0;
      
      if (isSimulation && simulationResult?.categories) {
        const simCat = simulationResult.categories.find(s => s.categoryName === cat.category_name);
        if (simulationResult.simulateType === 'expense' || simulationResult.simulateType === 'both') {
          spent = simCat?.simulatedExpense || 0;
        } else {
          spent = sumByType(getTxsByCategory(cat.category_id), 'expense');
        }
        if (simulationResult.simulateType === 'income' || simulationResult.simulateType === 'both') {
          income = simCat?.simulatedIncome || 0;
        } else {
          income = sumByType(getTxsByCategory(cat.category_id), 'income');
        }
      } else {
        const catTxs = getTxsByCategory(cat.category_id);
        spent = sumByType(catTxs, 'expense');
        income = sumByType(catTxs, 'income');
      }
      
      return { name: cat.category_name, spent, income };
    }).sort((a, b) => b.spent - a.spent);
  }, [categories, selectedCategoryIds, filteredTransactions, isSimulation, simulationResult]);

  const monthlyTrendData = useMemo(() => {
    const now = new Date();
    let months = [];
    
    if (selectedStartMonth === 'all' && selectedEndMonth === 'all') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
      }
    } else {
      const getDate = (dateStr) => {
        if (dateStr === 'all') return null;
        const [year, month] = dateStr.split('-').map(Number);
        return { year, month };
      };
      
      const startDate = getDate(selectedStartMonth) || { year: 2000, month: 1 };
      const endDate = getDate(selectedEndMonth) || { year: now.getFullYear(), month: now.getMonth() + 1 };
      
      let current = new Date(startDate.year, startDate.month - 1, 1);
      const end = new Date(endDate.year, endDate.month, 0);
      while (current <= end) {
        months.push({ year: current.getFullYear(), month: current.getMonth() + 1 });
        current.setMonth(current.getMonth() + 1);
      }
    }

    return months.map(({ year, month }) => {
      const monthTxs = filteredTransactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate.getFullYear() === year && txDate.getMonth() + 1 === month;
      });

      let spent = sumByType(monthTxs, 'expense');
      let income = sumByType(monthTxs, 'income');

      if (isSimulation && simulationResult?.categories) {
        const hasExpense = simulationResult.simulateType === 'expense' || simulationResult.simulateType === 'both';
        const hasIncome = simulationResult.simulateType === 'income' || simulationResult.simulateType === 'both';
        
        if (hasExpense || hasIncome) {
          let newSpent = 0, newIncome = 0;
          monthTxs.forEach(tx => {
            const catName = categories.find(c => c.category_id === tx.category_id)?.category_name;
            const simCat = simulationResult.categories.find(s => s.categoryName === catName);
            if (!simCat) return;
            
            const txAmount = parseFloat(tx.amount || 0);
            if (tx.type === 'expense' && hasExpense) {
              const ratio = simCat.currentExpense > 0 ? simCat.simulatedExpense / simCat.currentExpense : 1;
              newSpent += txAmount * ratio;
            } else if (tx.type === 'expense') {
              newSpent += txAmount;
            }
            
            if (tx.type === 'income' && hasIncome) {
              const ratio = simCat.currentIncome > 0 ? simCat.simulatedIncome / simCat.currentIncome : 1;
              newIncome += txAmount * ratio;
            } else if (tx.type === 'income') {
              newIncome += txAmount;
            }
          });
          spent = Math.max(0, newSpent);
          income = Math.max(0, newIncome);
        }
      }

      return { month: `${month}/${year}`, spent, income };
    });
  }, [categories, filteredTransactions, isSimulation, simulationResult, selectedStartMonth, selectedEndMonth]);

  return {
    loading,
    selectedBudgetIds,
    setSelectedBudgetIds,
    toggleBudgetSelection,
    filteredBudgets,
    summaryData,
    monthlyTableData,
    categoryChartData,
    monthlyTrendData,
    showScenarioModal,
    setShowScenarioModal,
    simulationResult,
    setSimulationResult
  };
}
