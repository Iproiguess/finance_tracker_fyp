import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useBudgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBudgets = useCallback(async () => {
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
      console.error('Error fetching budgets:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addBudget = async (budget) => {
    const { data, error } = await supabase
      .from('budgets')
      .insert([budget])
      .select('*');

    if (error) throw error;
    setBudgets(prev => [...prev, data[0]]);
    return data[0];
  };

  const updateBudget = async (id, updates) => {
    const { data /* , error */ } = await supabase
      .from('budgets')
      .update(updates)
      .eq('budget_id', id)
      .select('*');
    setBudgets(prev => prev.map(b => b.budget_id === id ? { ...b, ...updates } : b));
    return data ? data[0] : null;
  };

  const deleteBudget = async (id) => {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('budget_id', id);

    if (error) throw error;
    setBudgets(prev => prev.filter(b => b.budget_id !== id));
  };

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  return {
    budgets,
    loading,
    fetchBudgets,
    addBudget,
    updateBudget,
    deleteBudget
  };
}