/**
 * Admin Authentication Service
 * 
 * Separate from customer authentication.
 * Configuration-driven: inspects environment variables for real admin endpoint.
 * Never fakes authentication, never hardcodes credentials, never issues fake JWTs.
 */

const adminAuthEndpoint =
  import.meta.env.VITE_ADMIN_AUTH_ENDPOINT ||
  import.meta.env.VITE_ADMIN_API_URL ||
  '';

export interface AdminAuthResult {
  success: boolean;
  error?: string;
}

/**
 * Checks whether a real admin authentication endpoint or provider is configured.
 * Returns true only when the required real configuration exists in the environment.
 */
export function isAdminAuthConfigured(): boolean {
  return Boolean(adminAuthEndpoint && adminAuthEndpoint.trim().length > 0);
}

/**
 * Validates and submits administrator credentials to the configured admin endpoint.
 * If unconfigured, returns an honest configuration error without faking success.
 */
export async function loginAdmin(
  email: string,
  password: string
): Promise<AdminAuthResult> {
  const cleanEmail = email.trim();
  const cleanPassword = password;

  // Validation
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

  // Configuration check
  if (!isAdminAuthConfigured()) {
    // Artificial small delay so the user perceives the submission lifecycle
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      success: false,
      error:
        'Admin authentication service is not configured. Please configure VITE_ADMIN_AUTH_ENDPOINT in your environment to enable administrator login.',
    };
  }

  // Real backend integration flow
  try {
    const response = await fetch(adminAuthEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: cleanEmail,
        password: cleanPassword,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          data.message ||
          `Authentication failed with status ${response.status}. Please verify your credentials.`,
      };
    }

    return { success: true };
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
