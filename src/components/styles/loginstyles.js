export const styles = {
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#f5f5f5',
    margin: '0',
    padding: '0',
    boxSizing: 'border-box',
  },
  card: {
    maxWidth: '380px',
    padding: '30px',
    border: '1px solid #eee',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    backgroundColor: '#fff',
    fontFamily: 'sans-serif',
    margin: '0',
  },
  title: {
    marginBottom: '20px',
    marginTop: '0px',
    color: '#333'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
    gap: '5px'
  },
  input: {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none'
  },
  helperText: {
    fontSize: '11px',
    color: '#666',
    marginLeft: '2px'
  },
  btn: {
    padding: '12px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    opacity: 1,
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  footer: {
    marginTop: '20px',
  },
  error: {
    color: '#dc3545',
  },
  success: {
    color: '#28a745',
  },
  message: {
    minHeight: '20px',
    marginBottom: '10px',
    fontSize: '14px',
    transition: 'color 0.2s',
  },
  link: {
    color: '#007bff',
    cursor: 'pointer',
    fontSize: '13px',
    margin: '8px 0',
    textDecoration: 'none'
  },
};
