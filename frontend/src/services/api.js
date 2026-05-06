import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

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
