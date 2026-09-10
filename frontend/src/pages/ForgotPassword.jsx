import React, { useState } from 'react';
import { Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo';
import authService from '../services/authService';

const ForgotPassword = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return setError('Please enter your email address');
    try {
      setLoading(true);
      setError('');
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Try again.');
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
          <h2 className="auth-title">{sent ? 'Check Your Email' : 'Forgot Password?'}</h2>
          <p className="auth-subtitle">
            {sent
              ? `We sent a reset link to ${email}. Check your inbox (and spam folder).`
              : 'Enter your email and we\'ll send you a password reset link.'}
          </p>
        </div>

        {!sent ? (
          <>
            {error && (
              <div className="alert alert-error mb-4">
                <AlertCircle size={18} /><span>{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="input-label">Email Address</label>
                <div className="input-icon-wrapper">
                  <Mail size={18} className="input-left-icon" />
                  <input
                    type="email"
                    className="form-control with-left-icon"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
              The link expires in <strong>1 hour</strong>.
            </p>
          </div>
        )}

        <div className="auth-footer">
          <button type="button" className="link-btn" onClick={onBack}>
            <ArrowLeft size={14} style={{ marginRight: 4 }} />
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
