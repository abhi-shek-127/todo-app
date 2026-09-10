const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

export const authService = {
  // Token management
  getToken: () => localStorage.getItem('todo_auth_token'),
  setToken: (token) => localStorage.setItem('todo_auth_token', token),
  removeToken: () => {
    localStorage.removeItem('todo_auth_token');
    localStorage.removeItem('todo_user_data');
  },

  // User session info
  getUser: () => {
    const raw = localStorage.getItem('todo_user_data');
    return raw ? JSON.parse(raw) : null;
  },
  setUser: (user) => localStorage.setItem('todo_user_data', JSON.stringify(user)),

  // Register new user
  async register(name, email, password, username) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, username }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Registration failed');
    if (data.data?.token) {
      this.setToken(data.data.token);
      this.setUser({ _id: data.data._id, name: data.data.name, email: data.data.email, username: data.data.username });
    }
    return data;
  },

  // Login with email or username
  async login(identifier, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login failed');
    if (data.data?.token) {
      this.setToken(data.data.token);
      this.setUser({ _id: data.data._id, name: data.data.name, email: data.data.email, username: data.data.username });
    }
    return data;
  },

  // Check if a username is available
  async checkUsername(username) {
    const response = await fetch(`${API_URL}/auth/check-username`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    return response.json();
  },

  // Set username for logged-in user
  async setUsername(username) {
    const token = this.getToken();
    const response = await fetch(`${API_URL}/auth/set-username`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ username }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to set username');
    return data;
  },

  // Delete account permanently
  async deleteAccount() {
    const token = this.getToken();
    const response = await fetch(`${API_URL}/auth/account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete account');
    return data;
  },

  // Get current user profile from server
  async getMe() {
    const token = this.getToken();
    if (!token) throw new Error('No authentication token available');

    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user profile');
    }

    return data;
  },

  // Send forgot password email
  async forgotPassword(email) {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to send reset email');
    return data;
  },

  // Reset password with token
  async resetPassword(token, password) {
    const response = await fetch(`${API_URL}/auth/reset-password/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Password reset failed');
    return data;
  },

  // Logout
  logout() {
    this.removeToken();
  },
};

export default authService;
