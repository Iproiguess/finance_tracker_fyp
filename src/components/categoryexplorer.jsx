import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useCategories } from '../hooks/usecategories';
import { useTransactions } from '../hooks/usetransactions';
import { useBudgets } from '../hooks/usebudgets';
import { CategoryManager } from './categorymanager';
import { CategoryEditor } from './categoryeditor';
import { styles, formatCurrency, formatDate, getTransactionColor, getTransactionSign } from './utils/categoryExplorerUtils';
import { getCurrentSpendingByBudget } from './utils/budgetUtils';
import { AddTransaction } from './addtransaction';

export function CategoryExplorer() {
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [showDeleteTransactionConfirm, setShowDeleteTransactionConfirm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [selectedTransactionForDetails, setSelectedTransactionForDetails] = useState(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [hoveredAddBtn, setHoveredAddBtn] = useState(false);
  const [hoveredTransactionDetailsBtn, setHoveredTransactionDetailsBtn] = useState(null);
  const initializedRef = useRef(false);

  const { categories, loading: catsLoading, fetchCategories, addCategory, deleteCategory } = useCategories();
  const { transactions, loading: txnLoading, categoryStats, fetchTransactions, fetchCategoryStats, deleteTransaction } = useTransactions();
  const { budgets, loading: budgetsLoading } = useBudgets();

  const handleEditClick = (category) => {
    setEditingCategoryId(category.category_id);
    setEditingCategory(category);
  };

  // Initialize selected category on first load or when categories change
  useLayoutEffect(() => {
    if (categories.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      // This setState is intentional for initialization and won't cause issues
      // because we use a ref to prevent multiple calls
      setSelectedCategory(categories[0].category_id);
    }
  }, [categories]);

  // Fetch transactions when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchTransactions(selectedCategory);
    }
  }, [selectedCategory, fetchTransactions]);

  useEffect(() => {
    fetchCategoryStats();
  }, [fetchCategoryStats]);

  // Group transactions by month
  const groupTransactionsByMonth = (txs) => {
    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const grouped = {};
    
    txs.forEach(tx => {
      const date = new Date(tx.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = { label: monthLabel, transactions: [] };
      }
      grouped[monthKey].transactions.push(tx);
    });

    // Sort by date descending (newest first)
    return Object.entries(grouped)
      .sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
      .map(([/* date */, value]) => value);
  };


  if (catsLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 16, color: '#333', fontWeight: 500 }}>Loading categories...</div>;

  const handleCloseCategoryManager = async () => {
    setShowCategoryManager(false);
    await fetchCategories();
  };

  return (
    <div style={styles.explorer}>      
      {showCategoryManager && !editingCategoryId && (
        <CategoryManager
          onClose={handleCloseCategoryManager}
          categories={categories}
          categoryStats={categoryStats}
          addCategory={addCategory}
          deleteCategory={deleteCategory}
          fetchCategories={fetchCategories}
        />
      )}

      {editingCategoryId && editingCategory && (
        <CategoryEditor
          category={editingCategory}
          onClose={() => {
            setEditingCategoryId(null);
            setEditingCategory(null);
            setShowCategoryManager(false);
          }}
          fetchCategories={fetchCategories}
          fetchTransactions={fetchTransactions}
        />
      )}

      {selectedTransactionForDetails && (
        <div style={styles.overlay}>
          <div style={styles.detailsModal}>
            <div style={styles.detailsHeader}>
              <h3 style={{ margin: 0, color: '#000', fontWeight: 700 }}>Transaction Details</h3>
                <button
                  onClick={() => setSelectedTransactionForDetails(null)}
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
                    ...(hoveredTransactionDetailsBtn === 'close' && {
                      backgroundColor: '#c0392b',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                    })
                  }}
                  onMouseEnter={() => setHoveredTransactionDetailsBtn('close')}
                  onMouseLeave={() => setHoveredTransactionDetailsBtn(null)}
                  aria-label="Close"
                >
                  &times;
                </button>
            </div>
            <div style={styles.detailsContent}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Type:</span>
                <span style={styles.detailValue}>{selectedTransactionForDetails.type}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Amount:</span>
                <span style={{...styles.detailValue, color: getTransactionColor(selectedTransactionForDetails.type)}}>
                  {getTransactionSign(selectedTransactionForDetails.type)}{formatCurrency(selectedTransactionForDetails.amount)}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Description:</span>
                <span style={styles.detailValue}>{selectedTransactionForDetails.description || 'N/A'}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Date:</span>
                <span style={styles.detailValue}>{formatDate(selectedTransactionForDetails.date)}</span>
              </div>
            </div>
            <div style={styles.detailsActions}>
              <button
                onClick={() => {
                  setEditingTransaction(selectedTransactionForDetails);
                  setShowAddForm(true);
                  setSelectedTransactionForDetails(null);
                }}
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
                onClick={() => {
                  setTransactionToDelete(selectedTransactionForDetails);
                  setShowDeleteTransactionConfirm(true);
                }}
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
      )}

      {showDeleteTransactionConfirm && (
        <div style={styles.overlay}>
          <div style={{ ...styles.detailsModal, maxWidth: '380px', textAlign: 'center', padding: '40px 28px', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h4 style={{ color: '#000', fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>Delete Transaction?</h4>
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
                onClick={async () => {
                  await deleteTransaction(transactionToDelete.transaction_id);
                  setShowDeleteTransactionConfirm(false);
                  fetchTransactions(selectedCategory);
                  fetchCategoryStats();
                }}
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
                onClick={() => setShowDeleteTransactionConfirm(false)}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* sidebar add category */}
      <div style={styles.sidebar}>
        <div style={styles.categoryList}>
          {categories.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#bdc3c7' }}>
              <p>No categories yet.</p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>Click "+ New Category" to get started!</p>
            </div>
          ) : (
            categories.map((category) => {
              const stats = categoryStats[category.category_id] || { income: 0, expense: 0 };
              const isActive = selectedCategory === category.category_id;
              const categoryColor = category.color_code || '#3498db';

              return (
                <div
                  key={category.category_id}
                  onClick={() => setSelectedCategory(category.category_id)}
                  style={{
                    ...styles.categoryItem,
                    backgroundColor: isActive ? '#455a64' : '#34495e',
                    borderLeft: `4px solid ${categoryColor}`,
                    borderRight: isActive ? `2px solid ${categoryColor}` : '1px solid #455a64'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#455a64';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    const baseStyle = styles.categoryItem;
                    e.currentTarget.style.backgroundColor = isActive ? '#455a64' : '#34495e';
                    e.currentTarget.style.boxShadow = baseStyle.boxShadow;
                    e.currentTarget.style.transform = baseStyle.transform;
                  }}
                >
                  <div style={styles.categoryItemContent}>
                    <span style={styles.categoryName}>{category.category_name}</span>
                    <div style={styles.categoryItemStats}>
                      <span style={{ color: '#27ae60' }}>₊{formatCurrency(stats.income)}</span>
                      <span style={{ color: '#e74c3c' }}>₋{formatCurrency(stats.expense)}</span>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <button
                        style={{
                          backgroundColor: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          transition: 'background-color 0.2s',
                          width: '100%'
                        }}
                        onClick={e => { e.stopPropagation(); handleEditClick(category); }}
                      >Edit</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div style={styles.sidebarFooter}>
          <button 
            style={{
              ...styles.manageCategoryBtn,
              ...(hoveredAddBtn && { 
                backgroundColor: '#3d4a63',
                borderColor: '#5a6a85',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              })
            }}
            onMouseEnter={() => setHoveredAddBtn(true)}
            onMouseLeave={() => setHoveredAddBtn(false)}
            onClick={() => setShowCategoryManager(true)}
          >
            + Add Category
          </button>
        </div>
      </div>

      {/* not sidebar */}
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h2 style={styles.headerTitle}>
                {categories.find(c => c.category_id === selectedCategory)?.category_name || 'Select Category'}
              </h2>
              {selectedCategory && !budgetsLoading && !txnLoading && budgets.length > 0 && budgets.filter(b => (b.category_ids || []).includes(selectedCategory)).length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', margin: '4px 0 0 2px' }}>
                  <span style={{ fontSize: 13, color: '#888', fontWeight: 500, marginRight: 4 }}>
                    Affected Budgets:
                  </span>
                  {budgets.filter(b => (b.category_ids || []).includes(selectedCategory)).map(budget => {
                    // Calculate total spending for the whole budget (all categories)
                    const totalSpent = getCurrentSpendingByBudget(budget, transactions);
                    const budgetColor = '#2980b9';
                    return (
                      <span
                        key={budget.budget_id}
                        style={{
                          background: budgetColor,
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '2px 10px',
                          fontSize: 13,
                          fontWeight: 500,
                          opacity: 0.95,
                          transition: 'background 0.2s',
                          maxWidth: 140,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          outline: 'none',
                          cursor: 'default',
                          display: 'inline-block',
                        }}
                        title={budget.budget_name + ' (' + totalSpent + '/' + budget.monthly_limit + ')'}
                      >
                        {budget.budget_name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            {selectedCategory && (
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  margin: '0 0 0 32px',
                  background: '#2980b9',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '7px 18px',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(41,128,185,0.08)',
                  transition: 'all 0.2s ease',
                  alignSelf: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1f618d';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(41, 128, 185, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#2980b9';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 4px rgba(41,128,185,0.08)';
                }}
              >
                + Add Transaction
              </button>
            )}
          </div>
        </div>

        <div style={styles.list}>
          {txnLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', fontSize: 16, color: '#333', fontWeight: 500 }}>Loading transactions...</div>
          ) : !selectedCategory ? (
            <div style={styles.empty}><p>Please select a category from the left.</p></div>
          ) : transactions.length === 0 ? (
            <div style={styles.empty}><p>No transactions yet.</p></div>
          ) : (
            groupTransactionsByMonth(transactions).map((monthGroup) => (
              <div key={monthGroup.label}>
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#ecf0f1',
                  borderBottom: '1px solid #bdc3c7',
                  fontWeight: '600',
                  color: '#2c3e50',
                  fontSize: '13px',
                  marginTop: monthGroup.label === groupTransactionsByMonth(transactions)[0].label ? '0' : '12px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {monthGroup.label}
                </div>
                {monthGroup.transactions.map((transaction) => (
                  <div 
                    key={transaction.transaction_id} 
                    style={styles.transaction}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f4f8';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.2)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = '#3498db';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fafdff';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(30,34,47,0.04)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = '#e3e7ed';
                    }}
                  >
                    <div style={styles.transactionInfo}>
                      <div style={styles.description}>{transaction.description || 'No description'}</div>
                      <div style={styles.details}>{formatDate(transaction.date)}</div>
                    </div>
                    <div style={styles.amount}>
                      <span style={{ ...styles.amountText, color: getTransactionColor(transaction.type) }}>
                        {getTransactionSign(transaction.type)}{formatCurrency(transaction.amount)}
                      </span>
                      <button 
                        onClick={() => setSelectedTransactionForDetails(transaction)} 
                        style={styles.editButton}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#1b6dd4';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(45, 140, 255, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = styles.editButton.backgroundColor;
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Transaction Form Overlay */}
        {showAddForm && (
          <div style={styles.overlay}>
             <div style={styles.detailsModal}>
                <AddTransaction
                  categoryId={selectedCategory}
                  editingTransaction={editingTransaction}
                  autoComplete="off" // Disabling autocomplete here
                  onClose={async () => {
                    setShowAddForm(false);
                    setEditingTransaction(null);
                    if (selectedCategory) {
                      await fetchTransactions(selectedCategory);
                      await fetchCategoryStats();
                    }
                  }}
                />
             </div>
          </div>
        )}
      </div>
    </div>
  );
}