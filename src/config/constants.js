/**
 * Global application constants and configuration
 */

// Currency configuration - Make globally editable
export const CURRENCY = {
  symbol: '',         // No prefix/suffix
  code: 'USD',        // ISO 4217 currency code
  position: 'before'  // 'before' or 'after' the amount
};

/**
 * Format currency value
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  return amount.toFixed(2);
};

/**
 * Get currency symbol
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = () => CURRENCY.symbol;
