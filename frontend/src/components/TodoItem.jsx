import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Edit3,
  Calendar,
  AlertTriangle,
  Bell,
  BellOff,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const MUTE_OPTIONS = [
  { label: '10 min',  value: '10min' },
  { label: '30 min',  value: '30min' },
  { label: '1 hour',  value: '1hour' },
  { label: '2 hours', value: '2hours' },
  { label: '4 hours', value: '4hours' },
  { label: '8 hours', value: '8hours' },
  { label: '1 day',   value: '1day' },
];

const TodoItem = ({ todo, onToggleComplete, onEdit, onDelete, onSendReminder, onMute, onShiftDue }) => {
  const [showMuteMenu, setShowMuteMenu] = useState(false);
  const muteRef = useRef(null);

  // Close mute dropdown on outside click
  useEffect(() => {
    if (!showMuteMenu) return;
    const handler = (e) => {
      if (muteRef.current && !muteRef.current.contains(e.target)) setShowMuteMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMuteMenu]);

  const isOverdue = () => {
    if (!todo.dueDate || todo.completed) return false;
    return new Date(todo.dueDate) < new Date();
  };

  const isMuted = !!(todo.mutedUntil && new Date(todo.mutedUntil) > new Date());

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const formatMutedUntil = (dateString) => {
    const diffMs = new Date(dateString) - Date.now();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.round(diffMins / 60)}h`;
    return `${Math.round(diffMins / 1440)}d`;
  };

  const overdue = isOverdue();

  return (
    <div className={`todo-item-card ${todo.completed ? 'completed' : ''} ${overdue ? 'overdue' : ''}`}>
      <div className="todo-main">
        {/* Completion toggle */}
        <button
          type="button"
          className="todo-toggle-btn"
          onClick={() => onToggleComplete(todo)}
          aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {todo.completed
            ? <CheckCircle2 size={22} className="check-icon completed" />
            : <Circle size={22} className="check-icon" />}
        </button>

        {/* Content */}
        <div className="todo-content">
          <div className="todo-title-row">
            <h4 className="todo-title">{todo.title}</h4>
            <span className={`badge badge-${todo.priority}`}>{todo.priority}</span>
            {isMuted && (
              <span className="badge badge-muted" title={`Muted for ${formatMutedUntil(todo.mutedUntil)}`}>
                <BellOff size={10} style={{ marginRight: 2 }} />
                {formatMutedUntil(todo.mutedUntil)}
              </span>
            )}
          </div>

          {todo.description && (
            <p className="todo-description">{todo.description}</p>
          )}

          <div className="todo-meta">
            {todo.dueDate && (
              <span className={`meta-tag ${overdue ? 'text-danger' : ''}`}>
                {overdue ? <AlertTriangle size={13} /> : <Calendar size={13} />}
                {formatDate(todo.dueDate)}
                {overdue && ' (Overdue)'}
                {!todo.completed && (
                  <span className="shift-day-group">
                    <button
                      type="button"
                      className="shift-day-btn"
                      onClick={(e) => { e.stopPropagation(); onShiftDue(todo, -1); }}
                      title="Prepone by 1 day"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <button
                      type="button"
                      className="shift-day-btn"
                      onClick={(e) => { e.stopPropagation(); onShiftDue(todo, 1); }}
                      title="Postpone by 1 day"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </span>
                )}
              </span>
            )}

            <span className="meta-tag text-muted">
              <Clock size={13} />
              {new Date(todo.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="todo-actions">
        {!todo.completed && onSendReminder && (
          <button
            type="button"
            className="action-icon-btn remind-btn"
            onClick={() => onSendReminder(todo)}
            title="Send reminder now"
          >
            <Bell size={17} />
          </button>
        )}

        {!todo.completed && onMute && (
          <div className="mute-wrapper" ref={muteRef}>
            <button
              type="button"
              className={`action-icon-btn mute-btn ${isMuted ? 'mute-btn-active' : ''}`}
              onClick={() => setShowMuteMenu((v) => !v)}
              title={isMuted ? 'Muted — click to change' : 'Mute notifications'}
            >
              <BellOff size={17} />
            </button>

            {showMuteMenu && (
              <div className="mute-dropdown">
                <div className="mute-dropdown-header">Mute notifications for</div>
                {isMuted && (
                  <button
                    className="mute-option mute-unmute-btn"
                    onClick={() => { onMute(todo, null); setShowMuteMenu(false); }}
                  >
                    Unmute now
                  </button>
                )}
                {MUTE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className="mute-option"
                    onClick={() => { onMute(todo, opt.value); setShowMuteMenu(false); }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          className="action-icon-btn edit-btn"
          onClick={() => onEdit(todo)}
          title="Edit task"
        >
          <Edit3 size={17} />
        </button>

        <button
          type="button"
          className="action-icon-btn delete-btn"
          onClick={() => onDelete(todo._id)}
          title="Delete task"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  );
};

export default TodoItem;
