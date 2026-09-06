const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4051/api';
const REQUEST_TIMEOUT_MS = 20_000;

function friendlyNetworkError(error: unknown): Error {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new Error('The server took too long to respond. Please try again.');
  }
  if (error instanceof TypeError) {
    return new Error('Unable to reach the server. Check your connection and try again.');
  }
  return error instanceof Error ? error : new Error('Request failed. Please try again.');
}

class ApiClient {
  private readonly pendingGets = new Map<string, Promise<unknown>>();

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('machineiq_token');
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        cache: 'no-store',
        signal: options.signal ?? controller.signal,
      });
    } catch (error) {
      throw friendlyNetworkError(error);
    } finally {
      clearTimeout(timeout);
    }

    if (res.status === 401) {
      // A rejected login is a form error, not an expired session. Redirect
      // only when the request actually carried an authentication token.
      if (token && typeof window !== 'undefined') {
        localStorage.removeItem('machineiq_token');
        localStorage.removeItem('machineiq_user');
        window.location.href = '/login';
      }
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Request failed' }));
      const message = Array.isArray(error.message) ? error.message.join('. ') : error.message;
      const isGenericServerError = res.status >= 500 && (!message || message === 'Internal server error');
      throw new Error(isGenericServerError
        ? 'The server could not complete this request. Please try again.'
        : (message || `Request failed (${res.status})`));
    }

    if (res.status === 204) return null as T;

    const body = await res.text();
    return body ? JSON.parse(body) as T : null as T;
  }

  get<T>(path: string): Promise<T> {
    // Reuse only simultaneous identical reads. This removes duplicate network
    // work from React development checks and shared widgets without caching
    // completed data or hiding updates after a mutation.
    const existing = this.pendingGets.get(path) as Promise<T> | undefined;
    if (existing) return existing;
    const request = this.request<T>(path).finally(() => this.pendingGets.delete(path));
    this.pendingGets.set(path, request);
    return request;
  }

  post<T>(path: string, body: any): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }

  patch<T>(path: string, body: any): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
  }

  put<T>(path: string, body: any): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  postForm<T>(path: string, formData: FormData): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4051/api'}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    }).catch((error) => {
      throw friendlyNetworkError(error);
    }).then(async (res) => {
      if (res.status === 401) {
        if (token) {
          localStorage.removeItem('machineiq_token');
          localStorage.removeItem('machineiq_user');
          window.location.href = '/login';
        }
      }
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Request failed' }));
        const message = Array.isArray(error.message) ? error.message.join('. ') : error.message;
        throw new Error(res.status >= 500 && (!message || message === 'Internal server error')
          ? 'The server could not complete this upload. Please try again.'
          : (message || `Request failed (${res.status})`));
      }
      return res.json() as Promise<T>;
    });
  }
}

export const api = new ApiClient();
