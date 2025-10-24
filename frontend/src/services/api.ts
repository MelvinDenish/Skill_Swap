import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env?.VITE_API_BASE_URL ?? '/api',
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
  login: (email: string, password: string, totpCode?: string) => 
    api.post('/auth/login', totpCode ? { email, password, totpCode } : { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  logout: () => api.post('/auth/logout'),
  verify: () => api.get('/auth/verify'),
  providers: () => api.get<string[]>('/auth/providers'),
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

export const twoFAAPI = {
  setup: () => api.get('/2fa/setup'),
  enable: (secret: string, code: string) => api.post('/2fa/enable', { secret, code }),
  disable: (code: string) => api.post('/2fa/disable', { code }),
};

export const resourceAPI = {
  listAll: () => api.get('/resources'),
  my: () => api.get('/resources/my'),
  upload: (file: File, sessionId?: string, skillName?: string) => {
    const fd = new FormData();
    fd.append('file', file);
    if (sessionId) fd.append('sessionId', sessionId);
    if (skillName) fd.append('skillName', skillName);
    return api.post('/resources/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  link: (data: { title: string; url: string; description?: string; sessionId?: string; skillName?: string; }) =>
    api.post('/resources/link', data),
  bySession: (sessionId: string) => api.get(`/resources/session/${sessionId}`),
  bySkill: (skill: string) => api.get(`/resources/skill/${encodeURIComponent(skill)}`),
  remove: (id: string) => api.delete(`/resources/${id}`),
  downloadUrl: (id: string) => {
    const base = (import.meta.env?.VITE_API_BASE_URL ?? '/api') as string;
    return `${base}/resources/${id}/download`;
  }
};

export const calendarAPI = {
  myMappings: () => api.get('/calendar/mappings'),
  bySession: (sessionId: string) => api.get(`/calendar/session/${sessionId}`),
};

export default api;

