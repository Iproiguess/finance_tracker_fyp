import { useTransactions } from '../hooks/usetransactions';
import { styles, formatCurrency, getTransactionColor, getTransactionSign, formatDate, getCategoryColor, getCategoryName } from './utils/transactionUtils';

export function TransactionList({ onAddClick }) {
  const { transactions, loading, error, deleteTransaction } = useTransactions();

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 16, color: '#333', fontWeight: 500 }}>Loading transactions...</div>;
  if (error) return <div style={styles.status}>Error: {error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={{ margin: 0 }}>Transactions</h2>
        <button 
          onClick={onAddClick} 
          style={styles.addButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#0056b3';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 86, 179, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#007bff';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          + Add Transaction
        </button>
      </div>

      {transactions.length === 0 ? (
        <div style={styles.empty}>No transactions yet.</div>
      ) : (
        <div style={styles.list}>
          {transactions.map((transaction) => {
            const categoryColor = getCategoryColor(transaction);
            const categoryName = getCategoryName(transaction);

            return (
              <div key={transaction.transaction_id} style={styles.transaction}>
                <div style={{
                  width: '6px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: categoryColor,
                  marginRight: '15px'
                }} />

                <div style={styles.transactionInfo}>
                  <div style={styles.description}>
                    {transaction.description || 'No description'}
                  </div>
                  <div style={styles.details}>
                    <span style={{ color: categoryColor, fontWeight: 'bold' }}>
                      {categoryName}
                    </span> 
                    <span style={{ color: '#999' }}> • {formatDate(transaction.date)}</span>
                  </div>
                </div>

                <div style={styles.amount}>
                  <span style={{
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: getTransactionColor(transaction.type)
                  }}>
                    {getTransactionSign(transaction.type)}{formatCurrency(transaction.amount)}
                  </span>
                  <button 
                    onClick={() => deleteTransaction(transaction.transaction_id)} 
                    style={styles.deleteButton}
                  >
                    &times;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}