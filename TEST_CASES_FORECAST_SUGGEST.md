# Forecast & Recommendation Test Cases

## Overview
The system has two main features:
1. **Forecast & Recommendation**: Projects 6-month balance and provides spending advice based on 6+ months of data
2. **Scenario Simulation with Smart Suggest**: Allows scenario testing with AI-powered suggestions based on 12-month trends

---

## FORECAST & RECOMMENDATION TEST CASES

### Test Case 1: Basic Forecast - Positive Balance Trend
**Setup:**
- Last 6 months of data available
- Monthly income: $3,000
- Monthly expenses: $2,000
- Budget limit: $2,500

**Expected Output:**
```
Forecast: Based on the last 6 months of data, your average monthly balance is $1,000. 
Over 6 months, your projected balance will be $6,000.

Recommendation: Your average monthly spending ($2,000) is at 80% of your budget ($2,500). 
Forecasted for 6 months, you'll have $3,000 remaining. Consider reducing expenses.
```

**Metrics Validated:**
- `avgMonthlyIncome` = 3,000
- `avgMonthlyExpense` = 2,000
- `forecastBalance` = (3,000 - 2,000) * 6 = 6,000
- `spendingPercentage` = (2,000 / 2,500) * 100 = 80%
- `remainingBudget` = 2,500 - 2,000 = 500

---

### Test Case 2: Negative Balance Trend
**Setup:**
- Last 6 months of data
- Monthly income: $2,000
- Monthly expenses: $2,500
- Budget limit: $2,200

**Expected Output:**
```
Forecast: Your average monthly balance is -$500. 
Over 6 months, your projected balance will be -$3,000.

Recommendation: Your average monthly spending ($2,500) exceeds your budget limit ($2,200). 
Based on this trend, in 6 months you'll be $1,800 over budget. 
Consider reducing expenses significantly.
```

**Metrics Validated:**
- `forecastBalance` = (2,000 - 2,500) * 6 = -3,000
- `spendingPercentage` = (2,500 / 2,200) * 100 = 113.6%
- `remainingBudget` = 2,200 - 2,500 = -300 (deficit)

---

### Test Case 3: Insufficient Data
**Setup:**
- Only 1-2 months of transactions
- No budget selected

**Expected Output:**
```
Forecast unavailable

Not enough transaction history in the selected scope to make a reliable forecast. 
Add more data or select budgets to see a projection.
```

