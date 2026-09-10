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
  ChevronDown,
  ChevronUp,
  Check,
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

const TodoItem = ({
  todo,
  onToggleComplete,
  onEdit,
  onDelete,
  onSendReminder,
  onMute,
  onShiftDue,
  onToggleSubtask,
  bulkMode = false,
  selected = false,
  onBulkSelect,
}) => {
  const [showMuteMenu, setShowMuteMenu] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const muteRef = useRef(null);

  useEffect(() => {
    if (!showMuteMenu) return;
    const handler = (e) => {
      if (muteRef.current && !muteRef.current.contains(e.target)) setShowMuteMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMuteMenu]);

  const isOverdue = !todo.dueDate || todo.completed
    ? false
    : new Date(todo.dueDate) < new Date();

  const isMuted = !!(todo.mutedUntil && new Date(todo.mutedUntil) > new Date());

  const formatDate = (d) =>
    new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const formatMutedUntil = (d) => {
    const mins = Math.round((new Date(d) - Date.now()) / 60000);
    if (mins < 60) return `${mins}m`;
    if (mins < 1440) return `${Math.round(mins / 60)}h`;
    return `${Math.round(mins / 1440)}d`;
  };

  const subtasks = todo.subtasks || [];
  const subtasksDone = subtasks.filter(s => s.completed).length;
  const subtasksTotal = subtasks.length;
  const subtaskPct = subtasksTotal ? Math.round((subtasksDone / subtasksTotal) * 100) : 0;

  return (
    <div className={`todo-item-card ${todo.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''} ${selected ? 'bulk-selected' : ''}`}>
      <div className="todo-main">
        {/* Bulk checkbox OR completion toggle */}
        {bulkMode ? (
          <button
            type="button"
            className={`bulk-checkbox ${selected ? 'checked' : ''}`}
            onClick={() => onBulkSelect?.(todo._id)}
            aria-label={selected ? 'Deselect' : 'Select'}
          >
            {selected && <Check size={13} />}
          </button>
        ) : (
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
        )}

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

          {/* Tags */}
          {todo.tags?.length > 0 && (
            <div className="todo-tags">
              {todo.tags.map(tag => (
                <span key={tag} className={`tag-chip tag-chip-sm tag-${tag.charCodeAt(0) % 8}`}>{tag}</span>
              ))}
            </div>
          )}

          {todo.description && (
            <p className="todo-description">{todo.description}</p>
          )}

          {/* Subtask progress bar */}
          {subtasksTotal > 0 && (
            <button
              type="button"
              className="subtask-progress-btn"
              onClick={() => setShowSubtasks(v => !v)}
            >
              <div className="subtask-progress-bar-wrap">
                <div className="subtask-progress-bar" style={{ width: `${subtaskPct}%` }} />
              </div>
              <span className="subtask-progress-label">
                {subtasksDone}/{subtasksTotal} subtasks
              </span>
              {showSubtasks ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}

          {/* Subtask list */}
          {showSubtasks && subtasksTotal > 0 && (
            <ul className="subtask-list">
              {subtasks.map((st) => (
                <li
                  key={st._id}
                  className={`subtask-item ${st.completed ? 'done' : ''}`}
                  onClick={() => !todo.completed && onToggleSubtask?.(todo, st._id)}
                >
                  <span className="subtask-checkbox-ico">
                    {st.completed ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                  </span>
                  <span className="subtask-title">{st.title}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="todo-meta">
            {todo.dueDate && (
              <span className={`meta-tag ${isOverdue ? 'text-danger' : ''}`}>
                {isOverdue ? <AlertTriangle size={13} /> : <Calendar size={13} />}
                {formatDate(todo.dueDate)}
                {isOverdue && ' (Overdue)'}
                {!todo.completed && (
                  <span className="shift-day-group">
                    <button
                      type="button"
                      className="shift-day-btn"
                      onClick={(e) => { e.stopPropagation(); onShiftDue(todo, -1); }}
                      title="Prepone by 1 day"
                    ><ChevronLeft size={12} /></button>
                    <button
                      type="button"
                      className="shift-day-btn"
                      onClick={(e) => { e.stopPropagation(); onShiftDue(todo, 1); }}
                      title="Postpone by 1 day"
                    ><ChevronRight size={12} /></button>
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
      {!bulkMode && (
        <div className="todo-actions">
          {!todo.completed && onSendReminder && (
            <button type="button" className="action-icon-btn remind-btn" onClick={() => onSendReminder(todo)} title="Send reminder now">
              <Bell size={17} />
            </button>
          )}

          {!todo.completed && onMute && (
            <div className="mute-wrapper" ref={muteRef}>
              <button
                type="button"
                className={`action-icon-btn mute-btn ${isMuted ? 'mute-btn-active' : ''}`}
                onClick={() => setShowMuteMenu(v => !v)}
                title={isMuted ? 'Muted — click to change' : 'Mute notifications'}
              >
                <BellOff size={17} />
              </button>
              {showMuteMenu && (
                <div className="mute-dropdown">
                  <div className="mute-dropdown-header">Mute notifications for</div>
                  {isMuted && (
                    <button className="mute-option mute-unmute-btn" onClick={() => { onMute(todo, null); setShowMuteMenu(false); }}>
                      Unmute now
                    </button>
                  )}
                  {MUTE_OPTIONS.map((opt) => (
                    <button key={opt.value} className="mute-option" onClick={() => { onMute(todo, opt.value); setShowMuteMenu(false); }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button type="button" className="action-icon-btn edit-btn" onClick={() => onEdit(todo)} title="Edit task">
            <Edit3 size={17} />
          </button>

          <button type="button" className="action-icon-btn delete-btn" onClick={() => onDelete(todo._id)} title="Delete task">
            <Trash2 size={17} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TodoItem;
