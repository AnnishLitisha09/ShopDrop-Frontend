import axios from 'axios';

const rawUrl = import.meta.env.VITE_API_URL || 'https://n18vc52l-5000.inc1.devtunnels.ms';
const cleanUrl = rawUrl.replace(/\/+$/, '');
const API_URL = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to attach JWT token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sd_token') || sessionStorage.getItem('sd_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for generic error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear invalid token if unauthenticated
      localStorage.removeItem('sd_token');
      sessionStorage.removeItem('sd_token');
      localStorage.removeItem('sd_user');
      sessionStorage.removeItem('sd_user');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
