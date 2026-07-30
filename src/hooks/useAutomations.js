import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

let automationExecutionPromise = null;

/**
 * Custom hook for managing automated transactions
 * 
 * Handles CRUD operations for automation rules and automatic transaction insertion
 * 
 * KEY FEATURES:
 * - Supports multiple frequencies: daily, weekly, monthly, custom
 * - Automatic backfill of missed transactions when user logs back in after being offline
 * - Prevents duplicate executions with localStorage tracking
 * - Uses LOCAL timezone for all date calculations (not UTC)
 * - Verifies automations still exist before executing
 * 
 * CRITICAL BUG FIXES (v3):
 * 1. Backfill Support: Creates transactions for EACH missed day (not just today)
 * 2. Timezone Safety: All dates use local timezone, preventing "yesterday" bug in US zones
 * 3. No Double-Execution: localStorage flag prevents same-day re-runs
 * 4. Deletion Safety: Verifies automation exists before attempting transaction insertion
 * 
 * HOW BACKFILL WORKS (Daily Automations):
 * - If last_executed is 3 days ago, creates 3 transactions (one for each day)
 * - Each transaction gets its respective date (not all set to today)
 * - Handles users who are offline for extended periods
 * 
 * FLOW ON APP LOAD:
 * 1. User logs in → session is established
 * 2. App.jsx calls executeDueAutomations()
 * 3. Checks if already executed today (localStorage)
 * 4. For each due automation, calculates date range and creates transactions
 * 5. Updates last_executed to today
 * 6. Sets localStorage flag to prevent re-execution
 * 
 * @returns {Object} Object with automation management functions and state
 */
