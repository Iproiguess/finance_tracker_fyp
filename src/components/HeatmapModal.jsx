import React, { useState, useMemo, useEffect } from 'react';
import { styles } from './styles/analysisStyles';
import { formatCurrency } from './styles/budgetSummaryStyles';

/**
 * HeatmapModal - GitHub-style annual spending heatmap visualization
 * 
 * DESCRIPTION:
 * Shows a 7x52 grid (days of week × weeks of year) with color intensity
 * representing spending per day. Simulates GitHub's contribution heatmap.
 * 
 * ARCHITECTURE:
 * - Props: open, onClose, transactions, categories, simulationResult
 * - Data Flow: transactions → dailySpendingMap (aggregated by date) → color mapping
 * - Performance: Uses useMemo for dailySpendingMap and maxSpending
 * - Simulation: Respects simulationResult.selectedCategoryIds when present
 * 
 * IMPLEMENTATION CHECKPOINTS:
 * 1. Data Calculation: dailySpendingMap (lines 26-43)
 *    - Aggregates transaction amounts by YYYY-MM-DD date
 *    - Filters by selectedCategoryIds if simulation is active
 *    - Format: { "2026-01-15": 125.50, "2026-01-16": 45.00, ... }
 * 
 * 2. Color Mapping: getSpendingColor() (lines 45-58)
 *    - Maps spending intensity (0-1) to color scale
 *    - Uses GitHub-inspired green gradient
 *    - Color formula: intensity = amount / maxSpending
 * 
 * 3. Calendar Grid: generateYearDays() (lines 60-75)
 *    - Creates array of 365 day objects for current year
 *    - Each day has: dateStr, dayOfWeek, spending amount
 *    - Uses ISO date format (YYYY-MM-DD)
 * 
 * 4. Week Organization: getWeeksData() (lines 77-103)
 *    - Organizes days into 52-53 week arrays
 *    - Pads leading days (before Jan 1 dayOfWeek)
 *    - Pads trailing days (after Dec 31)
 *    - Each week = [null/day, null/day, ..., null/day] (7 elements)
 * 
 * FUTURE ENHANCEMENTS:
 * TODO: Add category selector dropdown for per-category heatmaps
 * TODO: Add spending threshold selector (highlight days > $X)
 * TODO: Add week number labels (1-52) on top row
 * TODO: Add year selector for multi-year comparison
 * TODO: Add export as PNG/image functionality
 * 
 * STYLING:
 * - Uses existing styles from analysisStyles.js
 * - Modal overlay, header, and standard button styles
 * - Cell size: 14px × 14px (matches GitHub heatmap)
 * - Gap between cells: 4px (for visual separation)
 * 
 * PERFORMANCE NOTES:
 * - dailySpendingMap recalculates when transactions or simulationResult changes
 * - Color calculation is O(1) per cell
 * - Grid rendering is optimized with memoization
 * - Responsive scrolling for wide heatmaps
 */
