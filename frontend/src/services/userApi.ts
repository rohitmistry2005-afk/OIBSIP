/**
 * User API Service
 * Centralizes user identity and profile operations.
 */

import { getCurrentUser, getStoredUser, setStoredUser, User } from './authApi';
import { ApiResponse } from './api';

export type { User };

export async function getUserProfile(): Promise<ApiResponse<{ user: User }>> {
  return getCurrentUser();
}

export { getStoredUser, setStoredUser };
