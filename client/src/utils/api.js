import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({ baseURL: '/api', timeout: 15000 });

// Attach JWT to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && err.response?.data?.code === 'TOKEN_EXPIRED') {
      localStorage.removeItem('sf_token');
      localStorage.removeItem('sf_user');
      window.location.href = '/login?expired=1';
    }
    return Promise.reject(err);
  }
);

// ── AUTH ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data)        => api.post('/auth/register'.replace('/api',''), data, { baseURL: '/' }),
  login:    (data)        => api.post('/auth/login'.replace('/api',''), data, { baseURL: '/' }),
  me:       ()            => api.get('/auth/me'.replace('/api',''), { baseURL: '/' }),
  updateMe: (data)        => api.put('/auth/me'.replace('/api',''), data, { baseURL: '/' }),
  changePassword: (data)  => api.put('/auth/me/password'.replace('/api',''), data, { baseURL: '/' }),
};

// Fix: auth routes are at /auth not /api/auth
const authAxios = axios.create({ baseURL: '/', timeout: 15000 });
authAxios.interceptors.request.use(config => {
  const token = localStorage.getItem('sf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const auth = {
  register:       data => authAxios.post('/auth/register', data),
  login:          data => authAxios.post('/auth/login', data),
  me:             ()   => authAxios.get('/auth/me'),
  updateMe:       data => authAxios.put('/auth/me', data),
  changePassword: data => authAxios.put('/auth/me/password', data),
};

// ── PROJECTS ─────────────────────────────────────────────────────────────────
export const projects = {
  list:      ()              => api.get('/projects'),
  get:       id              => api.get(`/projects/${id}`),
  create:    data            => api.post('/projects', data),
  save:      (id, data)      => api.put(`/projects/${id}/save`, data),
  patch:     (id, data)      => api.patch(`/projects/${id}`, data),
  duplicate: id              => api.post(`/projects/${id}/duplicate`),
  delete:    id              => api.delete(`/projects/${id}`),
  star:      id              => api.post(`/projects/${id}/star`),
};

// ── GALLERY ──────────────────────────────────────────────────────────────────
export const gallery = {
  list: params => api.get('/gallery', { params }),
};

// ── EXPORTS ──────────────────────────────────────────────────────────────────
export const exportProject = async (id, name) => {
  const token = localStorage.getItem('sf_token');
  const res = await fetch(`/api/export/${id}/export`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${name.replace(/[^a-z0-9]/gi,'_')}-loading-screen.zip`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── UPLOADS ──────────────────────────────────────────────────────────────────
export const uploads = {
  upload: (projectId, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/uploads/${projectId}`, form);
  },
  list:   projectId => api.get(`/uploads/${projectId}`),
  delete: (projectId, assetId) => api.delete(`/uploads/${projectId}/${assetId}`),
};

export default api;
