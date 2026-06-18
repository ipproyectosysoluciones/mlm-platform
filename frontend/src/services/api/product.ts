/**
 * @fileoverview Product service - Product API methods
 * @module services/api/product
 */
import api from './client';
import type {
  ProductListParams,
  ProductListResponse,
  Product,
  StreamingPlatform,
} from '../../types';

/**
 * @namespace productService
 * @description Product API methods - Streaming subscriptions catalog / Métodos de API de productos
 */
export const productService = {
  /**
   * Get list of products with optional filtering and pagination
   * Obtener lista de productos con filtrado y paginación opcionales
   * @param {ProductListParams} params - Query parameters / Parámetros de consulta
   * @returns {Promise<ProductListResponse>} Product list response / Respuesta de lista de productos
   */
  getProducts: async (params?: ProductListParams): Promise<ProductListResponse> => {
    const response = await api.get<{ success: boolean; data: ProductListResponse }>('/products', {
      params,
    });
    return response.data.data!;
  },

  /**
   * Get single product by ID
   * Obtener producto por ID
   * @param {string} productId - Product ID / ID del producto
   * @returns {Promise<Product>} Product data / Datos del producto
   */
  getProduct: async (productId: string): Promise<Product> => {
    const response = await api.get<{ success: boolean; data: Product }>(`/products/${productId}`);
    return response.data.data!;
  },

  /**
   * Get products filtered by platform
   * Obtener productos filtrados por plataforma
   * @param {StreamingPlatform} platform - Platform to filter by / Plataforma a filtrar
   * @param {number} [limit] - Results limit / Límite de resultados
   * @returns {Promise<Product[]>} Array of products / Array de productos
   */
  getProductsByPlatform: async (
    platform: StreamingPlatform,
    limit?: number
  ): Promise<Product[]> => {
    const params: ProductListParams = { platform };
    if (limit) params.limit = limit;
    const response = await api.get<{ success: boolean; data: Product[] }>('/products', {
      params,
    });
    return response.data.data || [];
  },
};
