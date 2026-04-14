import { uiTheme } from './uiTheme';

export const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(30,41,59,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000
  },
  modal: {
    backgroundColor: uiTheme.colors.card,
    borderRadius: uiTheme.borderRadius,
    padding: uiTheme.spacing.lg,
    width: '95%',
    maxWidth: '420px',
    boxShadow: uiTheme.cardShadow,
    fontFamily: uiTheme.fontFamily
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: uiTheme.spacing.md
  },
  closeButton: {
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
  content: { display: 'flex', flexDirection: 'column', gap: uiTheme.spacing.md },
  form: { display: 'flex', flexDirection: 'column', gap: uiTheme.spacing.md },
  colorPicker: { display: 'flex', flexDirection: 'column', gap: uiTheme.spacing.sm },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: uiTheme.spacing.xs },
  label: { fontSize: uiTheme.fontSize.small, fontWeight: 600, color: uiTheme.colors.textLight, marginBottom: '6px' },
  input: {
    padding: uiTheme.spacing.sm,
    borderRadius: '8px',
    border: '1.5px solid ' + uiTheme.colors.border,
    fontSize: uiTheme.fontSize.base,
    outline: 'none',
    background: '#f4f6fa',
    color: uiTheme.colors.text
  },
  colorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: uiTheme.spacing.sm
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
  actionRow: { display: 'flex', gap: uiTheme.spacing.sm, marginTop: uiTheme.spacing.sm },
  saveBtn: {
    flex: 2,
    padding: uiTheme.spacing.sm,
    backgroundColor: uiTheme.colors.accent,
    color: 'white',
    border: 'none',
    borderRadius: uiTheme.borderRadius,
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: uiTheme.fontSize.base,
    boxShadow: '0 2px 8px ' + uiTheme.colors.shadow,
    transition: 'all 0.2s ease',
    outline: 'none'
  },
  deleteBtn: {
    flex: 1,
    padding: uiTheme.spacing.sm,
    backgroundColor: '#fff',
    color: uiTheme.colors.danger,
    border: '1.5px solid ' + uiTheme.colors.danger,
    borderRadius: uiTheme.borderRadius,
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: uiTheme.fontSize.base,
    transition: uiTheme.transition,
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
