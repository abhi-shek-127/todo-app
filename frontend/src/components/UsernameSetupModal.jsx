import React, { useState, useEffect, useRef } from 'react';
import { X, AtSign, CheckCircle2, XCircle, Loader } from 'lucide-react';
import authService from '../services/authService';

const USERNAME_RE = /^[a-z0-9_]+$/;

const UsernameSetupModal = ({ onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'invalid'
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!username) { setStatus(null); return; }
    if (!USERNAME_RE.test(username) || username.length > 8) {
      setStatus('invalid');
      return;
    }
    setStatus('checking');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await authService.checkUsername(username);
        setStatus(res.available ? 'available' : 'taken');
      } catch {
        setStatus(null);
      }
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [username]);

  const handleSave = async () => {
    if (status !== 'available') return;
    setSaving(true);
    setError('');
    try {
      await authService.setUsername(username);
      onSuccess(username);
    } catch (err) {
      setError(err.message || 'Failed to save username');
      setSaving(false);
    }
  };

  const getHint = () => {
    if (status === 'checking') return { icon: <Loader size={15} className="spin" />, cls: 'checking', msg: 'Checking availability...' };
    if (status === 'available') return { icon: <CheckCircle2 size={15} />, cls: 'available', msg: 'Available!' };
    if (status === 'taken') return { icon: <XCircle size={15} />, cls: 'taken', msg: 'Already taken' };
    if (status === 'invalid') return { icon: <XCircle size={15} />, cls: 'taken', msg: 'Only a-z, 0-9, _ · max 8 characters' };
    return null;
  };
  const hint = getHint();

  return (
    <div className="modal-overlay">
      <div className="username-setup-modal">
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Skip">
          <X size={20} />
        </button>

        <div className="username-setup-header">
          <div className="username-setup-icon-wrap">
            <AtSign size={28} />
          </div>
          <h2>Choose a Username</h2>
          <p>
            Pick a unique handle for your account. Use lowercase letters, numbers, and underscores
            — max 8 characters.
          </p>
        </div>

        {error && (
          <div className="alert alert-error mb-3">
            <span>{error}</span>
          </div>
        )}

        <div className="form-group">
          <div className="input-icon-wrapper">
            <AtSign size={18} className="input-left-icon" />
            <input
              type="text"
              className={`form-control with-left-icon${hint ? ` username-${hint.cls}` : ''}`}
              placeholder="e.g. alex_j"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              maxLength={8}
              disabled={saving}
              autoFocus
            />
          </div>
          {hint && (
            <div className={`username-hint username-hint-${hint.cls}`}>
              {hint.icon}
              <span>{hint.msg}</span>
            </div>
          )}
        </div>

        <div className="username-setup-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Skip for now
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={status !== 'available' || saving}
          >
            {saving ? 'Saving...' : 'Save Username'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsernameSetupModal;
