import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryStats, setCategoryStats] = useState({});
  const fetchRequestId = useRef(0);

  const fetchTransactions = useCallback(async (categoryId = null) => {
    const requestId = ++fetchRequestId.current;
    setError(null);
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
      if (requestId === fetchRequestId.current) {
        setTransactions(data || []);
      }
    } catch (err) {
      if (requestId === fetchRequestId.current) {
        setError(err.message);
      }
    } finally {
      if (requestId === fetchRequestId.current) {
        setLoading(false);
      }
    }
  }, []);

  const fetchCategoryStats = useCallback(async () => {
    setError(null);
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
        const amt = typeof txn.amount === 'number' ? txn.amount : parseFloat(txn.amount);
        if (txn.type === 'income') {
          stats[txn.category_id].income += amt;
        } else {
          stats[txn.category_id].expense += amt;
        }
      });
      setCategoryStats(stats);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const addTransaction = async (transaction) => {
    setError(null);
    const tx = { ...transaction, amount: parseFloat(transaction.amount) };
    const { data, error } = await supabase
      .from('transactions')
      .insert([tx])
      .select(`
        *,
        categories (
          category_name,
          color_code
        )
      `)
      .single();
    if (error) throw new Error(error.message);
    const catId = tx.category_id;
    setCategoryStats(prev => {
      const updated = { ...prev };
      if (!updated[catId]) {
        updated[catId] = { income: 0, expense: 0 };
      }
      if (tx.type === 'income') {
        updated[catId].income += tx.amount;
      } else {
        updated[catId].expense += tx.amount;
      }
      return updated;
    });
    setTransactions(prev => [data, ...prev]);
    return data;
  };

  const updateTransaction = async (id, updates) => {
    setError(null);
    try {
      const tx = { ...updates, amount: parseFloat(updates.amount) };
      const { data, error } = await supabase
        .from('transactions')
        .update(tx)
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
    setError(null);
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
            const amt = typeof txnToDelete.amount === 'number' ? txnToDelete.amount : parseFloat(txnToDelete.amount);
            if (txnToDelete.type === 'income') {
              updated[catId].income -= amt;
            } else {
              updated[catId].expense -= amt;
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