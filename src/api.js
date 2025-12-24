import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Pasang inteceptor untuk menambahkan token otentikasi ke setiap permintaan
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;