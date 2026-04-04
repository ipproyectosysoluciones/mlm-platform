/**
 * @fileoverview Cart Store - Zustand store for shopping cart state management
 * @description Manages cart CRUD, localStorage persistence (debounced 30s),
 *              recovery from localStorage on load (<24hrs), and cleanup on checkout
 *              Gestiona CRUD del carrito, persistencia en localStorage (debounced 30s),
 *              recuperación desde localStorage al cargar (<24hrs), y limpieza al checkout
 * @module stores/cartStore
 * @author MLM Platform
 */
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { cartService } from '../services/cartService';
import type { CartResponse, CartItemResponse } from '../services/cartService';

// ============================================
// Constants / Constantes
// ============================================

const CART_STORAGE_PREFIX = 'mlm_cart_';
const SYNC_DEBOUNCE_MS = 30_000; // 30 seconds
const MAX_RECOVERY_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// ============================================
// Types / Tipos
// ============================================

interface CartState {
  // Data / Datos
  cart: CartResponse | null;
  items: CartItemResponse[];
  totalAmount: number;
  itemCount: number;
  lastActivityAt: string | null;

  // UI State / Estado de UI
  isLoading: boolean;
  isAddingItem: boolean;
  isRemovingItem: boolean;
  isUpdatingQuantity: boolean;
  isRecovering: boolean;
  error: string | null;

  // Recovery State / Estado de recuperación
  recoveryCart: CartResponse | null;
  recoveryError: string | null;
  isLoadingRecovery: boolean;

  // Actions / Acciones
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<CartResponse>;
  removeItem: (cartItemId: string) => Promise<CartResponse>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<CartResponse>;
  clearCart: () => void;

  // Recovery Actions / Acciones de recuperación
  previewRecoveryCart: (token: string) => Promise<CartResponse>;
  confirmRecovery: (token: string) => Promise<CartResponse>;
  clearRecovery: () => void;

  // Persistence Actions / Acciones de persistencia
  syncToLocalStorage: (userId: string) => void;
  loadFromLocalStorage: (userId: string) => void;
  clearLocalStorage: (userId: string) => void;

  // Reset
  reset: () => void;
}

// ============================================
// Debounce Timer / Temporizador de debounce
// ============================================

let syncTimer: ReturnType<typeof setTimeout> | null = null;

function debouncedSync(fn: () => void): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(fn, SYNC_DEBOUNCE_MS);
}

// ============================================
// Initial State / Estado inicial
// ============================================

const initialState = {
  cart: null,
  items: [],
  totalAmount: 0,
  itemCount: 0,
  lastActivityAt: null,

  isLoading: false,
  isAddingItem: false,
  isRemovingItem: false,
  isUpdatingQuantity: false,
  isRecovering: false,
  error: null,

  recoveryCart: null,
  recoveryError: null,
  isLoadingRecovery: false,
};

// ============================================
// Store / Store
// ============================================

