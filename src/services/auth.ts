import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export interface ResetPasswordResult {
  success: boolean;
  error?: string;
}

/**
 * Sends a password reset email using the configured Supabase client.
 * If credentials are not configured, returns a clear configuration error
 * without simulating fake success.
 */
export async function requestPasswordReset(email: string): Promise<ResetPasswordResult> {
  const cleanEmail = email.trim();

  // Basic email validation check before network call
  if (!cleanEmail) {
    return { success: false, error: 'Please enter your email address.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address (e.g. you@example.com).' };
  }

  if (!supabase) {
    // Artificial small delay so user can perceive loading state before error
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      success: false,
      error: 'Authentication service is not configured. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment to send password reset links.',
    };
  }

  try {
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred while processing your request.';
    return { success: false, error: message };
  }
}

/**
 * Updates the authenticated user's password using the active recovery session.
 * Does not fake success if unconfigured or if Supabase returns an error.
 */
export async function updateUserPassword(newPassword: string): Promise<ResetPasswordResult> {
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long.' };
  }

  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      success: false,
      error: 'Authentication service is not configured. Please configure the required environment variables before resetting your password.',
    };
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred while updating your password.';
    return { success: false, error: message };
  }
}

/**
 * Checks whether an active Supabase session or recovery context is present.
 */
export async function checkRecoverySession(): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return true;

    // Check if recovery tokens are present in window.location (hash or search)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      if (
        hash.includes('type=recovery') ||
        hash.includes('access_token=') ||
        search.includes('code=')
      ) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}
