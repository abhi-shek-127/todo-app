import React from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Edit3,
  Calendar,
  AlertTriangle,
  Bell,
} from 'lucide-react';

const TodoItem = ({ todo, onToggleComplete, onEdit, onDelete, onSendReminder }) => {
  const isOverdue = () => {
    if (!todo.dueDate || todo.completed) return false;
    const due = new Date(todo.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      className={`todo-item-card ${todo.completed ? 'completed' : ''} ${
        isOverdue() ? 'overdue' : ''
      }`}
    >
      <div className="todo-main">
        {/* Toggle Checkbox */}
        <button
          type="button"
          className="todo-toggle-btn"
          onClick={() => onToggleComplete(todo)}
          aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {todo.completed ? (
            <CheckCircle2 size={22} className="check-icon completed" />
          ) : (
            <Circle size={22} className="check-icon" />
          )}
        </button>

        {/* Content */}
        <div className="todo-content">
          <div className="todo-title-row">
            <h4 className="todo-title">{todo.title}</h4>
            <span className={`badge badge-${todo.priority}`}>
              {todo.priority}
            </span>
          </div>

          {todo.description && (
            <p className="todo-description">{todo.description}</p>
          )}

          <div className="todo-meta">
            {todo.dueDate && (
              <span className={`meta-tag ${isOverdue() ? 'text-danger' : ''}`}>
                {isOverdue() ? (
                  <AlertTriangle size={13} className="meta-icon" />
                ) : (
                  <Calendar size={13} className="meta-icon" />
                )}
                {formatDate(todo.dueDate)}
                {isOverdue() && ' (Overdue)'}
              </span>
            )}

            <span className="meta-tag text-muted">
              <Clock size={13} className="meta-icon" />
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
            title="Send email reminder now"
          >
            <Bell size={17} />
          </button>
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
