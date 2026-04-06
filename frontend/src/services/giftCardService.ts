/**
 * @fileoverview Gift Card Service - API client for gift card operations
 * @description Service for handling gift card creation, validation, and redemption
 *              Servicio para gestionar creación, validación y canje de gift cards
 * @module services/giftCardService
 * @author Nexo Real Development Team
 */

import api from './api';
import type {
  GiftCardResponse,
  GiftCardTransactionResponse,
  GiftCardCreatePayload,
  GiftCardRedeemPayload,
  GiftCardValidateResponse,
  GiftCardListParams,
} from '../types';

/**
 * @namespace giftCardService
 * @description Gift Card API methods / Métodos de API de Gift Cards
 */
export const giftCardService = {
  /**
   * Create a new gift card (admin only)
   * Crear una nueva gift card (solo admin)
   * @param {GiftCardCreatePayload} data - Gift card data / Datos de la gift card
   * @returns {Promise<GiftCardResponse>} Created gift card / Gift card creada
   */
  create: async (data: GiftCardCreatePayload): Promise<GiftCardResponse> => {
    const response = await api.post<{ success: boolean; data: GiftCardResponse }>(
      '/gift-cards',
      data
    );
    return response.data.data!;
  },

  /**
   * List all gift cards with pagination (admin only)
   * Listar todas las gift cards con paginación (solo admin)
   * @param {GiftCardListParams} params - Query parameters / Parámetros de consulta
   * @returns {Promise<{ data: GiftCardResponse[]; pagination: any }>} Gift cards list / Lista de gift cards
   */
  list: async (
    params?: GiftCardListParams
  ): Promise<{
    data: GiftCardResponse[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> => {
    const response = await api.get<{
      success: boolean;
      data: GiftCardResponse[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>('/gift-cards', { params });
    return { data: response.data.data!, pagination: response.data.pagination! };
  },

  /**
   * Get gift card details by ID (admin only)
   * Obtener detalles de gift card por ID (solo admin)
   * @param {string} id - Gift card ID / ID de la gift card
   * @returns {Promise<GiftCardResponse>} Gift card details / Detalles de la gift card
   */
  getById: async (id: string): Promise<GiftCardResponse> => {
    const response = await api.get<{ success: boolean; data: GiftCardResponse }>(
      `/gift-cards/${id}`
    );
    return response.data.data!;
  },

  /**
   * Validate a gift card by ID
   * Validar una gift card por ID
   * @param {string} giftCardId - Gift card ID / ID de la gift card
   * @returns {Promise<GiftCardValidateResponse>} Validation result / Resultado de validación
   */
  validate: async (giftCardId: string): Promise<GiftCardValidateResponse> => {
    const response = await api.get<{ success: boolean; data: GiftCardValidateResponse }>(
      `/gift-cards/${giftCardId}/validate`
    );
    return response.data.data!;
  },

  /**
   * Redeem a gift card
   * Canjear una gift card
   * @param {string} giftCardId - Gift card ID / ID de la gift card
   * @param {GiftCardRedeemPayload} data - Redeem payload / Datos de canje
   * @returns {Promise<GiftCardTransactionResponse>} Redemption transaction / Transacción de canje
   */
  redeem: async (
    giftCardId: string,
    data: GiftCardRedeemPayload
  ): Promise<GiftCardTransactionResponse> => {
    const response = await api.post<{ success: boolean; data: GiftCardTransactionResponse }>(
      `/gift-cards/${giftCardId}/redeem`,
      data
    );
    return response.data.data!;
  },

  /**
   * Resolve a QR short code to gift card ID (public)
   * Resolver un código corto QR a ID de gift card (público)
   * @param {string} shortCode - QR short code / Código corto QR
   * @returns {Promise<{ giftCardId: string }>} Gift card ID / ID de la gift card
   */
  resolveShortCode: async (shortCode: string): Promise<{ giftCardId: string }> => {
    const response = await api.get<{ success: boolean; data: { giftCardId: string } }>(
      `/q/${shortCode}`
    );
    return response.data.data!;
  },
};
