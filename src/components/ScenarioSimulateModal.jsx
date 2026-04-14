import React, { useState, useRef, useEffect, useCallback } from 'react';

// Styles object (must be outside the component)

export function ScenarioSimulateModal({
  open,
  onClose,
  onSimulate,
}) {
  const [mode, setMode] = useState('percent'); // 'percent' or 'amount'
  const [value, setValue] = useState('');
  const [simulateType, setSimulateType] = useState('expense'); // 'expense', 'income', or 'both'
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [hoveredSimulate, setHoveredSimulate] = useState(false);
  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);
  // Accessibility: trap focus inside modal
  useEffect(() => {
    if (!open) return;
    const handleTab = (e) => {
      if (!modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [open, onClose]);

  // Handlers with useCallback
  // Toggle badge selection
  // No category toggle needed
  const handleModePercent = useCallback(() => setMode('percent'), []);
  const handleModeAmount = useCallback(() => setMode('amount'), []);
  const handleValueChange = useCallback((e) => setValue(e.target.value), []);
  const handleSimulateTypeChange = useCallback((type) => setSimulateType(type), []);
  const handleSimulate = useCallback(() => {
    onSimulate({ mode, value: Number(value), simulateType });
    onClose();
  }, [onSimulate, mode, value, simulateType, onClose]);

  if (!open) return null;

  return (
    <div style={styles.overlay} aria-modal="true" role="dialog">
      <div style={styles.modal} ref={modalRef}>
        <button
          ref={closeBtnRef}
          style={{ 
            ...styles.closeBtn, 
            backgroundColor: '#dc3545',
            color: '#fff',
            ...(hoveredBtn === 'close' && {
              backgroundColor: '#c0392b',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
            })
          }}
          onClick={onClose}
          onMouseEnter={() => setHoveredBtn('close')}
          onMouseLeave={() => setHoveredBtn(null)}
          aria-label="Close"
        >
          ×
        </button>
        <h3 style={styles.title}>Scenario Simulation</h3>
        <div style={styles.descriptionBox}>
          <span>
            Simulate budget scenarios: Select specific budgets, adjust income or expenses by percentage or fixed amount to see real-time impact on your remaining balance.
          </span>
        </div>
        
        <div style={styles.formRow}>
          <label style={styles.label}>Simulate</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{ ...styles.toggleBtn, background: simulateType === 'expense' ? '#2176ae' : '#e3e7ed', color: simulateType === 'expense' ? '#fff' : '#333', flex: 1 }}
              onClick={() => handleSimulateTypeChange('expense')}
              type="button"
              title="Simulate expense changes"
            >
              Expenses
            </button>
            <button
              style={{ ...styles.toggleBtn, background: simulateType === 'income' ? '#2176ae' : '#e3e7ed', color: simulateType === 'income' ? '#fff' : '#333', flex: 1 }}
              onClick={() => handleSimulateTypeChange('income')}
              type="button"
              title="Simulate income changes"
            >
              Income
            </button>
            <button
              style={{ ...styles.toggleBtn, background: simulateType === 'both' ? '#2176ae' : '#e3e7ed', color: simulateType === 'both' ? '#fff' : '#333', flex: 1 }}
              onClick={() => handleSimulateTypeChange('both')}
              type="button"
              title="Simulate both income and expenses"
            >
              Both
            </button>
          </div>
        </div>

        <div style={styles.formRow}>
          <label htmlFor="scenario-value-input" style={styles.label}>Change by</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{ ...styles.toggleBtn, background: mode === 'percent' ? '#2176ae' : '#e3e7ed', color: mode === 'percent' ? '#fff' : '#333' }}
              onClick={handleModePercent}
              type="button"
            >
              %
            </button>
            <button
              style={{ ...styles.toggleBtn, background: mode === 'amount' ? '#2176ae' : '#e3e7ed', color: mode === 'amount' ? '#fff' : '#333' }}
              onClick={handleModeAmount}
              type="button"
            >
              RM
            </button>
            <input
              id="scenario-value-input"
              name="scenario-value-input"
              style={{ ...styles.input, width: 100, marginLeft: 8 }}
              type="number"
              placeholder={mode === 'percent' ? 'e.g. -20' : 'e.g. 100'}
              value={value}
              onChange={handleValueChange}
            />
          </div>
        </div>
        <button
          style={{
            ...styles.simulateBtn,
            opacity: !value ? 0.6 : 1,
            pointerEvents: 'auto',
            ...(hoveredSimulate && value && {
              background: 'linear-gradient(90deg, #1a5a8a 0%, #5ac5dd 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(33,118,174,0.2)'
            })
          }}
          onClick={handleSimulate}
          disabled={!value}
          type="button"
          onMouseEnter={() => value && setHoveredSimulate(true)}
          onMouseLeave={() => setHoveredSimulate(false)}
        >
          Simulate
        </button>
      </div>
    </div>
  );
}

// Styles object (fixed)
const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.25)',
    zIndex: 1001,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    background: '#fff',
    borderRadius: 12,
    padding: '32px 24px 24px 24px',
    minWidth: 340,
    maxWidth: 400,
    boxShadow: '0 8px 32px rgba(30,34,47,0.18)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    border: 'none',
    borderRadius: 6,
    background: '#dc3545',
    color: '#fff',
    fontSize: 18,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    placeItems: 'center',
    justifyContent: 'center',
    padding: 0,
    lineHeight: 'normal',
    transition: 'all 0.2s ease',
    outline: 'none',
    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.1)',
    transformOrigin: 'center',
    fontVariantNumeric: 'tabular-nums'
  },
  title: {
    margin: '0 0 18px 0',
    fontSize: 20,
    fontWeight: 700,
    color: '#23273a',
    textAlign: 'center',
  },
  formRow: {
    marginBottom: 18,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  label: {
    fontWeight: 600,
    fontSize: 14,
    marginBottom: 6,
    color: '#23273a',
  },
  input: {
    border: '1px solid #d3d6de',
    borderRadius: 6,
    padding: '8px 10px',
    fontSize: 15,
    outline: 'none',
    marginBottom: 0,
    background: '#f8f9fa',
    color: '#23273a',
  },
  toggleBtn: {
    border: 'none',
    borderRadius: 6,
    padding: '8px 16px',
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'background 0.18s',
  },
  badgeContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: 8,
    maxHeight: 90,
    overflowY: 'auto',
    paddingBottom: 4,
  },
  badge: {
    display: 'inline-block',
    padding: '7px 16px',
    borderRadius: 999,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    userSelect: 'none',
    border: '2px solid #e3e7ed',
    transition: 'background 0.18s, color 0.18s, border 0.18s',
    marginBottom: 2,
    whiteSpace: 'nowrap',
  },
  simulateBtn: {
    marginTop: 18,
    background: 'linear-gradient(90deg, #2176ae 0%, #6dd5ed 100%)',
    color: '#232323',
    border: 'none',
    borderRadius: 12,
    padding: '14px',
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    width: '100%',
    boxShadow: '0 4px 16px rgba(33,118,174,0.10)',
    outline: 'none',
    opacity: 1,
    letterSpacing: '0.5px',
    transformOrigin: 'center',
  },
  descriptionBox: {
    background: '#f8f9fa',
    color: '#23273a',
    borderRadius: 6,
    padding: '12px',
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 1.5,
    border: '1px solid #e3e7ed',
  },
};
