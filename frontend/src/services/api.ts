import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env?.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
});

api.defaults.withCredentials = true;

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  let { token } = useAuthStore.getState();
  if (!token) {
    try {
      const raw = localStorage.getItem('auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        token = parsed?.state?.token ?? null;
      }
      if (!token) {
        const legacy = localStorage.getItem('token');
        if (legacy) token = legacy;
      }
    } catch {}
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    if (error?.response?.status === 401) {
      try { await useAuthStore.getState().logout(); } catch {}
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  logout: () => api.post('/auth/logout'),
  verify: () => api.get('/auth/verify'),
};

export const userAPI = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: any) => api.put('/users/me', data),
  getUser: (id: string) => api.get(`/users/${id}`),
};

export const matchAPI = {
  getMatches: () => api.get('/match'),
};

export const sessionAPI = {
  getMySessions: () => api.get('/sessions/my-sessions'),
  createSession: (data: any) => api.post('/sessions', data),
  updateStatus: (id: string, status: string) => 
    api.put(`/sessions/${id}/status`, { status }),
};

export const reviewAPI = {
  submitReview: (data: any) => api.post('/reviews', data),
  getUserReviews: (userId: string) => api.get(`/reviews/user/${userId}`),
};

export const leaderboardAPI = {
  getTop: () => api.get('/leaderboard'),
};

export const notificationAPI = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  remove: (id: string) => api.delete(`/notifications/${id}`),
};

export default api;

