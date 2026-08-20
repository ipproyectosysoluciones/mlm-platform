/**
 * @fileoverview Cart persistence — localStorage helpers for cart state
 * @description Low-level localStorage CRUD for cart persistence.
 *              Extracted from cartStore.ts for separation of concerns.
 *              Persistencia localStorage para el estado del carrito.
 * @module lib/cartPersistence
 */

import type { CartItemResponse } from '../services/cartService';

// ============================================
// Constants / Constantes
// ============================================

const CART_STORAGE_PREFIX = 'mlm_cart_';
const MAX_RECOVERY_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// ============================================
// Types / Tipos
// ============================================

export interface PersistedCartData {
  items: CartItemResponse[];
  totalAmount: number;
  itemCount: number;
  lastActivityAt: string;
  savedAt: string;
}

// ============================================
// Public API / API pública
// ============================================

/**
 * Build the localStorage key for a given user
 * Construir la clave de localStorage para un usuario dado
 */
function storageKey(userId: string): string {
  return `${CART_STORAGE_PREFIX}${userId}`;
}

/**
 * Save cart state to localStorage
 * Guardar estado del carrito en localStorage
 */
export function saveCartToStorage(userId: string, data: Omit<PersistedCartData, 'savedAt'>): void {
  const payload: PersistedCartData = {
    ...data,
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(payload));
  } catch {
    // localStorage might be full or unavailable — silently ignore
  }
}

/**
 * Load cart state from localStorage (only if <24hrs old)
 * Cargar estado del carrito desde localStorage (solo si tiene <24hrs)
 *
 * Returns null if nothing stored, expired, or corrupted.
 * Returns null si no hay datos, expiró, o está corrupto.
 */
export function loadCartFromStorage(userId: string): PersistedCartData | null {
  try {
    const stored = localStorage.getItem(storageKey(userId));
    if (!stored) return null;

    const data: PersistedCartData = JSON.parse(stored);
    const age = Date.now() - new Date(data.savedAt).getTime();

    if (age > MAX_RECOVERY_AGE_MS) {
      localStorage.removeItem(storageKey(userId));
      return null;
    }

    return data;
  } catch {
    // Corrupted data — remove it
    localStorage.removeItem(storageKey(userId));
    return null;
  }
}

/**
 * Remove cart data from localStorage
 * Eliminar datos del carrito de localStorage
 */
export function clearCartFromStorage(userId: string): void {
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    // Silently ignore
  }
}
