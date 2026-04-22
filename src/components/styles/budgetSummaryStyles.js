export const styles = {
  card: { background: '#fff', border: '1px solid #ddd', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', flex: 1, minWidth: 300 },
  title: { margin: 0, marginBottom: 12, fontSize: 18, color: '#333' },
  row: { display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 16, color: '#333' }
};

export const formatCurrency = (amount) => {
  return amount.toFixed(2);
};

export const getRemainingColor = (remaining) => {
  return remaining < 0 ? '#dc3545' : '#28a745';
};
