import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Custom hook for managing budgets state and CRUD operations
export function useBudgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all budgets
  const fetchBudgets = useCallback(async () => {
    setError(null);
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      if (error) throw error;
      setBudgets(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new budget
  const addBudget = async (budget) => {
    setError(null);
    const { data, error } = await supabase
      .from('budgets')
      .insert([budget])
      .select('*');
    if (error) {
      setError(error.message);
      throw error;
    }
    setBudgets(prev => [...prev, data[0]]);
    return data[0];
  };

  // Update an existing budget
  const updateBudget = async (id, updates) => {
    setError(null);
    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('budget_id', id)
      .select('*');
    if (error) {
      setError(error.message);
      throw error;
    }
    setBudgets(prev => prev.map(b => b.budget_id === id ? { ...b, ...updates } : b));
    return data ? data[0] : null;
  };

  // Delete a budget by ID
  const deleteBudget = async (id) => {
    setError(null);
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('budget_id', id);
    if (error) {
      setError(error.message);
      throw error;
    }
    setBudgets(prev => prev.filter(b => b.budget_id !== id));
  };

  // Fetch budgets on mount
  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // Expose state and CRUD operations
  return {
    budgets,
    loading,
    error,
    fetchBudgets,
    addBudget,
    updateBudget,
    deleteBudget
  };
}