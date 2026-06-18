/**
 * @fileoverview Category service - Category API methods
 * @module services/api/category
 */
import api from './client';
import type { CreateCategoryPayload, UpdateCategoryPayload } from '../../types';

/**
 * @namespace categoryService
 * @description Category API methods - Category management
 */
export const categoryService = {
  /**
   * Get category tree
   */
  getTree: async (includeInactive?: boolean) => {
    const response = await api.get('/categories/tree', {
      params: { includeInactive },
    });
    return response.data;
  },

  /**
   * Get category by ID
   */
  getCategory: async (categoryId: string) => {
    const response = await api.get(`/categories/${categoryId}`);
    return response.data;
  },

  /**
   * Get breadcrumb for category
   */
  getBreadcrumb: async (categoryId: string) => {
    const response = await api.get(`/categories/${categoryId}/breadcrumb`);
    return response.data;
  },

  /**
   * List all categories
   */
  listCategories: async (params?: {
    includeInactive?: boolean;
    parentId?: string;
    isActive?: boolean;
  }) => {
    const response = await api.get('/categories', { params });
    return response.data;
  },

  // Admin methods
  /**
   * List all categories (admin)
   */
  listCategoriesAdmin: async (params?: { includeInactive?: boolean; parentId?: string }) => {
    const response = await api.get('/admin/categories', { params });
    return response.data;
  },

  /**
   * Get category by ID (admin)
   */
  getCategoryAdmin: async (categoryId: string) => {
    const response = await api.get(`/admin/categories/${categoryId}`);
    return response.data;
  },

  /**
   * Create a new category
   */
  createCategory: async (data: CreateCategoryPayload) => {
    const response = await api.post('/admin/categories', data);
    return response.data;
  },

  /**
   * Update a category
   */
  updateCategory: async (categoryId: string, data: UpdateCategoryPayload) => {
    const response = await api.put(`/admin/categories/${categoryId}`, data);
    return response.data;
  },

  /**
   * Delete a category
   */
  deleteCategory: async (categoryId: string) => {
    const response = await api.delete(`/admin/categories/${categoryId}`);
    return response.data;
  },
};
