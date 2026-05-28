const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('diptype_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Ошибка запроса') as Error & { data?: unknown; status?: number };
    err.data = data;
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro';
  planExpires: number | null;
  freeUsed: number;
  freeLimit: number;
  freeRemaining: number;
  isPro: boolean;
}

export interface GenFile {
  path: string;
  content: string;
}

export const api = {
  register: (email: string, password: string, name?: string) =>
    request<{ token: string; user: PublicUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: PublicUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<{ user: PublicUser }>('/auth/me'),

  generate: (form: FormData) =>
    request<{ id: string; kind: string; title: string; files: GenFile[]; demo: boolean; user: PublicUser }>(
      '/generate',
      { method: 'POST', body: form }
    ),

  generations: () =>
    request<{ generations: { id: string; kind: string; title: string; created_at: number }[] }>('/generations'),

  plans: () =>
    request<{ plans: Record<string, { amount: number; currency: string; days: number; label: string }>; demo: boolean }>(
      '/payments/plans'
    ),

  checkout: (plan: string) =>
    request<{ demo: boolean; message?: string; confirmationUrl?: string; user?: PublicUser; planExpires?: number }>(
      '/payments/checkout',
      { method: 'POST', body: JSON.stringify({ plan }) }
    ),

  pushToGithub: (id: string, repo: string, branch: string, token?: string) =>
    request<{ pushed: { path: string; url: string }[] }>(`/generations/${id}/push`, {
      method: 'POST',
      body: JSON.stringify({ repo, branch, token }),
    }),
};

export { getToken };