**Validation:**
- `monthsAvailable` = 0 or 1
- Should display warning card (background: #fff6e6)

---

### Test Case 4: At Budget Limit (Critical)
**Setup:**
- Last 6 months data
- Monthly expenses: $2,000
- Budget limit: $2,000

**Expected Output:**
```
Recommendation: Your average monthly spending ($2,000) exceeds your budget limit ($2,000). 
Based on this trend, in 6 months you'll be $0 over budget. 
Consider reducing expenses significantly.
```

**Metrics Validated:**
- `spendingPercentage` = 100%
- Triggers "exceeds" message

---

### Test Case 5: Well Under Budget
**Setup:**
- Monthly expenses: $800
- Budget limit: $2,000
- Monthly income: $3,000

**Expected Output:**
```
Recommendation: Your average monthly spending ($800) is at 40% of your budget ($2,000). 
Forecasted for 6 months, you'll have $7,200 remaining. Great control!
```

**Metrics Validated:**
- `spendingPercentage` = 40%
- Displays "Great control!" message

---

### Test Case 6: No Budget Limit Set (Expense > Income)
**Setup:**
- Monthly income: $2,000
- Monthly expenses: $2,500
- No budget selected

**Expected Output:**
```
Recommendation: Your average monthly expenses ($2,500) exceed your average income ($2,000) 
by $500. Consider reducing expenses.
```

**Validation:**
- `totalBudgetLimit` = 0
- Falls back to income comparison logic

---

### Test Case 7: No Budget Limit (Expense < Income)
**Setup:**
- Monthly income: $3,500
- Monthly expenses: $1,800
- No budget limit

**Expected Output:**
```
Recommendation: Your average monthly income ($3,500) exceeds your average expenses ($1,800). 
You're saving about $1,700 per month.
```

---

### Test Case 8: Balanced Budget
**Setup:**
- Monthly income: $2,500
- Monthly expenses: $2,500
- No budget limit

**Expected Output:**
```
Recommendation: Your average income and expenses are balanced.
```

---

## SCENARIO SIMULATION WITH SMART SUGGEST TEST CASES

### Test Case 9: Suggest - Reduce Expenses by Percentage
**Setup:**
- 12 months of transaction history
- Latest month expenses: $2,500
- Budget limit: $2,000
- Budget is 20% over recommended

**User Action:** Click "Suggest" button

**Expected Output:**
```
Suggested: Reduce expenses by 20% to reach 75% of budget

Mode: Percent (%)
Value: -20
Simulate Type: Expense
```

**Logic:**
- `targetExpense` = 2,000 * 0.75 = 1,500
- `reductionPercentage` = (2,500 - 1,500) / 2,500 * 100 = 40%
- `suggestedValue` = -40%

---

### Test Case 10: Suggest - Upward Trending Expenses
**Setup:**
- 12 months of data with upward trend
- Monthly expenses: Jan: $1,500 → Dec: $2,300
- Budget limit: $2,500
- Expense trend: +8% per month average

**Expected Output:**
```
Suggested: Expenses trending upward. Reduce by 4% to stay within budget

Mode: Percent (%)
Value: -4
```

**Logic:**
- `expenseTrend` = 0.08 (8% average monthly increase)
- `suggestedValue` = Math.round(0.08 * -50) = -4%

---

### Test Case 11: Suggest - Stable Expenses (No Action Needed)
**Setup:**
- Stable monthly expenses: $1,500 ± $50
- Budget limit: $2,000

**Expected Output:**
```
Suggested: Your expenses are within budget. Good control!

Value: 0
```

---

### Test Case 12: Suggest - No Data for Selected Budgets
**Setup:**
- User selects specific budgets
- No transactions in selected budget categories in last 12 months

**Expected Output:**
```
Suggested: No data for selected budgets
```

---

### Test Case 13: Simulate - Expense Reduction by Percentage
**Setup:**
- Avg monthly expense: $2,000
- Simulate: -20% reduction
- Type: Expense

**Expected Simulation Output:**
```
Impact Summary:
├─ Average Current Monthly: 2000.00
├─ Simulated Average Monthly: 1600.00
├─ Average Monthly Change: -400.00 (expense)
└─ 3-Month Forecasted Cumulative Impact: -1200.00

Chart Data:
├─ Month 1: Cumulative = -400.00, isPositive = false
├─ Month 2: Cumulative = -800.00, isPositive = false
└─ Month 3: Cumulative = -1200.00, isPositive = false
```

**Metrics Validated:**
- `simulatedAmount` = 2,000 * (1 + (-20) / 100) = 1,600
- `monthlyImpact` = 1,600 - 2,000 = -400
- `cumulativeIn3Months` = -400 * 3 = -1,200

---

### Test Case 14: Simulate - Income Increase by Fixed Amount
**Setup:**
- Avg monthly income: $3,000
- Simulate: +$500 fixed amount
- Type: Income

**Expected Output:**
```
Impact Summary:
├─ Average Current Monthly: 3000.00
├─ Simulated Average Monthly: 3500.00
├─ Average Monthly Change: +500.00 (income)
└─ 3-Month Forecasted Cumulative Impact: +1500.00

Chart: Shows positive impact with green color
```

**Metrics Validated:**
- `simulatedAmount` = 3,000 + 500 = 3,500
- `monthlyImpact` = +500
- Color code: green (#27ae60)

---

### Test Case 15: Simulate - Both Income and Expense Changes
**Setup:**
- Avg monthly income: $3,000
- Avg monthly expense: $2,000
- Combined current: $5,000
- Simulate: -15% combined reduction

**Expected Output:**
```
Simulated Average Monthly: 4250.00
Average Monthly Change: -750.00 (both)
3-Month Cumulative: -2250.00
```

**Metrics Validated:**
- `currentAmount` = 3,000 + 2,000 = 5,000
- `simulatedAmount` = 5,000 * (1 - 0.15) = 4,250
- `monthlyImpact` = -750

---

### Test Case 16: Simulate - Multi-Budget Selection
**Setup:**
- Selected budgets: "Groceries" (limit: $500) + "Dining" (limit: $300)
- Total budget limit: $800
- Avg spending in these categories: $700

**Expected Output:**
```
Impact Summary shows:
├─ Current: 700.00
├─ Simulated (after 10% reduction): 630.00
├─ Monthly Savings: 70.00
└─ 3-Month Total: 210.00

Category Impact (in simulationResult.categories):
├─ Groceries: current vs simulated
└─ Dining: current vs simulated
```

---

### Test Case 17: Forecast with Simulation - Immediate Feedback
**Setup:**
- User runs forecast with negative balance
- Then simulates -10% expense reduction
- System should show both original forecast and new projected balance

**Expected Output:**
```
Original Forecast: -$3,000 over 6 months

[After Simulation]

Updated projection:
- Original monthly expense: $2,500
- Simulated monthly expense: $2,250
- New 6-month forecast: -$2,100 (improvement of $900)

Impact Summary: Shows -10% reduction = $250/month saved
```

---

### Test Case 18: Edge Case - Zero Income/Expense
**Setup:**
- Monthly income: $0
- Monthly expenses: $1,500
- Budget limit: $1,000

**Expected Output:**
```
Recommendation: Your average monthly expenses ($1,500) exceed your average income ($0) 
by $1,500. Consider reducing expenses.
```

---

### Test Case 19: Edge Case - Very Small Numbers
**Setup:**
- Monthly income: $5.50
- Monthly expenses: $2.25
- Budget limit: $3.00

**Expected Output:**
```
Forecast: Your average monthly balance is $3.25. 
Over 6 months, your projected balance will be $19.50.

Recommendation: Your average monthly spending ($2.25) is at 75% of your budget ($3.00). 
Forecasted for 6 months, you'll have $4.50 remaining.
```

**Validation:**
- Proper decimal handling (2 decimal places for currency)

---

### Test Case 20: Edge Case - Very Large Numbers
**Setup:**
- Monthly income: $500,000
- Monthly expenses: $450,000
- Budget limit: $400,000

**Expected Output:**
```
Forecast: Your average monthly balance is $50,000. 
Over 6 months, your projected balance will be $300,000.

Recommendation: Your average monthly spending ($450,000) exceeds your budget limit ($400,000). 
Based on this trend, in 6 months you'll be $300,000 over budget. 
Consider reducing expenses significantly.
```

**Validation:**
- Proper formatting of large numbers

---

## TEST EXECUTION STRATEGY

### Manual Testing
1. Create test transactions in each category over 6-12 months
2. Set up multiple budgets with different limits
3. Observe forecast and recommendation updates
4. Test suggest button with various expense trends
5. Run simulations and verify cumulative impact

### Automated Testing
```javascript
// Example test for forecast calculation
test('Forecast calculates 6-month balance correctly', () => {
  const monthsAvailable = 6;
  const avgMonthlyIncome = 3000;
  const avgMonthlyExpense = 2000;
  
  const forecastBalance = (avgMonthlyIncome - avgMonthlyExpense) * 6;
  expect(forecastBalance).toBe(6000);
});

// Example test for suggestion logic
test('Suggest reduces expenses to 75% of budget', () => {
  const currentExpense = 2500;
  const budgetLimit = 2000;
  const targetExpense = budgetLimit * 0.75; // 1500
  const reductionPercentage = ((currentExpense - targetExpense) / currentExpense) * 100;
  
  expect(Math.round(-reductionPercentage)).toBe(-40);
});
```

---

## KEY METRICS TO VALIDATE

| Metric | Formula | Range | Notes |
|--------|---------|-------|-------|
| Average Monthly Income | sum(income) / months | $0+ | Must have 6+ months |
| Average Monthly Expense | sum(expense) / months | $0+ | Must have 6+ months |
| Forecast Balance (6 months) | (income - expense) * 6 | $-∞ to +∞ | Can be negative |
| Spending Percentage | (expense / budget) * 100 | 0-999%+ | >100% = over budget |
| 3-Month Cumulative | monthlyImpact * 3 | $-∞ to +∞ | Shows total impact |
| Trend Analysis | monthly change average | -50% to +50% | Capped for stability |

