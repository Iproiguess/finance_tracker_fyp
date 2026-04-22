import { useMemo, useState, useEffect } from 'react';
import { getCurrentSpendingByBudget, getCurrentIncomeByBudget, MONTH_NAMES } from '../components/utils/budgetUtils';

// Accepts selectedStartMonth and selectedEndMonth for range filtering
export function useAnalysisData(budgets, transactions, categories, budgetsLoading, transactionsLoading, categoriesLoading, selectedStartMonth = 'all', selectedEndMonth = 'all') {
  const [selectedBudgetIds, setSelectedBudgetIds] = useState(new Set());
  const [simulationResult, setSimulationResult] = useState(null);
  const [showScenarioModal, setShowScenarioModal] = useState(false);

  const loading = budgetsLoading || transactionsLoading || categoriesLoading;
  const isSimulation = !!simulationResult;

  // Sync selected budget with hash
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
    const newSet = new Set(selectedBudgetIds);
    if (newSet.has(budgetId)) {
      newSet.delete(budgetId);
    } else {
      newSet.add(budgetId);
    }
    setSelectedBudgetIds(newSet);
  };


  // Filtered budgets based on selection
  const filteredBudgets = useMemo(() => {
    if (selectedBudgetIds.size === 0) return budgets;
    return budgets.filter(b => selectedBudgetIds.has(b.budget_id));
  }, [budgets, selectedBudgetIds]);

  // Selected category IDs from filtered budgets
  const selectedCategoryIds = useMemo(() => {
    const ids = new Set();
    filteredBudgets.forEach(b => (b.category_ids || []).forEach(id => ids.add(id)));
    return Array.from(ids);
  }, [filteredBudgets]);

  // Filtered transactions by month range
  const filteredTransactions = useMemo(() => {
    let txs = selectedCategoryIds.length === 0 ? transactions : transactions.filter(tx => selectedCategoryIds.includes(tx.category_id));
    // If either is 'all', return all
    if (selectedStartMonth === 'all' || selectedEndMonth === 'all') return txs;
    const [startYear, startMonth] = selectedStartMonth.split('-').map(Number);
    const [endYear, endMonth] = selectedEndMonth.split('-').map(Number);
    const startDate = new Date(startYear, startMonth - 1, 1);
    const endDate = new Date(endYear, endMonth, 0, 23, 59, 59, 999); // End of end month
    return txs.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= startDate && txDate <= endDate;
    });
  }, [transactions, selectedCategoryIds, selectedStartMonth, selectedEndMonth]);

  // Total budget calculation
  const totalBudget = useMemo(() => {
    return filteredBudgets.reduce((sum, b) => sum + parseFloat(b.monthly_limit || 0), 0);
  }, [filteredBudgets]);

  // Summary totals
  const totalIncome = useMemo(() => {
    return filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  }, [filteredTransactions]);

  // Summary data
  const summaryData = useMemo(() => {
    if (isSimulation && (simulationResult?.categories)) {
      const simulatedExpense = simulationResult.categories.reduce((sum, c) => sum + c.simulatedExpense, 0);
      const simulatedIncome = simulationResult.categories.reduce((sum, c) => sum + c.simulatedIncome, 0);
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

  // Monthly table data
  const monthlyTableData = useMemo(() => {
    if (isSimulation && simulationResult?.categories) {
      return filteredBudgets.map((budget) => {
        const budgetCategoryNames = (budget.category_ids || [])
          .map(id => categories.find(c => c.category_id === id)?.category_name)
          .filter(Boolean);
        
        const budgetRelevantSimCats = simulationResult.categories.filter(cat =>
          budgetCategoryNames.includes(cat.categoryName)
        );
        
        let spent = 0, income = 0;
        if (simulationResult.simulateType === 'expense' || simulationResult.simulateType === 'both') {
          spent = budgetRelevantSimCats.reduce((sum, cat) => sum + cat.simulatedExpense, 0);
        } else {
          const budgetCategoryIds = budget.category_ids || [];
          spent = transactions
            .filter(tx => budgetCategoryIds.includes(tx.category_id) && tx.type === 'expense')
            .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
        }
        
        if (simulationResult.simulateType === 'income' || simulationResult.simulateType === 'both') {
          income = budgetRelevantSimCats.reduce((sum, cat) => sum + cat.simulatedIncome, 0);
        } else {
          const budgetCategoryIds = budget.category_ids || [];
          income = transactions
            .filter(tx => budgetCategoryIds.includes(tx.category_id) && tx.type === 'income')
            .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
        }
        
        const limit = parseFloat(budget.monthly_limit || 0);
        const remaining = limit - spent;
        const usagePercent = limit > 0 ? (spent/limit)*100 : 0;
        const usage = usagePercent >= 100 ? Math.min(usagePercent, 999).toFixed(2) : usagePercent.toFixed(1);
        const adjustedSpent = spent - income;
        const adjustedUsagePercent = limit > 0 ? (adjustedSpent/limit)*100 : 0;
        const adjustedUsage = adjustedUsagePercent >= 100 ? Math.min(adjustedUsagePercent, 999).toFixed(2) : adjustedUsagePercent.toFixed(1);
        const period = budget.month ? `${MONTH_NAMES[budget.month - 1]} ${budget.year}` : `${budget.year}`;
        
        return { id: budget.budget_id, name: budget.budget_name || 'Unnamed budget', period, limit, spent, remaining, usage, income, adjustedUsage };
      });
    }
    return filteredBudgets.map((budget) => {
      const budgetCategoryIds = budget.category_ids || [];
      
      // Calculate income and spent from filteredTransactions (respects selectedMonth filter)
      const budgetTransactions = filteredTransactions.filter(tx => budgetCategoryIds.includes(tx.category_id));
      const income = budgetTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
      const spent = budgetTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
      
      const limit = parseFloat(budget.monthly_limit || 0);
      const remaining = limit - spent;
      const usagePercent = limit > 0 ? (spent/limit)*100 : 0;
      const usage = usagePercent >= 100 ? Math.min(usagePercent, 999).toFixed(2) : usagePercent.toFixed(1);
      const adjustedSpent = spent - income;
      const adjustedUsagePercent = limit > 0 ? (adjustedSpent/limit)*100 : 0;
      const adjustedUsage = adjustedUsagePercent >= 100 ? Math.min(adjustedUsagePercent, 999).toFixed(2) : adjustedUsagePercent.toFixed(1);
      const period = budget.month ? `${MONTH_NAMES[budget.month - 1]} ${budget.year}` : `${budget.year}`;
      return { id: budget.budget_id, name: budget.budget_name || 'Unnamed budget', period, limit, spent, remaining, usage, income, adjustedUsage };
    });
  }, [filteredBudgets, filteredTransactions, isSimulation, simulationResult, categories, transactions]);

  // Category chart data
  const categoryChartData = useMemo(() => {
    const relevantCategories = categories.filter(cat => selectedCategoryIds.includes(cat.category_id));
    
    if (isSimulation && simulationResult?.categories) {
      return relevantCategories.map(cat => {
        const simCat = simulationResult.categories.find(s => s.categoryName === cat.category_name);
        let spent = 0, income = 0;
        
        if (simulationResult.simulateType === 'expense' || simulationResult.simulateType === 'both') {
          spent = simCat?.simulatedExpense || 0;
        } else {
          const catTxs = filteredTransactions.filter(tx => tx.category_id === cat.category_id);
          spent = catTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
        }
        
        if (simulationResult.simulateType === 'income' || simulationResult.simulateType === 'both') {
          income = simCat?.simulatedIncome || 0;
        } else {
          const catTxs = filteredTransactions.filter(tx => tx.category_id === cat.category_id);
          income = catTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
        }
        
        return { name: cat.category_name, spent, income };
      }).sort((a, b) => b.spent - a.spent);
    }

    return relevantCategories.map(cat => {
      const catTxs = filteredTransactions.filter(tx => tx.category_id === cat.category_id);
      const spent = catTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
      const income = catTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
      return { name: cat.category_name, spent, income };
    }).sort((a, b) => b.spent - a.spent);
  }, [categories, selectedCategoryIds, filteredTransactions, isSimulation, simulationResult]);

  // Monthly trend data for charts
  const monthlyTrendData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }

    let expenseSimulationMap = {}, incomeSimulationMap = {};
    if (isSimulation && simulationResult?.categories) {
      simulationResult.categories.forEach(simCat => {
        expenseSimulationMap[simCat.categoryName] = simCat.currentExpense > 0 ? simCat.simulatedExpense / simCat.currentExpense : 1;
        incomeSimulationMap[simCat.categoryName] = simCat.currentIncome > 0 ? simCat.simulatedIncome / simCat.currentIncome : 1;
      });
    }

    return months.map(({ year, month }) => {
      const monthTxs = filteredTransactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate.getFullYear() === year && txDate.getMonth() + 1 === month;
      });

      let spent = 0, income = 0;

      if (isSimulation && (Object.keys(expenseSimulationMap).length > 0 || Object.keys(incomeSimulationMap).length > 0)) {
        monthTxs.forEach(tx => {
          const catName = categories.find(c => c.category_id === tx.category_id)?.category_name;
          const txAmount = parseFloat(tx.amount || 0);
          
          if (tx.type === 'expense' && (simulationResult.simulateType === 'expense' || simulationResult.simulateType === 'both')) {
            const ratio = expenseSimulationMap[catName] || 1;
            spent += txAmount * ratio;
          } else if (tx.type === 'expense') {
            spent += txAmount;
          }
          
          if (tx.type === 'income' && (simulationResult.simulateType === 'income' || simulationResult.simulateType === 'both')) {
            const ratio = incomeSimulationMap[catName] || 1;
            income += txAmount * ratio;
          } else if (tx.type === 'income') {
            income += txAmount;
          }
        });
      } else {
        spent = monthTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
        income = monthTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
      }

      return { month: `${month}/${year}`, spent, income };
    });
  }, [categories, filteredTransactions, isSimulation, simulationResult]);

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
