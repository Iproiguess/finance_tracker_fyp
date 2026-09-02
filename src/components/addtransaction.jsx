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
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraLoading, setCameraLoading] = useState(false);
  const videoRef = useRef(null);
  const cameraContainerRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const workerRef = useRef(null);

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Revoke preview URLs, stop camera, and terminate OCR worker when component unmounts.
  useEffect(() => {
    return () => {
      if (receiptPreview) {
        try { URL.revokeObjectURL(receiptPreview); } catch { /* ignore */ }
      }
      stopCamera();
      if (workerRef.current) {
        try { workerRef.current.terminate(); } catch { /* ignore */ }
        workerRef.current = null;
      }
    };
  }, [receiptPreview]);

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

    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview);
    }

    setReceiptProcessing(true);
    setReceiptMessage('');
    setReceiptData(null);
    setReceiptPreview(URL.createObjectURL(file));

    try {
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

  const openCamera = async () => {
    setCameraError('');
    setCameraLoading(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by this browser.');
      }
      
      let stream;
      
      // Try with specific constraints first
      try {
        const constraints = {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn('Specific constraints failed, trying basic video:', err.message);
        // Fall back to basic video if specific constraints fail
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      
      cameraStreamRef.current = stream;
      
      // Ensure video element is ready before assigning stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video metadata to be loaded
        await new Promise((resolve, reject) => {
          const onLoadedMetadata = () => {
            videoRef.current.removeEventListener('loadedmetadata', onLoadedMetadata);
            resolve();
          };
          const onError = () => {
            videoRef.current.removeEventListener('error', onError);
            reject(new Error('Video element error'));
          };
          videoRef.current.addEventListener('loadedmetadata', onLoadedMetadata);
          videoRef.current.addEventListener('error', onError);
          // Timeout after 3 seconds
          setTimeout(() => reject(new Error('Video metadata loading timeout')), 3000);
        });
        
        // Force playback on mobile
        try {
          await videoRef.current.play();
        } catch (err) {
          console.warn('Video play failed:', err);
        }
      }
      
      setCameraActive(true);
      
      // Scroll into view after state updates
      setTimeout(() => {
        if (cameraContainerRef.current) {
          cameraContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
    } catch (err) {
      console.error('Camera error:', err);
      let errorMsg = 'Unable to access the camera. ';
      
      if (err.name === 'NotAllowedError') {
        errorMsg += 'Permission denied. Please check camera permissions and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMsg += 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        errorMsg += 'Camera is already in use by another application.';
      } else {
        errorMsg += err.message || 'Please use upload instead.';
      }
      
      setCameraError(errorMsg);
    } finally {
      setCameraLoading(false);
    }
  };

  const captureReceiptPhoto = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    
    // Wait for video to have metadata/dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setReceiptMessage('Waiting for camera to load... Please try again in a moment.');
      return;
    }
    
    const width = video.videoWidth;
    const height = video.videoHeight;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) {
      setReceiptMessage('Unable to capture a photo from the camera.');
      return;
    }

    const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview);
    }

    setReceiptProcessing(true);
    setReceiptMessage('');
    setReceiptData(null);
    setReceiptPreview(URL.createObjectURL(file));

    try {
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
      setSelectedCandidate(parsed.selected || parsed.description || '');
      setReceiptMessage(`Receipt detected: ${parsed.description || 'Unknown merchant'} • ${parsed.amount ? `$${parsed.amount.toFixed(2)}` : 'amount pending'}`);
      setError('');
      stopCamera();
    } catch (err) {
      setReceiptMessage(err.message || 'Unable to read the receipt. Please try again.');
    } finally {
      setReceiptProcessing(false);
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
              <div style={styles.receiptButtonRow}>
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
                <button
                  type="button"
                  onClick={cameraActive ? stopCamera : openCamera}
                  disabled={cameraLoading || receiptProcessing}
                  style={styles.scanButton}
                >
                  {cameraActive ? 'Stop camera' : cameraLoading ? 'Starting camera...' : 'Take a photo'}
                </button>
              </div>
              {cameraError && <div style={styles.receiptStatusBox}>{cameraError}</div>}
              {cameraActive && (
                <div ref={cameraContainerRef} style={styles.cameraContainer}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{...styles.cameraPreview, WebkitPlaysinline: 'true'}}
                  />
                  <button
                    type="button"
                    onClick={captureReceiptPhoto}
                    disabled={receiptProcessing}
                    style={styles.captureButton}
                  >
                    {receiptProcessing ? 'Capturing...' : 'Take photo'}
                  </button>
                </div>
              )}
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