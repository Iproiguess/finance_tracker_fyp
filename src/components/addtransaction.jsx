import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTransactions } from '../hooks/usetransactions';
import { styles, getInitialFormData, getTypeButtonStyle } from './styles/addTransactionStyles';
import { validateAndSanitize } from '../utils/validation';

// Modal form for adding or editing a transaction
export function AddTransaction({ onClose, categoryId, editingTransaction }) {
  const { addTransaction, updateTransaction } = useTransactions();
  const [formData, setFormData] = useState(() => getInitialFormData(editingTransaction));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredBtn, setHoveredBtn] = useState(null);

  // Handle form submission for add/edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!categoryId) {
      setError('Please select a valid category before adding a transaction.');
      setLoading(false);
      return;
    }
    // Validate and sanitize fields
    const fieldsToValidate = ['amount', 'description', 'date', 'type'];
    for (const field of fieldsToValidate) {
      const result = validateAndSanitize(field, formData[field]);
      if (!result.isValid) {
        setError(result.error || `Invalid ${field}`);
        setLoading(false);
        return;
      }
    }

    try {
      const amount = parseFloat(formData.amount || '0');
      const transaction = {
        ...formData,
        amount,
        category_id: categoryId // Ensure this matches your DB column name
      };
      if (editingTransaction) {
        await updateTransaction(editingTransaction.transaction_id, transaction);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        transaction.user_id = user.id;
        await addTransaction(transaction);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes and reset error state
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Restrict amount to max 10 digits (not counting decimals)
    if (name === 'amount' && value) {
      const numValue = parseFloat(value);
      if (numValue > 9999999999.99) {
        return; // Don't update if exceeds limit
      }
      const digitsOnly = value.replace(/[^0-9]/g, '');
      if (digitsOnly.length > 10) {
        return; // Don't update if more than 10 digits
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.modalTitle}>
            {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button 
            onClick={onClose} 
            style={{
              ...styles.closeBtn,
              ...(hoveredBtn === 'close' && { 
                backgroundColor: '#c0392b',
                transform: 'scale(1.05)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              })
            }}
            onMouseEnter={() => setHoveredBtn('close')}
            onMouseLeave={() => setHoveredBtn(null)}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <style>{`
          .category-explorer-animated-btn, [aria-label='Close'] { outline: none !important; }
          input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(0) brightness(0);
            cursor: pointer;
          }
        `}</style>
        <div style={styles.content}>
          {error && <div style={styles.errorBox}>{error}</div>}
          <form onSubmit={handleSubmit} style={styles.form} autoComplete="off">
            <div style={styles.field}>
              <label style={styles.label}>Transaction Type</label>
              <div style={styles.toggleGroup}>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
                  style={getTypeButtonStyle(formData.type, 'expense')}
                  className="category-explorer-animated-btn"
                >Expense</button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
                  style={getTypeButtonStyle(formData.type, 'income')}
                  className="category-explorer-animated-btn"
                >Income</button>
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Amount</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                style={styles.input}
                placeholder="0.00"
                step="0.01"
                min="0"
                max="9999999999.99"
                autoComplete="new-password"
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g. Lunch, Groceries, Salary"
                autoComplete="new-password" 
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <button type="submit" disabled={loading} style={{
              ...styles.submitButton,
              ...(hoveredBtn === 'submit' && !loading && { 
                backgroundColor: '#2980b9',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              })
            }}
            onMouseEnter={() => setHoveredBtn('submit')}
            onMouseLeave={() => setHoveredBtn(null)}
            className="category-explorer-animated-btn">
              {loading ? 'Processing...' : (editingTransaction ? 'Update Transaction' : 'Save Transaction')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}