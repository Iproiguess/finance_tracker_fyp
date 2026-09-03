import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../config/constants';

export function ForecastAndRecommendation({ simulationResult, transactions, budgets = [] }) {
  // Filter transactions to only include those from selected categories in simulation
  let relevantTransactions = transactions;
  
  if (simulationResult && simulationResult.selectedCategoryIds && simulationResult.selectedCategoryIds.length > 0) {
    const selectedCategoryIds = new Set(simulationResult.selectedCategoryIds);
    relevantTransactions = transactions.filter(tx => selectedCategoryIds.has(tx.category_id));
  }

  const months = 6;
  const now = new Date();
  // Calculate rolling window for last 6 months of data
  const windowStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const last6 = relevantTransactions.filter(tx => {
    const d = new Date(tx.date);
    return d >= windowStart && d <= now;
  });

  const monthKeys = new Set();
  last6.forEach(tx => {
    const d = new Date(tx.date);
    monthKeys.add(`${d.getFullYear()}-${d.getMonth()}`);
  });
  const monthsAvailable = Math.max(0, monthKeys.size);

  const income = last6.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
  const expense = last6.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

  // Average per month with fallback to prevent division by zero
  const divisor = monthsAvailable > 0 ? monthsAvailable : 1;
  const avgMonthlyIncome = income / divisor;
  const avgMonthlyExpense = expense / divisor;

  const forecastBalance = (avgMonthlyIncome - avgMonthlyExpense) * months;
  
  let totalBudgetLimit = 0;
  if (simulationResult && simulationResult.selectedBudgetIds && simulationResult.selectedBudgetIds.length > 0) {
    const selectedBudgetsSet = new Set(simulationResult.selectedBudgetIds);
    budgets
      .filter(b => selectedBudgetsSet.has(b.budget_id))
      .forEach(b => totalBudgetLimit += b.monthly_limit || 0);
  }
  
  let recommendation = '';
  const forecastSpending = avgMonthlyExpense * months;
  const remainingBudget = totalBudgetLimit - forecastSpending;
  
  if (totalBudgetLimit > 0) {
    const spendingPercentage = (avgMonthlyExpense / totalBudgetLimit) * 100;
    
    if (spendingPercentage > 100) {
      recommendation = `Your average monthly spending (${avgMonthlyExpense.toFixed(2)}) exceeds your budget limit (${totalBudgetLimit.toFixed(2)}). Based on this trend, in 6 months you'll be ${Math.abs(remainingBudget).toFixed(2)} over budget. Consider reducing expenses significantly.`;
    } else if (spendingPercentage > 75) {
      recommendation = `Your average monthly spending (${avgMonthlyExpense.toFixed(2)}) is at ${spendingPercentage.toFixed(0)}% of your budget (${totalBudgetLimit.toFixed(2)}). Forecasted for 6 months, you'll have ${remainingBudget.toFixed(2)} remaining. Consider reducing expenses.`;
    } else if (spendingPercentage > 50) {
      recommendation = `Your average monthly spending (${avgMonthlyExpense.toFixed(2)}) is at ${spendingPercentage.toFixed(0)}% of your budget (${totalBudgetLimit.toFixed(2)}). Forecasted for 6 months, you'll have ${remainingBudget.toFixed(2)} remaining. You're on track.`;
    } else {
      recommendation = `Your average monthly spending (${avgMonthlyExpense.toFixed(2)}) is at ${spendingPercentage.toFixed(0)}% of your budget (${totalBudgetLimit.toFixed(2)}). Forecasted for 6 months, you'll have ${remainingBudget.toFixed(2)} remaining. Great control!`;
    }
  } else {
    // No budget limit set, use income comparison
    if (avgMonthlyExpense > avgMonthlyIncome) {
      recommendation = `Your average monthly expenses (${avgMonthlyExpense.toFixed(2)}) exceed your average income (${avgMonthlyIncome.toFixed(2)}) by ${(avgMonthlyExpense - avgMonthlyIncome).toFixed(2)}. Consider reducing expenses.`;
    } else if (avgMonthlyIncome > avgMonthlyExpense) {
      recommendation = `Your average monthly income (${avgMonthlyIncome.toFixed(2)}) exceeds your average expenses (${avgMonthlyExpense.toFixed(2)}). You're saving about ${(avgMonthlyIncome - avgMonthlyExpense).toFixed(2)} per month.`;
    } else {
      recommendation = 'Your average income and expenses are balanced.';
    }
  }

  let impactData = [];
  let impactSummary = {};
  let isSimulation = false;
  
  if (simulationResult) {
    isSimulation = true;
    let currentAmount = avgMonthlyExpense;
    if (simulationResult.simulateType === 'income') {
      currentAmount = avgMonthlyIncome;
    } else if (simulationResult.simulateType === 'both') {
      currentAmount = avgMonthlyExpense + avgMonthlyIncome;
    }

    let simulatedAmount = currentAmount;
    if (simulationResult.mode === 'percent') {
      simulatedAmount = currentAmount * (1 + simulationResult.value / 100);
    } else if (simulationResult.mode === 'amount') {
      simulatedAmount = currentAmount + simulationResult.value;
    }

    const monthlyImpact = simulatedAmount - currentAmount;
    
    let cumulative = 0;
    for (let i = 1; i <= 3; i++) {
      cumulative += monthlyImpact;
      impactData.push({
        month: `Month ${i}`,
        impact: monthlyImpact,
        cumulative: cumulative,
        isPositive: cumulative >= 0
      });
    }

    impactSummary = {
      currentMonthly: currentAmount,
      simulatedMonthly: simulatedAmount,
      monthlyDifference: monthlyImpact,
      cumulativeIn3Months: cumulative,
      type: simulationResult.simulateType
    };
  } else {
    // Show baseline current spending trajectory even without simulation
    const monthlyBalance = avgMonthlyIncome - avgMonthlyExpense;
    let cumulative = 0;
    for (let i = 1; i <= 3; i++) {
      cumulative += monthlyBalance;
      impactData.push({
        month: `Month ${i}`,
        impact: monthlyBalance,
        cumulative: cumulative,
        isPositive: cumulative >= 0
      });
    }
  }

  if (monthsAvailable === 0) {
    return (
      <div style={{ background: '#fff6e6', color: '#333', borderRadius: 8, padding: '14px 18px', margin: '12px 0', fontSize: 14 }}>
        <div style={{ fontWeight: 700 }}>Forecast unavailable</div>
        <div style={{ marginTop: 6, color: '#6b6b6b' }}>Not enough transaction history in the selected scope to make a reliable forecast. Add more data or select budgets to see a projection.</div>
      </div>
    );
  }

  return (
    <>
      <div style={{ background: '#e3f6f5', color: '#232323', borderRadius: 8, padding: '14px 18px', margin: '12px 0', fontWeight: 500, fontSize: 15 }}>
        <div><b>Forecast:</b> Based on the last {monthsAvailable} month{monthsAvailable > 1 ? 's' : ''} of data, your average monthly balance is <b>{formatCurrency(avgMonthlyIncome - avgMonthlyExpense)}</b>. Over 6 months, your projected balance will be <b>{formatCurrency(forecastBalance)}</b>.</div>
        <div style={{ marginTop: 6 }}><b>Recommendation:</b> {recommendation}</div>
      </div>

      {simulationResult && impactSummary && (
        <div style={{ background: '#f0f8ff', borderRadius: 8, padding: '16px', margin: '12px 0', border: '2px solid #2176ae' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 600, color: '#232323' }}>Impact Summary</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#fff', padding: '12px', borderRadius: 6, borderLeft: '4px solid #e74c3c' }}>
              <div style={{ fontSize: 12, color: '#7f8c8d', marginBottom: 4 }}>Average Current Monthly</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#232323' }}>{impactSummary.type === 'income' ? '+' : impactSummary.type === 'expense' ? '-' : ''}{impactSummary.currentMonthly.toFixed(2)}</div>
            </div>
            <div style={{ background: '#fff', padding: '12px', borderRadius: 6, borderLeft: '4px solid #27ae60' }}>
              <div style={{ fontSize: 12, color: '#7f8c8d', marginBottom: 4 }}>Forecasted Average Monthly</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#232323' }}>{impactSummary.type === 'income' ? '+' : impactSummary.type === 'expense' ? '-' : ''}{impactSummary.simulatedMonthly.toFixed(2)}</div>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: '12px', background: '#fff', borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#7f8c8d', marginBottom: 4 }}>Average Monthly Change</div>
            <div style={{ 
              fontSize: 18, 
              fontWeight: 700, 
              color: (() => {
                // Determine if the change is financially good or bad based on simulation type
                if (impactSummary.type === 'expense') {
                  // For expenses: negative change (decrease) is good (green), positive change (increase) is bad (red)
                  return impactSummary.monthlyDifference <= 0 ? '#27ae60' : '#e74c3c';
                } else if (impactSummary.type === 'income') {
                  // For income: positive change (increase) is good (green), negative change (decrease) is bad (red)
                  return impactSummary.monthlyDifference >= 0 ? '#27ae60' : '#e74c3c';
                } else {
                  // For both: if net difference is negative, it's worse (red), positive is better (green)
                  return impactSummary.monthlyDifference >= 0 ? '#27ae60' : '#e74c3c';
                }
              })()
            }}>
              {impactSummary.monthlyDifference >= 0 ? '+' : ''}{impactSummary.monthlyDifference.toFixed(2)}
              {' '} ({impactSummary.type})
            </div>
          </div>
          <div style={{ marginTop: 12, padding: '12px', background: impactSummary.type === 'expense' ? (impactSummary.cumulativeIn3Months <= 0 ? '#e8f5e9' : '#ffebee') : (impactSummary.cumulativeIn3Months >= 0 ? '#e8f5e9' : '#ffebee'), borderRadius: 6, textAlign: 'center', border: `2px solid ${
            impactSummary.type === 'expense' 
              ? (impactSummary.cumulativeIn3Months <= 0 ? '#27ae60' : '#e74c3c')
              : (impactSummary.cumulativeIn3Months >= 0 ? '#27ae60' : '#e74c3c')
          }` }}>
            <div style={{ fontSize: 12, color: '#7f8c8d', marginBottom: 4 }}>3-Month Forecasted Cumulative Impact</div>
            <div style={{ 
              fontSize: 18, 
              fontWeight: 700, 
              color: impactSummary.type === 'expense' 
                ? (impactSummary.cumulativeIn3Months <= 0 ? '#27ae60' : '#e74c3c')
                : (impactSummary.cumulativeIn3Months >= 0 ? '#27ae60' : '#e74c3c')
            }}>
              {impactSummary.cumulativeIn3Months >= 0 ? '+' : ''}{impactSummary.cumulativeIn3Months.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {impactData.length > 0 && (
        <div style={{ background: '#f5f8fa', borderRadius: 8, padding: '16px', margin: '12px 0' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 600, color: '#232323' }}>
            {isSimulation ? 'Scenario Impact Over 3 Months' : 'Current Spending Trajectory (3 Months)'}
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={impactData} margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => `${value.toFixed(2)}`}
                contentStyle={{ background: '#fff', border: '1px solid #d3d6de', borderRadius: 6 }}
              />
              <Legend />
              <Bar 
                dataKey="cumulative" 
                fill={isSimulation ? '#2176ae' : '#7f8c8d'} 
                name={isSimulation ? 'Simulated Cumulative' : 'Current Cumulative Balance'} 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 11, color: '#7f8c8d', margin: '8px 0 0 0', fontStyle: 'italic', textAlign: 'center' }}>
            {isSimulation 
              ? 'Chart shows forecasted cumulative effect of your simulation over 3 months based on average spending patterns'
              : 'Chart shows your projected cumulative balance over 3 months based on current spending patterns'
            }
          </p>
        </div>
      )}
    </>
  );
}