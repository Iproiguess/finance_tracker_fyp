import { uiTheme } from './uiTheme';

export const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(30,41,59,0.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999
  },
  modal: {
    backgroundColor: uiTheme.colors.card,
    padding: uiTheme.spacing.lg,
    borderRadius: uiTheme.borderRadius,
    width: '95%',
    maxWidth: '420px',
    boxShadow: uiTheme.cardShadow,
    fontFamily: uiTheme.fontFamily
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: uiTheme.spacing.md
  },
  modalTitle: {
    margin: 0,
    fontSize: uiTheme.fontSize.heading,
    fontWeight: 700,
    color: uiTheme.colors.text
  },
  closeBtn: {
    backgroundColor: uiTheme.colors.danger,
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
    padding: 0,
    lineHeight: 'normal',
    boxShadow: '0 2px 8px ' + uiTheme.colors.shadow,
    transition: 'all 0.2s ease',
    outline: 'none',
    transformOrigin: 'center',
    fontVariantNumeric: 'tabular-nums'
  },
  content: {
    display: 'flex', flexDirection: 'column', gap: uiTheme.spacing.md
  },
  form: {
    display: 'flex', flexDirection: 'column', gap: uiTheme.spacing.md
  },
  toggleGroup: {
    display: 'flex', gap: uiTheme.spacing.sm
  },
  toggleBtn: {
    flex: 1,
    padding: uiTheme.spacing.sm,
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: uiTheme.fontSize.small,
    transition: 'all 0.2s ease',
    border: 'none',
    outline: 'none'
  },
  field: {
    display: 'flex', flexDirection: 'column', gap: '6px'
  },
  label: {
    fontSize: uiTheme.fontSize.small,
    fontWeight: 600,
    color: uiTheme.colors.textLight
  },
  input: {
    padding: uiTheme.spacing.sm,
    borderRadius: '8px',
    border: '1.5px solid ' + uiTheme.colors.border,
    fontSize: uiTheme.fontSize.base,
    outline: 'none',
    background: '#f4f6fa',
    color: uiTheme.colors.text
  },
  submitButton: {
    padding: uiTheme.spacing.sm,
    backgroundColor: uiTheme.colors.accent,
    color: 'white',
    border: 'none',
    borderRadius: uiTheme.borderRadius,
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: uiTheme.fontSize.base,
    marginTop: uiTheme.spacing.md,
    boxShadow: '0 2px 8px ' + uiTheme.colors.shadow,
    transition: 'all 0.2s ease'
  },
  errorBox: {
    color: uiTheme.colors.dangerDark,
    backgroundColor: '#fde8e8',
    padding: uiTheme.spacing.sm,
    borderRadius: '8px',
    border: '1.5px solid ' + uiTheme.colors.danger,
    fontSize: uiTheme.fontSize.small,
    marginBottom: uiTheme.spacing.sm
  }
};

export const TRANSACTION_COLORS = {
  expense: '#dc3545',
  income: '#28a745'
};

export const getInitialFormData = (editingTransaction) => {
  if (editingTransaction) {
    return {
      type: editingTransaction.type,
      amount: editingTransaction.amount.toString(),
      description: editingTransaction.description || '',
      date: editingTransaction.date
    };
  }
  return {
    type: 'expense',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  };
};

export const getTypeButtonStyle = (currentType, selectedType) => {
  const isSelected = currentType === selectedType;
  const bgColor = selectedType === 'expense' ? '#dc3545' : '#28a745';
  
  return {
    ...styles.toggleBtn,
    backgroundColor: isSelected ? bgColor : '#f8f9fa',
    color: isSelected ? 'white' : '#666',
    border: '1px solid',
    borderColor: isSelected ? bgColor : '#ddd'
  };
};
