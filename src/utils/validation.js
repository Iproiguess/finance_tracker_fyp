/**
 * Form validation and sanitization utilities
 */

export const validators = {
  // Email validation
  email: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Password validation (10+ chars, mix of upper, lower, number)
  password: (password) => {
    return (
      password.length >= 10 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  },

  // Username validation (3-20 chars, alphanumeric + underscore)
  username: (username) => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  },

  // Amount validation (positive number, max 2 decimals)
  amount: (amount) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && /^\d+(\.\d{1,2})?$/.test(amount);
  },

  // Category name validation (1-50 chars, alphanumeric + space)
  categoryName: (name) => {
    return /^[a-zA-Z0-9\s]{1,50}$/.test(name.trim());
  },

  // Budget name validation
  budgetName: (name) => {
    return name.trim().length > 0 && name.trim().length <= 100;
  },

  // Description validation (optional, max 500 chars)
  description: (desc) => {
    return desc == null || desc.trim().length <= 500;
  },

  // Date validation
  date: (date) => {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  },
};

/**
 * Sanitization functions to prevent XSS
 */
export const sanitizers = {
  // Remove potentially harmful characters but allow normal text
  text: (text) => {
    if (typeof text !== 'string') return '';
    return text
      .trim()
      .slice(0, 500) // Limit length
      .replace(/[<>"']/g, ''); // Remove dangerous chars
  },

  // Email sanitization
  email: (email) => {
    return typeof email === 'string' ? email.trim().toLowerCase() : '';
  },

  // Amount sanitization (extract numeric value)
  amount: (amount) => {
    const num = parseFloat(amount);
    return isNaN(num) ? 0 : Math.max(0, Math.round(num * 100) / 100);
  },

  // Category name sanitization
  categoryName: (name) => {
    return sanitizers.text(name);
  },

  // Budget name sanitization
  budgetName: (name) => {
    return sanitizers.text(name);
  },

  // Description sanitization
  description: (desc) => {
    return desc ? sanitizers.text(desc) : '';
  },

  // HTML escape for displaying user content
  escapeHtml: (text) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
  },
};

/**
 * Combined validate and sanitize function
 */
export function validateAndSanitize(field, value) {
  const sanitized = sanitizers[field]?.(value) || value;
  const isValid = validators[field]?.(sanitized) ?? true;

  return {
    isValid,
    value: sanitized,
    error: !isValid ? getErrorMessage(field) : null,
  };
}

/**
 * Get error messages for validation failures
 */
function getErrorMessage(field) {
  const messages = {
    email: 'Please enter a valid email address',
    password: 'Password must be at least 10 characters with uppercase, lowercase, and number',
    username: 'Username must be 3-20 characters (letters, numbers, underscore only)',
    amount: 'Please enter a valid positive amount',
    categoryName: 'Category name must be 1-50 characters',
    budgetName: 'Budget name must be 1-100 characters',
    description: 'Description must be 500 characters or less',
    date: 'Please enter a valid date',
  };

  return messages[field] || 'Invalid input';
}

/**
 * Batch validation for multiple fields
 */
export function batchValidate(fields) {
  const results = {};
  let isAllValid = true;

  Object.entries(fields).forEach(([fieldName, value]) => {
    const result = validateAndSanitize(fieldName, value);
    results[fieldName] = result;
    if (!result.isValid) isAllValid = false;
  });

  return { isAllValid, results };
}
