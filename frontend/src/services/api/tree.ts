/**
 * @fileoverview Tree service - Unilevel network API methods
 * @module services/api/tree
 */
import api from './client';
import type { TreeNode } from '../../types';

/**
 * @namespace treeService
 * @description Unilevel network API methods / Métodos de API de la red unilevel
 */
export const treeService = {
  /**
   * Get tree for specific user
   * Obtener árbol de usuario específico
   * @param {string} userId - User ID / ID de usuario
   * @param {number} [maxDepth] - Maximum depth to retrieve / Profundidad máxima a recuperar
   * @param {number} [page] - Page number for pagination / Número de página
   * @param {number} [limit] - Items per page / Items por página
   * @returns {Promise<TreeNode>} Tree node data / Datos del nodo del árbol
   */
  getTree: async (
    userId: string,
    maxDepth?: number,
    page?: number,
    limit?: number
  ): Promise<TreeNode> => {
    const params = new URLSearchParams();
    if (maxDepth) params.append('depth', maxDepth.toString());
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const queryString = params.toString();
    const response = await api.get<{ success: boolean; data: { tree: TreeNode; stats: any } }>(
      `/users/${userId}/tree${queryString ? `?${queryString}` : ''}`
    );
    // API returns { tree: {...}, stats: {...} so we need to extract just the tree
    return response.data.data!.tree;
  },

  /**
   * Get current user's tree
   * Obtener árbol del usuario actual
   * @param {number} [maxDepth] - Maximum depth to retrieve / Profundidad máxima a recuperar
   * @param {number} [page] - Page number for pagination / Número de página
   * @param {number} [limit] - Items per page / Items por página
   * @returns {Promise<TreeNode>} Tree node data / Datos del nodo del árbol
   */
  getMyTree: async (maxDepth?: number, page?: number, limit?: number): Promise<TreeNode> => {
    const params = new URLSearchParams();
    if (maxDepth) params.append('depth', maxDepth.toString());
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const queryString = params.toString();
    const response = await api.get<{ success: boolean; data: { tree: TreeNode; stats: any } }>(
      `/users/me/tree${queryString ? `?${queryString}` : ''}`
    );
    // API returns { tree: {...}, stats: {...} so we need to extract just the tree
    return response.data.data!.tree;
  },
};
