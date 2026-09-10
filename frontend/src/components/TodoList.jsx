import React from 'react';
import TodoItem from './TodoItem';
import { Search, Filter, ArrowUpDown, CheckCircle2, ListTodo, X } from 'lucide-react';

const TodoList = ({
  todos = [],
  onToggleComplete,
  onEdit,
  onDelete,
  onSendReminder,
  onMute,
  onShiftDue,
  filters,
  onFilterChange,
}) => {
  // Counts
  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.completed).length;
  const pendingCount = todos.filter((t) => !t.completed).length;

  const handleSearchChange = (e) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleStatusChange = (status) => {
    onFilterChange({ ...filters, status });
  };

  const handlePriorityChange = (e) => {
    onFilterChange({ ...filters, priority: e.target.value });
  };

  const handleSortChange = (e) => {
    onFilterChange({ ...filters, sortBy: e.target.value });
  };

  const clearSearch = () => {
    onFilterChange({ ...filters, search: '' });
  };

  return (
    <div className="card todo-list-container">
      {/* Controls Bar: Search & Filters */}
      <div className="controls-bar">
        {/* Search */}
        <div className="search-box">
          <Search size={17} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks by keyword..."
            value={filters.search}
            onChange={handleSearchChange}
          />
          {filters.search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={clearSearch}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Priority & Sort Filters */}
        <div className="filter-dropdowns">
          <div className="select-wrapper">
            <Filter size={15} className="select-icon" />
            <select
              value={filters.priority}
              onChange={handlePriorityChange}
              className="custom-select"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          <div className="select-wrapper">
            <ArrowUpDown size={15} className="select-icon" />
            <select
              value={filters.sortBy}
              onChange={handleSortChange}
              className="custom-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="dueDate">Due Date</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs for status */}
      <div className="status-tabs">
        <button
          type="button"
          className={`status-tab ${filters.status === 'all' ? 'active' : ''}`}
          onClick={() => handleStatusChange('all')}
        >
          All <span className="tab-badge">{totalCount}</span>
        </button>
        <button
          type="button"
          className={`status-tab ${filters.status === 'pending' ? 'active' : ''}`}
          onClick={() => handleStatusChange('pending')}
        >
          Pending <span className="tab-badge warning">{pendingCount}</span>
        </button>
        <button
          type="button"
          className={`status-tab ${filters.status === 'completed' ? 'active' : ''}`}
          onClick={() => handleStatusChange('completed')}
        >
          Completed <span className="tab-badge success">{completedCount}</span>
        </button>
      </div>

      {/* Todo items list */}
      <div className="todo-items-list">
        {todos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              {filters.search || filters.priority !== 'all' || filters.status !== 'all' ? (
                <Search size={36} className="empty-icon" />
              ) : (
                <CheckCircle2 size={36} className="empty-icon" />
              )}
            </div>
            <h4 className="empty-title">
              {filters.search || filters.priority !== 'all' || filters.status !== 'all'
                ? 'No matching tasks found'
                : 'You have no tasks yet!'}
            </h4>
            <p className="empty-desc">
              {filters.search || filters.priority !== 'all' || filters.status !== 'all'
                ? 'Try adjusting your search query or reset the filters.'
                : 'Create your first task using the form above to start tracking your goals.'}
            </p>
          </div>
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
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TodoList;
