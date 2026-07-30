# Automation Feature Implementation Guide

## Overview
This document explains the new automation feature added to the Finance Tracker application.

## Features Implemented

### 1. Fixed Simulation Button Toggle (Analysis Page)
**File:** `src/components/ScenarioSimulateModal.jsx`

**Issue:** When clicking the X close button on the scenario simulation modal, the simulation button in the submenu was not being untoggled.

**Fix:** Changed the close button's `onClick` handler from `onClose` to `onCancel`, ensuring the simulation state is properly reset and the button is untoggled.

**User Impact:**
- Users can now close the simulation modal using the X button and the simulation mode will be properly deactivated
- The simulation button will correctly show as unpressed after closing

---

### 2. Transaction Automation Feature
**New Files:**
- `src/components/AutomationModal.jsx`
- `src/hooks/useAutomations.js`
- `supabase_migration_automations.sql`

**Updated Files:**
- `src/components/transactionlist.jsx`

#### Features:
1. **Create Automated Transactions**
   - Set transaction details (description, amount, category)
   - Choose transaction type (income/expense)
   - Set start date

2. **Configure Frequency**
   - **Daily:** Transaction adds every day
   - **Weekly:** Transaction adds every week
   - **Monthly:** Transaction adds every month (default)
   - **Custom:** Set custom frequency in days (e.g., every 15 days)

3. **Add Immediately Option**
   - Checkbox to add the transaction to the list right away
   - When added, transaction is marked as "[inserted by automation system]"
   - Helps users verify the automation is working

4. **Manage Automations**
   - **View List:** All active automations displayed below the creation form
   - **Deactivate:** Pause an automation without deleting it (shows play icon)
   - **Reactivate:** Resume a paused automation
   - **Delete:** Remove an automation permanently

#### User Interface
**Button Location:** Next to the "Add Transaction" button on the transaction page
- Button Label: "⚙ Automation"
- Color: Gray (to differentiate from the blue "Add Transaction" button)
- Tooltip: "Set up automatic recurring transactions"

**Modal Layout:**
```
┌─────────────────────────────────────────┐
│ Transaction Automation              [X] │
├─────────────────────────────────────────┤
│                                         │
│ CREATE NEW AUTOMATION                   │
│ ─────────────────────────────────────── │
│ Description: [____________]             │
│ Amount: [_____]  Type: [Expense ▼]     │
│ Category: [Select ▼]  Start: [Date]   │
│ Frequency: [Daily] [Weekly] [Monthly]  │
│            [Custom: _____ days]         │
│ ☑ Add transaction to list now          │
│ [Create Automation]                     │
│                                         │
├─────────────────────────────────────────┤
│ ACTIVE AUTOMATIONS (3)                  │
│ ─────────────────────────────────────── │
│                                         │
│ 📋 Monthly subscription                │
│    $15.00 • Subscriptions • Monthly     │
│ [⏸] [🗑]                               │
│                                         │
│ 📋 Salary deposit                       │
│    $3,000.00 • Salary • Monthly         │
│ [⏸] [🗑]                               │
│                                         │
│ 📋 Gym membership                       │
│    $25.00 • Fitness (Inactive)          │
│ [▶] [🗑]                                │
│                                         │
└─────────────────────────────────────────┘
```

---

## Database Setup

### Required Migration
Run the SQL migration to set up the automations table:

```sql
-- File: supabase_migration_automations.sql
-- Execute this in your Supabase SQL editor
```

This creates:
- `automations` table with all necessary fields
- `automation_id` column in transactions table
- Row-level security policies
- Indexes for performance
- Timestamp triggers

### Table Structure

**automations Table:**
```sql
- automation_id (UUID, PK)
- user_id (UUID, FK to users)
- category_id (UUID, FK to categories)
- description (TEXT)
- amount (DECIMAL)
- type (TEXT: 'income' or 'expense')
- frequency (TEXT: 'daily', 'weekly', 'monthly', 'custom')
- frequency_days (INTEGER, nullable - used for custom frequency)
- start_date (DATE)
- is_active (BOOLEAN)
- last_executed (TIMESTAMP, for future cron implementation)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

## Hook: useAutomations

**Location:** `src/hooks/useAutomations.js`

### Available Functions

```javascript
// Fetch all automations
const { automations, loading, error, fetchAutomations } = useAutomations();

// Create new automation
const { createAutomation } = useAutomations();
await createAutomation(automationData, addNow);
// automationData: {description, amount, category_id, type, start_date, frequency, frequency_days}
// addNow: boolean - whether to immediately add first transaction

// Update automation
const { updateAutomation } = useAutomations();
await updateAutomation(automationId, updates);

// Toggle active status
const { toggleAutomationStatus } = useAutomations();
await toggleAutomationStatus(automationId, currentStatus);

// Delete automation
const { deleteAutomation } = useAutomations();
await deleteAutomation(automationId);

