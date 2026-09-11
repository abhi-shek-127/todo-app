import authService from './authService';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

const getAuthHeaders = () => {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const todoService = {
  // Fetch todos with optional query filters (status, priority, search, sortBy)
  async getTodos(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority);
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_URL}/todos${queryString}`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch tasks');
    }
    return data.data || [];
  },

  // Get single todo
  async getTodoById(id) {
    const response = await fetch(`${API_URL}/todos/${id}`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch task');
    }
    return data.data;
  },

  // Create new todo
  async createTodo(todoData) {
    const response = await fetch(`${API_URL}/todos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(todoData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create task');
    }
    return data.data;
  },

  // Update existing todo
  async updateTodo(id, updateData) {
    const response = await fetch(`${API_URL}/todos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update task');
    }
    return data.data;
  },

  // Delete a todo
  async deleteTodo(id) {
    const response = await fetch(`${API_URL}/todos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete task');
    }
    return data;
  },

  // Mute notifications for a task (muteFor = '10min'|'30min'|...|'1day', null to unmute)
  async muteTask(id, muteFor) {
    const response = await fetch(`${API_URL}/todos/${id}/mute`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ muteFor }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to mute task');
    return data.data;
  },

  // Shift due date by days (positive = postpone, negative = prepone)
  async shiftDue(id, days) {
    const response = await fetch(`${API_URL}/todos/${id}/shift-due`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ days }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to shift due date');
    return data.data;
  },

  // Reorder todos (save custom order)
  async reorderTodos(ids) {
    const response = await fetch(`${API_URL}/todos/reorder`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ids }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to reorder');
    return data;
  },

  // Move task to a kanban column
  async moveKanban(id, status) {
    const response = await fetch(`${API_URL}/todos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, completed: status === 'done' }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to move task');
    return data.data;
  },

  // Toggle a subtask completed state
  async toggleSubtask(todoId, subtaskId) {
    const response = await fetch(`${API_URL}/todos/${todoId}/subtasks/${subtaskId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to toggle subtask');
    return data.data;
  },

  // Bulk complete or delete tasks
  async bulkAction(ids, action) {
    const response = await fetch(`${API_URL}/todos/bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ids, action }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Bulk action failed');
    return data;
  },

  // Send email reminder on demand
  async sendReminder(id) {
    const response = await fetch(`${API_URL}/todos/${id}/remind`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send reminder email');
    }
    return data;
  },
};

export default todoService;
