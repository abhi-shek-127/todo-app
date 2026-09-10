import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, User, Mail, Lock, Eye, EyeOff, AlertCircle, AtSign, CheckCircle2, XCircle, Loader } from 'lucide-react';
import Logo from '../components/Logo';
import authService from '../services/authService';

const USERNAME_RE = /^[a-z0-9_]+$/;

const Register = ({ onRegisterSuccess, onNavigateToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'invalid'
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!username) { setUsernameStatus(null); return; }
    if (!USERNAME_RE.test(username) || username.length > 8) {
      setUsernameStatus('invalid');
      return;
    }
    setUsernameStatus('checking');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await authService.checkUsername(username);
        setUsernameStatus(res.available ? 'available' : 'taken');
      } catch {
        setUsernameStatus(null);
      }
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !username || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (usernameStatus !== 'available') {
      setError('Please choose a valid, available username');
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
      const data = await authService.register(name.trim(), email.trim(), password, username.trim());
      onRegisterSuccess(data.data);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getHint = () => {
    if (usernameStatus === 'checking') return { icon: <Loader size={15} className="spin" />, cls: 'checking', msg: 'Checking availability...' };
    if (usernameStatus === 'available') return { icon: <CheckCircle2 size={15} />, cls: 'available', msg: 'Username is available!' };
    if (usernameStatus === 'taken') return { icon: <XCircle size={15} />, cls: 'taken', msg: 'Username is already taken' };
    if (usernameStatus === 'invalid') return { icon: <XCircle size={15} />, cls: 'taken', msg: 'Only a-z, 0-9, _ · max 8 characters' };
    return null;
  };
  const hint = getHint();

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-logo">
            <Logo size={52} />
          </div>
          <h2 className="auth-title">Create an Account</h2>
          <p className="auth-subtitle">Join TaskMaster to organize, prioritize, and complete your tasks</p>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

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
            <label className="input-label">
              Username
              <span className="input-label-hint"> — a-z, 0-9, _ · max 8 chars</span>
            </label>
            <div className="input-icon-wrapper">
              <AtSign size={18} className="input-left-icon" />
              <input
                type="text"
                className={`form-control with-left-icon${hint ? ` username-${hint.cls}` : ''}`}
                placeholder="e.g. alex_j"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                maxLength={8}
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>
            {hint && (
              <div className={`username-hint username-hint-${hint.cls}`}>
                {hint.icon}
                <span>{hint.msg}</span>
              </div>
            )}
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
            disabled={loading || usernameStatus === 'checking' || usernameStatus === 'taken' || usernameStatus === 'invalid'}
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

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button type="button" className="link-btn" onClick={onNavigateToLogin}>
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
