import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAutomations } from '../hooks/useAutomations';
import { useCategories } from '../hooks/usecategories';
import { formatCurrency } from './utils/transactionUtils';
import { DeleteTransactionConfirmModal } from './DeleteTransactionConfirmModal';
import { formatDateToDDMMYYYY } from '../utils/dateFormatter';

/**
 * AutomationModal: Modal component for creating and managing automated transactions
 * Features:
 * - Create automation rules with custom frequency
 * - Immediately add first transaction
 * - Manage existing automations (activate, edit, delete)
 */
export function AutomationModal({ open, onClose, onAutomationCreated = () => {} }) {
  const { automations, loading: autoLoading, createAutomation, toggleAutomationStatus, deleteAutomation } = useAutomations();
  const { categories } = useCategories();
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form state for creating/editing automation
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category_id: '',
    type: 'expense',
    start_date: new Date().toISOString().split('T')[0],
    frequency: 'monthly', // daily, weekly, monthly, custom
    frequency_days: 30, // For custom frequency
    is_active: true,
  });

  const [addNow, setAddNow] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const modalRef = useRef(null);

  // Reset form fields only (preserves success/error messages)
  const resetFormFields = useCallback(() => {
    setFormData({
      description: '',
      amount: '',
      category_id: '',
      type: 'expense',
      start_date: new Date().toISOString().split('T')[0],
      frequency: 'monthly',
      frequency_days: 30,
      is_active: true,
    });
    setAddNow(true);
  }, []);

  // Handle form input changes
  const handleInputChange = useCallback((e) => {
    const { name, value, type: inputType } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: inputType === 'number' ? parseFloat(value) : value,
    }));
  }, []);

  // Validate form data
  const validateForm = () => {
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!formData.amount || formData.amount <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }
    if (!formData.category_id) {
      setError('Please select a category');
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    try {
      await createAutomation({
        description: formData.description,
        amount: formData.amount,
        category_id: formData.category_id,
        type: formData.type,
        start_date: formData.start_date,
        frequency: formData.frequency,
        frequency_days: formData.frequency === 'custom' ? formData.frequency_days : null,
      }, addNow);

      // Determine success message based on start_date and addNow
      let successMessage = 'Automation created successfully!';
      if (addNow) {
        const today = new Date().toISOString().split('T')[0];
        if (today >= formData.start_date) {
          successMessage = 'Automation created and transaction added!';
        } else {
          const formattedDate = formatDateToDDMMYYYY(formData.start_date);
          successMessage = `Automation created! Transactions will start on ${formattedDate}`;
        }
      }
      
      setSuccess(successMessage);
      resetFormFields();
      onAutomationCreated();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to create automation');
    }
  };

  // Handle automation deletion
  const handleDelete = async (automationId) => {
    try {
      await deleteAutomation(automationId);
      setDeleteConfirmId(null);
      setSuccess('Automation deleted successfully');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message);
      setDeleteConfirmId(null);
    }
  };

  // Show delete confirmation
  const showDeleteConfirm = (automationId) => {
    setDeleteConfirmId(automationId);
  };

  // Handle toggling automation status
  const handleToggleStatus = async (automationId, currentStatus) => {
    try {
      await toggleAutomationStatus(automationId, currentStatus);
      setSuccess(currentStatus ? 'Automation deactivated' : 'Automation reactivated');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Keyboard trap for modal accessibility
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const getCategoryName = (categoryId) => {
    return categories.find(c => c.category_id === categoryId)?.category_name || 'Unknown';
  };

  return (
    <div style={automationStyles.overlay} onClick={onClose}>
      <style>{`
        .automation-modal-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .automation-modal-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      <div
        className="automation-modal-scrollbar"
        style={automationStyles.modal}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div style={automationStyles.header}>
          <h2 style={automationStyles.title}>Transaction Automation</h2>
          <button
            onClick={onClose}
            style={automationStyles.closeButton}
            aria-label="Close modal"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#c0392b';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
              e.currentTarget.style.outline = 'none';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#dc3545';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.outline = 'none';
            }}
          >
            <span style={{ position: 'relative', top: '-1px' }}>×</span>
          </button>
        </div>

        {/* Form Section */}
        <div style={automationStyles.formSection}>
          <h3 style={automationStyles.sectionTitle}>Create New Automation</h3>

          <form onSubmit={handleSubmit} style={automationStyles.form}>
            {/* Description */}
            <div style={automationStyles.formGroup}>
              <label style={automationStyles.label}>Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="e.g., Monthly subscription"
                style={automationStyles.input}
              />
            </div>

            {/* Amount & Type Row */}
            <div style={automationStyles.formRow}>
              <div style={automationStyles.formGroup}>
                <label style={automationStyles.label}>Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  style={automationStyles.input}
                />
              </div>
              <div style={automationStyles.formGroup}>
                <label style={automationStyles.label}>Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  style={automationStyles.input}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>

            {/* Category & Start Date Row */}
            <div style={automationStyles.formRow}>
              <div style={automationStyles.formGroup}>
                <label style={automationStyles.label}>Category</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  style={automationStyles.input}
                >
                  <option value="">Select category...</option>
                  {categories.map(cat => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={automationStyles.formGroup}>
                <label style={automationStyles.label}>Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  style={automationStyles.input}
                />
              </div>
            </div>

            {/* Frequency Selection */}
            <div style={automationStyles.formGroup}>
              <label style={automationStyles.label}>Frequency</label>
              <div style={automationStyles.frequencyButtons}>
                {['daily', 'weekly', 'monthly'].map(freq => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, frequency: freq }))}
                    style={{
                      ...automationStyles.frequencyButton,
                      background: formData.frequency === freq ? '#2176ae' : '#f0f4f8',
                      color: formData.frequency === freq ? '#fff' : '#333',
                    }}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, frequency: 'custom' }))}
                  style={{
                    ...automationStyles.frequencyButton,
                    background: formData.frequency === 'custom' ? '#2176ae' : '#f0f4f8',
                    color: formData.frequency === 'custom' ? '#fff' : '#333',
                  }}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Custom Frequency Input */}
            {formData.frequency === 'custom' && (
              <div style={automationStyles.formGroup}>
                <label style={automationStyles.label}>Every (days)</label>
                <input
                  type="number"
                  name="frequency_days"
                  value={formData.frequency_days}
                  onChange={handleInputChange}
                  min="1"
                  style={automationStyles.input}
                />
              </div>
            )}

            {/* Add Now Checkbox */}
            <div style={automationStyles.formGroup}>
              <label style={automationStyles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={addNow}
                  onChange={(e) => setAddNow(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Add transaction to list now
              </label>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div style={automationStyles.message(true)}>
                {error}
              </div>
            )}
            {success && (
              <div style={automationStyles.message(false)}>
                {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              style={automationStyles.submitButton}
              disabled={autoLoading}
            >
              {autoLoading ? 'Creating...' : 'Create Automation'}
            </button>
          </form>
        </div>

        {/* Automations List Section */}
        <div style={automationStyles.listSection}>
          <h3 style={automationStyles.sectionTitle}>
            Active Automations ({automations.filter(a => a.is_active).length})
          </h3>

          {automations.length === 0 ? (
            <div style={automationStyles.emptyState}>
              No automations yet. Create one above to get started!
            </div>
          ) : (
            <div style={automationStyles.automationsList}>
              {automations.map((automation, index) => (
                <div
                  key={automation.automation_id}
                  style={{
                    ...automationStyles.automationItem,
                    backgroundColor: index % 2 === 0 ? '#f9fafb' : '#e8e8e8',
                  }}
                >
                  {/* Automation Info */}
                  <div style={automationStyles.automationInfo}>
                    <div style={automationStyles.automationDescription}>
                      {automation.description}
                      <span style={{ marginLeft: '8px', fontSize: '12px', color: automation.type === 'expense' ? '#d32f2f' : '#388e3c', fontWeight: '600' }}>
                        ({automation.type === 'expense' ? 'Expense' : 'Income'})
                      </span>
                      {!automation.is_active && (
                        <span style={automationStyles.inactiveTag}> (Inactive)</span>
                      )}
                    </div>
                    <div style={automationStyles.automationMeta}>
                      <span>
                        {formatCurrency(automation.amount)} • {getCategoryName(automation.category_id)}
                      </span>
                      <span style={{ marginLeft: '12px', color: '#7f8c8d' }}>
                        {automation.frequency.charAt(0).toUpperCase() + automation.frequency.slice(1)}
                        {automation.frequency === 'custom' && ` (Every ${automation.frequency_days} days)`}
                      </span>
                      <span style={{ marginLeft: '12px', color: '#7f8c8d', fontSize: '11px' }}>
                        Start: {formatDateToDDMMYYYY(automation.start_date)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={automationStyles.automationActions}>
                    <button
                      onClick={() => handleToggleStatus(automation.automation_id, automation.is_active)}
                      onFocus={(e) => e.target.blur()}
                      style={automationStyles.actionButton('toggle', automation.is_active)}
                      title={automation.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {automation.is_active ? '⏸' : '▶'}
                    </button>
                    <button
                      onClick={() => showDeleteConfirm(automation.automation_id)}
                      onFocus={(e) => e.target.blur()}
                      style={automationStyles.actionButton('delete')}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <DeleteTransactionConfirmModal
          title="Delete Automation?"
          onConfirm={() => handleDelete(deleteConfirmId)}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </div>
  );
}

/**
 * Styles object for AutomationModal
 * Organized by logical section for easy maintenance
 */
const automationStyles = {
  // Overlay
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1002,
  },

  // Modal Container
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '85vh',
    overflow: 'auto',
    position: 'relative',
  },

  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #eee',
    position: 'sticky',
    top: 0,
    backgroundColor: '#fff',
    zIndex: 10,
  },

  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#23273a',
  },

  closeButton: {
    background: '#dc3545',
    border: 'none',
    fontSize: '24px',
    color: '#fff',
    cursor: 'pointer',
    padding: 0,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    borderRadius: '6px',
    outline: 'none',
    lineHeight: 'normal',
    fontVariantNumeric: 'tabular-nums',
  },

  // Sections
  formSection: {
    padding: '20px',
    borderBottom: '1px solid #f0f4f8',
  },

  listSection: {
    padding: '20px',
  },

  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  // Form Elements
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },

  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#545e70',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },

  input: {
    padding: '10px 12px',
    border: '1px solid #d3d6de',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease',
  },

  frequencyButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },

  frequencyButton: {
    padding: '10px 8px',
    border: '1px solid #d3d6de',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#333',
    cursor: 'pointer',
  },

  message: (isError) => ({
    padding: '12px 14px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: isError ? '#ffebee' : '#e8f5e9',
    color: isError ? '#c62828' : '#2e7d32',
    marginTop: '12px',
    border: `2px solid ${isError ? '#ef5350' : '#4caf50'}`,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  }),

  submitButton: {
    padding: '12px 16px',
    backgroundColor: '#2176ae',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '8px',
  },

  // Automations List
  emptyState: {
    textAlign: 'center',
    padding: '20px',
    color: '#999',
    fontSize: '14px',
    borderRadius: '6px',
    backgroundColor: '#f9f9f9',
  },

  automationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  automationItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #f0f4f8',
    transition: 'all 0.2s ease',
  },

  automationInfo: {
    flex: 1,
  },

  automationDescription: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '6px',
  },

  inactiveTag: {
    color: '#ff9800',
    fontWeight: '500',
    fontSize: '12px',
  },

  automationMeta: {
    fontSize: '12px',
    color: '#7f8c8d',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },

  automationActions: {
    display: 'flex',
    gap: '6px',
    marginLeft: '12px',
    flexShrink: 0,
  },

  actionButton: (type, isActive = false) => ({
    background: type === 'delete' ? '#dc3545' : (isActive ? '#ffc107' : '#28a745'),
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 8px',
    fontSize: type === 'delete' ? '16px' : '18px',
    fontWeight: type === 'delete' ? '900' : '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    minWidth: '32px',
    height: '32px',
    paddingTop: type === 'delete' ? '5px' : '3px',
    outline: 'none',
    WebkitTextStroke: type === 'delete' ? '1.2px currentColor' : 'none',
    paintOrder: type === 'delete' ? 'stroke' : 'normal',
  }),
};
