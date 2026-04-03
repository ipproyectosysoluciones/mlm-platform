/**
 * @fileoverview Server-side data fetching utilities
 * @description Utilities for server-side data fetching that can run in build/prerender context
 *              Utilidades para fetching de datos del lado del servidor
 * @module lib/server-fetcher
 */

import type { DashboardData, TreeNode, User } from '../types';

/**
 * Base URL for API requests - uses environment variable or default localhost
 */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Server-side data fetching (runs in build/prerender context)
 * @template T - Type of data to fetch
 * @param endpoint - API endpoint path
 * @param options - Optional fetch options
 * @returns Promise resolving to the fetched data
 */
export async function serverFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    // Add server-only headers if needed
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Server fetch failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch dashboard data on the server
 * @returns Promise resolving to dashboard data
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  return serverFetch<DashboardData>('/dashboard');
}

/**
 * Fetch user tree data on the server
 * @param userId - User ID to fetch tree for
 * @param maxDepth - Optional maximum depth
 * @returns Promise resolving to tree node
 */
export async function fetchTreeData(userId: string, maxDepth?: number): Promise<TreeNode> {
  const params = new URLSearchParams();
  if (maxDepth) params.append('depth', maxDepth.toString());
  const queryString = params.toString();
  return serverFetch<TreeNode>(`/users/${userId}/tree${queryString ? `?${queryString}` : ''}`);
}

/**
 * Fetch user profile data on the server
 * @param userId - User ID to fetch profile for
 * @returns Promise resolving to user data
 */
export async function fetchUserProfile(userId: string): Promise<User> {
  return serverFetch<User>(`/users/${userId}/details`);
}

/**
 * Fetch current user data on the server
 * @returns Promise resolving to current user data
 */
export async function fetchCurrentUser(): Promise<User> {
  return serverFetch<User>('/auth/me');
}
