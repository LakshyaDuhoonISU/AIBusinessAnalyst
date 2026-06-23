/**
 * API Service
 * 
 * Axios instance configured with:
 *   - Base URL pointing to the backend
 *   - Automatic JWT token attachment via interceptor
 *   - Error handling for auth failures (auto-redirect to login)
 */

import axios from 'axios';

// Create axios instance with default config
const API = axios.create({
  baseURL: 'https://aibusinessanalyst.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Automatically adds the JWT token from localStorage to every request
 */
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles 401 errors by clearing token and redirecting to login
 */
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login/register page
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
