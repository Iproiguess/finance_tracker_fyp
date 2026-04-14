
import { useState } from 'react';
import { styles } from './styles/budgetStyles';
import { generateBudgetName } from './utils/budgetUtils';

export default function DeleteConfirmModal({
  isOpen,
  budgetToDelete,
  onConfirm,
  onCancel,
  categories
}) {
  const [hoveredBtn, setHoveredBtn] = useState(null);

  if (!isOpen || !budgetToDelete) return null;

  const budgetDisplayName = budgetToDelete.budget_name || 
    generateBudgetName(budgetToDelete.category_ids || [], categories);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.confirmBox}>
          <div style={styles.warningIcon}>⚠️</div>
          <h4 style={{ margin: '10px 0' }}>
            Delete "{budgetDisplayName}" Budget?
          </h4>
          <p style={{ fontSize: '14px', color: '#666' }}>
            This action cannot be undone.
          </p>
          
          <div style={styles.confirmActions}>
            <button
              onClick={onConfirm}
              style={{
                ...styles.confirmDeleteBtn,
                ...(hoveredBtn === 'confirm' && { 
                  backgroundColor: '#a93226',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                })
              }}
              onMouseEnter={() => setHoveredBtn('confirm')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              Yes, Delete
            </button>
            <button
              onClick={onCancel}
              style={{
                ...styles.cancelBtn,
                ...(hoveredBtn === 'cancel' && { 
                  backgroundColor: '#d0d0d0',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                })
              }}
              onMouseEnter={() => setHoveredBtn('cancel')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
