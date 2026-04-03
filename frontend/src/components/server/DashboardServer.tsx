/**
 * @fileoverview Server-side Dashboard component
 * @description Data fetching component that runs on the server/build context
 *              Componente de Dashboard que fetch data en el servidor/build
 * @module components/server/DashboardServer
 */

import { dashboardService } from '../../services/api';
import type { DashboardData } from '../../types';

/**
 * Server component for fetching dashboard data
 * In a React SPA context, this runs during initial load/prerender
 *
 * @returns Promise resolving to dashboard data
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  return dashboardService.getDashboard();
}

/**
 * Prefetch dashboard data for streaming
 * @returns Promise for dashboard data
 */
export function prefetchDashboardData(): Promise<DashboardData> {
  return dashboardService.getDashboard();
}

/**
 * Server-side render of dashboard stats
 * Can be used for SEO or initial HTML generation
 *
 * @param data - Dashboard data to render
 * @returns HTML string representation
 */
export function renderDashboardStats(data: DashboardData): string {
  const stats = data.stats;
  return JSON.stringify({
    totalReferrals: stats.totalReferrals,
    totalEarnings: stats.totalEarnings,
    leftCount: stats.leftCount,
    rightCount: stats.rightCount,
  });
}

/**
 * Get dashboard data for preloading
 * Used with preloadData utility
 */
export function getDashboardLoader() {
  return () => dashboardService.getDashboard();
}