export function HeatmapSection({
  transactions = [],
  categories = [],
  simulationResult = null,
  budgets = [],
}) {
  // State for multi-cell selection
  const [selectedCells, setSelectedCells] = useState([]);
  
  // State for year selection
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Toggle cell selection
  const toggleCell = (day) => {
    const exists = selectedCells.find(c => c.dateStr === day.dateStr);
    if (exists) {
      setSelectedCells(selectedCells.filter(c => c.dateStr !== day.dateStr));
    } else {
      setSelectedCells([...selectedCells, { 
        dateStr: day.dateStr, 
        spending: day.spending, 
        day: day.day,
        reductionPercentage: 20 
      }]);
    }
  };
  
  // Remove individual cell from selection
  const removeCell = (dateStr) => {
    setSelectedCells(selectedCells.filter(c => c.dateStr !== dateStr));
  };
  
  // Update reduction percentage for a specific cell
  const updateCellReduction = (dateStr, percentage) => {
    setSelectedCells(selectedCells.map(c => 
      c.dateStr === dateStr ? { ...c, reductionPercentage: percentage } : c
    ));
  };

  // Add slider CSS styles
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('heatmap-range-styles')) {
      const style = document.createElement('style');
      style.id = 'heatmap-range-styles';
      style.textContent = `
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3498db;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          margin-top: -4px;
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3498db;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          margin-top: 0;
        }
        
        input[type="range"]::-moz-range-track {
          border: none;
          background: transparent;
        }
        
        #heatmap-year-select:focus {
          outline: none;
          box-shadow: none;
        }
        
        #heatmap-year-select {
          outline: none;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // CHECKPOINT 1 - Calculate daily spending data
  const dailySpendingMap = useMemo(() => {
    const map = {};
    
    const relevantTransactions = simulationResult 
      ? transactions.filter(tx => 
          simulationResult.selectedCategoryIds.includes(tx.category_id)
        )
      : transactions;

    relevantTransactions.forEach(tx => {
      const date = tx.date;
      if (!date) return;
      
      if (!map[date]) {
        map[date] = 0;
      }
      map[date] += parseFloat(tx.amount || 0);
    });

    return map;
  }, [transactions, simulationResult]);

  // CHECKPOINT 2 - Color mapping logic
  const maxSpending = useMemo(() => {
    if (Object.keys(dailySpendingMap).length === 0) return 100;
    return Math.max(...Object.values(dailySpendingMap));
  }, [dailySpendingMap]);

  const getSpendingColor = (amount) => {
    if (amount === 0) return '#ebedf0';
    const intensity = Math.min(amount / maxSpending, 1);
    
    if (intensity < 0.25) return '#c6e48b';
    if (intensity < 0.5) return '#7bc96f';
    if (intensity < 0.75) return '#239a3b';
    return '#0d3817';
  };

  // CHECKPOINT 3 - Generate all 365 days
  const generateYearDays = () => {
    const year = selectedYear;
    const days = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        dateStr,
        day: new Date(d),
        dayOfWeek: new Date(d).getDay(),
        spending: dailySpendingMap[dateStr] || 0,
      });
    }
    return days;
  };

  const yearDays = useMemo(() => generateYearDays(), [selectedYear]);

  // CHECKPOINT 4 - Organize into weeks with month labels
  const getWeeksDataWithMonths = () => {
    const weeks = [];
    let currentWeek = [];
    
    const firstDay = yearDays[0];
    const startDayOfWeek = firstDay.dayOfWeek;
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    yearDays.forEach((day, idx) => {
      currentWeek.push(day);
      if (day.dayOfWeek === 6 || idx === yearDays.length - 1) {
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    return weeks;
  };

  const weeksData = getWeeksDataWithMonths();

  // Get month for a given week
  const getMonthForWeek = (week) => {
    for (let day of week) {
      if (day) return day.day.getMonth();
    }
    return -1;
  };

  // Calculate aggregate health impact from all selected cells
  const calculateAggregateImpact = () => {
    if (selectedCells.length === 0) return null;
    
    let totalCurrentSpending = 0;
    let totalReducedSpending = 0;
    let totalSavings = 0;
    
    selectedCells.forEach(cell => {
      const currentSpending = cell.spending;
      const reducedSpending = currentSpending * (1 - cell.reductionPercentage / 100);
      const savings = currentSpending - reducedSpending;
      
      totalCurrentSpending += currentSpending;
      totalReducedSpending += reducedSpending;
      totalSavings += savings;
    });
    
    const monthSpending = yearDays
      .filter(d => selectedCells.some(c => c.day.getMonth() === d.day.getMonth()))
      .reduce((sum, d) => sum + d.spending, 0);
    
    const savingsPercentage = (totalSavings / (monthSpending || 1)) * 100;
    const healthScoreImprovement = savingsPercentage * 0.1;
    
    return {
      totalCurrentSpending,
      totalReducedSpending,
      totalSavings,
      healthScoreImprovement: Math.round(healthScoreImprovement * 10) / 10,
    };
  };
  
  const aggregateImpact = calculateAggregateImpact();

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // TODO: CHECKPOINT 5 - Render inline heatmap section
  return (
    <div style={styles.sectionContainer}>
      {/* Container always visible */}
      <div style={{
        padding: '16px',
        backgroundColor: '#fff9e6',
        borderRadius: '8px',
        border: '2px solid #ffc107',
        marginBottom: '16px',
      }}>
        {/* Title and Year Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: '#000', fontSize: '16px', fontWeight: '600' }}>Annual Spending Heatmap</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: '#000', fontWeight: '600' }}>Year:</label>
            <select
              id="heatmap-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                color: '#000',
                backgroundColor: '#ffffff',
                border: '1px solid #ffc107',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
                outline: 'none',
              }}
            >
              {Array.from({ length: new Date().getFullYear() - 1990 + 1 }, (_, i) => 1990 + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: '12px', color: '#000', margin: '0 0 16px 0', fontWeight: '500' }}>
          Click cells to see what-if scenarios. Darker green = higher spending.
          {simulationResult && ' Simulation mode active - showing simulated values.'}
        </p>

        {/* Heatmap Grid */}
        <div style={{ overflowX: 'auto', overflowY: 'hidden', marginBottom: '16px' }}>
          <div style={{ display: 'inline-block', minWidth: '100%' }}>
            {/* Month labels - Calculate month sections */}
            {(() => {
              const monthSections = [];
              let currentMonth = -1;
              let monthStart = 0;
              let monthWeeks = 0;
              
              weeksData.forEach((week, weekIdx) => {
                const month = getMonthForWeek(week);
                if (month !== currentMonth) {
                  if (currentMonth >= 0) {
                    monthSections.push({ month: currentMonth, start: monthStart, weeks: monthWeeks });
                  }
                  currentMonth = month;
                  monthStart = weekIdx;
                  monthWeeks = 0;
                }
                monthWeeks++;
              });
              if (currentMonth >= 0) {
                monthSections.push({ month: currentMonth, start: monthStart, weeks: monthWeeks });
              }
              
              return (
                <div style={{ display: 'flex', marginBottom: '4px', gap: '4px', paddingLeft: '35px' }}>
                  {monthSections.map((section) => (
                    <div
                      key={`month-${section.month}`}
                      style={{
                        width: `${section.weeks * 18 - 4}px`,
                        fontSize: '11px',
                        color: '#666',
                        fontWeight: '600',
                        textAlign: 'center',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {section.month >= 0 ? MONTHS[section.month] : ''}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Heatmap rows */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {/* Row labels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '8px' }}>
                {DAYS.map(day => (
                  <div
                    key={day}
                    style={{
                      width: '30px',
                      height: '14px',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#666',
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid cells */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {weeksData.map((week, weekIdx) => (
                  <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {week.map((day, dayIdx) => (
                      <div
                        key={`${weekIdx}-${dayIdx}`}
                        style={{
                          width: '14px',
                          height: '14px',
                          backgroundColor: day ? getSpendingColor(day.spending) : '#000000',
                          border: '1px solid #000',
                          borderRadius: '2px',
                          cursor: day ? 'pointer' : 'default',
                          transition: 'all 0.2s ease',
                          boxShadow: selectedCells.some(c => c.dateStr === day?.dateStr)
                            ? '0 0 8px rgba(0,0,0,0.4), inset 0 0 0 2px #fff'
                            : 'none',
                        }}
                        onClick={() => day && toggleCell(day)}
                        title={day ? `${day.dateStr}: ${formatCurrency(day.spending)}` : ''}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #ffc107' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#000' }}>
            Spending Intensity
          </p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#ebedf0', border: '1px solid #000' }} />
              <span style={{ color: '#000' }}>None</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#c6e48b', border: '1px solid #000' }} />
              <span style={{ color: '#000' }}>Low</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#7bc96f', border: '1px solid #000' }} />
              <span style={{ color: '#000' }}>Medium</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#239a3b', border: '1px solid #000' }} />
              <span style={{ color: '#000' }}>High</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#0d3817', border: '1px solid #000' }} />
              <span style={{ color: '#000' }}>Very High</span>
            </div>
          </div>
        </div>

        {/* Individual containers for each selected cell */}
        {selectedCells.map((cell) => {
          const reducedAmount = cell.spending * (cell.reductionPercentage / 100);
          const finalAmount = cell.spending * (1 - cell.reductionPercentage / 100);
          
          return (
          <div key={cell.dateStr} style={{
            marginBottom: '12px',
            padding: '12px',
            backgroundColor: '#f9f5e6',
            borderRadius: '6px',
            border: '1px solid #ffc107',
          }}>
            {/* Cell header with date and remove button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#000' }}>
                {cell.dateStr}
              </div>
              <button
                onClick={() => removeCell(cell.dateStr)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#e74c3c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  marginLeft: '8px',
                  flexShrink: 0,
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#c0392b'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#e74c3c'}
              >
                Remove
              </button>
            </div>

            {/* Expense Statistics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '10px', borderRadius: '4px', border: '1px solid #e1e4e8' }}>
                <p style={{ margin: 0, color: '#666', fontSize: '11px', fontWeight: '500' }}>Current Expense</p>
                <p style={{ margin: '6px 0 0 0', fontWeight: '600', color: '#e74c3c', fontSize: '13px' }}>
                  {formatCurrency(cell.spending)}
                </p>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '10px', borderRadius: '4px', border: '1px solid #e1e4e8' }}>
                <p style={{ margin: 0, color: '#666', fontSize: '11px', fontWeight: '500' }}>Reduced by</p>
                <p style={{ margin: '6px 0 0 0', fontWeight: '600', color: '#f39c12', fontSize: '13px' }}>
                  {formatCurrency(reducedAmount)}
                </p>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '10px', borderRadius: '4px', border: '1px solid #e1e4e8' }}>
                <p style={{ margin: 0, color: '#666', fontSize: '11px', fontWeight: '500' }}>After Reduction</p>
                <p style={{ margin: '6px 0 0 0', fontWeight: '600', color: '#27ae60', fontSize: '13px' }}>
                  {formatCurrency(finalAmount)}
                </p>
              </div>
            </div>

            {/* Reduction Slider */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#000', marginBottom: '6px' }}>
                Reduce by: {cell.reductionPercentage}%
              </label>
              <div style={{ position: 'relative', marginBottom: '6px' }}>
                {/* Background bar */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: '6px',
                  background: 'linear-gradient(to right, #ebedf0 0%, #c6e48b 25%, #7bc96f 50%, #239a3b 75%, #0d3817 100%)',
                  border: '1px solid #e1e4e8',
                  borderRadius: '3px',
                  transform: 'translateY(-50%)',
                  zIndex: 1,
                  pointerEvents: 'none',
                }} />
                {/* 50% Midpoint Dot */}
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#fff',
                  border: '2px solid #333',
                  borderRadius: '50%',
                  zIndex: 2,
                  pointerEvents: 'none',
                }} />
                {/* Range input */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={cell.reductionPercentage}
                  onChange={(e) => updateCellReduction(cell.dateStr, parseFloat(e.target.value))}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '8px',
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    zIndex: 3,
                  }}
                />
              </div>
              <div style={{
                position: 'relative',
                height: '16px',
              }}>
                <div style={{ position: 'absolute', left: '0', fontSize: '10px', color: '#999' }}>0%</div>
                <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', color: '#999' }}>50%</div>
                <div style={{ position: 'absolute', right: '0', fontSize: '10px', color: '#999' }}>100%</div>
              </div>
            </div>
          </div>
        );
        })}

        {/* Aggregate Statistics */}
        {selectedCells.length > 0 && aggregateImpact && (
          <div style={{
            marginBottom: '12px',
            padding: '12px',
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            border: '2px solid #27ae60',
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#000', fontSize: '13px', fontWeight: '600' }}>
              Total Impact ({selectedCells.length} day{selectedCells.length !== 1 ? 's' : ''} selected)
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
              <div>
                <p style={{ margin: 0, color: '#666', fontSize: '11px' }}>Current Spending</p>
                <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: '#e74c3c', fontSize: '14px' }}>
                  {formatCurrency(aggregateImpact.totalCurrentSpending)}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, color: '#666', fontSize: '11px' }}>Final Spending</p>
                <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: '#27ae60', fontSize: '14px' }}>
                  {formatCurrency(aggregateImpact.totalReducedSpending)}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, color: '#666', fontSize: '11px' }}>Total Spending Reduced</p>
                <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: '#27ae60', fontSize: '14px' }}>
                  {formatCurrency(aggregateImpact.totalSavings)}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, color: '#666', fontSize: '11px' }}>Reduction Percentage</p>
                <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: '#3498db', fontSize: '14px' }}>
                  {((aggregateImpact.totalSavings / aggregateImpact.totalCurrentSpending) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            
            <p style={{
              margin: '12px 0 0 0',
              padding: '12px',
              backgroundColor: '#e3f6f5',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#000',
            }}>
              Total combined savings from the selected {selectedCells.length} day{selectedCells.length !== 1 ? 's' : ''} with your adjusted reduction percentages.
            </p>
          </div>
        )}

        {/* Clear Button */}
        {selectedCells.length > 0 && (
          <button
            onClick={() => setSelectedCells([])}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#e74c3c',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#c0392b'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#e74c3c'}
          >
            Clear All Selections
          </button>
        )}
      </div>
    </div>
  );
}

export default HeatmapSection;
