

const toastStyles = {
  container: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '400px',
  },
  toast: {
    padding: '16px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    animation: 'slideIn 0.3s ease-out forwards',
  },
  success: {
    backgroundColor: '#d4edda',
    color: '#155724',
    borderLeft: '4px solid #28a745',
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderLeft: '4px solid #dc3545',
  },
  warning: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    borderLeft: '4px solid #ffc107',
  },
  info: {
    backgroundColor: '#d1ecf1',
    color: '#0c5460',
    borderLeft: '4px solid #17a2b8',
  },
  closeBtn: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: 'inherit',
    opacity: 0.7,
    padding: 0,
    display: 'flex',
    placeItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    lineHeight: 'normal',
    transformOrigin: 'center',
    fontVariantNumeric: 'tabular-nums',
  },
};

const getIcon = (type) => {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '⚠';
    case 'info':
      return 'ℹ';
    default:
      return '•';
  }
};

export function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  // CSS animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  if (!document.head.querySelector('style[data-toast]')) {
    style.setAttribute('data-toast', 'true');
    document.head.appendChild(style);
  }

  return (
    <div style={toastStyles.container}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            ...toastStyles.toast,
            ...toastStyles[toast.type || 'info'],
          }}
          role="alert"
          aria-live="assertive"
        >
          <span>{getIcon(toast.type)}</span>
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            style={toastStyles.closeBtn}
            onClick={() => onRemove(toast.id)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
