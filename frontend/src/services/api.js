function apiBase() {
  const v = import.meta.env.VITE_API_URL;
  if (v && String(v).trim()) {
    return String(v).replace(/\/$/, '');
  }
  return '/api';
}

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch(path, { method = 'GET', token, body, headers = {} } = {}) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url =
    normalized.startsWith('/api/')
      ? normalized
      : `${apiBase()}${normalized}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token),
      ...headers,
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text || 'Invalid response' };
  }
  if (!res.ok) {
    const err = new Error(data?.error || res.statusText || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export { apiBase };
