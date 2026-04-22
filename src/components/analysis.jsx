import React from 'react';
import { useBudgets } from '../hooks/usebudgets';
import { useTransactions } from '../hooks/usetransactions';
import { useCategories } from '../hooks/usecategories';
import { useAnalysisData } from '../hooks/useAnalysisData';
import SummaryCards from './SummaryCards';
import { formatCurrency } from './styles/budgetSummaryStyles';
import { styles, getRemainingColor } from './styles/analysisStyles';
import { getCurrentSpendingByBudget, MONTH_NAMES } from './utils/budgetUtils';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ScenarioSimulateButton } from './ScenarioSimulateButton';
import { ScenarioSimulateModal } from './ScenarioSimulateModal';
import { ForecastAndRecommendation } from './ForecastAndRecommendation';

export function Analysis() {
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { categories, loading: categoriesLoading } = useCategories();

  // Get current month in YYYY-MM format
  const getCurrentMonthString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // Month range selection
  const [selectedStartMonth, setSelectedStartMonth] = React.useState('all');
  const [selectedEndMonth, setSelectedEndMonth] = React.useState(getCurrentMonthString());

  const { loading, selectedBudgetIds, setSelectedBudgetIds, toggleBudgetSelection, filteredBudgets, summaryData, monthlyTableData, categoryChartData, monthlyTrendData, showScenarioModal, setShowScenarioModal, simulationResult, setSimulationResult } = useAnalysisData(budgets, transactions, categories, budgetsLoading, transactionsLoading, categoriesLoading, selectedStartMonth, selectedEndMonth);

  if (loading) return <div style={styles.container}><div style={{ padding: '40px', textAlign: 'center' }}>Loading analysis...</div></div>;

  const handleSimulate = ({ mode, value, simulateType, selectedBudgetIds: modalBudgetIds }) => {
    // Use the budget IDs from the modal if provided, otherwise use component state
    const budgetsToUseIds = modalBudgetIds && modalBudgetIds.length > 0 
      ? new Set(modalBudgetIds)
      : selectedBudgetIds;
    
    const selectedCategoryIds = new Set();
    // Use only the selected budgets, not filtered budgets based on month range
    const budgetsToSimulate = budgetsToUseIds.size > 0 
      ? budgets.filter(b => budgetsToUseIds.has(b.budget_id))
      : filteredBudgets;
    budgetsToSimulate.forEach(b => (b.category_ids || []).forEach(id => selectedCategoryIds.add(id)));
    const relevantCategories = categories.filter(cat => selectedCategoryIds.has(cat.category_id));
    
    const results = relevantCategories.map(cat => {
      let currentExpense = 0, simulatedExpense = 0, currentIncome = 0, simulatedIncome = 0;
      if (simulateType === 'expense' || simulateType === 'both') {
        const expenseTxs = transactions.filter(tx => tx.category_id === cat.category_id && tx.type === 'expense');
        currentExpense = expenseTxs.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
        simulatedExpense = mode === 'percent' ? currentExpense + (currentExpense * (value / 100)) : value;
        if (simulatedExpense < 0) simulatedExpense = 0;
      }
      if (simulateType === 'income' || simulateType === 'both') {
        const incomeTxs = transactions.filter(tx => tx.category_id === cat.category_id && tx.type === 'income');
        currentIncome = incomeTxs.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
        simulatedIncome = mode === 'percent' ? currentIncome + (currentIncome * (value / 100)) : value;
        if (simulatedIncome < 0) simulatedIncome = 0;
      }
      return { categoryName: cat.category_name, currentExpense: simulateType === 'expense' || simulateType === 'both' ? currentExpense : 0, simulatedExpense: simulateType === 'expense' || simulateType === 'both' ? simulatedExpense : 0, currentIncome: simulateType === 'income' || simulateType === 'both' ? currentIncome : 0, simulatedIncome: simulateType === 'income' || simulateType === 'both' ? simulatedIncome : 0, current: (simulateType === 'expense' || simulateType === 'both' ? currentExpense : 0) + (simulateType === 'income' || simulateType === 'both' ? currentIncome : 0), simulated: (simulateType === 'expense' || simulateType === 'both' ? simulatedExpense : 0) + (simulateType === 'income' || simulateType === 'both' ? simulatedIncome : 0) };
    });
    relevantCategories.forEach(cat => { if (!results.find(r => r.categoryName === cat.category_name)) { results.push({ categoryName: cat.category_name, currentExpense: 0, simulatedExpense: 0, currentIncome: 0, simulatedIncome: 0, current: 0, simulated: 0 }); } });
    let totalCurrent = 0, totalCurrentAll = 0, totalSimulatedAll = 0;
    if (simulateType === 'expense' || simulateType === 'both') { totalCurrent = transactions.filter(tx => tx.type === 'expense' && selectedCategoryIds.has(tx.category_id)).reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0); totalCurrentAll += results.reduce((sum, r) => sum + r.currentExpense, 0); totalSimulatedAll += results.reduce((sum, r) => sum + r.simulatedExpense, 0); }
    if (simulateType === 'income' || simulateType === 'both') { const incomeCurrent = transactions.filter(tx => tx.type === 'income' && selectedCategoryIds.has(tx.category_id)).reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0); totalCurrent += incomeCurrent; totalCurrentAll += results.reduce((sum, r) => sum + r.currentIncome, 0); totalSimulatedAll += results.reduce((sum, r) => sum + r.simulatedIncome, 0); }
    const totalSimulated = totalCurrent - totalCurrentAll + totalSimulatedAll;
    setSimulationResult({ categories: results, impactOnTotal: totalSimulated - totalCurrent, simulateType, mode, value, selectedCategoryIds: Array.from(selectedCategoryIds), selectedBudgetIds: Array.from(budgetsToSimulate.map(b => b.budget_id)) });
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h3 style={styles.sidebarTitle}>Budgets</h3>
          <p style={styles.sidebarSubtitle}>{selectedBudgetIds.size === 0 ? 'All' : `${selectedBudgetIds.size}`} selected</p>
        </div>
        <div style={styles.budgetList}>
          {budgets.length === 0 ? (<div style={styles.emptyBudgetText}>No budgets created yet</div>) : (budgets.map(budget => { const spent = getCurrentSpendingByBudget(budget, transactions); const limit = parseFloat(budget.monthly_limit || 0); const isSelected = selectedBudgetIds.has(budget.budget_id); const period = budget.month ? `${MONTH_NAMES[budget.month - 1]} ${budget.year}` : `${budget.year}`; return (<div key={budget.budget_id} onClick={() => toggleBudgetSelection(budget.budget_id)} style={styles.budgetItem(isSelected)} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3d5a80'; e.currentTarget.style.border = '2px solid #3498db'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.15)'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={(e) => { const baseStyle = styles.budgetItem(isSelected); e.currentTarget.style.backgroundColor = baseStyle.backgroundColor; e.currentTarget.style.border = baseStyle.border; e.currentTarget.style.boxShadow = baseStyle.boxShadow; e.currentTarget.style.transform = baseStyle.transform; }} title={`Click to ${isSelected ? 'deselect' : 'select'} this budget`}><div style={styles.budgetItemHeader}><span style={styles.budgetName}>{budget.budget_name || 'Unnamed'}</span></div><div style={styles.budgetPeriod}>{period}</div><div style={styles.budgetAmount}>{formatCurrency(spent)} / {formatCurrency(limit)}</div></div>); }))}
        </div>
        <div style={styles.budgetListFooter}>
          <button onClick={() => setSelectedBudgetIds(new Set())} style={{ ...styles.clearAllBtn, width: '100%' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3498db'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.3)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#3498db'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>Clear All</button>
          <ScenarioSimulateButton onClick={() => setShowScenarioModal(true)} style={{ width: '100%', marginTop: '4px' }} />
          <div style={styles.budgetHint}>Click on budgets to select multiple and check specific budgets</div>
        </div>
      </div>
      <ScenarioSimulateModal open={showScenarioModal} onClose={() => setShowScenarioModal(false)} categories={categories} onSimulate={handleSimulate} simulationResult={simulationResult} transactions={transactions} selectedBudgetIds={selectedBudgetIds} allBudgets={budgets} />
      <div style={styles.mainContent}>
        {simulationResult && (<div style={{ background: 'linear-gradient(90deg, #ffe259 0%, #ffa751 100%)', color: '#232323', padding: '10px 18px', borderRadius: 10, margin: '0 0 12px 0', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(255, 174, 81, 0.10)' }}><span><span style={{ marginRight: 10, fontSize: 18 }}>⚡</span><span>Simulation Mode Active — {simulationResult.simulateType === 'both' && 'Both income & expenses simulating'}{simulationResult.simulateType === 'income' && 'Your income simulating'}{simulationResult.simulateType === 'expense' && 'Your expenses simulating'} {simulationResult.mode === 'percent' ? `by ${simulationResult.value > 0 ? '+' : ''}${simulationResult.value}%` : `to ${formatCurrency(simulationResult.value)}`}</span></span><button style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginLeft: 14 }} onClick={() => setSimulationResult(null)}>Clear Simulation</button></div>)}
        {simulationResult && <ForecastAndRecommendation simulationResult={simulationResult} transactions={transactions} budgets={budgets} selectedBudgetIds={selectedBudgetIds} />}
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <h2 style={styles.pageTitle}>Finance Analysis {selectedBudgetIds.size > 0 && `(${selectedBudgetIds.size} budget${selectedBudgetIds.size !== 1 ? 's' : ''})`}</h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="start-month" style={{ color: '#000' }}>From:</label>
              <select
                id="start-month"
                value={selectedStartMonth}
                onChange={e => setSelectedStartMonth(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #bdc3c7',
                  backgroundColor: '#fff',
                  color: '#000',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '120px'
                }}
              >
                <option value="all">All Time</option>
                {(() => {
                  const months = [];
                  const now = new Date();
                  for (let i = 0; i < 24; i++) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const year = d.getFullYear();
                    const month = d.getMonth() + 1;
                    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
                    const monthName = `${MONTH_NAMES[month - 1]} ${year}`;
                    months.push(<option key={monthStr} value={monthStr}>{monthName}</option>);
                  }
                  return months;
                })()}
              </select>
              <label htmlFor="end-month" style={{ color: '#000' }}>To:</label>
              <select
                id="end-month"
                value={selectedEndMonth}
                onChange={e => setSelectedEndMonth(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #bdc3c7',
                  backgroundColor: '#fff',
                  color: '#000',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '120px'
                }}
              >
                <option value="all">All Time</option>
                {(() => {
                  const months = [];
                  const now = new Date();
                  for (let i = 0; i < 24; i++) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const year = d.getFullYear();
                    const month = d.getMonth() + 1;
                    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
                    const monthName = `${MONTH_NAMES[month - 1]} ${year}`;
                    months.push(<option key={monthStr} value={monthStr}>{monthName}</option>);
                  }
                  return months;
                })()}
              </select>
            </div>
          </div>
          
          <p style={{ fontSize: '14px', color: '#95a5a6', margin: '0', fontStyle: 'italic' }}>💡 Tip: Use the dropdown above to view analysis for a specific month or all time</p>
        </div>

        {monthlyTrendData.length > 0 && (<div style={styles.sectionContainer}><h3 style={styles.sectionTitle}>Monthly Spending Trend (Last 12 Months)</h3><p style={{ fontSize: '12px', color: '#7f8c8d', margin: '0 0 12px 0' }}>Red line = Expenses, Green line = Income. Hover over points to see exact amounts.</p><ResponsiveContainer width="100%" height={350}><LineChart data={monthlyTrendData} margin={{ top: 5, right: 30, left: 60, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis tickFormatter={(value) => `${value}`} /><Tooltip formatter={(value) => formatCurrency(value)} /><Legend wrapperStyle={{ paddingTop: '12px' }} /><Line type="monotone" dataKey="spent" stroke="#e74c3c" name="Spending" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} /><Line type="monotone" dataKey="income" stroke="#27ae60" name="Income" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div>)}

        <p style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '16px', fontStyle: 'italic' }}>Budgets follow a monthly cycle and reset at the beginning of each month</p>

        <SummaryCards {...summaryData} />
        
        {categoryChartData.length > 0 && (<div style={styles.sectionContainer}><h3 style={styles.sectionTitle}>Top Category Spending</h3><p style={{ fontSize: '12px', color: '#7f8c8d', margin: '0 0 12px 0' }}>Red bars show expenses, green bars show income by category. Sorted by highest spending first.</p><div style={{ ...styles.chartContainer, width: '100%', padding: 0, marginBottom: 0 }}><ResponsiveContainer width="100%" height={500}><BarChart data={categoryChartData} margin={{ top: 20, right: 10, left: 40, bottom: 5 }} barCategoryGap="20%"><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" angle={0} textAnchor="middle" height={60} interval={0} padding={{ left: 30, right: 30 }} /><YAxis domain={[0, 'dataMax + 10']} tickFormatter={(value) => formatCurrency(value)} /><Tooltip formatter={(value) => formatCurrency(value)} /><Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} /><Bar dataKey="spent" fill="#e74c3c" name="Expense" radius={[4, 4, 0, 0]} /><Bar dataKey="income" fill="#27ae60" name="Income" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>)}
  {categoryChartData.length > 0 && (<div style={styles.sectionContainer}><h3 style={styles.sectionTitle}>Top Category Spending</h3><p style={{ fontSize: '12px', color: '#7f8c8d', margin: '0 0 12px 0' }}>Red bars show expenses, green bars show income by category. Sorted by highest spending first.</p><div style={{ ...styles.chartContainer, width: '100%', padding: 0, marginBottom: 0 }}><ResponsiveContainer width="100%" height={500}><BarChart data={categoryChartData} margin={{ top: 20, right: 10, left: 40, bottom: 5 }} barCategoryGap="20%"><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" angle={0} textAnchor="middle" height={60} interval={0} padding={{ left: 30, right: 30 }} /><YAxis domain={[0, 'dataMax + 10']} tickFormatter={(value) => `${value}`} /><Tooltip formatter={(value) => formatCurrency(value)} /><Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} /><Bar dataKey="spent" fill="#e74c3c" name="Expense" radius={[4, 4, 0, 0]} /><Bar dataKey="income" fill="#27ae60" name="Income" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>)}

        {categoryChartData.length > 0 && (<div style={styles.sectionContainer}><h3 style={styles.sectionTitle}>Category Breakdown</h3><p style={{ fontSize: '12px', color: '#7f8c8d', margin: '0 0 12px 0' }}>Detailed expense and income breakdown by category</p><div style={styles.tableWrapper}><table style={styles.table}><thead style={styles.tableHead}><tr><th style={styles.tableHeaderCell('left')}>Category</th><th style={styles.tableHeaderCell('right')}>Expenses</th><th style={styles.tableHeaderCell('right')}>Income</th><th style={styles.tableHeaderCell('right')}>Net</th></tr></thead><tbody>{categoryChartData.map((row, idx) => (<tr key={row.name} style={{ transition: 'background-color 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f4f8'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f9f9f9'; }}><td style={styles.tableCell('left', idx)}>{row.name}</td><td style={{...styles.tableCell('right', idx), color: '#e74c3c', fontWeight: '600'}}>{formatCurrency(row.spent)}</td><td style={{...styles.tableCell('right', idx), color: '#27ae60', fontWeight: '600'}}>{formatCurrency(row.income)}</td><td style={{...styles.tableCell('right', idx), fontWeight: '600', color: (row.income - row.spent) >= 0 ? '#27ae60' : '#e74c3c'}}>{formatCurrency(row.income - row.spent)}</td></tr>))}</tbody></table></div></div>)}

        <div style={styles.sectionContainer}>
          <h3 style={styles.sectionTitle}>Selected Budgets Overview</h3>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead style={styles.tableHead}>
                <tr><th style={styles.tableHeaderCell('left')}>Budget</th><th style={styles.tableHeaderCell('left')}>Period</th><th style={styles.tableHeaderCell('right')}>Limit</th><th style={styles.tableHeaderCell('right')}>Spent</th><th style={styles.tableHeaderCell('right')}>Remaining</th><th style={styles.tableHeaderCell('right')}>Usage %</th><th style={styles.tableHeaderCell('right')}>Income</th><th style={styles.tableHeaderCell('right')}>Adjusted Usage %</th></tr>
              </thead>
              <tbody>
                {monthlyTableData.length === 0 ? (<tr><td colSpan="8" style={styles.emptyTableCell}>Select budgets to see analysis</td></tr>) : monthlyTableData.map((row, idx) => (<tr key={row.id} style={{ transition: 'background-color 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f4f8'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f9f9f9'; }}><td style={styles.tableCell('left', idx)} title={row.name}>{row.name}</td><td style={styles.tableCell('left', idx)} title={row.period}>{row.period}</td><td style={styles.tableCell('right', idx)} title={`Limit: ${formatCurrency(row.limit)}`}>{formatCurrency(row.limit)}</td><td style={styles.tableCell('right', idx)} title={`Spent: ${formatCurrency(row.spent)}`}>{formatCurrency(row.spent)}</td><td style={styles.tableCellWithColor('right', getRemainingColor(row.remaining), idx)} title={`Remaining: ${formatCurrency(row.remaining)}`}>{formatCurrency(row.remaining)}</td><td style={styles.tableCell('right', idx)} title={`Usage: ${row.usage}%`}>{row.usage}%</td><td style={{...styles.tableCell('right', idx), color: '#27ae60', fontWeight: '600'}} title={`Income: ${formatCurrency(row.income)}`}>{formatCurrency(row.income)}</td><td style={styles.tableCell('right', idx)} title={`Adjusted Usage: ${row.adjustedUsage}%`}>{row.adjustedUsage}%</td></tr>))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analysis;
