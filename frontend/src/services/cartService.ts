/**
 * @fileoverview Cart Service - API client for shopping cart operations
 * @description Service for handling cart CRUD, recovery token validation, and admin listing
 *              Servicio para gestionar CRUD de carrito, validación de tokens de recuperación, y listado admin
 * @module services/cartService
 * @author MLM Platform
 */

import api from './api';

// ============================================
// Types / Tipos
// ============================================

export interface CartItemProduct {
  id: string;
  name: string;
  price: number;
  platform: string;
  isActive: boolean;
}

export interface CartItemResponse {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: CartItemProduct;
}

export interface CartResponse {
  id: string;
  userId: string;
  status: 'active' | 'abandoned' | 'recovered' | 'checked_out' | 'expired';
  lastActivityAt: string;
  abandonedAt: string | null;
  recoveredAt: string | null;
  checkedOutAt: string | null;
  itemCount: number;
  totalAmount: number;
  items: CartItemResponse[];
}

export interface AbandonedCartAdmin {
  id: string;
  userId: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  abandonedAt: string;
  lastActivityAt: string;
  user?: { id: string; email: string };
  items?: CartItemResponse[];
}

export interface AbandonedCartsResponse {
  carts: AbandonedCartAdmin[];
  stats: {
    totalAbandoned: number;
    totalRecovered: number;
    recoveryRate: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Service / Servicio
// ============================================

/**
 * @namespace cartService
 * @description Cart API methods / Métodos de API de Carrito
 */
export const cartService = {
  /**
   * Get the current user's active cart
   * Obtener el carrito activo del usuario actual
   * @returns {Promise<CartResponse>} Cart with items / Carrito con items
   */
  getMyCart: async (): Promise<CartResponse> => {
    const response = await api.get<{ success: boolean; data: CartResponse }>('/carts/me');
    return response.data.data!;
  },

  /**
   * Add an item to the cart
   * Agregar un item al carrito
   * @param {string} productId - Product UUID / UUID del producto
   * @param {number} quantity - Quantity to add / Cantidad a agregar
   * @returns {Promise<CartResponse>} Updated cart / Carrito actualizado
   */
  addItem: async (productId: string, quantity: number): Promise<CartResponse> => {
    const response = await api.post<{ success: boolean; data: CartResponse }>('/carts/me/items', {
      productId,
      quantity,
    });
    return response.data.data!;
  },

  /**
   * Remove an item from the cart
   * Eliminar un item del carrito
   * @param {string} cartItemId - CartItem UUID / UUID del CartItem
   * @returns {Promise<CartResponse>} Updated cart / Carrito actualizado
   */
  removeItem: async (cartItemId: string): Promise<CartResponse> => {
    const response = await api.delete<{ success: boolean; data: CartResponse }>(
      `/carts/me/items/${cartItemId}`
    );
    return response.data.data!;
  },

  /**
   * Update item quantity in the cart
   * Actualizar cantidad de item en el carrito
   * @param {string} cartItemId - CartItem UUID / UUID del CartItem
   * @param {number} quantity - New quantity / Nueva cantidad
   * @returns {Promise<CartResponse>} Updated cart / Carrito actualizado
   */
  updateQuantity: async (cartItemId: string, quantity: number): Promise<CartResponse> => {
    const response = await api.patch<{ success: boolean; data: CartResponse }>(
      `/carts/me/items/${cartItemId}`,
      { quantity }
    );
    return response.data.data!;
  },

  /**
   * Preview a cart via recovery token (public, no auth required)
   * Vista previa del carrito via token de recuperación (público, sin auth)
   * @param {string} token - Recovery token / Token de recuperación
   * @returns {Promise<CartResponse>} Cart preview / Vista previa del carrito
   */
  getCartByRecoveryToken: async (token: string): Promise<CartResponse> => {
    const response = await api.get<{ success: boolean; data: CartResponse }>(
      `/carts/recover/${encodeURIComponent(token)}`
    );
    return response.data.data!;
  },

  /**
   * Complete cart recovery (mark token as used, restore cart)
   * Completar recuperación de carrito (marcar token como usado, restaurar carrito)
   * @param {string} token - Recovery token / Token de recuperación
   * @returns {Promise<CartResponse>} Recovered cart / Carrito recuperado
   */
  recoverCart: async (token: string): Promise<CartResponse> => {
    const response = await api.post<{ success: boolean; data: CartResponse }>(
      `/carts/recover/${encodeURIComponent(token)}`
    );
    return response.data.data!;
  },

  /**
   * List abandoned carts (admin only)
   * Listar carritos abandonados (solo admin)
   * @param {number} page - Page number / Número de página
   * @param {number} limit - Items per page / Items por página
   * @returns {Promise<AbandonedCartsResponse>} Abandoned carts with stats / Carritos abandonados con estadísticas
   */
  listAbandoned: async (page = 1, limit = 20): Promise<AbandonedCartsResponse> => {
    const response = await api.get<{
      success: boolean;
      data: AbandonedCartsResponse;
    }>('/carts/abandoned', { params: { page, limit } });
    return response.data.data!;
  },
};
