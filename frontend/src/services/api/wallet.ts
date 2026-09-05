/**
 * @fileoverview Wallet service - Wallet API methods
 * @module services/api/wallet
 */
import api from './client';
import type {
  WalletBalance,
  WalletConfig,
  TransactionListParams,
  TransactionListResponse,
  WithdrawalRequest,
  WithdrawalDestination,
  CryptoPrices,
  AdminListWithdrawalsParams,
  AdminListWithdrawalsResponse,
  AdminApproveWithdrawalParams,
  AdminRejectWithdrawalParams,
} from '../../types';

/**
 * @namespace walletService
 * @description Wallet API methods - Digital wallet operations / Métodos de API del wallet
 */
export const walletService = {
  /**
   * Get wallet balance
   * Obtener balance del wallet
   */
  getBalance: async (): Promise<WalletBalance> => {
    const response = await api.get<{ success: boolean; data: WalletBalance }>('/wallet');
    return response.data.data!;
  },

  /**
   * Get wallet config (min/max/payoutMode)
   * Obtener configuración del wallet
   */
  getConfig: async (): Promise<WalletConfig> => {
    const response = await api.get<{ success: boolean; data: WalletConfig }>('/wallet/config');
    return response.data.data!;
  },

  /**
   * Get wallet transactions
   * Obtener transacciones del wallet
   */
  getTransactions: async (params?: TransactionListParams): Promise<TransactionListResponse> => {
    const response = await api.get<{ success: boolean; data: TransactionListResponse }>(
      '/wallet/transactions',
      { params }
    );
    return response.data.data!;
  },

  /**
   * Create withdrawal request with destination
   * Crear solicitud de retiro con destino
   */
  createWithdrawal: async (
    amount: number,
    destination: WithdrawalDestination
  ): Promise<WithdrawalRequest> => {
    const response = await api.post<{ success: boolean; data: WithdrawalRequest }>(
      '/wallet/withdraw',
      { amount, destination }
    );
    return response.data.data!;
  },

  /**
   * Get withdrawal status
   * Obtener estado del retiro
   */
  getWithdrawalStatus: async (id: string): Promise<WithdrawalRequest> => {
    const response = await api.get<{ success: boolean; data: WithdrawalRequest }>(
      `/wallet/withdrawals/${id}`
    );
    return response.data.data!;
  },

  /**
   * Cancel withdrawal request
   * Cancelar solicitud de retiro
   */
  cancelWithdrawal: async (id: string): Promise<WithdrawalRequest> => {
    const response = await api.delete<{ success: boolean; data: WithdrawalRequest }>(
      `/wallet/withdrawals/${id}`
    );
    return response.data.data!;
  },

  /**
   * Get current cryptocurrency prices
   * Obtener precios actuales de criptomonedas
   */
  getCryptoPrices: async (): Promise<CryptoPrices> => {
    const response = await api.get<{ success: boolean; data: CryptoPrices }>('/wallet/prices');
    return response.data.data!;
  },

  // ============================================
  // Admin endpoints — Admin wallet operations
  // ============================================

  /**
   * Admin: list all withdrawal requests with filters
   */
  adminListWithdrawals: async (
    params?: AdminListWithdrawalsParams
  ): Promise<AdminListWithdrawalsResponse> => {
    const response = await api.get<{ success: boolean; data: AdminListWithdrawalsResponse }>(
      '/admin/wallet/withdrawals',
      { params }
    );
    return response.data.data!;
  },

  /**
   * Admin: approve a withdrawal request
   */
  adminApproveWithdrawal: async (
    id: string,
    params?: AdminApproveWithdrawalParams
  ): Promise<WithdrawalRequest> => {
    const response = await api.post<{ success: boolean; data: WithdrawalRequest }>(
      `/admin/wallet/withdrawals/${id}/approve`,
      params || {}
    );
    return response.data.data!;
  },

  /**
   * Admin: reject a withdrawal request
   */
  adminRejectWithdrawal: async (
    id: string,
    params: AdminRejectWithdrawalParams
  ): Promise<WithdrawalRequest> => {
    const response = await api.post<{ success: boolean; data: WithdrawalRequest }>(
      `/admin/wallet/withdrawals/${id}/reject`,
      params
    );
    return response.data.data!;
  },
};
