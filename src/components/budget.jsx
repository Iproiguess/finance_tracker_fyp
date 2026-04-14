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

export default function BudgetPage() {
  const { budgets, loading: budgetsLoading, addBudget, updateBudget, deleteBudget } = useBudgets();
  const { categories, loading: categoriesLoading } = useCategories();
  const { transactions } = useTransactions();
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const [userId, setUserId] = useState(null);
  const [formData, setFormData] = useState(getInitialFormData());
  const [hoveredBtn, setHoveredBtn] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id);
    };
    getUser();
  }, []);

  const resetForm = () => {
    setFormData(getInitialFormData());
    setShowForm(false);
    setEditingBudget(null);
  };

  const handleToggleForm = () => {
    if (showForm) {
      resetForm();
    } else {
      setFormData(getInitialFormData());
      setEditingBudget(null);
      setShowForm(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!validateCategoriesExist(formData.category_ids, categories)) {
        alert('One or more selected categories no longer exist. Please choose again.');
        return;
      }

      if (formData.category_ids.length === 0) {
        alert('Please select at least one category.');
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
    } catch (error) {
      alert('Error saving budget: ' + error.message);
    }
  };

  const handleEdit = (budget) => {
    const categoryIds = budget.category_ids || [];
    
    if (!validateCategoriesExist(categoryIds, categories)) {
      alert('This budget references one or more categories that no longer exist.');
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
  };

  const handleDelete = (budget) => {
    setBudgetToDelete(budget);
    setDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!budgetToDelete) return;
    try {
      await deleteBudget(budgetToDelete.budget_id);
      setDeleteConfirm(false);
      setBudgetToDelete(null);
    } catch (error) {
      alert('Error deleting budget: ' + error.message);
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
    return <div style={styles.loading}>Loading budget...</div>;
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
