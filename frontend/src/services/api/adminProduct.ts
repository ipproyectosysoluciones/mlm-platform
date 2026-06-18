/**
 * @fileoverview Admin Product service - Admin Product API methods
 * @module services/api/adminProduct
 */
import api from './client';
import type {
  ProductListParams,
  CreateProductPayload,
  UpdateProductPayload,
  InventoryReservePayload,
  InventoryReleasePayload,
  InventoryAdjustPayload,
  InventoryInitialPayload,
  InventoryReturnPayload,
} from '../../types';

/**
 * @namespace adminProductService
 * @description Admin Product API methods - Full CRUD + inventory management
 */
export const adminProductService = {
  /**
   * Get all products (admin view)
   */
  getProducts: async (params?: ProductListParams) => {
    const response = await api.get('/admin/products', { params });
    return response.data;
  },

  /**
   * Get product by ID (admin view)
   */
  getProduct: async (productId: string) => {
    const response = await api.get(`/admin/products/${productId}`);
    return response.data;
  },

  /**
   * Create a new product
   */
  createProduct: async (data: CreateProductPayload) => {
    const response = await api.post('/admin/products', data);
    return response.data;
  },

  /**
   * Update a product
   */
  updateProduct: async (productId: string, data: UpdateProductPayload) => {
    const response = await api.put(`/admin/products/${productId}`, data);
    return response.data;
  },

  /**
   * Delete a product (soft delete)
   */
  deleteProduct: async (productId: string) => {
    const response = await api.delete(`/admin/products/${productId}`);
    return response.data;
  },

  // Inventory management
  /**
   * Reserve stock
   */
  reserveStock: async (productId: string, data: InventoryReservePayload) => {
    const response = await api.post(`/admin/products/${productId}/inventory/reserve`, data);
    return response.data;
  },

  /**
   * Release stock
   */
  releaseStock: async (productId: string, data: InventoryReleasePayload) => {
    const response = await api.post(`/admin/products/${productId}/inventory/release`, data);
    return response.data;
  },

  /**
   * Adjust stock manually
   */
  adjustStock: async (productId: string, data: InventoryAdjustPayload) => {
    const response = await api.post(`/admin/products/${productId}/inventory/adjust`, data);
    return response.data;
  },

  /**
   * Set initial stock
   */
  setInitialStock: async (productId: string, data: InventoryInitialPayload) => {
    const response = await api.post(`/admin/products/${productId}/inventory/initial`, data);
    return response.data;
  },

  /**
   * Record return
   */
  recordReturn: async (productId: string, data: InventoryReturnPayload) => {
    const response = await api.post(`/admin/products/${productId}/inventory/return`, data);
    return response.data;
  },

  /**
   * Get inventory movements
   */
  getInventoryMovements: async (productId: string, limit?: number) => {
    const response = await api.get(`/admin/products/${productId}/inventory/movements`, {
      params: { limit },
    });
    return response.data;
  },
};
