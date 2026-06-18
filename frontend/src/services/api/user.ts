/**
 * @fileoverview User service - User API methods (Phase 3)
 * @module services/api/user
 */
import api from './client';
import type { User, UserDetails } from '../../types';

/**
 * @namespace userService
 * @description User API methods (Phase 3) / Métodos de API de usuario
 */
export const userService = {
  /**
   * Search users in current user's network
   * Busca usuarios en la red del usuario actual
   * @param {string} query - Search term (email or referral code) / Término de búsqueda
   * @param {number} [limit] - Results limit / Límite de resultados
   * @returns {Promise<User[]>} Array of matching users / Array de usuarios coincidentes
   */
  searchUsers: async (query: string, limit?: number): Promise<User[]> => {
    const params = new URLSearchParams({ q: query });
    if (limit) params.append('limit', limit.toString());
    const response = await api.get<{ success: boolean; data: User[] }>(
      `/users/search?${params.toString()}`
    );
    return response.data.data || [];
  },

  /**
   * Get detailed information about a user
   * Obtiene información detallada de un usuario
   * @param {string} userId - User ID / ID de usuario
   * @returns {Promise<UserDetails>} User details / Detalles del usuario
   */
  getUserDetails: async (userId: string): Promise<UserDetails> => {
    const response = await api.get<{ success: boolean; data: UserDetails }>(
      `/users/${userId}/details`
    );
    return response.data.data!;
  },
};
