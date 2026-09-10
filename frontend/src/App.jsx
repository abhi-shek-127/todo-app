import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import authService from './services/authService';

export const App = () => {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login');
  const [resetToken, setResetToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check URL for password reset token
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset');
    if (token) {
      setResetToken(token);
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      const savedToken = authService.getToken();
      if (!savedToken) { setLoading(false); return; }
      try {
        const cachedUser = authService.getUser();
        if (cachedUser) setUser(cachedUser);
        const response = await authService.getMe();
        if (response.success && response.data) {
          setUser(response.data);
          authService.setUser(response.data);
        }
      } catch (err) {
        authService.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

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

  if (resetToken) {
    return (
      <div className="app-root">
        <ResetPassword token={resetToken} onSuccess={() => { setResetToken(null); setAuthView('login'); }} />
      </div>
    );
  }

  return (
    <div className="app-root">
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : authView === 'login' ? (
        <Login
          onLoginSuccess={(u) => setUser(u)}
          onNavigateToRegister={() => setAuthView('register')}
          onForgotPassword={() => setAuthView('forgot')}
        />
      ) : authView === 'register' ? (
        <Register
          onRegisterSuccess={(u) => setUser(u)}
          onNavigateToLogin={() => setAuthView('login')}
        />
      ) : (
        <ForgotPassword onBack={() => setAuthView('login')} />
      )}
    </div>
  );
};

export default App;
