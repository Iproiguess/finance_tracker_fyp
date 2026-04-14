
export const styles = {
  container: { maxWidth: '750px', margin: '80px auto', textAlign: 'center', border: '1px solid #ddd', padding: '60px', borderRadius: '10px' },
  title: { margin: 0, marginBottom: '30px', fontSize: '42px', color: '#333' },
  form: { display: 'flex', flexDirection: 'column', gap: '23px' },
  input: { padding: '18px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '18px', outline: 'none' },
  errorMessage: { color: '#dc3545', marginBottom: '18px', fontSize: '16px' },
  helperText: { fontSize: '14px', marginTop: '-5px' },
  helperTextValid: { color: '#28a745' },
  helperTextInvalid: { color: '#dc3545' },
  submitButton: { padding: '18px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', marginTop: '22px' }
};

export const getPasswordColor = (length) => {
  return length >= 10 ? '#28a745' : '#dc3545';
};

export const validatePassword = (password) => {
  return password.length >= 10;
};

export const passwordsMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

export const getPasswordMatchMessage = (password, confirmPassword) => {
  if (!confirmPassword) return '';
  return passwordsMatch(password, confirmPassword) ? '✓ Passwords match' : '✗ Passwords do not match';
};

export const getPasswordStrengthMessage = (password) => {
  if (password.length >= 10) return '✓';
  return `(minimum 10 required)`;
};
