import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  LogOut,
  ListTodo,
  CheckCircle,
  Flame,
  User,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import TodoForm from '../components/TodoForm';
import TodoList from '../components/TodoList';
import ActivityList from '../components/ActivityList';
import todoService from '../services/todoService';
import activityService from '../services/activityService';

const Dashboard = ({ user, onLogout }) => {
  const [todos, setTodos] = useState([]);
  const [activities, setActivities] = useState([]);
  const [editingTodo, setEditingTodo] = useState(null);
  const [loadingTodos, setLoadingTodos] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [notification, setNotification] = useState(null);

  // Filters state
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: '',
    sortBy: 'newest',
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Fetch todos
  const fetchTodos = useCallback(async () => {
    try {
      setLoadingTodos(true);
      const data = await todoService.getTodos(filters);
      setTodos(data);
    } catch (err) {
      showNotification(err.message || 'Failed to fetch tasks', 'error');
    } finally {
      setLoadingTodos(false);
    }
  }, [filters]);

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    try {
      setLoadingActivities(true);
      const data = await activityService.getActivities(20);
      setActivities(data);
    } catch (err) {
      console.error('Error loading activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Save or update todo
  const handleSaveTodo = async (todoData) => {
    if (editingTodo) {
      const updated = await todoService.updateTodo(editingTodo._id, todoData);
      showNotification(`Task "${updated.title}" updated successfully`);
      setEditingTodo(null);
    } else {
      const created = await todoService.createTodo(todoData);
      showNotification(`Task "${created.title}" added to your list`);
    }
    await fetchTodos();
    await fetchActivities();
  };

  // Toggle todo completion
  const handleToggleComplete = async (todo) => {
    try {
      const updated = await todoService.updateTodo(todo._id, {
        completed: !todo.completed,
      });
      showNotification(
        updated.completed
          ? `Great job! Completed "${updated.title}"`
          : `Reopened "${updated.title}"`
      );
      await fetchTodos();
      await fetchActivities();
    } catch (err) {
      showNotification(err.message || 'Failed to update task status', 'error');
    }
  };

  // Delete todo
  const handleDeleteTodo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }
    try {
      await todoService.deleteTodo(id);
      showNotification('Task deleted successfully');
      if (editingTodo && editingTodo._id === id) {
        setEditingTodo(null);
      }
      await fetchTodos();
      await fetchActivities();
    } catch (err) {
      showNotification(err.message || 'Failed to delete task', 'error');
    }
  };

  // Clear activities
  const handleClearActivities = async () => {
    if (!window.confirm('Clear all activity logs?')) return;
    try {
      await activityService.clearActivities();
      showNotification('Activity history cleared');
      setActivities([]);
    } catch (err) {
      showNotification(err.message || 'Failed to clear activities', 'error');
    }
  };

  // Computed metrics
  const totalTasks = todos.length;
  const completedTasks = todos.filter((t) => t.completed).length;
  const pendingTasks = todos.filter((t) => !t.completed).length;
  const highPriorityTasks = todos.filter((t) => t.priority === 'high' && !t.completed).length;

  return (
    <div className="dashboard-container">
      {/* Navigation Header */}
      <header className="dashboard-nav">
        <div className="nav-brand">
          <div className="brand-badge">
            <CheckCircle2 size={24} className="brand-badge-icon" />
          </div>
          <div>
            <h1 className="nav-title">TaskMaster</h1>
            <span className="nav-version">Personal Productivity Workspace</span>
          </div>
        </div>

        <div className="nav-user-actions">
          <div className="user-profile-tag">
            <div className="avatar-circle">
              <User size={16} />
            </div>
            <div className="user-info-text">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-email">{user?.email || ''}</span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline-danger btn-sm logout-btn"
            onClick={onLogout}
            title="Sign out"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className={`notification-toast toast-${notification.type}`}>
          {notification.type === 'error' ? (
            <AlertCircle size={18} />
          ) : (
            <Sparkles size={18} />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Metric Cards Overview */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box total">
            <ListTodo size={22} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Total Tasks</span>
            <span className="metric-value">{totalTasks}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box pending">
            <Clock size={22} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Pending</span>
            <span className="metric-value">{pendingTasks}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box completed">
            <CheckCircle size={22} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Completed</span>
            <span className="metric-value">{completedTasks}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box priority">
            <Flame size={22} />
          </div>
          <div className="metric-details">
            <span className="metric-label">High Priority</span>
            <span className="metric-value">{highPriorityTasks}</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="dashboard-grid">
        {/* Left / Center Column: Task Management */}
        <div className="main-content-col">
          {/* Add / Edit Form */}
          <TodoForm
            onSaveTodo={handleSaveTodo}
            editingTodo={editingTodo}
            onCancelEdit={() => setEditingTodo(null)}
          />

          {/* Task List */}
          <TodoList
            todos={todos}
            onToggleComplete={handleToggleComplete}
            onEdit={(todo) => {
              setEditingTodo(todo);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onDelete={handleDeleteTodo}
            filters={filters}
            onFilterChange={setFilters}
          />
        </div>

        {/* Right Column: Activity Stream */}
        <div className="sidebar-col">
          <ActivityList
            activities={activities}
            onClearActivities={handleClearActivities}
            loading={loadingActivities}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
