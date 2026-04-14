import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('category_name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addCategory = async (category) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select();

    if (error) throw error;
    setCategories(prev => [...prev, data[0]]);
    return data[0];
  };

  const updateCategory = async (id, updates) => {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('category_id', id)
      .select();
    if (error) throw error;
    // Update state instantly
    setCategories(prev => prev.map(c => c.category_id === id ? { ...c, ...updates } : c));
    return data ? data[0] : null;
  };

  const deleteCategory = async (id, onTransactionsDeleted) => {
    try {
      // First, get all budgets for the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: allBudgets, error: fetchError } = await supabase
        .from('budgets')
        .select('budget_id, category_ids')
        .eq('user_id', user.id);

      if (fetchError) throw new Error(`Failed to fetch budgets: ${fetchError.message}`);

      const budgetsToDelete = allBudgets?.filter(budget => 
        (budget.category_ids && budget.category_ids.includes(id))
      ) || [];

      for (const budget of budgetsToDelete) {
        const { error: deleteError } = await supabase
          .from('budgets')
          .delete()
          .eq('budget_id', budget.budget_id);
        if (deleteError) throw deleteError;
      }

      // Delete all transactions for this category
      const { error: transactionError } = await supabase
        .from('transactions')
        .delete()
        .eq('category_id', id);

      if (transactionError) throw new Error(`Failed to delete transactions: ${transactionError.message}`);

      // Call the callback to refresh transactions if provided
      if (onTransactionsDeleted) {
        await onTransactionsDeleted();
      }

      // Then delete the category itself
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('category_id', id);

      if (error) throw error;

      setCategories(prev => prev.filter(c => c.category_id !== id));

      if (typeof window !== 'undefined' && window.setTransactions) {
        window.setTransactions(prev => prev.filter(t => t.category_id !== id));
      }
    } catch (err) {
      alert("Delete failed: " + err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, error, addCategory, deleteCategory, updateCategory, fetchCategories };
}