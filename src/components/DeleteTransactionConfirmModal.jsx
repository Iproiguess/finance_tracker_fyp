import { styles } from './utils/categoryExplorerUtils';

export function DeleteTransactionConfirmModal({ onConfirm, onCancel, title = 'Delete Transaction?' }) {
  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div 
        style={{ ...styles.detailsModal, maxWidth: '380px', textAlign: 'center', padding: '40px 28px', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h4 style={{ color: '#000', fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>{title}</h4>
        <p style={{ fontSize: '14px', color: '#555', marginBottom: '24px', lineHeight: '1.5' }}>This action cannot be undone.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            style={{ 
              ...styles.detailsDeleteBtn, 
              padding: '14px', 
              fontSize: '15px',
              fontWeight: '600',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#a93226';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(233, 212, 96, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#e74c3c';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onClick={onConfirm}
          >Yes, Delete</button>
          <button 
            style={{ 
              backgroundColor: '#eee',
              color: '#333',
              border: 'none',
              width: '100%', 
              height: '44px',
              fontSize: '15px',
              fontWeight: '600',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#d9d9d9';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#eee';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onClick={onCancel}
          >Cancel</button>
        </div>
      </div>
    </div>
  );
}
