/**
 * @fileoverview Server-side Profile component
 * @description Data fetching component for user profile
 *              Componente de perfil que fetch data en el servidor/build
 * @module components/server/ProfileServer
 */

import { authService, userService } from '../../services/api';
import type { User, UserDetails } from '../../types';

/**
 * Server component for fetching current user profile
 * @returns Promise resolving to user data
 */
export async function fetchCurrentUserProfile(): Promise<User> {
  const response = await authService.getProfile();
  return response.data as User;
}

/**
 * Fetch user details by ID
 * @param userId - User ID to fetch details for
 * @returns Promise resolving to user details
 */
export async function fetchUserDetails(userId: string): Promise<UserDetails> {
  return userService.getUserDetails(userId);
}

/**
 * Prefetch current user profile for streaming
 * @returns Promise for user data
 */
export function prefetchCurrentUserProfile(): Promise<User> {
  return authService.getProfile() as Promise<User>;
}

/**
 * Prefetch user details for streaming
 * @param userId - User ID to fetch details for
 * @returns Promise for user details
 */
export function prefetchUserDetails(userId: string): Promise<UserDetails> {
  return userService.getUserDetails(userId);
}

/**
 * Get profile update function
 * @returns Function to update profile
 */
export function getProfileUpdater() {
  return {
    updateProfile: (data: { firstName?: string; lastName?: string; phone?: string }) =>
      authService.updateProfile(data),
  };
}
