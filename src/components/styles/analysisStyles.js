export const styles = {
  // Main container
  container: {
    display: 'flex',
    height: '100%',
    minHeight: 0,
    backgroundColor: '#f5f5f5'
  },

  // Modal overlay
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },

  // Modal dialog
  modalDialog: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    maxHeight: '85vh',
    overflowY: 'auto',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  },

  // Modal header
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },

  modalTitle: {
    margin: 0,
    color: '#000'
  },

  // Modal close button
  modalCloseBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#333',
    display: 'flex',
    placeItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    padding: 0,
    lineHeight: 'normal',
    transformOrigin: 'center',
    fontVariantNumeric: 'tabular-nums'
  },

  // Sidebar
  sidebar: {
    width: '280px',
    backgroundColor: '#2c3e50',
    borderRight: '1px solid #1a252f',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    color: '#fff',
    height: '100%',
    minHeight: 0,
    overflowY: 'hidden'
  },

  sidebarHeader: {
    marginBottom: '16px'
  },

  sidebarTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    color: '#ecf0f1',
    fontWeight: '600',
    textTransform: 'uppercase'
  },

  sidebarSubtitle: {
    margin: 0,
    fontSize: '13px',
    color: '#bdc3c7'
  },

  // Buttons
  addBudgetBtn: {
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 14px',
    marginBottom: '12px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '13px',
    transition: 'all 0.2s ease',
    outline: 'none'
  },

  clearAllBtn: {
    backgroundColor: 'transparent',
    color: '#3498db',
    border: '1px solid #3498db',
    borderRadius: '6px',
    padding: '8px 12px',
    marginTop: 0,
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    outline: 'none'
  },

  budgetHint: {
    fontSize: '11px',
    color: '#95a5a6',
    textAlign: 'center',
    marginTop: '4px',
    lineHeight: '1.2'
  },

  // Budget list
  budgetList: {
    flex: 1,
    overflowY: 'auto',
    minHeight: 0
  },

  budgetListFooter: {
    padding: '8px',
    borderTop: '1px solid #455a64',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    backgroundColor: '#2c3e50',
    flexShrink: 0,
    marginTop: 'auto'
  },

  emptyBudgetText: {
    padding: '12px',
    color: '#bdc3c7',
    fontSize: '13px'
  },

  budgetItem: (isSelected) => ({
    padding: '12px',
    marginBottom: '8px',
    backgroundColor: isSelected ? '#3d5a80' : '#34495e',
    border: `2px solid ${isSelected ? '#3498db' : '#455a64'}`,
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    color: '#ecf0f1',
    boxShadow: isSelected ? '0 4px 12px rgba(52, 152, 219, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
    transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
    ':hover': {
      backgroundColor: isSelected ? '#3d5a80' : '#3d5a80',
      borderColor: '#3498db',
      boxShadow: '0 4px 12px rgba(52, 152, 219, 0.15)',
      transform: 'translateY(-1px)'
    }
  }),

  budgetItemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px'
  },

  budgetCheckbox: {
    cursor: 'pointer',
    width: '16px',
    height: '16px',
    accentColor: '#3498db'
  },

  budgetName: {
    fontSize: '13px',
    fontWeight: '500',
    flex: 1,
    color: '#ecf0f1'
  },

  budgetPeriod: {
    fontSize: '12px',
    color: '#bdc3c7',
    marginLeft: '24px'
  },

  budgetAmount: {
    fontSize: '12px',
    color: '#95a5a6',
    marginLeft: '24px',
    marginTop: '4px'
  },

  // Main analysis content
  mainContent: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    backgroundColor: '#f5f5f5'
  },

  pageTitle: {
    margin: '0 0 14px 0',
    color: '#2c3e50'
  },

  summaryContainer: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    alignItems: 'flex-start'
  },

  // Transaction card
  transactionCard: {
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: 12,
    padding: 20,
    flex: 1,
    minWidth: 300,
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },

  cardTitle: {
    margin: 0,
    marginBottom: 12,
    fontSize: 18,
    color: '#2c3e50'
  },

  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 6,
    color: '#333'
  },

  // Section containers
  sectionContainer: {
    marginTop: '24px'
  },

  sectionContainerSecondary: {
    marginTop: '22px'
  },

  sectionTitle: {
    marginBottom: '12px',
    color: '#2c3e50',
    fontWeight: '600'
  },

  // Table styles
  tableWrapper: {
    overflowX: 'auto',
    border: '1px solid #bbb',
    borderRadius: '8px',
    backgroundColor: '#fff'
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },

  tableHead: {
    backgroundColor: '#2c3e50',
    color: '#fff'
  },

  tableHeaderCell: (align = 'left') => ({
    border: '1px solid #1a252f',
    padding: '12px 14px',
    textAlign: align,
    color: '#fff',
    fontWeight: '600',
    fontSize: '13px'
  }),

  tableCell: (align = 'left', rowIndex = 0) => ({
    border: '1px solid #e0e0e0',
    padding: '12px 14px',
    textAlign: align,
    color: '#333',
    backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f9f9f9',
    transition: 'background-color 0.2s ease'
  }),

  tableCellWithColor: (align, color, rowIndex = 0) => ({
    border: '1px solid #e0e0e0',
    padding: '12px 14px',
    textAlign: align,
    color: color,
    fontWeight: '600',
    backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f9f9f9',
    transition: 'background-color 0.2s ease'
  }),

  emptyTableCell: {
    padding: '12px',
    textAlign: 'center',
    color: '#999'
  },

  // Chart styles
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
    marginTop: '24px'
  },

  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #ddd',
    minHeight: '510px',
    display: 'flex',
    flexDirection: 'column'
  },

  fullWidthChartContainer: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #ddd',
    marginTop: '24px'
  },

  chartTitle: {
    marginTop: 0,
    marginBottom: '12px',
    color: '#2c3e50',
    fontWeight: '600',
    fontSize: '16px'
  },

  // Loading state
  loadingText: {
    padding: '40px',
    color: '#000',
    textAlign: 'center',
    fontSize: '18px'
  }
};

export const getRemainingColor = (remaining) => {
  return remaining < 0 ? '#e74c3c' : '#27ae60';
};
