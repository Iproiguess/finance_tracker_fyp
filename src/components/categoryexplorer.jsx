import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useCategories } from '../hooks/usecategories';
import { useTransactions } from '../hooks/usetransactions';
import { useBudgets } from '../hooks/usebudgets';
import { CategoryManager } from './categorymanager';
import { CategoryEditor } from './categoryeditor';
import { styles, formatCurrency, formatDate, getTransactionColor, getTransactionSign, groupTransactionsByMonth } from './utils/categoryExplorerUtils';
import { getCurrentSpendingByBudget } from './utils/budgetUtils';
import { AddTransaction } from './addtransaction';
import { TransactionDetailsModal } from './TransactionDetailsModal';
import { DeleteTransactionConfirmModal } from './DeleteTransactionConfirmModal';
import { AutomationModal } from './AutomationModal';

export function CategoryExplorer({ selectedCategoryId = null, onCategorySelect = null, isMobile = false, openCategoryManager = false, onCategoryManagerHandled = null }) {
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [showDeleteTransactionConfirm, setShowDeleteTransactionConfirm] = useState(false);
  const [internalSelectedCategory, setInternalSelectedCategory] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [selectedTransactionForDetails, setSelectedTransactionForDetails] = useState(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [hoveredAddBtn, setHoveredAddBtn] = useState(false);
  const initializedRef = useRef(false);

  const { categories, loading: catsLoading, fetchCategories, addCategory, deleteCategory } = useCategories();
  const { transactions, loading: txnLoading, categoryStats, fetchTransactions, fetchCategoryStats, deleteTransaction } = useTransactions();
  const { budgets, loading: budgetsLoading } = useBudgets();

  const handleEditClick = (category) => {
    setEditingCategoryId(category.category_id);
    setEditingCategory(category);
  };

  const selectedCategory = selectedCategoryId ?? internalSelectedCategory;
  const sidebarStyle = isMobile ? { ...styles.sidebar, display: 'none' } : styles.sidebar;

  useLayoutEffect(() => {
    if (!selectedCategoryId && categories.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      setInternalSelectedCategory(categories[0].category_id);
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    if (openCategoryManager) {
      setShowCategoryManager(true);
      if (onCategoryManagerHandled) {
        onCategoryManagerHandled();
      }
    }
  }, [openCategoryManager, onCategoryManagerHandled]);

  useEffect(() => {
    if (selectedCategory) {
      fetchTransactions(selectedCategory);
    }
  }, [selectedCategory, fetchTransactions]);

  useEffect(() => {
    fetchCategoryStats();
  }, [fetchCategoryStats]);

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
        <TransactionDetailsModal
          transaction={selectedTransactionForDetails}
          onClose={() => setSelectedTransactionForDetails(null)}
          onEdit={() => {
            setEditingTransaction(selectedTransactionForDetails);
            setShowAddForm(true);
            setSelectedTransactionForDetails(null);
          }}
          onDelete={() => {
            setTransactionToDelete(selectedTransactionForDetails);
            setShowDeleteTransactionConfirm(true);
          }}
        />
      )}

      {showDeleteTransactionConfirm && (
        <DeleteTransactionConfirmModal
          onConfirm={async () => {
            await deleteTransaction(transactionToDelete.transaction_id);
            setShowDeleteTransactionConfirm(false);
            fetchTransactions(selectedCategory);
            fetchCategoryStats();
          }}
          onCancel={() => setShowDeleteTransactionConfirm(false)}
        />
      )}

      {/* Automation Modal */}
      <AutomationModal
        open={showAutomationModal}
        onClose={() => setShowAutomationModal(false)}
        onAutomationCreated={() => {
          fetchTransactions(selectedCategory);
        }}
      />

      {/* sidebar add category */}
      <div style={sidebarStyle}>
        <div style={{ padding: '6px 12px', borderBottom: '1px solid #2e3347', color: '#8a93a8', fontSize: '10px', fontWeight: '600', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
          Category List:
        </div>
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
                  onClick={() => {
                    if (onCategorySelect) {
                      onCategorySelect(category.category_id);
                    } else {
                      setInternalSelectedCategory(category.category_id);
                    }
                  }}
                  style={{
                    ...styles.categoryItem,
                    background: isActive ? 'linear-gradient(135deg, rgba(91,109,255,0.24) 0%, rgba(29,38,70,0.95) 100%)' : 'rgba(255,255,255,0.06)',
                    borderLeft: `4px solid ${categoryColor}`,
                    borderRight: isActive ? `1px solid ${categoryColor}` : '1px solid rgba(255,255,255,0.08)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(91,109,255,0.28) 0%, rgba(29,38,70,0.98) 100%)';
                    e.currentTarget.style.boxShadow = '0 10px 24px rgba(53,66,110,0.24)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    const baseStyle = styles.categoryItem;
                    e.currentTarget.style.background = isActive ? 'linear-gradient(135deg, rgba(91,109,255,0.24) 0%, rgba(29,38,70,0.95) 100%)' : 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.boxShadow = baseStyle.boxShadow;
                    e.currentTarget.style.transform = baseStyle.transform;
                  }}
                >
                  <div style={styles.categoryItemContent}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: categoryColor, boxShadow: `0 0 0 4px ${categoryColor}22` }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={styles.categoryName}>{category.category_name}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Income & expense</div>
                        </div>
                      </div>
                      {isActive && <span style={{ padding: '4px 8px', borderRadius: '999px', background: 'rgba(125, 211, 252, 0.16)', color: '#7dd3fc', fontSize: '11px', fontWeight: 700 }}>Active</span>}
                    </div>
                    <div style={styles.categoryItemStats}>
                      <span style={{ padding: '4px 8px', borderRadius: '999px', background: 'rgba(34,197,94,0.16)', color: '#4ade80', fontWeight: 700 }}>↑ {formatCurrency(stats.income)}</span>
                      <span style={{ padding: '4px 8px', borderRadius: '999px', background: 'rgba(248,113,113,0.16)', color: '#fda4af', fontWeight: 700 }}>↓ {formatCurrency(stats.expense)}</span>
                    </div>
                    <div style={{ marginTop: '10px' }}>
                      <button
                        style={{
                          background: 'linear-gradient(135deg, #4f8cff 0%, #2f6de9 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '700',
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
                backgroundColor: '#5a6fff',
                borderColor: '#6a7fff',
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
          <div style={isMobile ? { display: 'flex', width: '100%', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' } : { display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: isMobile ? '100%' : 'auto' }}>
              <h2 style={styles.headerTitle}>
                {categories.find(c => c.category_id === selectedCategory)?.category_name || 'Select Category'}
              </h2>
              {selectedCategory && !budgetsLoading && !txnLoading && budgets.length > 0 && budgets.filter(b => (b.category_ids || []).includes(selectedCategory)).length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', margin: '4px 0 0 2px' }}>
                  <span style={{ fontSize: 13, color: '#888', fontWeight: 500, marginRight: 4 }}>
                    Affected Budget(s):
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
              <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'stretch', width: '100%' } : { display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => setShowAddForm(true)}
                  style={{
                    margin: '0',
                    background: '#2980b9',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: isMobile ? '10px 14px' : '7px 18px',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 4px rgba(41,128,185,0.08)',
                    transition: 'all 0.2s ease',
                    width: isMobile ? '100%' : 'auto',
                    justifyContent: isMobile ? 'center' : 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
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

                {/* Automation Button */}
                <button
                  onClick={() => setShowAutomationModal(true)}
                  style={{
                    margin: '0',
                    background: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: isMobile ? '10px 14px' : '7px 18px',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 4px rgba(108,117,125,0.08)',
                    transition: 'all 0.2s ease',
                    width: isMobile ? '100%' : 'auto',
                    justifyContent: isMobile ? 'center' : 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#545a63';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#6c757d';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(108,117,125,0.08)';
                  }}
                  title="Set up automatic recurring transactions"
                >
                  ⚙ Automation
                </button>
              </div>
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
                      <div style={styles.description}>
                        {transaction.description || 'No description'}
                        {transaction.automation_id && (
                          <span style={{
                            display: 'inline-block',
                            marginLeft: '8px',
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            backgroundColor: '#e8f4f8',
                            color: '#0277bd',
                            fontWeight: '500',
                            letterSpacing: '0.5px'
                          }}>
                            auto
                          </span>
                        )}
                      </div>
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