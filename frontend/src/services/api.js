import axios from 'axios';

// In production (Vercel), VITE_API_URL points to the Railway backend.
// In development, Vite proxies /api → localhost:5000.
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({ baseURL });

// Module-level token — stored in memory only (not localStorage per spec)
let _token = null;

export function setToken(token) {
  _token = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

const get  = (url, params) => api.get(url, { params }).then(r => r.data);
const post = (url, data)   => api.post(url, data).then(r => r.data);
const put  = (url, data)   => api.put(url, data).then(r => r.data);
const del  = (url)         => api.delete(url).then(r => r.data);

export default { get, post, put, del };
