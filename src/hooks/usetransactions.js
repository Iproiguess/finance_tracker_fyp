import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryStats, setCategoryStats] = useState({});

  const fetchTransactions = useCallback(async (categoryId = null) => {
    try {
      setLoading(true);
      let query = supabase
        .from('transactions')
        .select(`
          *,
          categories (
            category_name,
            color_code
          )
        `);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategoryStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('category_id, type, amount');

      if (error) throw error;

      const stats = {};
      data.forEach(txn => {
        if (!stats[txn.category_id]) {
          stats[txn.category_id] = { income: 0, expense: 0 };
        }
        if (txn.type === 'income') {
          stats[txn.category_id].income += txn.amount;
        } else {
          stats[txn.category_id].expense += txn.amount;
        }
      });
      setCategoryStats(stats);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const addTransaction = async (transaction) => {
    // Note: Removed the second categoryId param as it's usually inside the transaction object
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select(`
        *,
        categories (
          category_name,
          color_code
        )
      `)
      .single();

    if (error) throw new Error(error.message);

    // Update local stats
    const catId = transaction.category_id;
    setCategoryStats(prev => {
      const updated = { ...prev };
      if (!updated[catId]) {
        updated[catId] = { income: 0, expense: 0 };
      }
      if (transaction.type === 'income') {
        updated[catId].income += transaction.amount;
      } else {
        updated[catId].expense += transaction.amount;
      }
      return updated;
    });

    setTransactions(prev => [data, ...prev]);
    return data;
  };

  const updateTransaction = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('transaction_id', id)
        .select(`
          *,
          categories (
            category_name,
            color_code
          )
        `);

      if (error) throw error;
      
      const updatedTxn = data[0];
      setTransactions(prev =>
        prev.map(t => t.transaction_id === id ? updatedTxn : t)
      );
      
      await fetchCategoryStats();
      return updatedTxn;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      const txnToDelete = transactions.find(t => t.transaction_id === id);
      
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('transaction_id', id);

      if (error) {
        const errorMsg = error.message || 'Failed to delete transaction';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      setTransactions(prev => prev.filter(t => t.transaction_id !== id));
      
      if (txnToDelete) {
        setCategoryStats(prev => {
          const updated = { ...prev };
          const catId = txnToDelete.category_id;
          if (updated[catId]) {
            if (txnToDelete.type === 'income') {
              updated[catId].income -= txnToDelete.amount;
            } else {
              updated[catId].expense -= txnToDelete.amount;
            }
          }
          return updated;
        });
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchCategoryStats();
  }, [fetchTransactions, fetchCategoryStats]);

  return {
    transactions,
    loading,
    error,
    categoryStats,
    fetchTransactions,
    fetchCategoryStats,
    addTransaction,
    updateTransaction,
    deleteTransaction
  };
}