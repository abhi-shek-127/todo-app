import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Check, X, Calendar, Flag, Tag, CheckSquare, Plus, Repeat } from 'lucide-react';

const TodoForm = ({ onSaveTodo, editingTodo, onCancelEdit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [recurrence, setRecurrence] = useState('none');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const titleRef = useRef(null);

  // Expose title input ref so Dashboard can focus it (quick-add)
  useEffect(() => {
    if (titleRef.current) titleRef.current.dataset.quickaddTarget = 'true';
  }, []);

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
      setTags(editingTodo.tags || []);
      setSubtasks((editingTodo.subtasks || []).map(s => ({ title: s.title, completed: s.completed, _id: s._id })));
      setRecurrence(editingTodo.recurrence || 'none');
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
    setTags([]);
    setTagInput('');
    setSubtasks([]);
    setSubtaskInput('');
    setRecurrence('none');
    setError('');
  };

  // Tags
  const addTag = (raw) => {
    const t = raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (t && !tags.includes(t) && tags.length < 8) {
      setTags([...tags, t]);
    }
    setTagInput('');
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (tag) => setTags(tags.filter(t => t !== tag));

  // Subtasks
  const addSubtask = () => {
    const t = subtaskInput.trim();
    if (t) {
      setSubtasks([...subtasks, { title: t, completed: false }]);
      setSubtaskInput('');
    }
  };

  const handleSubtaskKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addSubtask(); }
  };

  const removeSubtask = (idx) => setSubtasks(subtasks.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Please enter a task title'); return; }

    try {
      setLoading(true);
      setError('');
      await onSaveTodo({
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate || null,
        tags,
        subtasks,
        recurrence,
      });
      if (!editingTodo) resetForm();
    } catch (err) {
      setError(err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card form-card" id="todo-form-card">
      <div className="form-header">
        <h3 className="form-title">
          {editingTodo ? '✏️ Edit Task' : '✨ Add New Task'}
        </h3>
        {editingTodo && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancelEdit} title="Cancel editing">
            <X size={16} /> Cancel
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="todo-form">
        {/* Title */}
        <div className="form-group">
          <input
            ref={titleRef}
            type="text"
            id="task-title-input"
            className="form-control"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            maxLength={100}
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <textarea
            className="form-control"
            rows="2"
            placeholder="Add notes or details (optional)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            maxLength={500}
          />
        </div>

        {/* Tags */}
        <div className="form-group">
          <label className="input-label"><Tag size={13} /> Tags</label>
          <div className={`tags-input-area ${loading ? 'disabled' : ''}`}>
            {tags.map(tag => (
              <span key={tag} className={`tag-chip tag-${tag.charCodeAt(0) % 8}`}>
                {tag}
                <button type="button" className="tag-chip-remove" onClick={() => removeTag(tag)}>
                  <X size={10} />
                </button>
              </span>
            ))}
            <input
              type="text"
              className="tags-inline-input"
              placeholder={tags.length === 0 ? 'Type a tag, press Enter...' : '+ tag'}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => tagInput && addTag(tagInput)}
              disabled={loading}
              maxLength={20}
            />
          </div>
        </div>

        {/* Subtasks */}
        <div className="form-group">
          <label className="input-label"><CheckSquare size={13} /> Subtasks</label>
          <div className="subtasks-editor">
            {subtasks.map((st, i) => (
              <div key={i} className="subtask-editor-row">
                <span className={`subtask-editor-title ${st.completed ? 'done' : ''}`}>{st.title}</span>
                <button type="button" className="subtask-remove-btn" onClick={() => removeSubtask(i)}>
                  <X size={13} />
                </button>
              </div>
            ))}
            <div className="subtask-add-row">
              <input
                type="text"
                className="form-control subtask-add-input"
                placeholder="Add a subtask, press Enter..."
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={handleSubtaskKeyDown}
                disabled={loading}
                maxLength={80}
              />
              <button type="button" className="btn btn-sm subtask-add-btn" onClick={addSubtask} disabled={!subtaskInput.trim()}>
                <Plus size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Priority + Due Date */}
        <div className="form-row">
          <div className="form-col">
            <label className="input-label"><Flag size={13} /> Priority</label>
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
            <label className="input-label"><Calendar size={13} /> Due Date</label>
            <input
              type="date"
              className="form-control date-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-col">
            <label className="input-label"><Repeat size={13} /> Repeat</label>
            <div className="select-wrapper" style={{ position: 'relative' }}>
              <select
                className="custom-select"
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                disabled={loading}
              >
                <option value="none">No repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className={`btn btn-primary ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {editingTodo ? <><Check size={18} /> Update Task</> : <><PlusCircle size={18} /> Add Task</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TodoForm;