export const useCartStore = create<CartState>((set, get) => ({
  ...initialState,

  /**
   * Fetch the current user's active cart from the API
   * Obtener el carrito activo del usuario actual desde la API
   */
  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const cart = await cartService.getMyCart();
      set({
        cart,
        items: cart.items ?? [],
        totalAmount: Number(cart.totalAmount) || 0,
        itemCount: cart.itemCount ?? cart.items?.length ?? 0,
        lastActivityAt: cart.lastActivityAt ?? new Date().toISOString(),
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch cart';
      set({ error: message, isLoading: false });
    }
  },

  /**
   * Add an item to the cart
   * Agregar un item al carrito
   */
  addItem: async (productId: string, quantity: number) => {
    set({ isAddingItem: true, error: null });
    try {
      const cart = await cartService.addItem(productId, quantity);
      set({
        cart,
        items: cart.items ?? [],
        totalAmount: Number(cart.totalAmount) || 0,
        itemCount: cart.itemCount ?? cart.items?.length ?? 0,
        lastActivityAt: cart.lastActivityAt ?? new Date().toISOString(),
        isAddingItem: false,
      });
      return cart;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add item to cart';
      set({ error: message, isAddingItem: false });
      throw error;
    }
  },

  /**
   * Remove an item from the cart
   * Eliminar un item del carrito
   */
  removeItem: async (cartItemId: string) => {
    set({ isRemovingItem: true, error: null });
    try {
      const cart = await cartService.removeItem(cartItemId);
      set({
        cart,
        items: cart.items ?? [],
        totalAmount: Number(cart.totalAmount) || 0,
        itemCount: cart.itemCount ?? cart.items?.length ?? 0,
        lastActivityAt: cart.lastActivityAt ?? new Date().toISOString(),
        isRemovingItem: false,
      });
      return cart;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove item from cart';
      set({ error: message, isRemovingItem: false });
      throw error;
    }
  },

  /**
   * Update item quantity in the cart
   * Actualizar la cantidad de un item en el carrito
   */
  updateQuantity: async (cartItemId: string, quantity: number) => {
    set({ isUpdatingQuantity: true, error: null });
    try {
      const cart = await cartService.updateQuantity(cartItemId, quantity);
      set({
        cart,
        items: cart.items ?? [],
        totalAmount: Number(cart.totalAmount) || 0,
        itemCount: cart.itemCount ?? cart.items?.length ?? 0,
        lastActivityAt: cart.lastActivityAt ?? new Date().toISOString(),
        isUpdatingQuantity: false,
      });
      return cart;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update quantity';
      set({ error: message, isUpdatingQuantity: false });
      throw error;
    }
  },

  /**
   * Clear cart state (used after successful checkout)
   * Limpiar el estado del carrito (usado después de checkout exitoso)
   */
  clearCart: () => {
    set({
      cart: null,
      items: [],
      totalAmount: 0,
      itemCount: 0,
      lastActivityAt: null,
      error: null,
    });
  },

  // ==========================================
  // Recovery / Recuperación
  // ==========================================

  /**
   * Preview a cart via recovery token (public, no auth)
   * Vista previa del carrito via token de recuperación (público, sin auth)
   */
  previewRecoveryCart: async (token: string) => {
    set({ isLoadingRecovery: true, recoveryError: null, recoveryCart: null });
    try {
      const cart = await cartService.getCartByRecoveryToken(token);
      set({
        recoveryCart: cart,
        isLoadingRecovery: false,
      });
      return cart;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load recovery cart';
      set({ recoveryError: message, isLoadingRecovery: false });
      throw error;
    }
  },

  /**
   * Confirm cart recovery — marks token as used, restores cart
   * Confirmar recuperación — marca token como usado, restaura carrito
   */
  confirmRecovery: async (token: string) => {
    set({ isRecovering: true, recoveryError: null });
    try {
      const cart = await cartService.recoverCart(token);
      set({
        cart,
        items: cart.items ?? [],
        totalAmount: Number(cart.totalAmount) || 0,
        itemCount: cart.itemCount ?? cart.items?.length ?? 0,
        lastActivityAt: cart.lastActivityAt ?? new Date().toISOString(),
        recoveryCart: null,
        isRecovering: false,
      });
      return cart;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to recover cart';
      set({ recoveryError: message, isRecovering: false });
      throw error;
    }
  },

  /**
   * Clear recovery state
   * Limpiar estado de recuperación
   */
  clearRecovery: () => set({ recoveryCart: null, recoveryError: null, isLoadingRecovery: false }),

  // ==========================================
  // localStorage Persistence / Persistencia
  // ==========================================

  /**
   * Sync cart state to localStorage (debounced 30s)
   * Sincronizar estado del carrito a localStorage (debounced 30s)
   */
  syncToLocalStorage: (userId: string) => {
    debouncedSync(() => {
      const state = get();
      if (!state.cart) return;

      const data = {
        items: state.items,
        totalAmount: state.totalAmount,
        itemCount: state.itemCount,
        lastActivityAt: state.lastActivityAt ?? new Date().toISOString(),
        savedAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem(`${CART_STORAGE_PREFIX}${userId}`, JSON.stringify(data));
      } catch {
        // localStorage might be full or unavailable — silently ignore
      }
    });
  },

  /**
   * Load cart from localStorage if <24hrs old
   * Cargar carrito desde localStorage si tiene <24hrs
   */
  loadFromLocalStorage: (userId: string) => {
    try {
      const stored = localStorage.getItem(`${CART_STORAGE_PREFIX}${userId}`);
      if (!stored) return;

      const data = JSON.parse(stored);
      const savedAt = new Date(data.savedAt).getTime();
      const age = Date.now() - savedAt;

      // Only restore if <24hrs old / Solo restaurar si tiene <24hrs
      if (age > MAX_RECOVERY_AGE_MS) {
        localStorage.removeItem(`${CART_STORAGE_PREFIX}${userId}`);
        return;
      }

      set({
        items: data.items ?? [],
        totalAmount: Number(data.totalAmount) || 0,
        itemCount: data.itemCount ?? data.items?.length ?? 0,
        lastActivityAt: data.lastActivityAt ?? null,
      });
    } catch {
      // Corrupted data — remove it / Datos corruptos — eliminar
      localStorage.removeItem(`${CART_STORAGE_PREFIX}${userId}`);
    }
  },

  /**
   * Clear localStorage for a user (on checkout completion)
   * Limpiar localStorage de un usuario (al completar checkout)
   */
  clearLocalStorage: (userId: string) => {
    try {
      localStorage.removeItem(`${CART_STORAGE_PREFIX}${userId}`);
    } catch {
      // Silently ignore
    }
  },

  /**
   * Reset store to initial state
   * Resetear el store al estado inicial
   */
  reset: () => {
    if (syncTimer) clearTimeout(syncTimer);
    set(initialState);
  },
}));

