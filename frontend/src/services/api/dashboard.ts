/**
 * @fileoverview Dashboard service - Dashboard API methods
 * @module services/api/dashboard
 */
import api from './client';
import type { DashboardData } from '../../types';

/**
 * @namespace dashboardService
 * @description Dashboard API methods / Métodos de API del dashboard
 */
export const dashboardService = {
  /**
   * Get dashboard data with stats
   * Obtener datos del dashboard con estadísticas
   * @returns {Promise<DashboardData>} Dashboard data / Datos del dashboard
   */
  getDashboard: async (): Promise<DashboardData> => {
    const response = await api.get<{ success: boolean; data: DashboardData }>('/dashboard');
    return response.data.data!;
  },
};
