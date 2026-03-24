import axios from 'axios';

// Determine API base URL based on environment
let API_BASE_URL;

if (import.meta.env.VITE_API_BASE_URL) {
    // Use environment variable if available
    API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
} else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Production environment (Vercel or any non-localhost domain)
    API_BASE_URL = 'https://server-two-sable-33.vercel.app';
} else {
    // Local development
    API_BASE_URL = 'http://localhost:5000';
}

console.log('API_BASE_URL:', API_BASE_URL);

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: { 'Content-Type': 'application/json' }
});

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Response interceptor: handle 401 (expired token)
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

export default api;
