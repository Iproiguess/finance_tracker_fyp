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
    fontWeight: 800,
    color: '#23273a',
    letterSpacing: '0.5px'
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
  input: {
    padding: uiTheme.spacing.sm,
    borderRadius: '8px',
    border: '1.5px solid ' + uiTheme.colors.border,
    fontSize: uiTheme.fontSize.base,
    outline: 'none',
    background: '#f4f6fa',
    color: uiTheme.colors.text
  },
  label: {
    fontSize: uiTheme.fontSize.small,
    fontWeight: 600,
    color: uiTheme.colors.textLight,
    marginBottom: '6px'
  },
  colorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: uiTheme.spacing.sm,
    marginBottom: uiTheme.spacing.md
  },
  colorOption: {
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    cursor: 'pointer',
    border: '2px solid ' + uiTheme.colors.border,
    transition: uiTheme.transition,
    outline: 'none'
  },
  submitBtn: {
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
    transition: 'all 0.2s ease',
    outline: 'none'
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

export const DEFAULT_COLORS = [
  '#007bff', '#28a745', '#dc3545', '#ffc107', 
  '#17a2b8', '#6f42c1', '#e83e8c', '#fd7e14', 
  '#20c997', '#6c757d', '#ff6b6b', '#4ecdc4'
];

export const isDuplicateCategory = (categoryName, categories) => {
  return categories.some(
    (cat) => cat.category_name.toLowerCase() === categoryName.trim().toLowerCase()
  );
};

export const formatCategoryName = (name) => {
  return name.trim();
};
