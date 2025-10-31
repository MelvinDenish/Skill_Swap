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

export const chatAPI = {
  start: (otherId: string) => api.post(`/chat/start/${otherId}`),
  conversations: () => api.get('/chat/conversations'),
  messages: (conversationId: string, page = 0, size = 20) => api.get(`/chat/${conversationId}/messages`, { params: { page, size } }),
  send: (conversationId: string, text: string) => api.post(`/chat/${conversationId}/send`, { text }),
  markRead: (conversationId: string) => api.put(`/chat/${conversationId}/read`),
  unread: (conversationId: string) => api.get(`/chat/${conversationId}/unread`),
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
  joinInfo: (id: string) => api.get(`/sessions/${id}/join-info`),
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
  },
  download: (id: string) => api.get(`/resources/${id}/download`, { responseType: 'blob' })
};

export const aiAPI = {
  ask: (question: string, skill?: string) => api.post('/ai/ask', { question, skill }),
  history: (page = 0, size = 20) => api.get(`/ai/history`, { params: { page, size } }),
  clearHistory: () => api.delete('/ai/history'),
};

export const calendarAPI = {
  myMappings: () => api.get('/calendar/mappings'),
  bySession: (sessionId: string) => api.get(`/calendar/session/${sessionId}`),
};

export const groupsAPI = {
  list: (skill?: string, page = 0, size = 20) => api.get('/groups', { params: { skill, page, size } }),
  create: (data: { name: string; description?: string; relatedSkill?: string; maxMembers?: number; isPrivate?: boolean; }) =>
    api.post('/groups', data),
  get: (id: string) => api.get(`/groups/${id}`),
  join: (id: string) => api.post(`/groups/${id}/join`),
  leave: (id: string) => api.post(`/groups/${id}/leave`),
  recentMessages: (id: string) => api.get(`/groups/${id}/messages`),
  sendMessage: (id: string, text: string) => api.post(`/groups/${id}/messages`, { text }),
  members: (id: string) => api.get(`/groups/${id}/members`),
  resources: (id: string) => api.get(`/groups/${id}/resources`),
  shareResource: (id: string, resourceId: string) => api.post(`/groups/${id}/resources/share`, { resourceId }),
  sessions: (id: string) => api.get(`/groups/${id}/sessions`),
  scheduleSession: (id: string, scheduledTime: string, duration?: number) => api.post(`/groups/${id}/sessions`, { scheduledTime, duration }),
};

export const examAPI = {
  questions: (skill: string, difficulty?: string, count = 10) =>
    api.get('/exams/questions', { params: { skill, difficulty, count } }),
  submit: (payload: { skill: string; difficulty?: string; items: { questionId: string; answer: string; timeSpent?: number; }[] }) =>
    api.post('/exams/submit', payload),
  leaderboard: (skill?: string) => api.get('/exams/leaderboard', { params: { skill } }),
  attempts: (page = 0, size = 20) => api.get('/exams/attempts', { params: { page, size } }),
  daily: () => api.get('/exams/daily-challenge'),
  scheduleMock: (otherUserId: string, skillTopic: string, interviewType: string, scheduledTime: string) =>
    api.post('/exams/mock/schedule', { otherUserId, skillTopic, interviewType, scheduledTime }),
  feedback: (id: string, feedback: string) => api.post(`/exams/mock/${id}/feedback`, { feedback }),
};

export default api;

