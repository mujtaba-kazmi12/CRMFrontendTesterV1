// Use only the environment variable for API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

console.log('API_BASE being used:', API_BASE);

export const api = {
  get: async (url: string, token?: string) => {
    try {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }
    return res.json();
    } catch (error) {
      console.error(`API Error for ${url}:`, error);
      throw error;
    }
  },
  post: async (url: string, data: any, token?: string) => {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  put: async (url: string, data: any, token?: string) => {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  delete: async (url: string, token?: string) => {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  upload: async (url: string, file: File, token?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
}; 