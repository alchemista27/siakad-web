import axios from 'axios';

const api = axios.create({
  // Gunakan import.meta.env untuk Vite. Pastikan ada file .env dengan VITE_API_URL
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', 
});

// Gunakan interceptor untuk menambahkan token ke setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;