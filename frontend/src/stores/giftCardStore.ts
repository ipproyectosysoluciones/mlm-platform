/**
 * @fileoverview Gift Card Store - Zustand store for gift card state management
 * @description Manages gift card creation, validation, redemption, and listing
 *              Gestiona creación, validación, canje y listado de gift cards
 * @module stores/giftCardStore
 * @author MLM Platform
 */
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type {
  GiftCardResponse,
  GiftCardTransactionResponse,
  GiftCardValidateResponse,
} from '../types';
import { giftCardService } from '../services/giftCardService';

interface GiftCardState {
  // Data
  cards: GiftCardResponse[];
  selectedCard: GiftCardResponse | null;
  validationResult: GiftCardValidateResponse | null;
  lastTransaction: GiftCardTransactionResponse | null;

  // UI State
  isLoading: boolean;
  isCreating: boolean;
  isValidating: boolean;
  isRedeeming: boolean;
  error: string | null;
  createError: string | null;
  validateError: string | null;
  redeemError: string | null;

  // Pagination
  page: number;
  limit: number;
  total: number;
  totalPages: number;

  // Actions
  createCard: (amount: number, expiresInDays?: number) => Promise<GiftCardResponse>;
  validateCode: (giftCardId: string) => Promise<GiftCardValidateResponse>;
  redeemCard: (giftCardId: string, orderId?: string) => Promise<GiftCardTransactionResponse>;
  fetchCards: (page?: number, status?: string) => Promise<void>;
  clearValidation: () => void;
  clearErrors: () => void;
  reset: () => void;
}

const initialState = {
  cards: [],
  selectedCard: null,
  validationResult: null,
  lastTransaction: null,
  isLoading: false,
  isCreating: false,
  isValidating: false,
  isRedeeming: false,
  error: null,
  createError: null,
  validateError: null,
  redeemError: null,
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

export const useGiftCardStore = create<GiftCardState>((set, get) => ({
  ...initialState,

  /**
   * Create a new gift card (admin)
   * Crear una nueva gift card (admin)
   */
  createCard: async (amount: number, expiresInDays?: number) => {
    set({ isCreating: true, createError: null });
    try {
      const card = await giftCardService.create({ amount, expiresInDays });
      set((state) => ({
        selectedCard: card,
        cards: [card, ...state.cards],
        isCreating: false,
      }));
      return card;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create gift card';
      set({ createError: message, isCreating: false });
      throw error;
    }
  },

  /**
   * Validate a gift card by ID
   * Validar una gift card por ID
   */
  validateCode: async (giftCardId: string) => {
    set({ isValidating: true, validateError: null, validationResult: null });
    try {
      const result = await giftCardService.validate(giftCardId);
      set({ validationResult: result, isValidating: false });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to validate gift card';
      set({ validateError: message, isValidating: false });
      throw error;
    }
  },

  /**
   * Redeem a gift card
   * Canjear una gift card
   */
  redeemCard: async (giftCardId: string, orderId?: string) => {
    set({ isRedeeming: true, redeemError: null });
    try {
      const transaction = await giftCardService.redeem(giftCardId, { orderId });
      set({
        lastTransaction: transaction,
        validationResult: null,
        isRedeeming: false,
      });
      return transaction;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to redeem gift card';
      set({ redeemError: message, isRedeeming: false });
      throw error;
    }
  },

  /**
   * Fetch gift cards with pagination (admin)
   * Obtener gift cards con paginación (admin)
   */
  fetchCards: async (page = 1, status?: string) => {
    set({ isLoading: true, error: null });
    try {
      const state = get();
      const result = await giftCardService.list({
        page,
        limit: state.limit,
        status: status as GiftCardResponse['status'],
      });
      set({
        cards: result.data,
        page: result.pagination.page,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch gift cards';
      set({ error: message, isLoading: false });
    }
  },

  /**
   * Clear validation state
   * Limpiar estado de validación
   */
  clearValidation: () =>
    set({ validationResult: null, validateError: null, lastTransaction: null }),

  /**
   * Clear all errors
   * Limpiar todos los errores
   */
  clearErrors: () =>
    set({ error: null, createError: null, validateError: null, redeemError: null }),

  /**
   * Reset store to initial state
   * Resetear el store al estado inicial
   */
  reset: () => set(initialState),
}));

// Selector hooks

/**
 * Hook for gift card creation state
 * Hook para estado de creación de gift card
 */
export const useGiftCardCreate = () =>
  useGiftCardStore(
    useShallow((state) => ({
      selectedCard: state.selectedCard,
      isCreating: state.isCreating,
      createError: state.createError,
      createCard: state.createCard,
      clearErrors: state.clearErrors,
    }))
  );

/**
 * Hook for gift card redemption state
 * Hook para estado de canje de gift card
 */
export const useGiftCardRedeem = () =>
  useGiftCardStore(
    useShallow((state) => ({
      validationResult: state.validationResult,
      lastTransaction: state.lastTransaction,
      isValidating: state.isValidating,
      isRedeeming: state.isRedeeming,
      validateError: state.validateError,
      redeemError: state.redeemError,
      validateCode: state.validateCode,
      redeemCard: state.redeemCard,
      clearValidation: state.clearValidation,
      clearErrors: state.clearErrors,
    }))
  );

/**
 * Hook for gift card list state
 * Hook para estado de lista de gift cards
 */
export const useGiftCardList = () =>
  useGiftCardStore(
    useShallow((state) => ({
      cards: state.cards,
      isLoading: state.isLoading,
      error: state.error,
      page: state.page,
      total: state.total,
      totalPages: state.totalPages,
      fetchCards: state.fetchCards,
    }))
  );

export default useGiftCardStore;
