import React, { useState } from 'react';
import { X, Mail, Calendar, ListTodo, CheckCircle, Clock, Flame, Trash2, AtSign, AlertCircle } from 'lucide-react';
import authService from '../services/authService';

const ProfileModal = ({ user, todos, onClose, onLogout }) => {
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const initials = (user?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const totalTasks = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const pending = todos.filter((t) => !t.completed).length;
  const highPriority = todos.filter((t) => t.priority === 'high' && !t.completed).length;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    setDeleteError('');
    try {
      await authService.deleteAccount();
      authService.logout();
      onLogout();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close profile">
          <X size={20} />
        </button>

        {/* Avatar + Name */}
        <div className="profile-header">
          <div className="profile-avatar">{initials}</div>
          <h2 className="profile-name">{user?.name}</h2>
          {user?.username && <span className="profile-username-badge">@{user.username}</span>}
        </div>

        {/* Info rows */}
        <div className="profile-info-list">
          <div className="profile-info-row">
            <Mail size={15} />
            <span>{user?.email}</span>
          </div>
          {user?.username && (
            <div className="profile-info-row">
              <AtSign size={15} />
              <span>{user.username}</span>
            </div>
          )}
          {memberSince && (
            <div className="profile-info-row">
              <Calendar size={15} />
              <span>Member since {memberSince}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="profile-stats">
          <div className="profile-stat">
            <ListTodo size={16} className="profile-stat-icon" />
            <span className="profile-stat-value">{totalTasks}</span>
            <span className="profile-stat-label">Total</span>
          </div>
          <div className="profile-stat">
            <CheckCircle size={16} className="profile-stat-icon done" />
            <span className="profile-stat-value">{completed}</span>
            <span className="profile-stat-label">Done</span>
          </div>
          <div className="profile-stat">
            <Clock size={16} className="profile-stat-icon pending" />
            <span className="profile-stat-value">{pending}</span>
            <span className="profile-stat-label">Pending</span>
          </div>
          <div className="profile-stat">
            <Flame size={16} className="profile-stat-icon high" />
            <span className="profile-stat-value">{highPriority}</span>
            <span className="profile-stat-label">High</span>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="profile-danger-zone">
          <h3 className="danger-zone-title">Danger Zone</h3>
          <p className="danger-zone-desc">
            Permanently delete your account and all associated tasks and data. This cannot be undone.
          </p>
          {deleteError && (
            <div className="alert alert-error mb-3">
              <AlertCircle size={15} />
              <span>{deleteError}</span>
            </div>
          )}
          <input
            type="text"
            className="form-control danger-confirm-input"
            placeholder='Type "DELETE" to confirm'
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            disabled={deleting}
          />
          <button
            type="button"
            className="btn btn-danger btn-block"
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== 'DELETE' || deleting}
          >
            <Trash2 size={15} />
            {deleting ? 'Deleting account...' : 'Delete My Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
