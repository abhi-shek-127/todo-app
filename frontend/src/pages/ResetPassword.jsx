import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Logo from '../components/Logo';
import authService from '../services/authService';

const ResetPassword = ({ token, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirm) return setError('Passwords do not match');
    try {
      setLoading(true);
      setError('');
      await authService.resetPassword(token, password);
      setDone(true);
      // Clear reset token from URL
      window.history.replaceState({}, document.title, '/');
      setTimeout(() => onSuccess(), 2500);
    } catch (err) {
      setError(err.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-logo">
            <Logo size={52} />
          </div>
          <h2 className="auth-title">{done ? 'Password Reset!' : 'Set New Password'}</h2>
          <p className="auth-subtitle">
            {done ? 'Your password has been updated. Redirecting to login...' : 'Enter your new password below.'}
          </p>
        </div>

        {!done ? (
          <>
            {error && (
              <div className="alert alert-error mb-4">
                <AlertCircle size={18} /><span>{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="input-label">New Password</label>
                <div className="input-icon-wrapper">
                  <Lock size={18} className="input-left-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control with-left-icon with-right-icon"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <button type="button" className="input-right-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="input-label">Confirm Password</label>
                <div className="input-icon-wrapper">
                  <Lock size={18} className="input-left-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control with-left-icon"
                    placeholder="Repeat new password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className={`btn btn-primary btn-block btn-lg ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '12px 0 20px', fontSize: 48 }}>✅</div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
