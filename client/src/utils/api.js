import axios from 'axios';
import toast from 'react-hot-toast';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-catalyst-domain.com';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
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

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      toast.error('Access denied. Insufficient permissions.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (credentials) => apiClient.post('/auth_system/login', credentials),
  verifyToken: () => apiClient.get('/auth_system/verify'),
  logout: () => apiClient.post('/auth_system/logout')
};

// Service Requests API
export const serviceRequestsAPI = {
  getAll: (params = {}) => apiClient.get('/service_requests/requests', { params }),
  getById: (id) => apiClient.get(`/service_requests/requests/${id}`),
  create: (data) => apiClient.post('/service_requests/requests', data),
  update: (id, data) => apiClient.put(`/service_requests/requests/${id}`, data),
  delete: (id) => apiClient.delete(`/service_requests/requests/${id}`),
  getStats: () => apiClient.get('/service_requests/stats')
};

export default apiClient;