# Quick Reference - New Utilities

## Toast Notifications

```jsx
// Import
import { useToastContext } from '../lib/ToastContext';

// Usage
const { success, error, warning, info } = useToastContext();

success('Save successful!');        // Green
error('Something went wrong!');      // Red
warning('Please double check');      // Yellow
info('This is information');         // Blue
```

---

## Form Validation

```jsx
// Single field
import { validateAndSanitize } from '../utils/validation';

const { isValid, value, error } = validateAndSanitize('email', email);

// Multiple fields
import { batchValidate } from '../utils/validation';

const { isAllValid, results } = batchValidate({
  email: userEmail,
  password: userPassword,
  amount: amount
});
```

**Available Validators:**
- email, password, username, amount, categoryName, budgetName, description, date

---

## Pagination

```jsx
import { Pagination } from '../components/Pagination';
import { useState } from 'react';

const [page, setPage] = useState(1);
const [size, setSize] = useState(10);

<Pagination
  currentPage={page}
  totalPages={Math.ceil(items.length / size)}
  totalItems={items.length}
  itemsPerPage={size}
  onPageChange={setPage}
  onItemsPerPageChange={setSize}
/>
```

---

## Input Sanitization

```jsx
import { sanitizers } from '../utils/validation';

const clean = sanitizers.text(input);           // Text
const email = sanitizers.email(input);          // Email
const amount = sanitizers.amount(input);        // Number
const name = sanitizers.categoryName(input);    // Category
```

---

## ARIA Labels (Accessibility)

```jsx
// Buttons
<button aria-label="Close dialog">×</button>
<button aria-label="Delete transaction">🗑️</button>

// Forms
<label htmlFor="email-input">Email:</label>
<input id="email-input" type="email" />

// Live regions
<div aria-live="polite">Saving...</div>
```

---

## Performance - useMemo

```jsx
const data = useMemo(() => {
  return complexCalculation();
}, [dependency]);
```

---

## Performance - useCallback

```jsx
const handleClick = useCallback(() => {
  doSomething();
}, [dependency]);
```

---

## Error Handling Pattern

```jsx
try {
  const result = await someAsyncOperation();
  toast.success('Operation successful!');
} catch (err) {
  toast.error(err.message);
  console.error('Error:', err);
}
```

---

## Form Validation Pattern

```jsx
const handleSubmit = (e) => {
  e.preventDefault();
  
  const { isAllValid, results } = batchValidate({
    email: form.email,
    amount: form.amount,
  });
  
  if (!isAllValid) {
    Object.entries(results).forEach(([field, { error }]) => {
      if (error) toast.error(`${field}: ${error}`);
    });
    return;
  }
  
  // Process valid data
};
```

---

**For full documentation see:** `IMPLEMENTATION_GUIDE.md`
