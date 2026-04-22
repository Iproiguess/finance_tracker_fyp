
export const styles = {
  explorer: { display: 'flex', height: '100%', minHeight: 0, backgroundColor: '#23273a', color: '#e7eaf1' },
  sidebar: { width: '260px', backgroundColor: '#23273a', borderRight: '1px solid #2e3347', display: 'flex', flexDirection: 'column', color: '#e7eaf1', height: '100%', minHeight: 0, overflowY: 'hidden' },
  sidebarHeader: { padding: 0, borderBottom: '1px solid #2e3347', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: 0, height: '0px', borderRadius: '0' },
  manageCategoryBtn: {
    background: '#2e3347',
    color: '#e7eaf1',
    border: '1px solid #454d62',
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    width: '100%',
    height: 'auto',
    boxShadow: '0 2px 8px rgba(30,34,47,0.10)',
    transition: 'all 0.18s cubic-bezier(.4,0,.2,1)',
    outline: 'none',
    letterSpacing: '0.5px',
    margin: 0,
    display: 'block',
    whiteSpace: 'wrap',
    overflow: 'visible',
    textOverflow: 'ellipsis',
  },
  sidebarFooter: { padding: '12px', borderTop: '1px solid #2e3347', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#23273a', flexShrink: 0, marginTop: 'auto' },
  categoryList: { flex: 1, overflowY: 'auto', padding: '10px', minHeight: 0, display: 'flex', flexDirection: 'column' },
  categoryItem: { padding: '12px', marginBottom: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.25s ease', backgroundColor: '#2e3347', borderLeft: '4px solid', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  categoryItemContent: { flex: 1 },
  categoryName: { fontWeight: '600', fontSize: '15px', color: '#f3f6fa' },
  categoryItemStats: { display: 'flex', gap: '8px', fontSize: '12px', marginTop: '4px', color: '#a2adc7' },
  miniEditBtn: { color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', backgroundColor: '#2d8cff', transition: 'all 0.2s ease', marginTop: '4px', width: '100%' },
  mainContent: { flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: '#f5f6fa' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 32px', backgroundColor: '#fff', borderBottom: '1px solid #e3e7ed', minHeight: '48px' },
  headerTitle: { color: '#23273a', fontWeight: 800, fontSize: '1.5rem', margin: 0 },
  addButton: { backgroundColor: '#2d8cff', color: 'white', border: 'none', padding: '13px 28px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' },
  list: { flex: 1, overflowY: 'auto', padding: '32px' },
  transaction: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', marginBottom: '18px', backgroundColor: '#fafdff', border: '1px solid #e3e7ed', borderRadius: '14px', boxShadow: '0 2px 8px rgba(30,34,47,0.04)', cursor: 'pointer', transition: 'all 0.25s ease' },
  transactionInfo: { flex: 1 },
  description: { fontWeight: 'bold', color: '#23273a', fontSize: '18px' },
  details: { fontSize: '13px', color: '#7b8494' },
  amount: { display: 'flex', alignItems: 'center', gap: '15px' },
  amountText: { fontWeight: 'bold', fontSize: '16px' },
  editButton: { backgroundColor: '#2d8cff', border: '1px solid #1a6ed8', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: 'white', transition: 'all 0.2s ease' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(35,39,58,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  detailsModal: { backgroundColor: '#fff', padding: '22px', borderRadius: '14px', width: '400px', boxShadow: '0 4px 24px rgba(30,34,47,0.10)' },
  detailsHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px', color: '#23273a', fontWeight: 700, fontSize: '1.3rem' },
  detailsContent: { marginBottom: '20px' },
  detailRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e3e7ed' },
  detailLabel: { fontWeight: 'bold', color: '#23273a' },
  detailValue: { color: '#23273a' },
  detailsActions: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  detailsEditBtn: { backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' },
  detailsDeleteBtn: { backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' },
  detailsCloseButton: {
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    display: 'flex',
    placeItems: 'center',
    justifyContent: 'center',
    padding: 0,
    fontSize: '26px',
    lineHeight: 'normal',
    transition: 'background-color 0.2s',
    transformOrigin: 'center',
    fontVariantNumeric: 'tabular-nums'
  },
  loading: { padding: '40px', textAlign: 'center', fontSize: '18px', color: '#000' },
  empty: { textAlign: 'center', marginTop: '50px', color: '#a2adc7' }
};

/**
 * Format currency
 */
export const formatCurrency = (amount) => {
  return amount.toFixed(2);
};

/**
 * Format date to locale string
 */
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

/**
 * Get transaction display color
 */
export const getTransactionColor = (type) => {
  return type === 'income' ? '#27ae60' : '#e74c3c';
};

/**
 * Get transaction sign prefix
 */
export const getTransactionSign = (type) => {
  return type === 'income' ? '+' : '-';
};
