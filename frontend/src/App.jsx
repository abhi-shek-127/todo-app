import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import authService from './services/authService';

export const App = () => {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const token = authService.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const cachedUser = authService.getUser();
        if (cachedUser) {
          setUser(cachedUser);
        }
        // Verify with server
        const response = await authService.getMe();
        if (response.success && response.data) {
          setUser(response.data);
          authService.setUser(response.data);
        }
      } catch (err) {
        console.warn('Session expired or invalid token:', err.message);
        authService.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleRegisterSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setAuthView('login');
  };

  if (loading) {
    return (
      <div className="fullscreen-loading">
        <div className="spinner"></div>
        <p>Loading TaskMaster...</p>
      </div>
    );
  }

  return (
    <div className="app-root">
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : authView === 'login' ? (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onNavigateToRegister={() => setAuthView('register')}
        />
      ) : (
        <Register
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateToLogin={() => setAuthView('login')}
        />
      )}
    </div>
  );
};

export default App;
