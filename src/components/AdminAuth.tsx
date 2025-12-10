import { useState } from 'react';
import './AdminAuth.css';

interface AdminAuthProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function AdminAuth({ onSuccess, onCancel }: AdminAuthProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      const hashedPin = await hashPin(pin);
      const isValid = await verifyPin(hashedPin);

      if (isValid) {
        sessionStorage.setItem('admin_session', Date.now().toString());
        onSuccess();
      } else {
        setError('Invalid PIN. Access denied.');
        setPin('');
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const hashPin = async (pin: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const verifyPin = async (hashedPin: string): Promise<boolean> => {
    const adminPinHash = import.meta.env.VITE_ADMIN_PIN_HASH;
    return hashedPin === adminPinHash;
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(value);
  };

  return (
    <div className="admin-auth-overlay" onClick={onCancel}>
      <div className="admin-auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-header">
          <h2>Admin Authentication</h2>
          <button className="close-btn" onClick={onCancel} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="pin-input-group">
            <label htmlFor="admin-pin">Enter 6-Digit PIN</label>
            <input
              id="admin-pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={handlePinChange}
              placeholder="••••••"
              maxLength={6}
              autoFocus
              autoComplete="off"
              className={error ? 'error' : ''}
            />
            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="auth-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pin.length !== 6 || isVerifying}
              className="btn btn-primary"
            >
              {isVerifying ? 'Verifying...' : 'Authenticate'}
            </button>
          </div>
        </form>

        <div className="auth-hint">
          Access restricted to authorized administrators only
        </div>
      </div>
    </div>
  );
}

export default AdminAuth;
