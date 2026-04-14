import { useState } from 'react';
import { styles } from '../styles/loginstyles';

export function ForgotPasswordForm({ email, error, success, loading, onEmailChange, onSubmit, onLoginClick }) {
  const isFormValid = email.trim();
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
        {loading ? 'Processing...' : 'Send Reset Link'}
      </button>

      <div style={styles.footer}>
        <p
          style={styles.link}
          onClick={onLoginClick}
        >
          Back to login
        </p>
      </div>
    </form>
  );
}
