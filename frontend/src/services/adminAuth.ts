/**
 * Admin Authentication Service
 * Express/JWT backed admin login connecting to POST /api/admin/auth/login
 */

import { loginAdmin as apiLoginAdmin, isAdminAuthenticated, logoutAdmin, getStoredAdmin, AdminUser } from './adminApi';

export interface AdminAuthResult {
  success: boolean;
  error?: string;
  admin?: AdminUser;
}

export function isAdminAuthConfigured(): boolean {
  return true;
}

export { isAdminAuthenticated, logoutAdmin, getStoredAdmin };

/**
 * Validates and submits administrator credentials to the backend endpoint.
 * POST /api/admin/auth/login
 */
export async function loginAdmin(email: string, password: string): Promise<AdminAuthResult> {
  const cleanEmail = email.trim();
  const cleanPassword = password;

  if (!cleanEmail) {
    return {
      success: false,
      error: 'Please enter your administrator email address.',
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return {
      success: false,
      error: 'Please enter a valid administrator email address.',
    };
  }

  if (!cleanPassword) {
    return {
      success: false,
      error: 'Please enter your administrator password.',
    };
  }

  try {
    const res = await apiLoginAdmin({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (!res.success) {
      return {
        success: false,
        error: res.error || 'Authentication failed. Please verify your credentials.',
      };
    }

    return {
      success: true,
      admin: res.data?.admin,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'Network error occurred while connecting to the admin authentication service.';
    return {
      success: false,
      error: message,
    };
  }
}
