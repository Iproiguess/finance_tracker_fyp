import { useEffect, useRef, useState } from 'react';
import { createWorker } from 'tesseract.js';
import { supabase } from '../lib/supabase';
import { useTransactions } from '../hooks/usetransactions';
import { styles, getInitialFormData, getTypeButtonStyle } from './styles/addTransactionStyles';
import { validateAndSanitize } from '../utils/validation';
import { parseReceiptText } from '../utils/receiptParser';

const validateAmountInput = (value) => {
  if (!value) return true;
  const numValue = parseFloat(value);
  if (numValue > 9999999999.99) return false;
  if (value.replace(/[^0-9]/g, '').length > 10) return false;
  return true;
};

export function AddTransaction({ onClose, categoryId, editingTransaction }) {
  const { addTransaction, updateTransaction } = useTransactions();
  const [formData, setFormData] = useState(() => getInitialFormData(editingTransaction));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [receiptProcessing, setReceiptProcessing] = useState(false);
  const [receiptMessage, setReceiptMessage] = useState('');
  const [receiptPreview, setReceiptPreview] = useState('');
  const [receiptData, setReceiptData] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const workerRef = useRef(null);

  // Revoke preview URLs whenever `receiptPreview` changes or on unmount.
  useEffect(() => {
    return () => {
      if (receiptPreview) {
        try { URL.revokeObjectURL(receiptPreview); } catch (e) { /* ignore */ }
      }
    };
  }, [receiptPreview]);

  // Terminate the OCR worker only when the component unmounts.
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        try { workerRef.current.terminate(); } catch (e) { /* ignore */ }
        workerRef.current = null;
      }
    };
  }, []);

  const submitTransaction = async (payload = formData) => {
    // Reuse the same submission path for both manual entry and parsed receipt data.
    setLoading(true);
    setError('');

    if (!categoryId) {
      setError('Please select a valid category before adding a transaction.');
      setLoading(false);
      return;
    }

    const fieldsToValidate = ['amount', 'description', 'date', 'type'];
    for (const field of fieldsToValidate) {
      const result = validateAndSanitize(field, payload[field]);
      if (!result.isValid) {
        setError(result.error || `Invalid ${field}`);
        setLoading(false);
        return;
      }
    }

    try {
      const amount = parseFloat(payload.amount || '0');
      const transaction = {
        ...payload,
        amount,
        category_id: categoryId
      };
      if (editingTransaction) {
        await updateTransaction(editingTransaction.transaction_id, transaction);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        transaction.user_id = user.id;
        await addTransaction(transaction);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    await submitTransaction(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'amount' && !validateAmountInput(value)) {
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleReceiptUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isSupportedImage = /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || '') || ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type);
    if (!isSupportedImage) {
      setReceiptMessage('Please choose a common image file such as JPG, PNG, WEBP, or a phone photo.');
      return;
    }

    // Keep the preview visible while OCR runs so the user can confirm the image.
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview);
    }

    setReceiptProcessing(true);
    setReceiptMessage('');
    setReceiptData(null);
    setReceiptPreview(URL.createObjectURL(file));

    try {
      // OCR is expensive, so keep one worker alive for repeated uploads in the same session.
      if (!workerRef.current) {
        workerRef.current = await createWorker('eng');
      }

      const { data: { text } } = await workerRef.current.recognize(file);
      const parsed = parseReceiptText(text);

      if (!parsed.amount && !parsed.description) {
        throw new Error('No transaction details could be read from that receipt. Please try another image.');
      }

      setFormData(prev => ({
        ...prev,
        type: parsed.type || prev.type,
        amount: parsed.amount ? String(parsed.amount) : prev.amount,
        description: parsed.description || prev.description,
        date: parsed.date || prev.date
      }));
      setReceiptData(parsed);
      // initialize selected candidate to parsed selection or description
      setSelectedCandidate(parsed.selected || parsed.description || '');
      setReceiptMessage(`Receipt detected: ${parsed.description || 'Unknown merchant'} • ${parsed.amount ? `$${parsed.amount.toFixed(2)}` : 'amount pending'}`);
      setError('');
    } catch (err) {
      setReceiptMessage(err.message || 'Unable to read the receipt. Please try another image.');
    } finally {
      setReceiptProcessing(false);
      event.target.value = '';
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.modalTitle}>
            {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button
            onClick={onClose}
            style={{
              ...styles.closeBtn,
              ...(hoveredBtn === 'close' && {
                backgroundColor: '#c0392b',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              })
            }}
            onMouseEnter={() => setHoveredBtn('close')}
            onMouseLeave={() => setHoveredBtn(null)}
            aria-label="Close"
          >
            <span style={{ position: 'relative', top: '-2px' }}>&times;</span>
          </button>
        </div>
        <style>{`
          .category-explorer-animated-btn, [aria-label='Close'] { outline: none !important; }
          input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(0) brightness(0);
            cursor: pointer;
          }
        `}</style>
        <div style={{ ...styles.content, ...styles.scrollableBody }}>
          {error && <div style={styles.errorBox}>{error}</div>}
          <form onSubmit={handleSubmit} style={styles.form} autoComplete="off">
            <div style={styles.field}>
              <label style={styles.label}>Transaction Type</label>
              <div style={styles.toggleGroup}>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
                  style={getTypeButtonStyle(formData.type, 'expense')}
                  className="category-explorer-animated-btn"
                >Expense</button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
                  style={getTypeButtonStyle(formData.type, 'income')}
                  className="category-explorer-animated-btn"
                >Income</button>
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Receipt photo</label>
              <label style={styles.receiptUploadButton} className="category-explorer-animated-btn">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
                  capture="environment"
                  onChange={handleReceiptUpload}
                  style={styles.hiddenInput}
                />
                {receiptProcessing ? 'Reading receipt...' : 'Upload receipt'}
              </label>
              {receiptPreview && <img src={receiptPreview} alt="Receipt preview" style={styles.receiptPreview} />}
              {receiptMessage && <div style={styles.receiptStatusBox}>{receiptMessage}</div>}

              {receiptData && Array.isArray(receiptData.candidates) && (
                <>
                  <div style={{ fontSize: '12px', color: '#555', marginTop: '8px' }}>
                    Choose one to fill the Description field, it will be saved as the transaction description.
                  </div>
                  <div style={styles.candidateList}>
                    {(() => {
                      const out = [];
                      const seen = new Set();
                      // preserve candidate order as returned by parser
                      for (const c of receiptData.candidates) {
                        const text = (c && c.text) ? c.text.trim() : String(c).trim();
                        if (!text) continue;
                        out.push({ text, score: c.score });
                        seen.add(text.toLowerCase());
                      }
                      // if parser's description isn't already present, append it at the end (do not reorder existing items)
                      const parsedDesc = (receiptData.description || '').trim();
                      if (parsedDesc && !seen.has(parsedDesc.toLowerCase())) {
                        out.push({ text: parsedDesc, score: 0 });
                        seen.add(parsedDesc.toLowerCase());
                      }
                      return out.map((c, idx) => {
                        const isSelected = selectedCandidate && (c.text.trim().toLowerCase() === selectedCandidate.trim().toLowerCase());
                        return (
                          <div key={idx} style={isSelected ? styles.candidateItemSelected : styles.candidateItem}>
                            <div style={{ flex: 1, marginRight: '8px', color: '#333' }}>{c.text}</div>
                            <button type="button" style={styles.candidateBtn} disabled={isSelected} onClick={() => {
                              setFormData(prev => ({ ...prev, description: c.text }));
                              setReceiptMessage(`Selected suggestion: ${c.text}`);
                              setReceiptData(prev => ({ ...prev, selected: c.text }));
                              setSelectedCandidate(c.text);
                            }}>{isSelected ? 'Selected' : 'Use'}</button>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </>
              )}
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Amount</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                style={styles.input}
                placeholder="0.00"
                step="0.01"
                min="0"
                max="9999999999.99"
                autoComplete="new-password"
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g. Lunch, Groceries, Salary"
                autoComplete="new-password"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <button type="submit" disabled={loading} style={{
              ...styles.submitButton,
              ...(hoveredBtn === 'submit' && !loading && {
                backgroundColor: '#2980b9',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              })
            }}
            onMouseEnter={() => setHoveredBtn('submit')}
            onMouseLeave={() => setHoveredBtn(null)}
            className="category-explorer-animated-btn">
              {loading ? 'Processing...' : (editingTransaction ? 'Update Transaction' : 'Save Transaction')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}