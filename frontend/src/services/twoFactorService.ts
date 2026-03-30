/**
 * @fileoverview Two Factor Authentication Service
 * @description API methods for 2FA operations
 * @module services/twoFactorService
 */

import api from './api';

/**
 * Types for 2FA responses
 */
export interface TwoFactorStatus {
  enabled: boolean;
  enabledAt: string | null;
  method: string;
}

export interface TwoFactorSetupResponse {
  qrCodeUrl: string;
  secret: string;
  expiresIn: number;
}

export interface TwoFactorVerifySetupResponse {
  success: boolean;
  recoveryCodes: string[];
  message: string;
}

export interface TwoFactorVerifyResponse {
  verified: boolean;
}

export interface TwoFactorDisableResponse {
  success: boolean;
  message: string;
}

/**
 * @namespace twoFactorService
 * @description Two-Factor Authentication API methods
 */
export const twoFactorService = {
  /**
   * Get current 2FA status
   * Obtiene el estado actual de 2FA
   * @returns {Promise<TwoFactorStatus>} 2FA status
   */
  getStatus: async (): Promise<TwoFactorStatus> => {
    const response = await api.get<{ success: boolean; data: TwoFactorStatus }>('/auth/2fa/status');
    return response.data.data!;
  },

  /**
   * Initiate 2FA setup
   * Inicia la configuración de 2FA
   * @returns {Promise<TwoFactorSetupResponse>} Setup data with QR code
   */
  setup: async (): Promise<TwoFactorSetupResponse> => {
    const response = await api.post<{ success: boolean; data: TwoFactorSetupResponse }>(
      '/auth/2fa/setup'
    );
    return response.data.data!;
  },

  /**
   * Verify setup code and enable 2FA
   * Verifica el código y habilita 2FA
   * @param {string} code - 6-digit verification code
   * @returns {Promise<TwoFactorVerifySetupResponse>} Response with recovery codes
   */
  verifySetup: async (code: string): Promise<TwoFactorVerifySetupResponse> => {
    const response = await api.post<{ success: boolean; data: TwoFactorVerifySetupResponse }>(
      '/auth/2fa/verify-setup',
      { code }
    );
    return response.data.data!;
  },

  /**
   * Verify 2FA code (during login)
   * Verifica código 2FA (durante login)
   * @param {string} code - 6-digit verification code
   * @returns {Promise<TwoFactorVerifyResponse>} Verification result
   */
  verify: async (code: string): Promise<TwoFactorVerifyResponse> => {
    const response = await api.post<{ success: boolean; data: TwoFactorVerifyResponse }>(
      '/auth/2fa/verify',
      { code }
    );
    return response.data.data!;
  },

  /**
   * Disable 2FA
   * Deshabilita 2FA
   * @param {string} code - Current 2FA code or recovery code
   * @returns {Promise<TwoFactorDisableResponse>} Disable result
   */
  disable: async (code: string): Promise<TwoFactorDisableResponse> => {
    const response = await api.post<{ success: boolean; data: TwoFactorDisableResponse }>(
      '/auth/2fa/disable',
      { code }
    );
    return response.data.data!;
  },
};

export default twoFactorService;
