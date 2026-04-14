import { useState } from 'react';
import { useAuth } from './hooks/useauth';
import { styles } from './components/styles/loginstyles';
import { LoginForm } from './components/auth/loginform';
import { SignupForm } from './components/auth/signupform';
import { ForgotPasswordForm } from './components/auth/forgotpasswordform';

export default function Login({ onLogin }) {
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');

  const { loading, error, success, signup, login, resetPassword, clearMessages } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();
    await signup(email, password, confirmPassword, username);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const session = await login(email, password);
    if (session) {
      onLogin(session);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    await resetPassword(email);
  };

  const switchView = (newView) => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    clearMessages();
    setView(newView);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    clearMessages();
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    clearMessages();
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    clearMessages();
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    clearMessages();
  };

  const getTitle = () => {
    if (view === 'login') return 'Sign In';
    if (view === 'signup') return 'Create Account';
    if (view === 'forgot') return 'Reset Password';
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>{getTitle()}</h2>

        {view === 'login' && (
          <LoginForm
            email={email}
            password={password}
            error={error}
            success={success}
            loading={loading}
            onEmailChange={handleEmailChange}
            onPasswordChange={handlePasswordChange}
            onSubmit={handleLogin}
            onSignupClick={() => switchView('signup')}
            onForgotClick={() => switchView('forgot')}
          />
        )}

        {view === 'signup' && (
          <SignupForm
            username={username}
            email={email}
            password={password}
            confirmPassword={confirmPassword}
            error={error}
            success={success}
            loading={loading}
            onUsernameChange={handleUsernameChange}
            onEmailChange={handleEmailChange}
            onPasswordChange={handlePasswordChange}
            onConfirmPasswordChange={handleConfirmPasswordChange}
            onSubmit={handleSignup}
            onLoginClick={() => switchView('login')}
          />
        )}

        {view === 'forgot' && (
          <ForgotPasswordForm
            email={email}
            error={error}
            success={success}
            loading={loading}
            onEmailChange={handleEmailChange}
            onSubmit={handleResetPassword}
            onLoginClick={() => switchView('login')}
          />
        )}
      </div>
    </div>
  );
}