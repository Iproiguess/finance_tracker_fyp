import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { styles, DEFAULT_COLORS, isDuplicateCategory, formatCategoryName } from './styles/categoryManagerStyles';
import { uiTheme } from './styles/uiTheme';

export function CategoryManager({ onClose, categories, addCategory }) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#007bff');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const trimmedName = formatCategoryName(newCategoryName);
    if (!trimmedName) return;

    if (isDuplicateCategory(trimmedName, categories)) {
      setError(`The category "${trimmedName}" already exists.`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await addCategory({
        user_id: user.id,
        category_name: trimmedName,
        color_code: selectedColor,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.modalTitle}>Add a Category</h2>
          <button 
            onClick={onClose} 
            style={{
              ...styles.closeBtn,
              ...(hoveredBtn === 'close' && { 
                backgroundColor: '#c0392b',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
              })
            }}
            onMouseEnter={() => setHoveredBtn('close')}
            onMouseLeave={() => setHoveredBtn(null)}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div style={styles.content}>
          {error && <div style={styles.errorBox}>{error}</div>}
          <form onSubmit={handleAddCategory} style={styles.form} autoComplete="off">
            <input
              type="text"
              name="new-category-name"
              value={newCategoryName}
              onChange={e => { setNewCategoryName(e.target.value); setError(''); }}
              placeholder="e.g. Groceries, Rent, Utilities"
              style={styles.input}
              autoFocus
              required
              autoComplete="new-password"
            />
            <label style={styles.label}>Select Color</label>
            <div style={styles.colorGrid}>
              {DEFAULT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  style={{
                    ...styles.colorOption,
                    backgroundColor: c,
                    outline: selectedColor === c ? `3px solid ${uiTheme.colors.primary}` : 'none',
                    transform: selectedColor === c ? 'scale(1.1)' : 'scale(1)'
                  }}
                />
              ))}
            </div>
            <button type="submit" style={{
              ...styles.submitBtn,
              ...(hoveredBtn === 'submit' && !loading && { 
                backgroundColor: '#2980b9',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              })
            }}
            onMouseEnter={() => setHoveredBtn('submit')}
            onMouseLeave={() => setHoveredBtn(null)}
            disabled={loading}>
              {loading ? 'Saving...' : 'Create Category'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}