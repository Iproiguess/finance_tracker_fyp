import { useState } from 'react';
import { useCategories } from '../hooks/usecategories';
import { styles, DEFAULT_COLORS } from './styles/categoryEditorStyles';
import { CategoryDeleteConfirmModal } from './CategoryDeleteConfirmModal';

export function CategoryEditor({ category, onClose, fetchCategories: parentFetchCategories, fetchTransactions: parentFetchTransactions }) {
  const { updateCategory, deleteCategory } = useCategories();
  
  const [name, setName] = useState(category?.category_name || '');
  const [color, setColor] = useState(category?.color_code || '#007bff');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      await updateCategory(category.category_id, {
        category_name: name,
        color_code: color
      });
      if (parentFetchCategories) await parentFetchCategories();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await deleteCategory(category.category_id, parentFetchTransactions);
      if (parentFetchCategories) await parentFetchCategories();
      setDeleteConfirm(false);
      onClose();
    } catch {
      setError("Cannot delete: This category is still linked to transactions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={{ margin: 0, color: '#000', fontWeight: 700 }}>Edit Category</h2>
          <button 
            onClick={onClose} 
            style={{
              ...styles.closeButton,
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

          {!deleteConfirm ? (
            <div style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Category Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter name..."
                  style={styles.input}
                  onKeyPress={e => e.key === 'Enter' && handleSave()}
                />
              </div>

              <div style={styles.colorPicker}>
                <label style={styles.label}>Color Theme</label>
                <div style={styles.colorGrid}>
                  {DEFAULT_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      style={{
                        ...styles.colorOption,
                        backgroundColor: c,
                        border: color === c ? '3px solid #000' : '1px solid rgba(0,0,0,0.1)',
                        transform: color === c ? 'scale(1.1)' : 'scale(1)'
                      }}
                    />
                  ))}
                </div>
              </div>
              <div style={styles.actionRow}>
                <button
                  onClick={handleSave}
                  disabled={loading || !name.trim()}
                  style={{
                    ...styles.saveBtn,
                    ...(hoveredBtn === 'save' && !loading && { 
                      backgroundColor: '#2980b9',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    })
                  }}
                  onMouseEnter={() => setHoveredBtn('save')}
                  onMouseLeave={() => setHoveredBtn(null)}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(true)}
                  style={{
                    ...styles.deleteBtn,
                    ...(hoveredBtn === 'delete' && !loading && { 
                      backgroundColor: '#c0392b',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    })
                  }}
                  onMouseEnter={() => setHoveredBtn('delete')}
                  onMouseLeave={() => setHoveredBtn(null)}
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <CategoryDeleteConfirmModal
        isOpen={deleteConfirm}
        categoryName={name}
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(false)}
      />
    </div>
  );
}

export default CategoryEditor;