// ============================================
// Selector Hooks / Hooks selectores
// ============================================

/**
 * Hook for cart items and totals
 * Hook para items del carrito y totales
 */
export const useCartItems = () =>
  useCartStore(
    useShallow((state) => ({
      items: state.items,
      totalAmount: state.totalAmount,
      itemCount: state.itemCount,
      isLoading: state.isLoading,
      error: state.error,
      fetchCart: state.fetchCart,
    }))
  );

/**
 * Hook for cart mutation actions
 * Hook para acciones de mutación del carrito
 */
export const useCartActions = () =>
  useCartStore(
    useShallow((state) => ({
      addItem: state.addItem,
      removeItem: state.removeItem,
      updateQuantity: state.updateQuantity,
      clearCart: state.clearCart,
      isAddingItem: state.isAddingItem,
      isRemovingItem: state.isRemovingItem,
      isUpdatingQuantity: state.isUpdatingQuantity,
      error: state.error,
    }))
  );

/**
 * Hook for cart recovery state
 * Hook para estado de recuperación del carrito
 */
export const useCartRecovery = () =>
  useCartStore(
    useShallow((state) => ({
      recoveryCart: state.recoveryCart,
      recoveryError: state.recoveryError,
      isLoadingRecovery: state.isLoadingRecovery,
      isRecovering: state.isRecovering,
      previewRecoveryCart: state.previewRecoveryCart,
      confirmRecovery: state.confirmRecovery,
      clearRecovery: state.clearRecovery,
    }))
  );

/**
 * Hook for localStorage persistence
 * Hook para persistencia en localStorage
 */
export const useCartPersistence = () =>
  useCartStore(
    useShallow((state) => ({
      syncToLocalStorage: state.syncToLocalStorage,
      loadFromLocalStorage: state.loadFromLocalStorage,
      clearLocalStorage: state.clearLocalStorage,
    }))
  );

export default useCartStore;
