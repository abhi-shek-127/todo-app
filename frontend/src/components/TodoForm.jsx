import React, { useState, useEffect } from 'react';
import { PlusCircle, Check, X, Calendar, Flag, AlertCircle } from 'lucide-react';

const TodoForm = ({ onSaveTodo, editingTodo, onCancelEdit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingTodo) {
      setTitle(editingTodo.title || '');
      setDescription(editingTodo.description || '');
      setPriority(editingTodo.priority || 'medium');
      setDueDate(
        editingTodo.dueDate
          ? new Date(editingTodo.dueDate).toISOString().split('T')[0]
          : ''
      );
    } else {
      resetForm();
    }
    setError('');
  }, [editingTodo]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a task title');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSaveTodo({
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate || null,
      });
      if (!editingTodo) {
        resetForm();
      }
    } catch (err) {
      setError(err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card form-card">
      <div className="form-header">
        <h3 className="form-title">
          {editingTodo ? '✏️ Edit Task' : '✨ Add New Task'}
        </h3>
        {editingTodo && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onCancelEdit}
            title="Cancel editing"
          >
            <X size={16} /> Cancel
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="todo-form">
        <div className="form-group">
          <input
            type="text"
            className="form-control"
            placeholder="What needs to be done? (e.g. Complete math assignment)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            maxLength={100}
            autoFocus
          />
        </div>

        <div className="form-group">
          <textarea
            className="form-control"
            rows="2"
            placeholder="Add extra details or notes (optional)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            maxLength={500}
          />
        </div>

        <div className="form-row">
          <div className="form-col">
            <label className="input-label">
              <Flag size={14} /> Priority
            </label>
            <div className="priority-pills">
              {['low', 'medium', 'high'].map((p) => (
                <button
                  type="button"
                  key={p}
                  className={`pill-btn ${priority === p ? `active ${p}` : ''}`}
                  onClick={() => setPriority(p)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="form-col">
            <label className="input-label">
              <Calendar size={14} /> Due Date
            </label>
            <input
              type="date"
              className="form-control date-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className={`btn btn-primary ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {editingTodo ? (
              <>
                <Check size={18} /> Update Task
              </>
            ) : (
              <>
                <PlusCircle size={18} /> Add Task
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TodoForm;
