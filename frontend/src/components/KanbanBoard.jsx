import React from 'react';
import { Edit3, Trash2, Calendar, AlertTriangle, ArrowRight } from 'lucide-react';

const COLUMNS = [
  { key: 'todo',       label: 'To Do',      colorClass: 'kanban-col-todo' },
  { key: 'inprogress', label: 'In Progress', colorClass: 'kanban-col-inprogress' },
  { key: 'done',       label: 'Done',        colorClass: 'kanban-col-done' },
];

const MOVE_TARGETS = {
  todo:       ['inprogress', 'done'],
  inprogress: ['todo', 'done'],
  done:       ['todo', 'inprogress'],
};

const MOVE_LABELS = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };

// Compute kanban status with backward-compat (existing tasks have no status field)
const getKanbanStatus = (todo) => {
  if (todo.completed) return 'done';
  return todo.status || 'todo';
};

const KanbanBoard = ({ todos, onEdit, onDelete, onMoveKanban }) => {
  const columns = COLUMNS.map((col) => ({
    ...col,
    tasks: todos.filter((t) => getKanbanStatus(t) === col.key),
  }));

  return (
    <div className="kanban-board">
      {columns.map((col) => (
        <div key={col.key} className={`kanban-col ${col.colorClass}`}>
          <div className="kanban-col-header">
            <span className="kanban-col-title">{col.label}</span>
            <span className="kanban-col-count">{col.tasks.length}</span>
          </div>

          <div className="kanban-cards">
            {col.tasks.length === 0 && (
              <div className="kanban-empty">No tasks here</div>
            )}
            {col.tasks.map((todo) => (
              <KanbanCard
                key={todo._id}
                todo={todo}
                currentStatus={col.key}
                moveTargets={MOVE_TARGETS[col.key]}
                onEdit={onEdit}
                onDelete={onDelete}
                onMove={onMoveKanban}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const KanbanCard = ({ todo, currentStatus, moveTargets, onEdit, onDelete, onMove }) => {
  const isOverdue = todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date();
  const subtasks = todo.subtasks || [];
  const subtasksDone = subtasks.filter((s) => s.completed).length;

  return (
    <div className={`kanban-card priority-border-${todo.priority} ${currentStatus === 'done' ? 'kanban-card-done' : ''}`}>
      {/* Title */}
      <p className="kanban-card-title">{todo.title}</p>

      {/* Tags */}
      {todo.tags?.length > 0 && (
        <div className="todo-tags" style={{ marginBottom: 6 }}>
          {todo.tags.map((tag) => (
            <span key={tag} className={`tag-chip tag-chip-sm tag-${tag.charCodeAt(0) % 8}`}>{tag}</span>
          ))}
        </div>
      )}

      {/* Subtask progress */}
      {subtasks.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <div className="subtask-progress-bar-wrap" style={{ flex: 1, maxWidth: 'none' }}>
            <div className="subtask-progress-bar" style={{ width: `${Math.round((subtasksDone / subtasks.length) * 100)}%` }} />
          </div>
          <span className="subtask-progress-label">{subtasksDone}/{subtasks.length}</span>
        </div>
      )}

      {/* Meta row */}
      <div className="kanban-card-meta">
        <span className={`badge badge-${todo.priority}`}>{todo.priority}</span>
        {todo.dueDate && (
          <span className={`meta-tag ${isOverdue ? 'text-danger' : 'text-muted'}`} style={{ fontSize: '0.72rem' }}>
            {isOverdue ? <AlertTriangle size={11} /> : <Calendar size={11} />}
            {new Date(todo.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="kanban-card-actions">
        <div className="kanban-move-btns">
          {moveTargets.map((target) => (
            <button
              key={target}
              type="button"
              className="kanban-move-btn"
              onClick={() => onMove(todo, target)}
              title={`Move to ${MOVE_LABELS[target]}`}
            >
              <ArrowRight size={11} />
              {MOVE_LABELS[target]}
            </button>
          ))}
        </div>
        <div className="kanban-icon-actions">
          <button type="button" className="action-icon-btn edit-btn" onClick={() => onEdit(todo)} title="Edit">
            <Edit3 size={14} />
          </button>
          <button type="button" className="action-icon-btn delete-btn" onClick={() => onDelete(todo._id)} title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;
