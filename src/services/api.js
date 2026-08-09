import axios from 'axios';
import { enqueueRequest } from '../utils/backgroundSync';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE
});

// Request interceptor to attach JWT token and handle offline queuing
api.interceptors.request.use(
  (config) => {
    // If browser is offline, queue mutation requests (POST, PUT, DELETE, PATCH)
    if (!navigator.onLine) {
      const isBgSync = config.headers['X-Background-Sync'] || config.headers['x-background-sync'];
      if (!isBgSync) {
        const queued = enqueueRequest(config.url || '', config.method || 'get', config.data);
        if (queued) {
          return Promise.reject(new Error('OFFLINE_QUEUED'));
        }
      }
    }

    // Clean background sync headers if present
    if (config.headers['X-Background-Sync']) {
      delete config.headers['X-Background-Sync'];
    }

    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors (like 401) and offline failures
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // If it was already queued offline, just pass it along
    if (error.message === 'OFFLINE_QUEUED') {
      return Promise.reject(error);
    }

    // If offline and request fails with a network error, dispatch offline page event
    if (!navigator.onLine && (!error.response || error.message === 'Network Error')) {
      const isGet = error.config && error.config.method && error.config.method.toLowerCase() === 'get';
      if (isGet) {
        window.dispatchEvent(new Event('api-offline-error'));
      }
    }

    if (error.response && error.response.status === 401) {
      // Clear token and user storage
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');

      // Redirect to login if not already there
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login';
      }
    }

    // Extract error message
    const message = error.response?.data?.error || error.message || 'API request failed';
    return Promise.reject(new Error(message));
  }
);

export default api;
