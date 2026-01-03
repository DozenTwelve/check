const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    return { raw: text };
  }
}

export async function apiFetch(path, options = {}) {
  const { method = 'GET', body, userId, token, headers: extraHeaders } = options;
  const headers = {
    'Content-Type': 'application/json',
    ...(extraHeaders || {})
  };

  const authToken = token || localStorage.getItem('ledger_token');
  if (!headers.Authorization && authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    const error = new Error('request_failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export { API_BASE };
