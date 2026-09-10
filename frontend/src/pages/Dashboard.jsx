import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Clock,
  AlertCircle,
  LogOut,
  ListTodo,
  CheckCircle,
  Flame,
  User,
  Sparkles,
  Bell,
  BellOff,
  Download,
  Share2,
  Trash2,
  Plus,
  Activity,
  Moon,
  Sun,
} from 'lucide-react';
import Logo from '../components/Logo';
import ProfileModal from '../components/ProfileModal';
import UsernameSetupModal from '../components/UsernameSetupModal';
import TodoForm from '../components/TodoForm';
import TodoList from '../components/TodoList';
import ActivityList from '../components/ActivityList';
import todoService from '../services/todoService';
import activityService from '../services/activityService';
import authService from '../services/authService';
import {
  isPushSupported,
  checkPushSubscribed,
  subscribeToPush,
  unsubscribeFromPush,
} from '../services/pushService';

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches || !!navigator.standalone;

const Dashboard = ({ user, onLogout, onUserUpdate }) => {
  const [todos, setTodos] = useState([]);
  const [activities, setActivities] = useState([]);
  const [editingTodo, setEditingTodo] = useState(null);
  const [loadingTodos, setLoadingTodos] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [notification, setNotification] = useState(null);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const [mobileTab, setMobileTab] = useState('tasks');
  const mainColRef = useRef(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showUsernameSetup, setShowUsernameSetup] = useState(!user?.username);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('tm-dark') === '1');

  // Apply / remove dark class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('tm-dark', darkMode ? '1' : '0');
  }, [darkMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Ignore when typing in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key === 'n' || e.key === 'N') {
        const input = document.getElementById('task-title-input');
        if (input) { input.focus(); setMobileTab('tasks'); }
      }
      if (e.key === 'Escape') {
        setShowProfile(false);
        setShowUsernameSetup(false);
        setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
      }
      if (e.key === 'd' || e.key === 'D') {
        setDarkMode(v => !v);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleUsernameSuccess = (newUsername) => {
    setShowUsernameSetup(false);
    onUserUpdate?.({ username: newUsername });
    showNotification(`Username @${newUsername} saved!`);
  };

  const handleFAB = () => {
    setMobileTab('tasks');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 30);
  };
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

  const askConfirm = (title, message, onConfirm) =>
    setConfirmDialog({ open: true, title, message, onConfirm });
  const closeConfirm = () => setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });

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

  useEffect(() => { fetchTodos(); }, [fetchTodos]);
  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  useEffect(() => {
    checkPushSubscribed().then(setPushSubscribed);
  }, []);

  // Capture the browser's native install prompt (Android/Chrome/Edge)
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSBanner(true);
      return;
    }
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  const handleTogglePush = async () => {
    setPushLoading(true);
    try {
      const token = authService.getToken();
      if (pushSubscribed) {
        await unsubscribeFromPush(token);
        setPushSubscribed(false);
        showNotification('Push notifications disabled');
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          showNotification('Notification permission denied', 'error');
          return;
        }
        await subscribeToPush(token);
        setPushSubscribed(true);
        showNotification('Push notifications enabled! You will get reminders on this device.');
      }
    } catch (err) {
      showNotification(err.message || 'Failed to toggle push notifications', 'error');
    } finally {
      setPushLoading(false);
    }
  };

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
      // Confetti when all tasks are now complete
      const allDone = todos.every(t => t._id === todo._id ? updated.completed : t.completed);
      if (updated.completed && allDone && todos.length > 0) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 } });
      }
    } catch (err) {
      showNotification(err.message || 'Failed to update task status', 'error');
    }
  };

  // Toggle subtask
  const handleToggleSubtask = async (todo, subtaskId) => {
    try {
      await todoService.toggleSubtask(todo._id, subtaskId);
      await fetchTodos();
    } catch (err) {
      showNotification(err.message || 'Failed to update subtask', 'error');
    }
  };

  // Bulk complete
  const handleBulkComplete = (ids) => {
    askConfirm('Complete Tasks', `Mark ${ids.length} task(s) as complete?`, async () => {
      try {
        await todoService.bulkAction(ids, 'complete');
        showNotification(`${ids.length} task(s) marked complete`);
        await fetchTodos();
        await fetchActivities();
      } catch (err) {
        showNotification(err.message || 'Bulk complete failed', 'error');
      }
    });
  };

  // Bulk delete
  const handleBulkDelete = (ids) => {
    askConfirm('Delete Tasks', `Permanently delete ${ids.length} task(s)?`, async () => {
      try {
        await todoService.bulkAction(ids, 'delete');
        showNotification(`${ids.length} task(s) deleted`);
        await fetchTodos();
        await fetchActivities();
      } catch (err) {
        showNotification(err.message || 'Bulk delete failed', 'error');
      }
    });
  };

  // Delete todo
  const handleDeleteTodo = (id) => {
    askConfirm('Delete Task', 'This task will be permanently removed. This action cannot be undone.', async () => {
      try {
        await todoService.deleteTodo(id);
        showNotification('Task deleted successfully');
        if (editingTodo && editingTodo._id === id) setEditingTodo(null);
        await fetchTodos();
        await fetchActivities();
      } catch (err) {
        showNotification(err.message || 'Failed to delete task', 'error');
      }
    });
  };

  // Clear activities
  const handleClearActivities = () => {
    askConfirm('Clear Activity Log', 'All activity history will be erased. This cannot be undone.', async () => {
      try {
        await activityService.clearActivities();
        showNotification('Activity history cleared');
        setActivities([]);
      } catch (err) {
        showNotification(err.message || 'Failed to clear activities', 'error');
      }
    });
  };

  // Delete selected activities
  const handleDeleteSelected = (ids) => {
    askConfirm(
      'Delete Selected',
      `Remove ${ids.length} selected ${ids.length === 1 ? 'entry' : 'entries'} from the activity log?`,
      async () => {
        try {
          await activityService.deleteSelected(ids);
          showNotification(`${ids.length} ${ids.length === 1 ? 'entry' : 'entries'} deleted`);
          await fetchActivities();
        } catch (err) {
          showNotification(err.message || 'Failed to delete selected activities', 'error');
        }
      }
    );
  };

  // Mute notifications for a task
  const handleMute = async (todo, muteFor) => {
    try {
      await todoService.muteTask(todo._id, muteFor);
      showNotification(muteFor ? `Notifications muted for ${muteFor}` : 'Notifications unmuted');
      await fetchTodos();
    } catch (err) {
      showNotification(err.message || 'Failed to update mute', 'error');
    }
  };

  // Shift due date ±1 day
  const handleShiftDue = async (todo, days) => {
    try {
      await todoService.shiftDue(todo._id, days);
      showNotification(days > 0 ? 'Task postponed by 1 day' : 'Task preponed by 1 day');
      await fetchTodos();
      await fetchActivities();
    } catch (err) {
      showNotification(err.message || 'Failed to shift due date', 'error');
    }
  };

  // Send manual reminder email
  const handleSendReminder = async (todo) => {
    try {
      showNotification(`Sending reminder email for "${todo.title}"...`, 'info');
      const result = await todoService.sendReminder(todo._id);
      showNotification(result.message || `Reminder email sent!`);
      if (result.previewUrl) {
        window.open(result.previewUrl, '_blank');
      }
      await fetchActivities();
    } catch (err) {
      showNotification(err.message || 'Failed to send reminder email', 'error');
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
          <Logo size={36} />
          <div>
            <h1 className="nav-title">TaskMaster</h1>
            <span className="nav-version">Personal Productivity Workspace</span>
          </div>
        </div>

        <div className="nav-user-actions">
          <button
            type="button"
            className="user-profile-tag user-profile-btn"
            onClick={() => setShowProfile(true)}
            title="View profile"
          >
            <div className="avatar-circle avatar-initials">
              {(user?.name || 'U').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div className="user-info-text">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-email">{user?.username ? `@${user.username}` : user?.email || ''}</span>
            </div>
          </button>

          <button
            type="button"
            className="btn btn-sm dark-toggle-btn"
            onClick={() => setDarkMode(v => !v)}
            title={darkMode ? 'Switch to light mode (D)' : 'Switch to dark mode (D)'}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {!isStandalone && (installPrompt || isIOS) && (
            <button
              type="button"
              className="btn btn-sm install-btn"
              onClick={handleInstall}
              title="Install TaskMaster on your device"
            >
              {isIOS ? <Share2 size={16} /> : <Download size={16} />}
              <span>Install App</span>
            </button>
          )}

          {isPushSupported() && (
            <button
              type="button"
              className={`btn btn-sm push-btn ${pushSubscribed ? 'push-btn-active' : 'push-btn-inactive'}`}
              onClick={handleTogglePush}
              disabled={pushLoading}
              title={pushSubscribed ? 'Disable push notifications' : 'Enable push notifications'}
            >
              {pushSubscribed ? <Bell size={16} /> : <BellOff size={16} />}
              <span>{pushLoading ? '...' : pushSubscribed ? 'Notifs On' : 'Notifs Off'}</span>
            </button>
          )}

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

      {/* iOS Install Instructions Banner */}
      {showIOSBanner && (
        <div className="ios-install-banner">
          <Share2 size={18} className="ios-install-icon" />
          <span>
            Tap the <strong>Share</strong> button in Safari, then choose{' '}
            <strong>Add to Home Screen</strong> to install TaskMaster.
          </span>
          <button
            type="button"
            className="ios-install-close"
            onClick={() => setShowIOSBanner(false)}
            aria-label="Dismiss"
          >
            ✕
          </button>
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
      <div className="dashboard-grid" data-mobile-tab={mobileTab}>
        {/* Left / Center Column: Task Management */}
        <div className="main-content-col" ref={mainColRef}>
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
            onSendReminder={handleSendReminder}
            onMute={handleMute}
            onShiftDue={handleShiftDue}
            onToggleSubtask={handleToggleSubtask}
            onBulkComplete={handleBulkComplete}
            onBulkDelete={handleBulkDelete}
            filters={filters}
            onFilterChange={setFilters}
          />
        </div>

        {/* Right Column: Activity Stream */}
        <div className="sidebar-col">
          <ActivityList
            activities={activities}
            onClearActivities={handleClearActivities}
            onDeleteSelected={handleDeleteSelected}
            loading={loadingActivities}
          />
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="mobile-bottom-nav" aria-label="Main navigation">
        <button
          type="button"
          className={`mobile-tab-btn ${mobileTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setMobileTab('tasks')}
        >
          <ListTodo size={22} />
          <span>Tasks</span>
        </button>
        <button type="button" className="mobile-fab" onClick={handleFAB} aria-label="Add task">
          <Plus size={24} />
        </button>
        <button
          type="button"
          className={`mobile-tab-btn ${mobileTab === 'activity' ? 'active' : ''}`}
          onClick={() => setMobileTab('activity')}
        >
          <Activity size={22} />
          <span>Activity</span>
        </button>
      </nav>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          user={user}
          todos={todos}
          onClose={() => setShowProfile(false)}
          onLogout={onLogout}
        />
      )}

      {/* Username Setup Modal for existing users */}
      {showUsernameSetup && (
        <UsernameSetupModal
          onClose={() => setShowUsernameSetup(false)}
          onSuccess={handleUsernameSuccess}
        />
      )}

      {/* Custom Confirm Dialog */}
      {confirmDialog.open && (
        <div className="confirm-overlay" onClick={closeConfirm}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon-wrap">
              <Trash2 size={22} />
            </div>
            <h3 className="confirm-title">{confirmDialog.title}</h3>
            <p className="confirm-message">{confirmDialog.message}</p>
            <div className="confirm-actions">
              <button type="button" className="btn confirm-cancel-btn" onClick={closeConfirm}>
                Cancel
              </button>
              <button
                type="button"
                className="btn confirm-delete-btn"
                onClick={() => { closeConfirm(); confirmDialog.onConfirm?.(); }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
