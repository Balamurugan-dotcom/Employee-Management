import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Clear any residual persistent authentication tokens from localStorage
    try {
      localStorage.removeItem('ems_token');
      localStorage.removeItem('ems_user');
    } catch (e) {
      // Ignore storage errors
    }

    const savedUser = sessionStorage.getItem('ems_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => sessionStorage.getItem('ems_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Validate current tab session with backend on initial load
    const verifyUser = async () => {
      const savedToken = sessionStorage.getItem('ems_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/profile');
          if (res.data.success) {
            const currentRole = res.data.user.role;
            const updatedUser = {
              _id: res.data.user._id,
              name: res.data.user.name,
              email: res.data.user.email,
              role: currentRole,
              employeeId: res.data.user.employeeId,
              status: res.data.user.status,
              avatar: res.data.user.avatar || res.data.employee?.profileImage || '',
              employeeRecordId: res.data.employee?._id || null,
              department: res.data.employee?.department || '',
              designation: res.data.employee?.designation || '',
            };
            setUser(updatedUser);
            sessionStorage.setItem('ems_user', JSON.stringify(updatedUser));
          }
        } catch (err) {
          console.error('Session verification failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (identifier, password, rememberMe = false, locationData = null) => {
    setError(null);
    try {
      const payload = { identifier, password };
      if (locationData) {
        if (locationData.latitude !== undefined) payload.latitude = locationData.latitude;
        if (locationData.longitude !== undefined) payload.longitude = locationData.longitude;
        if (locationData.locationError) payload.locationError = locationData.locationError;
      }
      const res = await api.post('/auth/login', payload);
      if (res.data.success) {
        const { token: receivedToken, user: receivedUser } = res.data;
        setToken(receivedToken);
        setUser(receivedUser);

        // Store session exclusively in sessionStorage so closing the tab ends the session
        sessionStorage.setItem('ems_token', receivedToken);
        sessionStorage.setItem('ems_user', JSON.stringify(receivedUser));

        // Purge any persistent tokens from localStorage
        localStorage.removeItem('ems_token');
        localStorage.removeItem('ems_user');

        if (rememberMe) {
          localStorage.setItem('ems_remembered_identifier', identifier);
        } else {
          localStorage.removeItem('ems_remembered_identifier');
        }

        return { success: true, user: receivedUser };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Authentication failed. Please try again.';
      const code = err.response?.data?.code || null;
      const data = err.response?.data || null;
      setError(msg);
      return { success: false, message: msg, code, data };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (e) {
      // Ignore network error on logout
    } finally {
      setUser(null);
      setToken(null);
      // Clean up both sessionStorage and localStorage
      sessionStorage.removeItem('ems_token');
      sessionStorage.removeItem('ems_user');
      localStorage.removeItem('ems_token');
      localStorage.removeItem('ems_user');
    }
  };

  const updateUser = (newDetails) => {
    const updated = { ...user, ...newDetails };
    setUser(updated);
    sessionStorage.setItem('ems_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        logout,
        updateUser,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        isManager: user?.role === 'manager',
        isEmployee: user?.role === 'employee',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
