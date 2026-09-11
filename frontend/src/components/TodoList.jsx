import React, { useState, useEffect } from 'react';
import TodoItem from './TodoItem';
import { Search, Filter, ArrowUpDown, CheckCircle2, X, MousePointerSquareDashed, CheckCheck, Trash2, Tag } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable wrapper for each task row
const SortableTodoItem = ({ todo, ...props }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo._id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative',
      }}
    >
      <TodoItem {...props} todo={todo} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
};

const TodoList = ({
  todos = [],
  onToggleComplete,
  onEdit,
  onDelete,
  onSendReminder,
  onMute,
  onShiftDue,
  onToggleSubtask,
  onBulkComplete,
  onBulkDelete,
  onReorder,
  filters,
  onFilterChange,
}) => {
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const isDragMode = filters.sortBy === 'custom' && !bulkMode;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = todos.findIndex(t => t._id === active.id);
    const newIndex = todos.findIndex(t => t._id === over.id);
    const reordered = arrayMove(todos, oldIndex, newIndex);
    onReorder?.(reordered.map(t => t._id));
  };

  // Clear selection when todos list changes (after bulk action)
  useEffect(() => {
    setSelectedIds(new Set());
  }, [todos.length]);

  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.completed).length;
  const pendingCount = todos.filter((t) => !t.completed).length;

  // Collect all unique tags from current todos
  const allTags = [...new Set(todos.flatMap(t => t.tags || []))].sort();

  const handleBulkSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === todos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(todos.map(t => t._id)));
    }
  };

  const exitBulkMode = () => {
    setBulkMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkComplete = () => {
    onBulkComplete?.(Array.from(selectedIds));
    exitBulkMode();
  };

  const handleBulkDelete = () => {
    onBulkDelete?.(Array.from(selectedIds));
    exitBulkMode();
  };

  return (
    <div className="card todo-list-container">
      {/* Controls Bar */}
      <div className="controls-bar">
        <div className="search-box">
          <Search size={17} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          />
          {filters.search && (
            <button type="button" className="clear-search-btn" onClick={() => onFilterChange({ ...filters, search: '' })}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filter-dropdowns">
          {/* Tag filter */}
          {allTags.length > 0 && (
            <div className="select-wrapper">
              <Tag size={15} className="select-icon" />
              <select
                value={filters.tag || 'all'}
                onChange={(e) => onFilterChange({ ...filters, tag: e.target.value })}
                className="custom-select"
              >
                <option value="all">All Tags</option>
                {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
              </select>
            </div>
          )}

          <div className="select-wrapper">
            <Filter size={15} className="select-icon" />
            <select
              value={filters.priority}
              onChange={(e) => onFilterChange({ ...filters, priority: e.target.value })}
              className="custom-select"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="select-wrapper">
            <ArrowUpDown size={15} className="select-icon" />
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
              className="custom-select"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="dueDate">Due Date</option>
              <option value="title">A–Z</option>
              <option value="custom">Custom Order ↕</option>
            </select>
          </div>

          {/* Bulk mode toggle */}
          <button
            type="button"
            className={`btn btn-sm bulk-toggle-btn ${bulkMode ? 'active' : ''}`}
            onClick={() => { setBulkMode(v => !v); setSelectedIds(new Set()); }}
            title="Select multiple tasks"
          >
            <MousePointerSquareDashed size={15} />
            {bulkMode ? 'Cancel' : 'Select'}
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {bulkMode && (
        <div className="bulk-action-bar">
          <label className="bulk-select-all">
            <input
              type="checkbox"
              checked={selectedIds.size === todos.length && todos.length > 0}
              onChange={toggleSelectAll}
            />
            <span>{selectedIds.size === todos.length && todos.length > 0 ? 'Deselect all' : `Select all (${todos.length})`}</span>
          </label>

          {selectedIds.size > 0 && (
            <div className="bulk-actions">
              <span className="bulk-count">{selectedIds.size} selected</span>
              <button type="button" className="btn btn-sm bulk-complete-btn" onClick={handleBulkComplete}>
                <CheckCheck size={15} /> Complete
              </button>
              <button type="button" className="btn btn-sm bulk-delete-btn" onClick={handleBulkDelete}>
                <Trash2 size={15} /> Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Status tabs */}
      <div className="status-tabs">
        {[
          { key: 'all', label: 'All', count: totalCount },
          { key: 'pending', label: 'Pending', count: pendingCount, cls: 'warning' },
          { key: 'completed', label: 'Completed', count: completedCount, cls: 'success' },
        ].map(({ key, label, count, cls }) => (
          <button
            key={key}
            type="button"
            className={`status-tab ${filters.status === key ? 'active' : ''}`}
            onClick={() => onFilterChange({ ...filters, status: key })}
          >
            {label} <span className={`tab-badge ${cls || ''}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="todo-items-list">
        {todos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              {filters.search || filters.priority !== 'all' || filters.status !== 'all' || (filters.tag && filters.tag !== 'all')
                ? <Search size={36} className="empty-icon" />
                : <CheckCircle2 size={36} className="empty-icon" />}
            </div>
            <h4 className="empty-title">
              {filters.search || filters.priority !== 'all' || filters.status !== 'all' || (filters.tag && filters.tag !== 'all')
                ? 'No matching tasks found'
                : 'No tasks yet!'}
            </h4>
            <p className="empty-desc">
              {filters.search || filters.priority !== 'all' || filters.status !== 'all' || (filters.tag && filters.tag !== 'all')
                ? 'Try adjusting your filters.'
                : 'Add your first task above to get started.'}
            </p>
          </div>
        ) : isDragMode ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={todos.map(t => t._id)} strategy={verticalListSortingStrategy}>
              {todos.map((todo) => (
                <SortableTodoItem
                  key={todo._id}
                  todo={todo}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onSendReminder={onSendReminder}
                  onMute={onMute}
                  onShiftDue={onShiftDue}
                  onToggleSubtask={onToggleSubtask}
                  bulkMode={false}
                  selected={false}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          todos.map((todo) => (
            <TodoItem
              key={todo._id}
              todo={todo}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              onSendReminder={onSendReminder}
              onMute={onMute}
              onShiftDue={onShiftDue}
              onToggleSubtask={onToggleSubtask}
              bulkMode={bulkMode}
              selected={selectedIds.has(todo._id)}
              onBulkSelect={handleBulkSelect}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TodoList;
