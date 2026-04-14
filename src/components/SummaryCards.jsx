
import { styles as summaryStyles, formatCurrency, getRemainingColor } from './styles/budgetSummaryStyles';
import { styles as analysisStyles } from './styles/analysisStyles';

export function SummaryCards({ 
  totalBudget = 0, 
  totalSpent = 0, 
  totalIncome = 0,
  transactionsCount = 0,
  categoriesCount = 0,
  netAmount = 0
}) {
  const remaining = totalBudget - totalSpent;

  return (
    <div style={analysisStyles.summaryContainer}>
      {/* Budget Summary Card */}
      <div style={summaryStyles.card}>
        <h3 style={summaryStyles.title}>Budget Summary</h3>
        <div style={summaryStyles.row}>
          <span>Total Budget:</span>
          <span>{formatCurrency(totalBudget)}</span>
        </div>
        <div style={summaryStyles.row}>
          <span>Total Spent:</span>
          <span>{formatCurrency(totalSpent)}</span>
        </div>
        <div style={summaryStyles.row}>
          <span>Total Income:</span>
          <span style={{ color: '#27ae60' }}>
            {formatCurrency(totalIncome)}
          </span>
        </div>
        <div style={summaryStyles.row}>
          <span>Remaining:</span>
          <span style={{ color: getRemainingColor(remaining) }}>
            {formatCurrency(remaining)}
          </span>
        </div>
      </div>

      {/* Transactions Card */}
      <div style={analysisStyles.transactionCard}>
        <h3 style={analysisStyles.cardTitle}>Transactions</h3>
        <div style={analysisStyles.cardRow}>
          <span>Total transactions</span>
          <span>{transactionsCount}</span>
        </div>
        <div style={analysisStyles.cardRow}>
          <span>Total categories</span>
          <span>{categoriesCount}</span>
        </div>
        <div style={analysisStyles.cardRow}>
          <span>Net</span>
          <span>{formatCurrency(netAmount)}</span>
        </div>
      </div>
    </div>
  );
}

export default SummaryCards;
