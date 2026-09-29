/**
 * Centralized API Communication Layer for PizzaDelight
 * Connects React frontend with Express/MongoDB REST API
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const USER_TOKEN_KEY = 'pizzadelight_token';
export const ADMIN_TOKEN_KEY = 'pizzadelight_admin_token';

export interface JwtPayload {
  sub?: string;
  role?: string;
  type?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

export function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return payload.exp * 1000 <= Date.now();
}

export function getUserToken(): string | null {
  try {
    const token = localStorage.getItem(USER_TOKEN_KEY);
    if (!token) return null;
    if (isTokenExpired(token)) {
      removeUserToken();
      return null;
    }
    const payload = parseJwtPayload(token);
    if (!payload || payload.type !== 'user' || payload.role === 'admin') {
      removeUserToken();
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function setUserToken(token: string): void {
  try {
    localStorage.setItem(USER_TOKEN_KEY, token);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { authed: true } }));
    }
  } catch {
    // ignore
  }
}

export function removeUserToken(): void {
  try {
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem('pizzadelight_user_data');
    localStorage.removeItem('pizza_user_name');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { authed: false } }));
    }
  } catch {
    // ignore
  }
}

export function getAdminToken(): string | null {
  try {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return null;
    if (isTokenExpired(token)) {
      removeAdminToken();
      return null;
    }
    const payload = parseJwtPayload(token);
    if (!payload || payload.type !== 'admin' || payload.role !== 'admin') {
      removeAdminToken();
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function removeAdminToken(): void {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem('pizzadelight_admin_data');
  } catch {
    // ignore
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status: number;
  retryAfter?: number;
  code?: string;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  useAdminAuth?: boolean;
}

export async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { body, useAdminAuth = false, headers: customHeaders, ...customOptions } = options;

  const token = useAdminAuth ? getAdminToken() : getUserToken();

  const headers = new Headers(customHeaders || {});
  headers.set('Accept', 'application/json');

  if (body !== undefined && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...customOptions,
      headers,
      body: body !== undefined && !(body instanceof FormData) ? JSON.stringify(body) : (body as BodyInit),
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      // Auto-clear invalid/expired token on 401
      if (response.status === 401) {
        if (useAdminAuth) {
          removeAdminToken();
        } else {
          removeUserToken();
        }
      }

      const retryAfterHeader = response.headers.get('retry-after');
      const retryAfter = retryAfterHeader
        ? parseInt(retryAfterHeader, 10)
        : typeof data?.retryAfter === 'number'
          ? data.retryAfter
          : undefined;

      let errorMessage: string;
      if (response.status === 429) {
        if (typeof data?.message === 'string' && data.message.trim()) {
          errorMessage = data.message.trim();
        } else if (endpoint.includes('verification')) {
          errorMessage = 'Too many attempts. Please wait before requesting another verification email.';
        } else {
          errorMessage = 'Too many attempts. Please wait a moment before trying again.';
        }
      } else if (typeof data?.message === 'string' && data.message.trim()) {
        errorMessage = data.message.trim();
      } else if (typeof data?.error === 'string' && data.error.trim()) {
        errorMessage = data.error.trim();
      } else if (response.status === 404) {
        errorMessage = 'Resource not found';
      } else if (response.status === 403) {
        errorMessage = 'Access forbidden';
      } else if (response.status === 401) {
        errorMessage = 'Authentication required or session expired';
      } else {
        errorMessage = 'Unable to process the request. Please try again.';
      }

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
        status: response.status,
        retryAfter,
        code: data?.code,
        data: data as T,
      };
    }

    return {
      success: true,
      data: data as T,
      message: data?.message,
      status: response.status,
    };
  } catch (err: unknown) {
    const isNetwork = err instanceof TypeError;
    const message = isNetwork
      ? 'Unable to connect to the backend server. Please verify the API server is running.'
      : 'An unexpected network error occurred.';

    return {
      success: false,
      error: message,
      message,
      status: 0,
    };
  }
}
