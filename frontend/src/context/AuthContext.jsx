/**
 * Authentication Context
 * 
 * Provides authentication state and functions to the entire app.
 * Handles login, register, logout, and checking auth status.
 * 
 * Usage:
 *   import { useAuth } from './context/AuthContext';
 *   const { user, login, logout } = useAuth();
 */

import { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

// Create the context
const AuthContext = createContext(null);

/**
 * AuthProvider wraps the app and provides auth state
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * On mount, check if user is already logged in
   * by verifying the stored JWT token
   */
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          // Verify token is still valid by calling /api/auth/me
          const response = await API.get('/auth/me');
          setUser(response.data.data);
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  /**
   * Register a new user
   */
  const register = async (name, email, password) => {
    const response = await API.post('/auth/register', {
      name,
      email,
      password,
    });

    const { token, ...userData } = response.data.data;

    // Store token and user info
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    return response.data;
  };

  /**
   * Login with email and password
   */
  const login = async (email, password) => {
    const response = await API.post('/auth/login', {
      email,
      password,
    });

    const { token, ...userData } = response.data.data;

    // Store token and user info
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    return response.data;
  };

  /**
   * Logout - clear stored data and reset state
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access auth context
 * Usage: const { user, login, logout } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
