/**
 * @fileoverview Wallet service - Wallet API methods
 * @module services/api/wallet
 */
import api from './client';
import type {
  WalletBalance,
  TransactionListParams,
  TransactionListResponse,
  WithdrawalRequest,
  CryptoPrices,
} from '../../types';

/**
 * @namespace walletService
 * @description Wallet API methods - Digital wallet operations / Métodos de API del wallet
 */
export const walletService = {
  /**
   * Get wallet balance
   * Obtener balance del wallet
   * @returns {Promise<WalletBalance>} Wallet balance / Balance del wallet
   */
  getBalance: async (): Promise<WalletBalance> => {
    const response = await api.get<{ success: boolean; data: WalletBalance }>('/wallet');
    return response.data.data!;
  },

  /**
   * Get wallet transactions
   * Obtener transacciones del wallet
   * @param {TransactionListParams} params - Query parameters / Parámetros de consulta
   * @returns {Promise<TransactionListResponse>} Transaction list response / Respuesta de lista de transacciones
   */
  getTransactions: async (params?: TransactionListParams): Promise<TransactionListResponse> => {
    const response = await api.get<{ success: boolean; data: TransactionListResponse }>(
      '/wallet/transactions',
      { params }
    );
    return response.data.data!;
  },

  /**
   * Create withdrawal request
   * Crear solicitud de retiro
   * @param {number} amount - Amount to withdraw / Monto a retirer
   * @returns {Promise<WithdrawalRequest>} Created withdrawal request / Solicitud de retiro creada
   */
  createWithdrawal: async (amount: number): Promise<WithdrawalRequest> => {
    const response = await api.post<{ success: boolean; data: WithdrawalRequest }>(
      '/wallet/withdraw',
      { amount }
    );
    return response.data.data!;
  },

  /**
   * Get withdrawal status
   * Obtener estado del retiro
   * @param {string} id - Withdrawal ID / ID del retiro
   * @returns {Promise<WithdrawalRequest>} Withdrawal request / Solicitud de retiro
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
   * @param {string} id - Withdrawal ID / ID del retiro
   * @returns {Promise<WithdrawalRequest>} Cancelled withdrawal request / Solicitud de retiro cancelada
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
   * @returns {Promise<CryptoPrices>} Current crypto prices / Precios actuales de crypto
   */
  getCryptoPrices: async (): Promise<CryptoPrices> => {
    const response = await api.get<{ success: boolean; data: CryptoPrices }>('/wallet/prices');
    return response.data.data!;
  },
};
