/**
 * @fileoverview Admin Vendor service - Admin Vendor API methods
 * @module services/api/adminVendor
 */
import api from './client';
import type { Vendor } from '../../types';

/**
 * @namespace adminVendorService
 * @description Admin Vendor API methods - Vendor management for admins
 */
export const adminVendorService = {
  /**
   * List all vendors
   * Listar todos los vendedores
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {string} status - Filter by status
   * @returns {Promise<{data: Vendor[]; pagination: any}>} Vendor list with pagination
   */
  listVendors: async (page?: number, limit?: number, status?: string) => {
    const response = await api.get('/admin/vendors', { params: { page, limit, status } });
    return response.data;
  },

  /**
   * Get vendor by ID
   * Obtener vendedor por ID
   * @param {string} vendorId - Vendor ID
   * @returns {Promise<Vendor>} Vendor data
   */
  getVendor: async (vendorId: string): Promise<Vendor> => {
    const response = await api.get<{ success: boolean; data: Vendor }>(
      `/admin/vendors/${vendorId}`
    );
    return response.data.data!;
  },

  /**
   * Approve vendor
   * Aprobar vendedor
   * @param {string} vendorId - Vendor ID
   * @returns {Promise<Vendor>} Updated vendor
   */
  approveVendor: async (vendorId: string): Promise<Vendor> => {
    const response = await api.post<{ success: boolean; data: Vendor }>(
      `/admin/vendors/${vendorId}/approve`
    );
    return response.data.data!;
  },

  /**
   * Reject vendor
   * Rechazar vendedor
   * @param {string} vendorId - Vendor ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Vendor>} Updated vendor
   */
  rejectVendor: async (vendorId: string, reason: string): Promise<Vendor> => {
    const response = await api.post<{ success: boolean; data: Vendor }>(
      `/admin/vendors/${vendorId}/reject`,
      { reason }
    );
    return response.data.data!;
  },

  /**
   * Suspend vendor
   * Suspender vendedor
   * @param {string} vendorId - Vendor ID
   * @param {string} reason - Suspension reason
   * @returns {Promise<Vendor>} Updated vendor
   */
  suspendVendor: async (vendorId: string, reason: string): Promise<Vendor> => {
    const response = await api.post<{ success: boolean; data: Vendor }>(
      `/admin/vendors/${vendorId}/suspend`,
      { reason }
    );
    return response.data.data!;
  },

  /**
   * Update vendor commission rate
   * Actualizar tasa de comisión del vendedor
   * @param {string} vendorId - Vendor ID
   * @param {number} commissionRate - New commission rate (0-1)
   * @returns {Promise<Vendor>} Updated vendor
   */
  updateCommissionRate: async (vendorId: string, commissionRate: number): Promise<Vendor> => {
    const response = await api.patch<{ success: boolean; data: Vendor }>(
      `/admin/vendors/${vendorId}/commission-rate`,
      { commissionRate }
    );
    return response.data.data!;
  },
};
