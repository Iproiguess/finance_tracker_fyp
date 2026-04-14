import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const signup = async (email, password, confirmPassword, username) => {
    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);

    try {
      if (password.length < 10) {
        throw new Error("Password must be at least 10 characters.");
      }
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { display_name: username } }
      });

      if (error) throw error;
      setSuccess("Verification email sent! Check your inbox.");
      setError('');
    } catch (err) {
      setError(err.message);
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (error) throw error;
      setError('');
      setSuccess('');
      return data.session;
    } catch (err) {
      setError(err.message);
      setSuccess('');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: 'http://localhost:5173',
      });

      if (error) throw error;
      setSuccess("Password reset link sent to email!");
      setError('');
    } catch (err) {
      setError(err.message);
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return {
    loading,
    error,
    success,
    signup,
    login,
    resetPassword,
    clearMessages
  };
}
