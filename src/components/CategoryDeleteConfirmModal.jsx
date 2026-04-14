
import { useState } from 'react';

export function CategoryDeleteConfirmModal({ isOpen, categoryName, loading, onConfirm, onCancel }) {
  const [hoveredBtn, setHoveredBtn] = useState(null);

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      width: '90%',
      maxWidth: '380px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
    },
    confirmBox: { textAlign: 'center', padding: '10px 0' },
    warningIcon: { fontSize: '40px', marginBottom: '10px' },
    title: { margin: '10px 0 15px', fontSize: '18px', fontWeight: 'bold', color: '#333' },
    description: { fontSize: '14px', color: '#666', marginBottom: '20px' },
    confirmActions: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' },
    confirmDeleteBtn: {
      padding: '12px',
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    cancelBtn: {
      padding: '12px',
      backgroundColor: '#eee',
      color: '#333',
      border: 'none',
      borderRadius: '8px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.confirmBox}>
          <div style={styles.warningIcon}>⚠️</div>
          <h4 style={styles.title}>Delete "{categoryName}"?</h4>
          <p style={styles.description}>This action cannot be undone.</p>
          
          <div style={styles.confirmActions}>
            <button
              onClick={onConfirm}
              style={{
                ...styles.confirmDeleteBtn,
                ...(hoveredBtn === 'confirm' && !loading && { 
                  backgroundColor: '#a93226',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                })
              }}
              onMouseEnter={() => setHoveredBtn('confirm')}
              onMouseLeave={() => setHoveredBtn(null)}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button
              onClick={onCancel}
              style={{
                ...styles.cancelBtn,
                ...(hoveredBtn === 'cancel' && !loading && { 
                  backgroundColor: '#d0d0d0',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                })
              }}
              onMouseEnter={() => setHoveredBtn('cancel')}
              onMouseLeave={() => setHoveredBtn(null)}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
