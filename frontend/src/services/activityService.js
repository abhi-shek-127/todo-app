import authService from './authService';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

const getAuthHeaders = () => {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const activityService = {
  // Get user activity history
  async getActivities(limit = 20) {
    const response = await fetch(`${API_URL}/activities?limit=${limit}`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch activities');
    }
    return data.data || [];
  },

  // Clear user activity history
  async clearActivities() {
    const response = await fetch(`${API_URL}/activities`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to clear activity history');
    }
    return data;
  },
};

export default activityService;
