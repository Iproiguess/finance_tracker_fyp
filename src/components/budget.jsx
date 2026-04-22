import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useBudgets } from '../hooks/usebudgets';
import { useCategories } from '../hooks/usecategories';
import { useTransactions } from '../hooks/usetransactions';
import { styles } from './styles/budgetStyles';
import BudgetForm from './BudgetForm';
import BudgetCard from './BudgetCard';
import DeleteConfirmModal from './DeleteConfirmModal';
import { 
  generateBudgetName, 
  validateCategoriesExist, 
  getInitialFormData 
} from './utils/budgetUtils';

// Main page for managing budgets
export default function BudgetPage() {
  const { budgets, loading: budgetsLoading, error: budgetsError, addBudget, updateBudget, deleteBudget } = useBudgets();
  const { categories, loading: categoriesLoading } = useCategories();
  const { transactions } = useTransactions();
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const [userId, setUserId] = useState(null);
  const [formData, setFormData] = useState(getInitialFormData());
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [error, setError] = useState('');

  // Fetch user ID on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id);
    };
    getUser();
  }, []);

  // Reset form state
  const resetForm = () => {
    setFormData(getInitialFormData());
    setShowForm(false);
    setEditingBudget(null);
    setError('');
  };

  // Toggle form visibility
  const handleToggleForm = () => {
    if (showForm) {
      resetForm();
    } else {
      setFormData(getInitialFormData());
      setEditingBudget(null);
      setShowForm(true);
      setError('');
    }
  };

  // Handle form submit for add/edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (!validateCategoriesExist(formData.category_ids, categories)) {
        setError('One or more selected categories no longer exist. Please choose again.');
        return;
      }
      if (formData.category_ids.length === 0) {
        setError('Please select at least one category.');
        return;
      }
      if (!formData.monthly_limit || isNaN(parseFloat(formData.monthly_limit))) {
        setError('Please enter a valid monthly limit.');
        return;
      }
      if (!formData.year || isNaN(parseInt(formData.year))) {
        setError('Please enter a valid year.');
        return;
      }
      const budgetData = {
        ...formData,
        monthly_limit: parseFloat(formData.monthly_limit),
        budget_name: formData.budget_name || generateBudgetName(formData.category_ids, categories),
        user_id: userId
      };
      if (editingBudget) {
        await updateBudget(editingBudget.budget_id, budgetData);
      } else {
        await addBudget(budgetData);
      }
      resetForm();
    } catch (err) {
      setError('Error saving budget: ' + (err.message || err));
    }
  };

  // Handle edit button click
  const handleEdit = (budget) => {
    const categoryIds = budget.category_ids || [];
    if (!validateCategoriesExist(categoryIds, categories)) {
      setError('This budget references one or more categories that no longer exist.');
      return;
    }
    setEditingBudget(budget);
    setFormData({
      budget_name: budget.budget_name || '',
      category_ids: categoryIds,
      monthly_limit: budget.monthly_limit.toString(),
      month: budget.month,
      year: budget.year,
      rollover: budget.rollover ?? budget.rollover_enabled ?? false
    });
    setShowForm(true);
    setError('');
  };

  // Handle delete button click
  const handleDelete = (budget) => {
    setBudgetToDelete(budget);
    setDeleteConfirm(true);
    setError('');
  };

  // Confirm deletion of a budget
  const confirmDelete = async () => {
    if (!budgetToDelete) return;
    setError('');
    try {
      await deleteBudget(budgetToDelete.budget_id);
      setDeleteConfirm(false);
      setBudgetToDelete(null);
    } catch (err) {
      setError('Error deleting budget: ' + (err.message || err));
    }
  };

  // Listen for hash changes to open the edit form for a budget
  useEffect(() => {
    const openBudgetFromHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#budget-')) {
        const budgetId = hash.replace('#budget-', '');
        const budget = budgets.find(b => String(b.budget_id) === budgetId);
        if (budget) {
          setEditingBudget(budget);
          setFormData({
            budget_name: budget.budget_name || '',
            category_ids: budget.category_ids || [],
            monthly_limit: budget.monthly_limit.toString(),
            month: budget.month,
            year: budget.year,
            rollover: budget.rollover ?? budget.rollover_enabled ?? false
          });
          setShowForm(true);
        }
      }
    };
    window.addEventListener('hashchange', openBudgetFromHash);
    // Run once on mount in case hash is already set
    openBudgetFromHash();
    return () => window.removeEventListener('hashchange', openBudgetFromHash);
  }, [budgets]);

  if (budgetsLoading || categoriesLoading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 16, color: '#333', fontWeight: 500 }}>Loading budget...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Budget Management</h2>
        <button
          onClick={handleToggleForm}
          style={{
            ...styles.addButton,
            ...(hoveredBtn === 'addBudget' && { 
              backgroundColor: '#2980b9',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            })
          }}
          onMouseEnter={() => setHoveredBtn('addBudget')}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          {showForm ? 'Cancel' : '+ Add Budget'}
        </button>
      </div>

      {/* Error display */}
      {(error || budgetsError) && (
        <div style={{ color: '#dc3545', background: '#fff3f3', border: '1px solid #f5c2c7', padding: '10px', borderRadius: 6, margin: '10px 0' }}>
          {error || budgetsError}
        </div>
      )}

      {showForm && (
        <BudgetForm
          formData={formData}
          categories={categories}
          isEditing={Boolean(editingBudget)}
          onSubmit={handleSubmit}
          onChange={setFormData}
          onCancel={resetForm}
        />
      )}

      <div style={styles.budgetsList}>
        {budgets.length === 0 ? (
          <p style={styles.emptyMessage}>
            No budgets set yet. Click '+ Add Budget' to create one!
          </p>
        ) : (
          budgets.map(budget => (
            <BudgetCard
              key={budget.budget_id}
              budget={budget}
              categories={categories}
              transactions={transactions}
              budgets={budgets}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteConfirm}
        budgetToDelete={budgetToDelete}
        categories={categories}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteConfirm(false);
          setBudgetToDelete(null);
        }}
      />
    </div>
  );
}
