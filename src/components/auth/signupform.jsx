import { useState } from 'react';
import { styles } from '../styles/loginstyles';

export function SignupForm({ username, email, password, confirmPassword, error, success, loading, onUsernameChange, onEmailChange, onPasswordChange, onConfirmPasswordChange, onSubmit, onLoginClick }) {
  const isFormValid = (
    username.trim() &&
    email.trim() &&
    password.length >= 10 &&
    password === confirmPassword
  );
  const [hoveredBtn, setHoveredBtn] = useState(null);

  return (
    <form onSubmit={onSubmit} style={styles.form}>
      <div
        style={{
          ...styles.message,
          color: error ? styles.error.color : success ? styles.success.color : 'transparent'
        }}
      >
        {error || success || ''}
      </div>

      <input
        style={styles.input}
        type="text"
        placeholder="Username"
        value={username}
        onChange={onUsernameChange}
        required
      />

      <input
        style={styles.input}
        type="email"
        placeholder="Email Address"
        value={email}
        onChange={onEmailChange}
        required
      />

      <div style={styles.inputGroup}>
        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={onPasswordChange}
          required
        />
        <span style={styles.helperText}>* Minimum 10 characters required</span>
      </div>

      <input
        style={styles.input}
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={onConfirmPasswordChange}
        required
      />

      <button
        type="submit"
        style={{
          ...(loading || !isFormValid
            ? { ...styles.btn, ...styles.btnDisabled }
            : { ...styles.btn,
                ...(hoveredBtn === 'submit' && { 
                  backgroundColor: '#218838',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                })
              })
        }}
        disabled={loading || !isFormValid}
        onMouseEnter={() => !loading && isFormValid && setHoveredBtn('submit')}
        onMouseLeave={() => setHoveredBtn(null)}
      >
        {loading ? 'Processing...' : 'Create Account'}
      </button>

      <div style={styles.footer}>
        <p
          style={styles.link}
          onClick={onLoginClick}
        >
          Already have an account? Login
        </p>
      </div>
    </form>
  );
}
