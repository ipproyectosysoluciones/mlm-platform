/**
 * @fileoverview Order service - Order API methods
 * @module services/api/order
 */
import api from './client';
import type { CreateOrderRequest, Order, OrderListParams, OrderListResponse } from '../../types';

/**
 * @namespace orderService
 * @description Order API methods - Purchase orders / Métodos de API de órdenes
 */
export const orderService = {
  /**
   * Create a new order (purchase)
   * Crear una nueva orden (compra)
   * @param {CreateOrderRequest} data - Order data / Datos de la orden
   * @returns {Promise<Order>} Created order / Orden creada
   */
  createOrder: async (data: CreateOrderRequest): Promise<Order> => {
    const response = await api.post<{ success: boolean; data: Order }>('/orders', data);
    return response.data.data!;
  },

  /**
   * Get current user's orders
   * Obtener órdenes del usuario actual
   * @param {OrderListParams} params - Query parameters / Parámetros de consulta
   * @returns {Promise<OrderListResponse>} Order list response / Respuesta de lista de órdenes
   */
  getOrders: async (params?: OrderListParams): Promise<OrderListResponse> => {
    const response = await api.get<{ success: boolean; data: OrderListResponse }>('/orders', {
      params,
    });
    return response.data.data!;
  },

  /**
   * Get single order by ID
   * Obtener orden por ID
   * @param {string} orderId - Order ID / ID de la orden
   * @returns {Promise<Order>} Order data / Datos de la orden
   */
  getOrder: async (orderId: string): Promise<Order> => {
    const response = await api.get<{ success: boolean; data: Order }>(`/orders/${orderId}`);
    return response.data.data!;
  },

  /**
   * Get order details with product info
   * Obtener detalles de la orden con info del producto
   * @param {string} orderId - Order ID / ID de la orden
   * @returns {Promise<Order>} Order with product data / Orden con datos del producto
   */
  getOrderWithProduct: async (orderId: string): Promise<Order> => {
    const response = await api.get<{ success: boolean; data: Order }>(`/orders/${orderId}`);
    return response.data.data!;
  },
};
