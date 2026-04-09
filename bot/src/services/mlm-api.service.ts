/**
 * @fileoverview MLM API Service — HTTP client for backend bot endpoints
 * @description Thin HTTP wrapper around the backend /api/bot/* routes.
 *              All requests include the x-bot-secret header automatically.
 *              Cliente HTTP delgado para las rutas /api/bot/* del backend.
 *              Todas las peticiones incluyen el header x-bot-secret automáticamente.
 * @module services/mlm-api.service
 */

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.MLM_BACKEND_URL ?? 'http://backend:3000/api',
  headers: {
    'Content-Type': 'application/json',
    'x-bot-secret': process.env.BOT_SECRET ?? '',
  },
  timeout: 10000,
});

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * User profile returned by the bot API.
 * Perfil de usuario retornado por la API del bot.
 */
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
}

/**
 * Wallet balance summary for a user.
 * Resumen de balance de wallet para un usuario.
 */
export interface WalletBalance {
  balance: number;
  pendingWithdrawals: number;
  totalEarned: number;
  currency: string;
}

/**
 * Binary network summary for a user.
 * Resumen de red binaria para un usuario.
 */
export interface NetworkSummary {
  totalReferrals: number;
  activeReferrals: number;
  leftLeg: number;
  rightLeg: number;
  level: number;
}

/**
 * Commission entry (simplified).
 * Entrada de comisión (simplificada).
 */
