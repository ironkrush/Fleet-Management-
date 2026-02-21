import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

// Dashboard API
export const dashboardAPI = {
  getKPIs: () => api.get('/dashboard/kpis'),
  getAnalytics: () => api.get('/dashboard/analytics'),
};

// Vehicles API
export const vehiclesAPI = {
  getAll: (params) => api.get('/vehicles', { params }),
  getAvailable: () => api.get('/vehicles/available'),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
  getStats: (id) => api.get(`/vehicles/${id}/stats`),
};

// Drivers API
export const driversAPI = {
  getAll: (params) => api.get('/drivers', { params }),
  getAvailable: () => api.get('/drivers/available'),
  getById: (id) => api.get(`/drivers/${id}`),
  create: (data) => api.post('/drivers', data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  delete: (id) => api.delete(`/drivers/${id}`),
  getPerformance: (id) => api.get(`/drivers/${id}/performance`),
};

// Trips API
export const tripsAPI = {
  getAll: (params) => api.get('/trips', { params }),
  getById: (id) => api.get(`/trips/${id}`),
  create: (data) => api.post('/trips', data),
  updateStatus: (id, data) => api.put(`/trips/${id}/status`, data),
};

// Maintenance API
export const maintenanceAPI = {
  getAll: (params) => api.get('/maintenance', { params }),
  getById: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post('/maintenance', data),
  updateStatus: (id, data) => api.put(`/maintenance/${id}/status`, data),
  delete: (id) => api.delete(`/maintenance/${id}`),
};

// Fuel API
export const fuelAPI = {
  getAll: (params) => api.get('/fuel', { params }),
  create: (data) => api.post('/fuel', data),
  delete: (id) => api.delete(`/fuel/${id}`),
};

export default api;