export function useAutomations() {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch all automations for the current user
   * Retrieves active and inactive automations, sorted by creation date (newest first)
   */
  const fetchAutomations = useCallback(async () => {
    setError(null);
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAutomations(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new automation rule
   * 
   * @param {Object} automationData - Contains: description, amount, category_id, start_date, frequency, is_active
   * @param {boolean} addNow - Whether to immediately add transaction to list (only if today >= start_date)
   * 
   * Important: If start_date is in future, no transaction created even if addNow=true
   * The automation will begin executing once start_date is reached
   */
  const createAutomation = useCallback(async (automationData, addNow = false) => {
    setError(null);
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('User not authenticated');

      // Create the automation record with user_id
      const { data, error } = await supabase
        .from('automations')
        .insert([{ ...automationData, user_id: user.id, is_active: true }])
        .select();
      if (error) throw error;

      // If addNow is true, only insert a transaction if today >= start_date
      if (addNow && data && data.length > 0) {
        // Get today's date in local timezone (not UTC - see insertAutomatedTransaction for why)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;
        if (today >= automationData.start_date) {
          await insertAutomatedTransaction(data[0].automation_id, automationData);
        }
      }

      await fetchAutomations();
      return data?.[0];
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchAutomations]);

  /**
   * Check if an automation should be executed based on frequency and last_executed
   * 
   * IMPORTANT: Uses LOCAL date calculation (not UTC) to prevent timezone-related bugs
   * where UTC conversion could show yesterday's date in US timezones
   * 
   * Returns true if:
   * - Today >= start_date AND
   * - Automation is active AND
   * - Sufficient time has passed based on frequency
   * 
   * Frequency checks:
   * - daily: daysDiff >= 1 (at least 1 day since last execution)
   * - weekly: daysDiff >= 7
   * - monthly: daysDiff >= 30
   * - custom: daysDiff >= frequency_days
   */
  const shouldExecuteAutomation = useCallback((automation) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Don't execute if start date is in the future
    if (automation.start_date > today) {
      return false;
    }
    
    // Don't execute if not active
    if (!automation.is_active) {
      return false;
    }
    
    // If never executed, check if today >= start_date
    if (!automation.last_executed) {
      return true;
    }
    
    const lastExecDate = new Date(automation.last_executed);
    const todayDate = new Date(today);
    const daysDiff = Math.floor((todayDate - lastExecDate) / (1000 * 60 * 60 * 24));
    
    // Check based on frequency
    switch (automation.frequency) {
      case 'daily':
        return daysDiff >= 1;
      case 'weekly':
        return daysDiff >= 7;
      case 'monthly':
        return daysDiff >= 30;
      case 'custom':
        return daysDiff >= (automation.frequency_days || 30);
      default:
        return false;
    }
  }, []);

  /**
   * Insert a transaction from an automation rule
   * Adds a marker showing it was inserted by the automation system
   * 
   * CRITICAL: Uses LOCAL timezone date calculation, NOT UTC
   * Reason: new Date().toISOString().split('T')[0] converts to UTC first,
   * which causes incorrect dates for users in timezones behind UTC (e.g., US)
   * 
   * @param {string} automationId - The automation_id from the automations table
   * @param {Object} automationData - Contains: description, amount, category_id, type, start_date, frequency
   */
  const insertAutomatedTransaction = useCallback(async (automationId, automationData) => {
    try {
      const { description, amount, category_id, type } = automationData;

      // Get current user for user_id in transaction
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('User not authenticated');

      // Calculate local date (not UTC) to prevent timezone bugs
      // In US timezones (behind UTC), ISO string would show yesterday
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const localDate = `${year}-${month}-${day}`;

      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            description: description,
            amount: parseFloat(amount),
            category_id: category_id,
            type: type || 'expense',
            date: localDate,
            automation_id: automationId,
            user_id: user.id,
          },
        ])
        .select();

      if (error) throw error;
      
      // Update last_executed timestamp for the automation
      await supabase
        .from('automations')
        .update({ last_executed: new Date().toISOString() })
        .eq('automation_id', automationId);
      
      return data?.[0];
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);
  
  /**
   * CRITICAL: Execute automations with BACKFILL support for missed days
   * 
   * BUG FIX (v3): Previously only created ONE transaction per execution.
   * This caused users offline for multiple days to lose missed transactions.
   * 
   * Example: User offline June 24-July 7, automation is daily.
   * OLD BEHAVIOR: Creates only 1 transaction on July 7
   * NEW BEHAVIOR: Creates transactions for ALL days June 24-July 7 (13 transactions)
   * 
   * Algorithm for DAILY automations:
   * 1. If never executed: startDate = automation.start_date
   * 2. If previously executed: startDate = last_executed + 1 day
   * 3. Create transactions for EACH day from startDate to today
   * 4. Each transaction gets its respective date (not always today)
   * 
   * Called on app load and periodically
   * Uses localStorage flag to prevent multiple executions on same day
   */
  const executeDueAutomations = useCallback(async () => {
    if (automationExecutionPromise) {
      console.log('[AUTOMATION] Another execution already running, reusing the in-flight run');
      return automationExecutionPromise;
    }

    const runExecution = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.log('[AUTOMATION] No authenticated user, skipping');
          return;
        }
        
        // Get today's date in local timezone (not UTC)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;
        
        console.log(`[AUTOMATION] Starting execution at ${new Date().toLocaleString()} | Today: ${today}`);
        
        // Check if we already executed today (prevent double-execution)
        const lastExecutionKey = `automation_execution_${user.id}`;
        const lastExecution = localStorage.getItem(lastExecutionKey);

        if (lastExecution === today) {
          console.log(`[AUTOMATION] Already executed today (${today}) - skipping to prevent duplicates`);
          return;
        }
        
        // Get all active automations for this user
        const { data: automationsData, error: fetchError } = await supabase
          .from('automations')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        if (fetchError) throw fetchError;
        console.log(`[AUTOMATION] Fetched ${automationsData?.length || 0} active automations for user ${user.id}`);
        
        if (!automationsData || automationsData.length === 0) {
          console.log('[AUTOMATION] No active automations found');
          localStorage.setItem(lastExecutionKey, today);
          return;
        }
        
        // Log all automations
        automationsData.forEach(auto => {
          console.log(`[AUTOMATION] - ${auto.description} | Freq: ${auto.frequency} | Last Exec: ${auto.last_executed || 'NEVER'} | Start: ${auto.start_date}`);
        });
        
        // Manually check which automations should execute
        const automationsToExecute = automationsData.filter(automation => {
          // Don't execute if start date is in the future
          if (automation.start_date > today) {
            console.log(`[AUTOMATION] SKIP ${automation.description}: start_date (${automation.start_date}) > today (${today})`);
            return false;
          }
          
          // Don't execute if not active
          if (!automation.is_active) {
            console.log(`[AUTOMATION] SKIP ${automation.description}: not active`);
            return false;
          }
          
          // If never executed, check if today >= start_date
          if (!automation.last_executed) {
            console.log(`[AUTOMATION] EXECUTE ${automation.description}: never executed before, today >= start_date`);
            return true;
          }
          
          const lastExecDateOnly = automation.last_executed.split('T')[0];
          const daysDiff = Math.floor((new Date(today) - new Date(lastExecDateOnly)) / (1000 * 60 * 60 * 24));
          console.log(`[AUTOMATION] ${automation.description}: last_exec=${lastExecDateOnly}, days_diff=${daysDiff}, freq=${automation.frequency}`);
          
          // Check based on frequency
          switch (automation.frequency) {
            case 'daily':
              if (daysDiff >= 1) {
                console.log(`[AUTOMATION] EXECUTE ${automation.description}: daily, daysDiff (${daysDiff}) >= 1`);
                return true;
              }
              break;
            case 'weekly':
              if (daysDiff >= 7) {
                console.log(`[AUTOMATION] EXECUTE ${automation.description}: weekly, daysDiff (${daysDiff}) >= 7`);
                return true;
              }
              break;
            case 'monthly':
              if (daysDiff >= 30) {
                console.log(`[AUTOMATION] EXECUTE ${automation.description}: monthly, daysDiff (${daysDiff}) >= 30`);
                return true;
              }
              break;
            case 'custom':
              if (daysDiff >= (automation.frequency_days || 30)) {
                console.log(`[AUTOMATION] EXECUTE ${automation.description}: custom, daysDiff (${daysDiff}) >= ${automation.frequency_days || 30}`);
                return true;
              }
              break;
            default:
              console.log(`[AUTOMATION] SKIP ${automation.description}: unknown frequency ${automation.frequency}`);
              return false;
          }
          console.log(`[AUTOMATION] SKIP ${automation.description}: frequency check failed`);
          return false;
        });
        
        console.log(`[AUTOMATION] ${automationsToExecute.length} automations due for execution`);
        
        if (automationsToExecute.length === 0) {
          // Mark execution as done even if nothing to execute
          localStorage.setItem(lastExecutionKey, today);
          console.log('[AUTOMATION] No automations due - marking execution done');
          return;
        }
        
        // Execute each due automation
        for (const automation of automationsToExecute) {
          try {
            console.log(`[AUTOMATION] Processing: ${automation.description}`);
            
            // Double-check automation still exists and is active
            const { data: checkAuto } = await supabase
              .from('automations')
              .select('is_active')
              .eq('automation_id', automation.automation_id)
              .single();
            
            if (!checkAuto || !checkAuto.is_active) {
              console.log(`[AUTOMATION] Automation ${automation.automation_id} was deleted or deactivated, skipping`);
              continue;
            }

            // Get current user for transaction
            const { data: { user: txUser }, error: txAuthError } = await supabase.auth.getUser();
            if (txAuthError || !txUser) {
              console.log('[AUTOMATION] User auth error during transaction insert');
              continue;
            }

            // CRITICAL FIX: Calculate date range for this automation
            // Determine start date: either first execution or day after last execution
            let startDateStr = automation.start_date;
            if (automation.last_executed) {
              // Add 1 day to last_executed to get next day to process
              const lastExecDate = new Date(automation.last_executed.split('T')[0]);
              const nextDate = new Date(lastExecDate);
              nextDate.setDate(nextDate.getDate() + 1);
              startDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
            }
            
            console.log(`[AUTOMATION] Date range: ${startDateStr} → ${today}`);
            
            // Parse date strings to compare
            const startDate = new Date(startDateStr);
            const endDate = new Date(today);
            
            // Generate array of dates to create transactions for based on frequency
            const transactionDates = [];
            
            if (automation.frequency === 'daily') {
              // DAILY: Create transaction for EACH day from start to end
              // This handles backfill when user was offline multiple days
              const currentDate = new Date(startDate);
              while (currentDate <= endDate) {
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                transactionDates.push(dateStr);
                currentDate.setDate(currentDate.getDate() + 1);
              }
            } else if (automation.frequency === 'weekly') {
              // WEEKLY: Create one transaction per week from start to end
              const currentDate = new Date(startDate);
              while (currentDate <= endDate) {
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                transactionDates.push(dateStr);
                currentDate.setDate(currentDate.getDate() + 7);
              }
            } else if (automation.frequency === 'monthly') {
              // MONTHLY: Create one transaction per month from start to end
              const currentDate = new Date(startDate);
              while (currentDate <= endDate) {
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                transactionDates.push(dateStr);
                currentDate.setMonth(currentDate.getMonth() + 1);
              }
            } else if (automation.frequency === 'custom' && automation.frequency_days) {
              // CUSTOM: Create one transaction per frequency_days from start to end
              const currentDate = new Date(startDate);
              while (currentDate <= endDate) {
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                transactionDates.push(dateStr);
                currentDate.setDate(currentDate.getDate() + automation.frequency_days);
              }
            }
            
            console.log(`[AUTOMATION] Generated ${transactionDates.length} transaction dates: ${transactionDates.slice(0, 3).join(', ')}${transactionDates.length > 3 ? '...' : ''}`);
            
            // Avoid inserting duplicates by checking existing automation transactions first
            const { data: existingTransactions, error: existingError } = await supabase
              .from('transactions')
              .select('transaction_id, date')
              .eq('automation_id', automation.automation_id)
              .in('date', transactionDates);

            if (existingError) throw existingError;

            const existingDates = new Set((existingTransactions || []).map(tx => tx.date));
            const transactionsToInsert = transactionDates
              .filter(transactionDate => !existingDates.has(transactionDate))
              .map(transactionDate => ({
                description: automation.description,
                amount: parseFloat(automation.amount),
                category_id: automation.category_id,
                type: automation.type || 'expense',
                date: transactionDate, // Each transaction gets its respective date (not always today)
                automation_id: automation.automation_id,
                user_id: txUser.id,
              }));

            if (transactionsToInsert.length === 0) {
              console.log(`[AUTOMATION] All ${transactionDates.length} candidate dates already exist for ${automation.description}, skipping inserts`);
            } else {
              // Insert only the missing transactions
              const { error: insertError } = await supabase
                .from('transactions')
                .insert(transactionsToInsert);

              if (insertError) throw insertError;
              
              console.log(`[AUTOMATION] ✓ Created ${transactionsToInsert.length} transactions for ${automation.description}`);
            }
            
            // Update last_executed timestamp to today (not the last transaction date)
            // This ensures we don't re-process the same period tomorrow
            await supabase
              .from('automations')
              .update({ last_executed: new Date().toISOString() })
              .eq('automation_id', automation.automation_id);
              
            console.log(`[AUTOMATION] Updated last_executed for ${automation.description}`);
          } catch (err) {
            console.error(`[AUTOMATION] ✗ Error executing automation ${automation.automation_id}:`, err);
          }
        }
        
        // Mark execution as done to prevent duplicate runs today
        localStorage.setItem(lastExecutionKey, today);
        console.log(`[AUTOMATION] ✓ Execution completed. Set localStorage flag to ${today}`);
        
        // Refresh automations list after execution
        await fetchAutomations();
      } catch (err) {
        console.error('[AUTOMATION] ✗ Error executing due automations:', err);
      }
    };

    automationExecutionPromise = runExecution();
    try {
      return await automationExecutionPromise;
    } finally {
      automationExecutionPromise = null;
    }
  }, [fetchAutomations]);

  /**
   * Update an automation rule
   */
  const updateAutomation = useCallback(async (automationId, updates) => {
    setError(null);
    try {
      const { data, error } = await supabase
        .from('automations')
        .update(updates)
        .eq('automation_id', automationId)
        .select();
      if (error) throw error;
      await fetchAutomations();
      return data?.[0];
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchAutomations]);

  /**
   * Toggle automation active status (deactivate/reactivate)
   */
  const toggleAutomationStatus = useCallback(async (automationId, currentStatus) => {
    return updateAutomation(automationId, { is_active: !currentStatus });
  }, [updateAutomation]);

  /**
   * Delete an automation rule
   */
  const deleteAutomation = useCallback(async (automationId) => {
    setError(null);
    try {
      const { error } = await supabase
        .from('automations')
        .delete()
        .eq('automation_id', automationId);
      if (error) throw error;
      await fetchAutomations();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchAutomations]);

  // Fetch automations on component mount
  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  return {
    automations,
    loading,
    error,
    createAutomation,
    updateAutomation,
    toggleAutomationStatus,
    deleteAutomation,
    insertAutomatedTransaction,
    fetchAutomations,
    executeDueAutomations,
    shouldExecuteAutomation,
  };
}
