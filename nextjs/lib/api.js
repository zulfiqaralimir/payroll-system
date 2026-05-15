const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ws_token');
};

const request = async (method, url, data) => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api${url}`, {
    method,
    headers,
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });
  return res.json();
};

const postForm = async (url, formData) => {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`/api${url}`, { method: 'POST', headers, body: formData });
  return res.json();
};

const api = {
  get:      (url, params) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request('GET', url + qs);
  },
  post:     (url, data) => request('POST', url, data),
  postForm: (url, form) => postForm(url, form),
  put:      (url, data) => request('PUT', url, data),
  del:      (url)       => request('DELETE', url),
  delete:   (url)       => request('DELETE', url),
};

export default api;
