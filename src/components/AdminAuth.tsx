import { useState } from 'react';
import { supabase } from '../lib/supabase';
import './AdminAuth.css';

interface AdminAuthProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function AdminAuth({ onSuccess, onCancel }: AdminAuthProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const checkIfFirstAdmin = async () => {
    const { count } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true });
    return count === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('No user data returned');
      }

      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', authData.user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (adminError) throw adminError;

      if (!adminData) {
        await supabase.auth.signOut();
        throw new Error('Access denied. You are not an authorized admin.');
      }

      sessionStorage.setItem('admin_session', Date.now().toString());
      sessionStorage.setItem('admin_user_id', authData.user.id);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsProcessing(true);

    try {
      const firstAdmin = await checkIfFirstAdmin();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('No user data returned');
      }

      const { error: insertError } = await supabase
        .from('admin_users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          created_by: firstAdmin ? null : authData.user.id,
          is_active: true,
        });

      if (insertError) {
        await supabase.auth.signOut();
        throw insertError;
      }

      sessionStorage.setItem('admin_session', Date.now().toString());
      sessionStorage.setItem('admin_user_id', authData.user.id);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = mode === 'login' ? handleLogin : handleSignup;

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="admin-auth-overlay" onClick={onCancel}>
      <div className="admin-auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-header">
          <h2>{mode === 'login' ? 'Admin Login' : 'Create Admin Account'}</h2>
          <button className="close-btn" onClick={onCancel} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="admin-email">Email Address</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              autoFocus
              autoComplete="email"
              className={error ? 'error' : ''}
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className={error ? 'error' : ''}
            />
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="admin-confirm-password">Confirm Password</label>
              <input
                id="admin-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
                minLength={6}
                autoComplete="new-password"
                className={error ? 'error' : ''}
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="auth-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !email || !password}
              className="btn btn-primary"
            >
              {isProcessing ? 'Processing...' : mode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </div>
        </form>

        <div className="auth-toggle">
          {mode === 'login' ? (
            <p>
              Need an admin account?{' '}
              <button type="button" onClick={toggleMode} className="link-btn">
                Create one
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button type="button" onClick={toggleMode} className="link-btn">
                Login
              </button>
            </p>
          )}
        </div>

        <div className="auth-hint">
          Access restricted to authorized administrators only
        </div>
      </div>
    </div>
  );
}

export default AdminAuth;
