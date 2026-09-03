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

const OCR_TIMEOUT_MS = 30000;

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
  const [videoStateDebug, setVideoStateDebug] = useState({});
  const videoRef = useRef(null);
  const cameraContainerRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const workerRef = useRef(null);
  const receiptPreviewRef = useRef('');

  const recognizeReceipt = async (file) => {
    if (!workerRef.current) {
      workerRef.current = await createWorker('eng');
    }

    let timeoutId;
    try {
      return await Promise.race([
        workerRef.current.recognize(file),
        new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            const timeoutError = new Error('Receipt reading timed out. Please try again with a clearer photo.');
            timeoutError.name = 'OCRTimeoutError';
            reject(timeoutError);
          }, OCR_TIMEOUT_MS);
        })
      ]);
    } catch (err) {
      if (err.name === 'OCRTimeoutError') {
        try { await workerRef.current.terminate(); } catch { /* ignore */ }
        workerRef.current = null;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const stopCamera = () => {
    console.log('====== stopCamera CALLED ======');

    if (cameraStreamRef.current) {
      const tracks = cameraStreamRef.current.getTracks();
      tracks.forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.load();
    }

    setVideoStateDebug({});
    setCameraLoading(false);
    setCameraError('');
    setCameraActive(false);
    console.log('====== stopCamera FINISHED ======');
  };

  // Clean up camera and OCR only when the form unmounts.
  useEffect(() => {
    return () => {
      if (receiptPreviewRef.current) {
        try { URL.revokeObjectURL(receiptPreviewRef.current); } catch { /* ignore */ }
      }
      stopCamera();
      if (workerRef.current) {
        try { workerRef.current.terminate(); } catch { /* ignore */ }
        workerRef.current = null;
      }
    };
  }, []);

  // Monitor video element state when camera is active
  useEffect(() => {
    if (!cameraActive || !videoRef.current) return;

    const video = videoRef.current;
    const interval = setInterval(() => {
      const state = {
        paused: video.paused,
        readyState: video.readyState,
        networkState: video.networkState,
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration
      };
      console.log(`[Video Monitor] paused=${state.paused}, readyState=${state.readyState}, networkState=${state.networkState}, dimensions=${state.width}x${state.height}, duration=${state.duration}`);
      setVideoStateDebug(state);
    }, 500);

    return () => clearInterval(interval);
  }, [cameraActive]);

  const handleCameraButtonClick = () => {
    console.log('====== Camera button clicked ======');

    if (cameraActive) {
      stopCamera();
      return;
    }

    setCameraError('');
    setCameraLoading(true);
    setVideoStateDebug({});
    setCameraActive(true);
  };

  useEffect(() => {
    if (!cameraActive) return undefined;

    let cancelled = false;

    const startCamera = async () => {
      try {
        await openCamera();
      } catch (err) {
        if (!cancelled) {
          const message = err && err.message ? err.message : 'Unable to access the camera.';
          setCameraError(message);
        }
      } finally {
        if (!cancelled) {
          setCameraLoading(false);
        }
      }
    };

    startCamera();

    return () => {
      cancelled = true;
    };
  }, [cameraActive]);

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
    const previewUrl = URL.createObjectURL(file);
    receiptPreviewRef.current = previewUrl;
    setReceiptPreview(previewUrl);

    try {
      const { data: { text } } = await recognizeReceipt(file);
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
    console.log('openCamera called');
    setCameraError('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera access is not supported by this browser.');
    }

    let stream;

    try {
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        },
        audio: false
      };
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      console.warn('Specific camera constraints failed, trying basic video:', err?.message || err);
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      } catch (basicErr) {
        const error = basicErr && basicErr.name ? basicErr : new Error(basicErr?.message || 'Unable to access the camera.');
        if (error.name === 'NotAllowedError') {
          throw new Error('Permission denied. Please check camera permissions and try again.');
        }
        if (error.name === 'NotFoundError') {
          throw new Error('No camera found on this device.');
        }
        if (error.name === 'NotReadableError') {
          throw new Error('Camera is already in use by another application.');
        }
        throw error;
      }
    }

    cameraStreamRef.current = stream;

    if (!videoRef.current) {
      throw new Error('Camera preview is not ready yet. Please try again.');
    }

    const video = videoRef.current;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.playsinline = true;
    video.srcObject = stream;

    try {
      await video.play();
    } catch (playErr) {
      console.error('play() threw error:', playErr);
    }

    setTimeout(() => {
      if (cameraContainerRef.current) {
        cameraContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  };

  const captureReceiptPhoto = async () => {
    console.log('captureReceiptPhoto called, videoRef:', videoRef.current);
    if (!videoRef.current) return;

    const video = videoRef.current;
    console.log(`Video dimensions: ${video.videoWidth} x ${video.videoHeight}`);
    
    // Wait for video to have metadata/dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn('Video dimensions not ready');
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
    const previewUrl = URL.createObjectURL(file);
    receiptPreviewRef.current = previewUrl;
    setReceiptPreview(previewUrl);

    try {
      const { data: { text } } = await recognizeReceipt(file);
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
      console.log('Photo captured and processed successfully, closing camera');
      stopCamera();
    } catch (err) {
      console.error('Error processing receipt:', err);
      setReceiptMessage(err.message || 'Unable to read the receipt. Please try again.');
      // Also close camera if OCR fails
      stopCamera();
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
                    onChange={handleReceiptUpload}
                    style={styles.hiddenInput}
                  />
                  {receiptProcessing ? 'Reading receipt...' : 'Upload receipt'}
                </label>
                <button
                  type="button"
                  onClick={handleCameraButtonClick}
                  disabled={cameraLoading || receiptProcessing}
                  style={styles.scanButton}
                >
                  {cameraActive ? 'Stop camera' : cameraLoading ? 'Starting camera...' : 'Take a photo'}
                </button>
              </div>
              {cameraError && <div style={styles.receiptStatusBox}>{cameraError}</div>}
              {cameraActive && (
                <div ref={cameraContainerRef} style={styles.cameraContainer}>
                  <div style={{ fontSize: '10px', color: '#ccc', padding: '4px', backgroundColor: '#333', borderRadius: '4px', marginBottom: '4px', fontFamily: 'monospace', maxHeight: '60px', overflow: 'auto' }}>
                    <div>Video State Debug:</div>
                    <div>Paused: {videoStateDebug.paused ? 'YES' : 'NO'}</div>
                    <div>ReadyState: {videoStateDebug.readyState}</div>
                    <div>Dimensions: {videoStateDebug.width}x{videoStateDebug.height}</div>
                  </div>
                  <video
                    ref={videoRef}
                    autoPlay={true}
                    playsInline={true}
                    muted={true}
                    controls={false}
                    width="100%"
                    height="auto"
                    style={styles.cameraPreview}
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