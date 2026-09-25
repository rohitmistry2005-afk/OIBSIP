/**
 * Authentication Service
 * Express/JWT backed authentication operations.
 * Completely replaces Supabase with the real MERN backend API.
 */

import {
  forgotPassword,
  resetPassword,
  verifyEmail as apiVerifyEmail,
  resendVerificationEmail as apiResendVerificationEmail,
  isAuthenticated,
  getCurrentUser,
  getStoredUser,
  setStoredUser,
  logoutUser,
  verifyEmailOtp,
  resendEmailOtp,
  User,
} from './authApi';

export const isAuthConfigured = true;

export interface ResetPasswordResult {
  success: boolean;
  error?: string;
  message?: string;
  status?: number;
  retryAfter?: number;
  code?: string;
}

export function sanitizeErrorMessage(rawMessage: unknown, fallback = 'Unable to process the request. Please try again.'): string {
  if (typeof rawMessage !== 'string' || !rawMessage.trim()) {
    return fallback;
  }
  const clean = rawMessage.trim();
  if (
    clean.includes('MongooseError') ||
    clean.includes('MongoError') ||
    clean.includes('buffering timed out') ||
    clean.includes('ECONNREFUSED') ||
    clean.includes('ETIMEDOUT') ||
    clean.includes('at Timeout.') ||
    clean.startsWith('{') ||
    clean.includes('[object') ||
    clean.includes('SyntaxError')
  ) {
    return fallback;
  }
  return clean;
}

/**
 * Sends a password reset email using the Express/JWT backend.
 * POST /api/auth/forgot-password
 */
export async function requestPasswordReset(email: string): Promise<ResetPasswordResult> {
  const cleanEmail = typeof email === 'string' ? email.trim() : '';

  if (!cleanEmail) {
    return { success: false, error: 'Email address is required.' };
  }

  const normalizedEmail = cleanEmail.toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  try {
    const res = await forgotPassword(normalizedEmail);
    if (!res.success) {
      if (res.status === 429) {
        return {
          success: false,
          status: 429,
          retryAfter: res.retryAfter,
          error: res.error || res.message || 'Too many attempts. Please wait a moment before trying again.',
        };
      }
      return {
        success: false,
        status: res.status,
        error: sanitizeErrorMessage(res.error || res.message, 'Failed to send password reset request'),
      };
    }
    return { success: true, message: res.data?.message || res.message, status: res.status };
  } catch (err: unknown) {
    const message = err instanceof Error ? sanitizeErrorMessage(err.message) : 'An unexpected error occurred while processing your request.';
    return { success: false, error: message, status: 0 };
  }
}

/**
 * Resets user password using the reset token sent via email.
 * POST /api/auth/reset-password/:token
 */
export async function updateUserPassword(
  newPassword: string,
  token?: string,
  confirmPassword?: string,
  email?: string
): Promise<ResetPasswordResult> {
  if (!newPassword) {
    return { success: false, error: 'Password is required.' };
  }
  if (newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long.' };
  }
  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    return { success: false, error: 'Passwords do not match.' };
  }

  // Extract token and email from parameter or window URL
  let resetToken = token?.trim();
  let queryEmail = email?.trim();
  if (typeof window !== 'undefined') {
    if (!resetToken) {
      const pathParts = window.location.pathname.split('/');
      const tokenIdx = pathParts.indexOf('reset-password');
      if (tokenIdx !== -1 && pathParts[tokenIdx + 1]) {
        resetToken = pathParts[tokenIdx + 1];
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        resetToken = urlParams.get('token') || '';
      }
    }
    if (!queryEmail) {
      const urlParams = new URLSearchParams(window.location.search);
      queryEmail = urlParams.get('email') || '';
    }
  }

  if (!resetToken) {
    return {
      success: false,
      code: 'MISSING_TOKEN',
      error: 'Password reset link is incomplete.',
    };
  }

  try {
    const res = await resetPassword(resetToken, newPassword, confirmPassword, queryEmail);
    if (!res.success) {
      if (res.status === 429) {
        return {
          success: false,
          status: 429,
          error: res.error || res.message || 'Too many attempts. Please wait a moment before trying again.',
        };
      }
      return {
        success: false,
        code: res.code,
        status: res.status,
        error: sanitizeErrorMessage(res.error || res.message, 'Password reset failed. The link may have expired.'),
      };
    }
    return { success: true, message: res.data?.message || res.message, status: res.status };
  } catch (err: unknown) {
    const message = err instanceof Error ? sanitizeErrorMessage(err.message) : 'An unexpected error occurred while updating your password.';
    return { success: false, error: message, status: 0 };
  }
}

