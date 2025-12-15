import { useState } from 'react';
import './AdminAuth.css';

interface AdminAuthProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://0ec90b57d6e95fcbda19832f.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw';

function AdminAuth({ onSuccess, onCancel }: AdminAuthProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const callAdminAuth = async (action: 'login' | 'signup') => {
    const apiUrl = `${SUPABASE_URL}/functions/v1/admin-auth`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, email, password }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || 'Authentication failed');
    }

    return data;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);

    try {
      const data = await callAdminAuth('login');

      sessionStorage.setItem('admin_session', Date.now().toString());
      sessionStorage.setItem('admin_user_id', data.userId);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
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
      const data = await callAdminAuth('signup');

      sessionStorage.setItem('admin_session', Date.now().toString());
      sessionStorage.setItem('admin_user_id', data.userId);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
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
