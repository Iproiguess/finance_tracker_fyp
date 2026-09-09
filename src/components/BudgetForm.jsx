
import { styles } from './styles/budgetStyles';
import { generateBudgetName } from './utils/budgetUtils';

export default function BudgetForm({
  formData,
  categories,
  isEditing,
  onSubmit,
  onChange,
  onCancel
}) {
  const handleCategoryToggle = (categoryId) => {
    const newIds = formData.category_ids.includes(categoryId)
      ? formData.category_ids.filter(id => id !== categoryId)
      : [...formData.category_ids, categoryId];
    
    const oldGeneratedName = generateBudgetName(formData.category_ids, categories);
    const newGeneratedName = generateBudgetName(newIds, categories);
    
    onChange({
      ...formData,
      category_ids: newIds,
      budget_name: formData.budget_name === oldGeneratedName || !formData.budget_name
        ? newGeneratedName
        : formData.budget_name
    });
  };

  return (
    <form onSubmit={onSubmit} style={styles.form}>
      <style>{`
        .no-spinner::-webkit-outer-spin-button,
        .no-spinner::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .no-spinner[type=number] {
          -moz-appearance: textfield;
        }
        .category-badge-btn {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          outline: none !important;
        }
        .category-badge-btn:focus {
          outline: none !important;
        }
        .category-badge-btn:active {
          outline: none !important;
        }
        input:focus, select:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
        }
      `}</style>

      <div style={styles.formGroup}>
        <label style={{ ...styles.label, color: '#000' }}>Budget Name:</label>
        <input
          type="text"
          value={formData.budget_name}
          onChange={(e) => onChange({...formData, budget_name: e.target.value})}
          placeholder={generateBudgetName(formData.category_ids, categories) || 'Enter budget name...'}
          style={styles.input}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={{ ...styles.label, color: '#000' }}>Categories:</label>
        <div style={styles.categoryBadges}>
          {categories.map(category => {
            const isSelected = formData.category_ids.includes(category.category_id);
            return (
              <button
                key={category.category_id}
                type="button"
                className="category-badge-btn"
                onClick={() => handleCategoryToggle(category.category_id)}
                style={{
                  ...styles.categoryBadge,
                  backgroundColor: isSelected ? category.color_code : category.color_code + '30',
                  borderColor: category.color_code,
                  color: isSelected ? '#fff' : '#333',
                  fontWeight: '500'
                }}
              >
                {category.category_name}
              </button>
            );
          })}
        </div>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Monthly Limit:</label>
        <input
          type="number"
          step="0.01"
          value={formData.monthly_limit}
          onChange={(e) => onChange({...formData, monthly_limit: e.target.value})}
          className="no-spinner"
          style={styles.input}
          placeholder="0.00"
          required
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.rollover}
            onChange={(e) => onChange({...formData, rollover: e.target.checked})}
            style={styles.checkbox}
          />
          Enable Rollover
        </label>
      </div>

      {formData.rollover && (
        <div style={styles.formGroup}>
          <label style={styles.label}>Rollover Mode:</label>
          <select
            value={formData.rollover_mode || 'previous-month'}
            onChange={(e) => onChange({ ...formData, rollover_mode: e.target.value })}
            style={styles.select}
          >
            <option value="previous-month">Previous month only</option>
            <option value="full">Full carry-over</option>
          </select>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          type="submit" 
          style={{ ...styles.submitButton, flex: 1 }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#218838';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = styles.submitButton.backgroundColor;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {isEditing ? 'Update Budget' : 'Add Budget'}
        </button>
        <button 
          type="button" 
          onClick={onCancel} 
          style={{ ...styles.submitButton, flex: 1, backgroundColor: '#6c757d' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#5a6268';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#6c757d';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
