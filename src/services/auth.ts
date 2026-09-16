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
