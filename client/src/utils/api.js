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
  const { method = 'GET', body, userId } = options;
  const headers = {
    'Content-Type': 'application/json'
  };

  if (userId) {
    headers['x-user-id'] = String(userId);
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
