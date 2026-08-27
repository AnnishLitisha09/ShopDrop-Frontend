import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const ROLE_DASHBOARDS = {
  student: '/student/dashboard',
  vendor: '/vendor/dashboard',
  institution_admin: '/institution-admin/dashboard',
  super_admin: '/super-admin/dashboard',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('sd_user') || sessionStorage.getItem('sd_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('sd_token') || sessionStorage.getItem('sd_token') || null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            const storage = localStorage.getItem('sd_token') ? localStorage : sessionStorage;
            storage.setItem('sd_user', JSON.stringify(res.user));
          } else {
            logout();
          }
        } catch (error) {
          console.error('Failed to verify token session:', error);
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    verifyAuth();
  }, [token]);

  const login = async (email, password, rememberMe = false) => {
    const data = await authService.login(email, password, rememberMe);
    if (data.success && data.token && data.user) {
      const storage = rememberMe ? localStorage : sessionStorage;
      localStorage.removeItem('sd_token');
      localStorage.removeItem('sd_user');
      sessionStorage.removeItem('sd_token');
      sessionStorage.removeItem('sd_user');

      storage.setItem('sd_token', data.token);
      storage.setItem('sd_user', JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);
      return data.user;
    } else {
      throw new Error(data.message || 'Login failed');
    }
  };

  const register = async (name, email, password, institutionId) => {
    const data = await authService.register(name, email, password, institutionId);
    if (data.success && data.token && data.user) {
      localStorage.removeItem('sd_token');
      localStorage.removeItem('sd_user');
      sessionStorage.removeItem('sd_token');
      sessionStorage.removeItem('sd_user');

      localStorage.setItem('sd_token', data.token);
      localStorage.setItem('sd_user', JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);
      return data.user;
    } else {
      throw new Error(data.message || 'Registration failed');
    }
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    const storage = localStorage.getItem('sd_token') ? localStorage : sessionStorage;
    storage.setItem('sd_user', JSON.stringify(updatedUser));
  };

  const updateSavedAddress = (newAddress) => {
    if (!user) return;
    const updatedUser = { ...user, savedAddress: newAddress };
    setUser(updatedUser);
    localStorage.setItem('sd_saved_address', JSON.stringify(newAddress));
    const storage = localStorage.getItem('sd_token') ? localStorage : sessionStorage;
    storage.setItem('sd_user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    localStorage.removeItem('sd_token');
    localStorage.removeItem('sd_user');
    localStorage.removeItem('sd_saved_address');
    sessionStorage.removeItem('sd_token');
    sessionStorage.removeItem('sd_user');
    setToken(null);
    setUser(null);
  };

  const getDashboardPath = (role) => {
    return ROLE_DASHBOARDS[role] || '/student/dashboard';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        register,
        logout,
        updateUserProfile,
        updateSavedAddress,
        getDashboardPath,
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

export default AuthContext;
