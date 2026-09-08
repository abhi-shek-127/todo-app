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
};

export default todoService;