// Manually insert transaction from automation
const { insertAutomatedTransaction } = useAutomations();
await insertAutomatedTransaction(automationId, automationData);
```

---

## Component: AutomationModal

**Location:** `src/components/AutomationModal.jsx`

### Props

```javascript
<AutomationModal
  open={boolean}              // Whether modal is visible
  onClose={function}          // Called when user closes modal
  onAutomationCreated={function}  // Called after successful creation (for refreshing lists)
/>
```

### Key Design Features

1. **Minimal Complexity**
   - Clean, readable code with helpful comments
   - Organized styles object for easy maintenance
   - Separated concerns: form logic, list management, state handling

2. **Helpful Comments**
   - Section headers for different form parts
   - Inline comments explaining key logic
   - JSDoc-style function documentation
   - Purpose statements for complex operations

3. **User Experience**
   - Form validation with clear error messages
   - Success messages after actions
   - Visual indicators for inactive automations
   - Smooth transitions and hover effects

4. **Accessibility**
   - Proper ARIA attributes
   - Keyboard support (Escape to close)
   - Tab trapping within modal
   - Semantic HTML structure

---

## Code Examples

### Basic Usage in Components

```javascript
import { AutomationModal } from './AutomationModal';
import { useState } from 'react';

export function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Open Automation
      </button>
      
      <AutomationModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onAutomationCreated={() => console.log('Automation created!')}
      />
    </>
  );
}
```

### Creating an Automation Programmatically

```javascript
import { useAutomations } from '../hooks/useAutomations';

export function MyComponent() {
  const { createAutomation } = useAutomations();

  const handleCreateMonthlySubscription = async () => {
    try {
      await createAutomation({
        description: 'Netflix Subscription',
        amount: 15.99,
        category_id: 'some-uuid',
        type: 'expense',
        start_date: '2024-01-01',
        frequency: 'monthly',
        frequency_days: null
      }, true); // true = add first transaction immediately
    } catch (error) {
      console.error('Failed to create automation:', error);
    }
  };

  return <button onClick={handleCreateMonthlySubscription}>Subscribe</button>;
}
```

---

## Future Enhancements

### 1. Server-Side Cron Job
Implement a scheduled task (AWS Lambda, Vercel Cron, or similar) to automatically insert transactions based on automation rules every 24 hours.

```javascript
// Pseudo-code for cron implementation
if (automation.is_active) {
  const daysSinceLastExecution = getDaysDifference(
    new Date(),
    automation.last_executed
  );
  
  if (daysSinceLastExecution >= (automation.frequency_days || getFrequencyDays(automation.frequency))) {
    // Insert transaction
    // Update last_executed
  }
}
```

### 2. Edit Automation
Add ability to edit existing automations (currently only deactivate/delete available).

### 3. One-Time Automations
Add support for one-time scheduled transactions (not recurring).

### 4. Notification Reminders
Send notifications when automation transactions are inserted.

### 5. Bulk Operations
Allow users to enable/disable multiple automations at once.

---

## Troubleshooting

### Automations Not Showing
- **Issue:** Created automations don't appear in the list
- **Solution:** 
  1. Check browser console for errors
  2. Verify Supabase migration was executed
  3. Check row-level security policies allow reads
  4. Clear browser cache and reload

### Transactions Not Being Added
- **Issue:** "Add now" checkbox doesn't create transaction
- **Solution:**
  1. Verify all required fields are filled
  2. Check category_id is valid
  3. Check amount is positive number
  4. Verify database connection in console

### Modal Won't Close
- **Issue:** Pressing X or clicking outside doesn't close
- **Solution:**
  1. Check `onClose` callback is properly passed
  2. Ensure `open` prop is controlled correctly
  3. Check for JavaScript errors in console

---

## Files Summary

| File | Purpose |
|------|---------|
| `src/components/AutomationModal.jsx` | Main modal UI component for creating/managing automations |
| `src/hooks/useAutomations.js` | Hook for all automation CRUD operations |
| `src/components/transactionlist.jsx` | Updated to include Automation button and modal integration |
| `src/components/ScenarioSimulateModal.jsx` | Fixed close button to properly reset simulation state |
| `supabase_migration_automations.sql` | Database schema migration for automations feature |

---

## Implementation Notes

### State Management
- Automations are fetched on component mount and after CRUD operations
- Form state is separated from list state for better organization
- Error/success messages auto-clear after 2-3 seconds

### Performance Optimizations
- useCallback hooks prevent unnecessary re-renders
- Debouncing on form inputs (if needed)
- Efficient database queries with proper indexes
- Lazy loading of modal to reduce initial bundle size

### Security
- Row-level security ensures users only see their own automations
- Input validation on both frontend and backend
- Amount validation to prevent negative values
- Proper cascade deletes when categories are removed

---

## Contact & Support
For issues or questions about the automation feature, check the code comments or contact the development team.
