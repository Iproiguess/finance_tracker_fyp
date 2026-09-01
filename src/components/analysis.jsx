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
import { ScenarioSimulateModal } from './ScenarioSimulateModal';
import { ForecastAndRecommendation } from './ForecastAndRecommendation';
import { HeatmapSection } from './HeatmapModal';

// Custom tooltip component for trend chart
const TrendChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: '#fff', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
        <p style={{ margin: '0 0 4px 0', color: '#000', fontWeight: '600' }}>{payload[0].payload.month}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: '2px 0', color: entry.color, fontSize: '12px' }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function Analysis({ activeFeatures = { forecast: false, simulation: false, heatmap: false }, setActiveFeatures = () => {}, selectedStartMonth = 'all', selectedEndMonth, fetchTransactions, handleBudgetsChanged = () => {}, isMobile: isMobileProp = false, mobileBudgetSidebarOpen = false, onMobileBudgetSidebarToggle = () => {} }) {
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { categories, loading: categoriesLoading } = useCategories();

  // Get current month in YYYY-MM format
  const getCurrentMonthString = React.useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, []);

  // Use current month as default if not provided
  const finalSelectedEndMonth = selectedEndMonth || getCurrentMonthString();

  // Store modal state persistently
  const [modalMode, setModalMode] = React.useState('percent');
  const [modalValue, setModalValue] = React.useState('');
  const [modalSimulateType, setModalSimulateType] = React.useState('expense');
  const [modalSelectedBudgetIds, setModalSelectedBudgetIds] = React.useState(new Set());
  const [showScenarioModal, setShowScenarioModal] = React.useState(false);
  const [lastBudgetFetchTime, setLastBudgetFetchTime] = React.useState(0);
  const [viewportIsMobile, setViewportIsMobile] = React.useState(() => window.innerWidth <= 768);
  const simulationInitializedRef = React.useRef(false);

  React.useEffect(() => {
    const handleResize = () => setViewportIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { loading, selectedBudgetIds, setSelectedBudgetIds, toggleBudgetSelection, filteredBudgets, summaryData, monthlyTableData, categoryChartData, monthlyTrendData, simulationResult, setSimulationResult } = useAnalysisData(budgets, transactions, categories, budgetsLoading, transactionsLoading, categoriesLoading, selectedStartMonth, finalSelectedEndMonth);

  // Notify parent when selected budgets change
  React.useEffect(() => {
    handleBudgetsChanged(selectedBudgetIds);
  }, [selectedBudgetIds, handleBudgetsChanged]);

  // Refresh transactions when budget selection changes (with throttling)
  React.useEffect(() => {
    if (fetchTransactions) {
      const now = Date.now();
      // Only fetch if more than 2 seconds have passed since last budget-triggered fetch
      if (now - lastBudgetFetchTime > 2000) {
        fetchTransactions();
        setLastBudgetFetchTime(now);
      }
    }
  }, [selectedBudgetIds, fetchTransactions, lastBudgetFetchTime]);

  // Only open modal on initial toggle ON, not on page returns
  React.useEffect(() => {
    if (activeFeatures.simulation && !simulationInitializedRef.current) {
      setShowScenarioModal(true);
      simulationInitializedRef.current = true;
    } else if (!activeFeatures.simulation) {
      // Close modal and clear simulation when toggled OFF
      setShowScenarioModal(false);
      setSimulationResult(null);
      simulationInitializedRef.current = false;
    }
  }, [activeFeatures.simulation]);

  if (loading) return <div style={styles.container}><div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#333', fontWeight: 500 }}>Loading analysis...</div></div>;

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
        simulatedExpense = mode === 'percent' ? currentExpense + (currentExpense * (value / 100)) : Math.max(0, currentExpense + value);
      }
      if (simulateType === 'income' || simulateType === 'both') {
        const incomeTxs = transactions.filter(tx => tx.category_id === cat.category_id && tx.type === 'income');
        currentIncome = incomeTxs.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
        simulatedIncome = mode === 'percent' ? currentIncome + (currentIncome * (value / 100)) : Math.max(0, currentIncome + value);
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

  const isMobileView = isMobileProp || viewportIsMobile;

  const renderBudgetSidebar = () => (
    <div style={isMobileView ? {
      ...styles.sidebarDrawer,
      left: 0,
      right: 'auto',
      transform: mobileBudgetSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
      width: '74vw',
      maxWidth: '320px',
      borderLeft: 'none',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '8px 0 24px rgba(0,0,0,0.22)',
      zIndex: mobileBudgetSidebarOpen ? 102 : 90,
      padding: '8px 14px 16px'
    } : styles.sidebar}>
      <div style={isMobileView ? { ...styles.sidebarHeader, marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' } : styles.sidebarHeader}>
        <h3 style={isMobileView ? { ...styles.sidebarTitle, margin: '0 0 6px 0', color: '#8a93a8', fontSize: '14px', fontWeight: 600, letterSpacing: '0.4px' } : styles.sidebarTitle}>Budgets</h3>
        <p style={isMobileView ? { ...styles.sidebarSubtitle, fontSize: '12px', color: '#8a93a8', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' } : styles.sidebarSubtitle}>{selectedBudgetIds.size === 0 ? 'All' : `${selectedBudgetIds.size}`} selected</p>
      </div>
      <div style={styles.budgetList}>
        {budgets.length === 0 ? (<div style={styles.emptyBudgetText}>No budgets created yet</div>) : (budgets.map(budget => { const spent = getCurrentSpendingByBudget(budget, transactions); const limit = parseFloat(budget.monthly_limit || 0); const isSelected = selectedBudgetIds.has(budget.budget_id); const period = budget.month ? `${MONTH_NAMES[budget.month - 1]} ${budget.year}` : `${budget.year}`; return (<div key={budget.budget_id} onClick={() => toggleBudgetSelection(budget.budget_id)} style={styles.budgetItem(isSelected)} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3d5a80'; e.currentTarget.style.border = '2px solid #3498db'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.15)'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={(e) => { const baseStyle = styles.budgetItem(isSelected); e.currentTarget.style.backgroundColor = baseStyle.backgroundColor; e.currentTarget.style.border = baseStyle.border; e.currentTarget.style.boxShadow = baseStyle.boxShadow; e.currentTarget.style.transform = baseStyle.transform; }} title={`Click to ${isSelected ? 'deselect' : 'select'} this budget`}><div style={styles.budgetItemHeader}><span style={styles.budgetName}>{budget.budget_name || 'Unnamed'}</span></div><div style={styles.budgetPeriod}>{period}</div><div style={styles.budgetAmount}>{formatCurrency(spent)} / {formatCurrency(limit)}</div></div>); }))}
      </div>
      <div style={styles.budgetListFooter}>
        <button onClick={() => setSelectedBudgetIds(new Set())} style={{ ...styles.clearAllBtn, width: '100%' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3498db'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.3)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#3498db'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>Clear All</button>
        <div style={styles.budgetHint}>Click on budgets to select multiple and check specific budgets</div>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      {isMobileView && mobileBudgetSidebarOpen && (
        <>
          <div style={{ ...styles.sidebarDrawerBackdrop, zIndex: 101 }} onClick={() => onMobileBudgetSidebarToggle(false)} />
          {renderBudgetSidebar()}
        </>
      )}
      {!isMobileView && renderBudgetSidebar()}
      <ScenarioSimulateModal 
        open={showScenarioModal} 
        onClose={() => setShowScenarioModal(false)}
        onCancel={() => {
          setShowScenarioModal(false);
          setActiveFeatures(prev => ({ ...prev, simulation: false }));
          setSimulationResult(null);
        }}
        categories={categories} 
        onSimulate={handleSimulate} 
        simulationResult={simulationResult} 
        transactions={transactions} 
        selectedBudgetIds={selectedBudgetIds} 
        allBudgets={budgets}
        initialMode={modalMode}
        initialValue={modalValue}
        initialSimulateType={modalSimulateType}
        initialModalSelectedBudgetIds={modalSelectedBudgetIds}
        onModalStateChange={(state) => {
          setModalMode(state.mode);
          setModalValue(state.value);
          setModalSimulateType(state.simulateType);
          setModalSelectedBudgetIds(state.modalSelectedBudgetIds);
        }}
      />
      <div style={styles.mainContent}>
        {/* SIMULATION NOTIFICATION - Shows when simulation toggle is ON */}
        {activeFeatures.simulation && simulationResult && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fff3cd', borderRadius: 8, border: '2px solid #ffc107', display: 'flex', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, color: '#856404', fontWeight: '600', fontSize: '16px' }}>Simulation Mode Active</p>
              <p style={{ margin: '4px 0 0 0', color: '#856404', fontSize: '14px', opacity: 0.8 }}>
                Simulating {simulationResult.simulateType} by {simulationResult.mode === 'percent' ? `${simulationResult.value}%` : formatCurrency(simulationResult.value)} • Toggle off to return to actual data.
              </p>
            </div>
          </div>
        )}

        {/* FORECAST OVERLAY - Shows forecast + impact summary + chart when forecast toggle is ON */}
        {activeFeatures.forecast && (
          <>
            <div style={{ marginBottom: '20px', padding: '16px', background: '#e3f6f5', borderRadius: 8, border: '2px solid #17a2b8' }}>
              <h2 style={styles.pageTitle}>📊 Forecast</h2>
              <ForecastAndRecommendation simulationResult={simulationResult} transactions={transactions} budgets={budgets} selectedBudgetIds={selectedBudgetIds} />
            </div>
          </>
        )}

        {/* HEATMAP - Shows annual spending heatmap when heatmap toggle is ON */}
        {activeFeatures.heatmap && (
          <HeatmapSection
            transactions={transactions}
            categories={categories}
            simulationResult={simulationResult}
            budgets={budgets}
          />
        )}

        {/* ALWAYS SHOW: Full Stats/Analysis Page */}
        <>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={styles.pageTitle}>Finance Analysis {selectedBudgetIds.size > 0 && `(${selectedBudgetIds.size} budget${selectedBudgetIds.size !== 1 ? 's' : ''})`}</h2>
          </div>
          
          {monthlyTrendData.length > 0 && (
            <div style={{ ...styles.sectionContainer, width: '100%' }}>
              <h3 style={styles.sectionTitle}>Monthly Spending Trend (Last 12 Months)</h3>
              <p style={{ fontSize: '12px', color: '#7f8c8d', margin: '0 0 12px 0' }}>Red line = Expenses, Green line = Income. Hover over points to see exact amounts.</p>
              <div style={{ ...styles.chartContainer, width: '100%', padding: 0, marginBottom: 0 }}>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={monthlyTrendData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }} isAnimationActive={true} animationDuration={800} animationEasing="ease-in-out">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${value}`} />
                    <Tooltip content={<TrendChartTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '12px' }} />
                    <Line type="monotone" dataKey="spent" stroke="#e74c3c" name="Spending" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} isAnimationActive={true} animationDuration={800} animationEasing="ease-in-out" />
                    <Line type="monotone" dataKey="income" stroke="#27ae60" name="Income" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} isAnimationActive={true} animationDuration={800} animationEasing="ease-in-out" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        <p style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '16px', fontStyle: 'italic' }}>Budgets follow a monthly cycle and reset at the beginning of each month</p>

        <SummaryCards {...summaryData} />
        
        {categoryChartData.length > 0 && (<div style={styles.sectionContainer}><h3 style={styles.sectionTitle}>Top Category Spending</h3><p style={{ fontSize: '12px', color: '#7f8c8d', margin: '0 0 12px 0' }}>Red bars show expenses, green bars show income by category. Sorted by highest spending first.</p><div style={{ ...styles.chartContainer, width: '100%', padding: 0, marginBottom: 0 }}><ResponsiveContainer width="100%" height={500}><BarChart data={categoryChartData} margin={{ top: 20, right: 10, left: 40, bottom: 5 }} barCategoryGap="20%"><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" angle={0} textAnchor="middle" height={60} interval={0} padding={{ left: 30, right: 30 }} /><YAxis domain={[0, 'dataMax + 10']} tickFormatter={(value) => formatCurrency(value)} /><Tooltip formatter={(value) => formatCurrency(value)} /><Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} /><Bar dataKey="spent" fill="#e74c3c" name="Expense" radius={[4, 4, 0, 0]} /><Bar dataKey="income" fill="#27ae60" name="Income" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>)}

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
        </>
      </div>
    </div>
  );
}

export default Analysis;
