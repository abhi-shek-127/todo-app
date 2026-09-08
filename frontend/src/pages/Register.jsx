import React, { useState } from 'react';
import { UserPlus, User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import authService from '../services/authService';

const Register = ({ onRegisterSuccess, onNavigateToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await authService.register(name.trim(), email.trim(), password);
      onRegisterSuccess(data.data);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="brand-logo">
            <CheckCircle2 size={32} className="brand-icon" />
          </div>
          <h2 className="auth-title">Create an Account</h2>
          <p className="auth-subtitle">Join TaskMaster to organize, prioritize, and complete your tasks</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error mb-4">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="input-label">Full Name</label>
            <div className="input-icon-wrapper">
              <User size={18} className="input-left-icon" />
              <input
                type="text"
                className="form-control with-left-icon"
                placeholder="e.g. Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Email Address</label>
            <div className="input-icon-wrapper">
              <Mail size={18} className="input-left-icon" />
              <input
                type="email"
                className="form-control with-left-icon"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Password</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="input-left-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control with-left-icon with-right-icon"
                placeholder="Create a password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="input-right-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
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
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-block btn-lg ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              'Creating Account...'
            ) : (
              <>
                <UserPlus size={18} /> Create Account
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button
              type="button"
              className="link-btn"
              onClick={onNavigateToLogin}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