export interface Commission {
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

/**
 * Simplified property listing for bot prompts.
 * Listado simplificado de propiedad para prompts del bot.
 */
export interface BotProperty {
  /** Unique property identifier / Identificador único de propiedad */
  id: string;
  /** Property type: rental | sale | management / Tipo: alquiler | venta | gestión */
  type: string;
  /** Listing title / Título del listado */
  title: string;
  /** Listing price / Precio del listado */
  price: number;
  /** Price currency / Moneda del precio */
  currency: string;
  /** City where the property is located / Ciudad donde está la propiedad */
  city: string;
  /** Number of bedrooms (null if N/A) / Número de habitaciones (null si N/A) */
  bedrooms: number | null;
  /** Number of bathrooms (null if N/A) / Número de baños (null si N/A) */
  bathrooms: number | null;
  /** Area in square meters (null if N/A) / Área en metros cuadrados (null si N/A) */
  areaM2: number | null;
}

/**
 * Simplified tour package for bot prompts.
 * Paquete turístico simplificado para prompts del bot.
 */
export interface BotTour {
  /** Unique tour identifier / Identificador único del tour */
  id: string;
  /** Tour type (adventure, cultural, etc.) / Tipo de tour (aventura, cultural, etc.) */
  type: string;
  /** Package title / Título del paquete */
  title: string;
  /** Main destination / Destino principal */
  destination: string;
  /** Package price / Precio del paquete */
  price: number;
  /** Price currency / Moneda del precio */
  currency: string;
  /** Duration in days / Duración en días */
  durationDays: number;
  /** Maximum passenger capacity / Capacidad máxima de pasajeros */
  maxCapacity: number;
}

/**
 * Simplified reservation entry for bot responses.
 * Entrada de reserva simplificada para respuestas del bot.
 */
export interface BotReservation {
  /** Unique reservation identifier / Identificador único de reserva */
  id: string;
  /** Reservation type: property | tour / Tipo de reserva: propiedad | tour */
  type: 'property' | 'tour';
  /** Current status / Estado actual */
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  /** Property ID (if type = property) / ID de propiedad (si type = property) */
  propertyId?: string;
  /** Check-in date (if type = property) / Fecha de check-in (si type = property) */
  checkIn?: string;
  /** Check-out date (if type = property) / Fecha de check-out (si type = property) */
  checkOut?: string;
  /** Tour package ID (if type = tour) / ID de paquete turístico (si type = tour) */
  tourPackageId?: string;
  /** Tour date (if type = tour) / Fecha de tour (si type = tour) */
  tourDate?: string;
  /** Group size for tours / Tamaño del grupo para tours */
  groupSize: number;
  /** Total price / Precio total */
  totalPrice: number;
  /** Price currency / Moneda */
  currency: string;
  /** Payment status / Estado del pago */
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  /** Reservation creation date / Fecha de creación de la reserva */
  createdAt: string;
}

// ── Service methods ───────────────────────────────────────────────────────────

export const mlmApi = {
  /**
   * Get user profile by phone number.
   * Obtiene el perfil de usuario por número de teléfono.
   *
   * @param phone - WhatsApp phone number / Número de teléfono de WhatsApp
   * @returns User profile or null if not found / Perfil de usuario o null si no existe
   */
  async getUserByPhone(phone: string): Promise<UserProfile | null> {
    try {
      const { data } = await api.get(`/bot/user-by-phone/${phone}`);
      return data.user ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Get wallet balance for a user.
   * Obtiene el balance de wallet para un usuario.
   *
   * @param userId - User UUID / UUID del usuario
   * @returns Wallet balance or null / Balance de wallet o null
   */
  async getWalletBalance(userId: string): Promise<WalletBalance | null> {
    try {
      const { data } = await api.get(`/bot/wallet/${userId}`);
      return data.wallet ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Get network summary for a user.
   * Obtiene el resumen de red para un usuario.
   *
   * @param userId - User UUID / UUID del usuario
   * @returns Network summary or null / Resumen de red o null
   */
  async getNetworkSummary(userId: string): Promise<NetworkSummary | null> {
    try {
      const { data } = await api.get(`/bot/network/${userId}`);
      return data.network ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Get recent commissions for a user (last 5).
   * Obtiene las comisiones recientes de un usuario (últimas 5).
   *
   * @param userId - User UUID / UUID del usuario
   * @returns Array of commission entries / Array de entradas de comisión
   */
  async getRecentCommissions(userId: string): Promise<Commission[]> {
    try {
      const { data } = await api.get(`/bot/commissions/${userId}?limit=5`);
      return data.commissions ?? [];
    } catch {
      return [];
    }
  },

  /**
   * Search available properties by optional filters.
   * Busca propiedades disponibles con filtros opcionales.
   *
   * @param params - Optional filters: city, type, maxPrice, limit
   *                 Filtros opcionales: ciudad, tipo, precio máximo, límite
   * @returns Array of simplified property objects / Array de propiedades simplificadas
   */
  async searchProperties(params: {
    city?: string;
    type?: string;
    maxPrice?: number;
    limit?: number;
  }): Promise<BotProperty[]> {
    const res = await api.get('/bot/properties', { params });
    return res.data.properties ?? [];
  },

  /**
   * Search active tour packages by optional filters.
   * Busca paquetes turísticos activos con filtros opcionales.
   *
   * @param params - Optional filters: destination, type, maxPrice, limit
   *                 Filtros opcionales: destino, tipo, precio máximo, límite
   * @returns Array of simplified tour objects / Array de tours simplificados
   */
  async searchTours(params: {
    destination?: string;
    type?: string;
    maxPrice?: number;
    limit?: number;
  }): Promise<BotTour[]> {
    const res = await api.get('/bot/tours', { params });
    return res.data.tours ?? [];
  },

  /**
   * Get recent reservations for a user (property + tour combined).
   * Obtiene las reservas recientes de un usuario (propiedades + tours combinados).
   *
   * @param userId  - User UUID / UUID del usuario
   * @param params  - Optional filters: limit, status, type
   *                  Filtros opcionales: límite, estado, tipo
   * @returns Array of simplified reservation objects or empty array on error
   *          Array de reservas simplificadas o array vacío en error
   */
  async getReservations(
    userId: string,
    params: {
      limit?: number;
      status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
      type?: 'property' | 'tour';
    } = {}
  ): Promise<BotReservation[]> {
    try {
      const { data } = await api.get(`/bot/reservations/${userId}`, { params });
      return (data.reservations as BotReservation[]) ?? [];
    } catch {
      return [];
    }
  },
};
