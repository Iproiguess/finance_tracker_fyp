import { useState } from 'react';
import { styles, formatCurrency, formatDate, getTransactionColor, getTransactionSign } from './utils/categoryExplorerUtils';

export function TransactionDetailsModal({ transaction, onClose, onEdit, onDelete }) {
  const [hoveredBtn, setHoveredBtn] = useState(null);

  return (
    <div style={styles.overlay}>
      <div style={styles.detailsModal}>
        <div style={styles.detailsHeader}>
          <h3 style={{ margin: 0, color: '#000', fontWeight: 700 }}>Transaction Details</h3>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              width: '28px',
              height: '28px',
              display: 'flex',
              placeItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              outline: 'none',
              padding: 0,
              lineHeight: 'normal',
              transition: 'all 0.2s ease',
              transformOrigin: 'center',
              fontVariantNumeric: 'tabular-nums',
              ...(hoveredBtn === 'close' && {
                backgroundColor: '#c0392b',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
              })
            }}
            onMouseEnter={() => setHoveredBtn('close')}
            onMouseLeave={() => setHoveredBtn(null)}
            aria-label="Close"
          >
            <span style={{ position: 'relative', top: '-1px' }}>&times;</span>
          </button>
        </div>
        <div style={styles.detailsContent}>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Type:</span>
            <span style={styles.detailValue}>{transaction.type}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Amount:</span>
            <span style={{...styles.detailValue, color: getTransactionColor(transaction.type)}}>
              {getTransactionSign(transaction.type)}{formatCurrency(transaction.amount)}
            </span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Description:</span>
            <span style={styles.detailValue}>{transaction.description || 'N/A'}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Date:</span>
            <span style={styles.detailValue}>{formatDate(transaction.date)}</span>
          </div>
        </div>
        <div style={styles.detailsActions}>
          <button
            onClick={onEdit}
            style={styles.detailsEditBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#088c5e';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = styles.detailsEditBtn.backgroundColor;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >Edit</button>
          <button
            onClick={onDelete}
            style={styles.detailsDeleteBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = styles.detailsDeleteBtn.backgroundColor;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >Delete</button>
        </div>
      </div>
    </div>
  );
}
