/**
 * @fileoverview Vendor service - Vendor API methods
 * @module services/api/vendor
 */
import api from './client';
import type {
  Vendor,
  VendorRegistrationPayload,
  VendorDashboard,
  VendorPayoutRequest,
} from '../../types';

/**
 * @namespace vendorService
 * @description Vendor API methods - Marketplace vendor operations
 */
export const vendorService = {
  /**
   * Register as a vendor
   * Registrarse como vendedor
   * @param {VendorRegistrationPayload} data - Vendor registration data
   * @returns {Promise<Vendor>} Created vendor
   */
  register: async (data: VendorRegistrationPayload): Promise<Vendor> => {
    const response = await api.post<{ success: boolean; data: Vendor }>('/vendors/register', data);
    return response.data.data!;
  },

  /**
   * Get current vendor profile
   * Obtener perfil del vendedor actual
   * @returns {Promise<Vendor>} Vendor profile
   */
  getProfile: async (): Promise<Vendor> => {
    const response = await api.get<{ success: boolean; data: Vendor }>('/vendors/me');
    return response.data.data!;
  },

  /**
   * Get vendor products
   * Obtener productos del vendedor
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<{data: Product[]; pagination: any}>} Vendor products with pagination
   */
  getProducts: async (page?: number, limit?: number) => {
    const response = await api.get('/vendors/me/products', { params: { page, limit } });
    return response.data;
  },

  /**
   * Get vendor dashboard
   * Obtener panel del vendedor
   * @returns {Promise<VendorDashboard>} Dashboard data
   */
  getDashboard: async (): Promise<VendorDashboard> => {
    const response = await api.get<{ success: boolean; data: VendorDashboard }>(
      '/vendors/me/dashboard'
    );
    return response.data.data!;
  },

  /**
   * Request payout
   * Solicitar pago
   * @param {VendorPayoutRequest} data - Payout request data
   * @returns {Promise<any>} Created payout
   */
  requestPayout: async (data: VendorPayoutRequest) => {
    const response = await api.post<{ success: boolean; data: any }>('/vendors/me/payouts', data);
    return response.data.data!;
  },
};
