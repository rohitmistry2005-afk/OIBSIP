/**
 * Authentication API Service
 * Handles user registration, email verification, login, forgot password, reset password, and session.
 * Connects to Express JWT backend (/api/auth).
 */

import { request, setUserToken, removeUserToken, getUserToken, isTokenExpired, ApiResponse } from './api';

export { isTokenExpired };

export interface User {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  user: User;
}

export interface RegisterResponseData {
  user: User;
  message: string;
  requiresVerification?: boolean;
  verificationMethod?: string;
  email?: string;
}

export interface VerifyOtpResponseData {
  message: string;
  alreadyVerified?: boolean;
  attemptsRemaining?: number;
  code?: string;
}

export interface ResendOtpResponseData {
  message: string;
  code?: string;
  retryAfter?: number;
}

export interface MeResponseData {
  user: User;
}

const USER_DATA_KEY = 'pizzadelight_user_data';

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  try {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    localStorage.setItem('pizza_user_name', user.name);
  } catch {
    // ignore
  }
}

export function removeStoredUser(): void {
  try {
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem('pizza_user_name');
  } catch {
    // ignore
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getUserToken());
}

/**
 * Register a new user account
 * POST /api/auth/register
 */
export async function registerUser(payload: RegisterPayload): Promise<ApiResponse<RegisterResponseData>> {
  return request<RegisterResponseData>('/auth/register', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Verify user email address with token
 * GET /api/auth/verify-email/:token
 */
export async function verifyEmail(token: string, email?: string): Promise<ApiResponse<{ message: string }>> {
  const query = email ? `?email=${encodeURIComponent(email.trim().toLowerCase())}` : '';
  return request<{ message: string }>(`/auth/verify-email/${encodeURIComponent(token)}${query}`, {
    method: 'GET',
  });
}

/**
 * Resend email verification link
 * POST /api/auth/resend-verification
 */
export async function resendVerificationEmail(email: string): Promise<ApiResponse<{ message: string }>> {
  return request<{ message: string }>('/auth/resend-verification', {
    method: 'POST',
    body: { email },
  });
}

/**
 * Verify user email address with 6-digit OTP code
 * POST /api/auth/verify-otp
 */
export async function verifyEmailOtp(
  email: string,
  otp: string
): Promise<ApiResponse<VerifyOtpResponseData>> {
  return request<VerifyOtpResponseData>('/auth/verify-otp', {
    method: 'POST',
    body: { email, otp },
  });
}

/**
 * Resend 6-digit OTP verification code
 * POST /api/auth/resend-otp
 */
export async function resendEmailOtp(
  email: string
): Promise<ApiResponse<ResendOtpResponseData>> {
  return request<ResendOtpResponseData>('/auth/resend-otp', {
    method: 'POST',
    body: { email },
  });
}

/**
 * Log in an existing user
 * POST /api/auth/login
 */
export async function loginUser(payload: LoginPayload): Promise<ApiResponse<LoginResponseData>> {
  const res = await request<LoginResponseData>('/auth/login', {
    method: 'POST',
    body: payload,
  });

  if (res.success && res.data?.token) {
    setUserToken(res.data.token);
    if (res.data.user) {
      setStoredUser(res.data.user);
    }
  }

  return res;
}

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
export async function getCurrentUser(): Promise<ApiResponse<MeResponseData>> {
  const res = await request<MeResponseData>('/auth/me', {
    method: 'GET',
  });

  if (res.success && res.data?.user) {
    setStoredUser(res.data.user);
  }

  return res;
}

/**
 * Request password reset link
 * POST /api/auth/forgot-password
 */
export async function forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
  return request<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

/**
 * Reset password with token
 * POST /api/auth/reset-password/:token
 */
export async function resetPassword(
  token: string,
  password: string,
  confirmPassword?: string,
  email?: string
): Promise<ApiResponse<{ message: string }>> {
  const query = email ? `?email=${encodeURIComponent(email.trim().toLowerCase())}` : '';
  return request<{ message: string }>(`/auth/reset-password/${encodeURIComponent(token)}${query}`, {
    method: 'POST',
    body: { password, confirmPassword, email },
  });
}

/**
 * Log out user by notifying backend and clearing tokens and stored session
 */
export function logoutUser(): void {
  const token = getUserToken();
  if (token) {
    request('/auth/logout', { method: 'POST' }).catch(() => {});
  }
  removeUserToken();
  removeStoredUser();
}
