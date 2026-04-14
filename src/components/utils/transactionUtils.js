/**
 * Styles for TransactionList component
 */
export const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  addButton: { backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s ease' },
  list: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #eee' },
  transaction: { display: 'flex', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #f8f9fa' },
  transactionInfo: { flex: 1 },
  description: { fontWeight: 'bold', color: '#333', fontSize: '15px' },
  details: { color: '#999', fontSize: '13px', marginTop: '4px' },
  amount: { display: 'flex', alignItems: 'center', gap: '10px' },
  deleteButton: { backgroundColor: '#ff4d4d', color: 'white', border: 'none', borderRadius: '6px', width: '28px', height: '28px', fontSize: '18px', cursor: 'pointer', display: 'flex', placeItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 'normal', transformOrigin: 'center', fontVariantNumeric: 'tabular-nums' },
  empty: { textAlign: 'center', padding: '40px', color: '#999' },
  status: { textAlign: 'center', padding: '20px', color: '#666', fontSize: '16px' }
};

/**
 * Format amount as Malaysian Ringgit currency
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-MY', { 
    style: 'currency', 
    currency: 'MYR' 
  }).format(amount);
};

/**
 * Get transaction color based on type
 */
export const getTransactionColor = (type) => {
  return type === 'income' ? '#28a745' : '#dc3545';
};

/**
 * Get transaction sign (+ or -)
 */
export const getTransactionSign = (type) => {
  return type === 'income' ? '+' : '-';
};

/**
 * Format date to local string
 */
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

/**
 * Get category color with fallback
 */
export const getCategoryColor = (transaction) => {
  return transaction.categories?.color_code || '#6c757d';
};

/**
 * Get category name with fallback
 */
export const getCategoryName = (transaction) => {
  return transaction.categories?.category_name || 'Uncategorized';
};
