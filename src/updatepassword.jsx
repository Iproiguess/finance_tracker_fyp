import { useState } from 'react';
import { supabase } from './lib/supabase';
import { styles, validatePassword, passwordsMatch, getPasswordMatchMessage, getPasswordStrengthMessage, getPasswordColor } from './components/styles/updatePasswordStyles';

export default function UpdatePassword({ onComplete }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validatePassword(password)) {
      setError("Password must be 10+ characters.");
      return;
    }
    if (!passwordsMatch(password, confirmPassword)) {
      setError("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      setError("Update Failed: " + error.message);
    } else {
      onComplete();
    }
    setLoading(false);
  };

  const isFormValid = validatePassword(password) && passwordsMatch(password, confirmPassword);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Create New Password</h2>
      <form onSubmit={handleUpdate} style={styles.form}>
        {error && <div style={styles.errorMessage}>{error}</div>}
        <input 
          style={styles.input}
          type="password" 
          placeholder="New Password" 
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }} 
          required 
        />
        <div style={{...styles.helperText, color: getPasswordColor(password.length)}}>
          Password: {password.length}/10 characters {getPasswordStrengthMessage(password)}
        </div>
        <input 
          style={styles.input}
          type="password" 
          placeholder="Confirm Password" 
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError('');
          }} 
          required 
        />
        {confirmPassword && (
          <div style={{...styles.helperText, color: passwordsMatch(password, confirmPassword) ? '#28a745' : '#dc3545'}}>
            {getPasswordMatchMessage(password, confirmPassword)}
          </div>
        )}
        <button 
          style={styles.submitButton}
          type="submit" 
          disabled={loading || !isFormValid}
        >
          {loading ? 'Saving...' : 'Confirm New Password'}
        </button>
      </form>
    </div>
  );
}