/**
 * Verifies email using verification token.
 * GET /api/auth/verify-email/:token
 */
export async function verifyUserEmail(token: string, email?: string): Promise<ResetPasswordResult> {
  const cleanToken = token?.trim() || '';
  if (!cleanToken) {
    return {
      success: false,
      code: 'MISSING_TOKEN',
      error: 'Verification link is missing or incomplete.',
    };
  }

  try {
    const res = await apiVerifyEmail(cleanToken, email);
    if (!res.success) {
      const sanitized = sanitizeErrorMessage(res.error || res.message, "We couldn't verify your email right now. Please try again.");
      return {
        success: false,
        code: res.code,
        status: res.status,
        error: sanitized,
      };
    }
    return {
      success: true,
      message: res.data?.message || res.message || 'Email verified successfully.',
      status: res.status,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? sanitizeErrorMessage(err.message) : "We couldn't verify your email right now. Please try again.";
    return { success: false, error: message, status: 0 };
  }
}

/**
 * Requests a new verification email for an unverified account.
 * POST /api/auth/resend-verification
 */
export async function resendUserVerificationEmail(email: string): Promise<ResetPasswordResult> {
  const cleanEmail = typeof email === 'string' ? email.trim() : '';
  if (!cleanEmail) {
    return { success: false, error: 'Email address is required.' };
  }

  const normalizedEmail = cleanEmail.toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  try {
    const res = await apiResendVerificationEmail(normalizedEmail);
    if (!res.success) {
      if (res.status === 429) {
        return {
          success: false,
          status: 429,
          retryAfter: res.retryAfter,
          error: res.error || 'Too many attempts. Please wait before requesting another verification email.',
        };
      }
      const sanitized = sanitizeErrorMessage(res.error || res.message);
      return {
        success: false,
        status: res.status,
        error: sanitized,
      };
    }
    return {
      success: true,
      message: res.data?.message || res.message || 'If an unverified account exists for this email, a new verification link has been sent.',
      status: res.status,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? sanitizeErrorMessage(err.message) : 'Unable to process the request. Please try again.';
    return { success: false, error: message, status: 0 };
  }
}

/**
 * Checks whether an active user session exists.
 */
export async function checkAuthSession(): Promise<boolean> {
  if (!isAuthenticated()) return false;
  try {
    const res = await getCurrentUser();
    return res.success;
  } catch {
    return false;
  }
}

/**
 * Updates user profile locally.
 * (Note: The current backend does not expose a PUT/PATCH /api/auth/profile endpoint;
 * this persists to local session and is reported as a non-blocking remaining task per prompt instructions).
 */
export async function updateUserProfile(fullName: string): Promise<ResetPasswordResult> {
  const current = getStoredUser();
  if (current) {
    const updated: User = { ...current, name: fullName.trim() };
    setStoredUser(updated);
    return { success: true, message: 'Profile name updated for your session.' };
  }
  return {
    success: false,
    error: 'Please sign in to update your profile.',
  };
}

export {
  isAuthenticated,
  getCurrentUser,
  getStoredUser,
  setStoredUser,
  logoutUser,
  verifyEmailOtp,
  resendEmailOtp,
};
