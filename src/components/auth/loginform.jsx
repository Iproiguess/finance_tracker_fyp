import { useState } from 'react';
import { styles } from '../styles/loginstyles';

export function LoginForm({ email, password, error, success, loading, onEmailChange, onPasswordChange, onSubmit, onSignupClick, onForgotClick }) {
  const isFormValid = email.trim() && password.length > 0;
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
        type="email"
        placeholder="Email Address"
        value={email}
        onChange={onEmailChange}
        required
      />

      <input
        style={styles.input}
        type="password"
        placeholder="Password"
        value={password}
        onChange={onPasswordChange}
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
        onMouseEnter={() => !loading && !isFormValid && setHoveredBtn('submit')}
        onMouseLeave={() => setHoveredBtn(null)}
      >
        {loading ? 'Processing...' : 'Sign In'}
      </button>

      <div style={styles.footer}>
        <p
          style={styles.link}
          onClick={onSignupClick}
        >
          Don't have an account? Sign up
        </p>
        <p
          style={styles.link}
          onClick={onForgotClick}
        >
          Forgot password?
        </p>
      </div>
    </form>
  );
}
