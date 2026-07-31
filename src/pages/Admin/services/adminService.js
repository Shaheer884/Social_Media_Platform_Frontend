import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const adminApi = axios.create({
  baseURL: `${API_BASE}/admin`
});

// Attach admin token dynamically
adminApi.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('adminToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Format responses & intercept 401/403 for admin paths
adminApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear admin session
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('adminUser');
      
      const path = window.location.pathname;
      if (path !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    const message = error.response?.data?.error || error.message || 'Admin API failed';
    return Promise.reject(new Error(message));
  }
);

const adminService = {
  login: async (emailOrUsername, password) => {
    const res = await axios.post(`${API_BASE}/admin/login`, { emailOrUsername, password });
    if (res.data.success) {
      sessionStorage.setItem('adminToken', res.data.data.token);
      sessionStorage.setItem('adminUser', JSON.stringify(res.data.data));
    }
    return res.data;
  },

  logout: () => {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUser');
  },

  getStats: () => adminApi.get('/stats'),
  
  getUsers: (page = 1, search = '', filter = '') => 
    adminApi.get(`/users?page=${page}&search=${encodeURIComponent(search)}&filter=${filter}`),
  
  suspendUser: (id, isSuspended) => adminApi.put(`/users/${id}/suspend`, { isSuspended }),
  softDeleteUser: (id) => adminApi.delete(`/users/${id}`),
  restoreUser: (id) => adminApi.post(`/users/${id}/restore`),
  permanentDeleteUser: (id) => adminApi.delete(`/users/${id}/permanent`),
  
  getPosts: (page = 1, search = '', filterHidden = '') => 
    adminApi.get(`/posts?page=${page}&search=${encodeURIComponent(search)}&filterHidden=${filterHidden}`),
  
  hidePost: (id, isHidden) => adminApi.put(`/posts/${id}/hide`, { isHidden }),
  softDeletePost: (id) => adminApi.delete(`/posts/${id}`),
  restorePost: (id) => adminApi.post(`/posts/${id}/restore`),
  permanentDeletePost: (id) => adminApi.delete(`/posts/${id}/permanent`),
  
  getComments: (page = 1, search = '', filterHidden = '') => 
    adminApi.get(`/comments?page=${page}&search=${encodeURIComponent(search)}&filterHidden=${filterHidden}`),
  
  hideComment: (id, isHidden) => adminApi.put(`/comments/${id}/hide`, { isHidden }),
  softDeleteComment: (id) => adminApi.delete(`/comments/${id}`),
  restoreComment: (id) => adminApi.post(`/comments/${id}/restore`),
  permanentDeleteComment: (id) => adminApi.delete(`/comments/${id}/permanent`),
  
  getReports: (page = 1, status = '', reason = '') => 
    adminApi.get(`/reports?page=${page}&status=${status}&reason=${reason}`),
  
  updateReportStatus: (id, status) => adminApi.put(`/reports/${id}/status`, { status }),
  
  broadcastAnnouncement: (title, message, type) => 
    adminApi.post('/broadcast', { title, message, type }),
  
  getActivityLogs: (page = 1) => adminApi.get(`/activity-logs?page=${page}`),
  getRecycleBin: () => adminApi.get('/recycle-bin'),
  
  getSettings: () => adminApi.get('/settings'),
  updateSettings: (settings) => adminApi.put('/settings', settings),
  
  getPublicSettings: async () => {
    const res = await axios.get(`${API_BASE}/admin/settings/public`);
    return res.data;
  },
  
  getTrending: () => adminApi.get('/trending')
};

export default adminService;
