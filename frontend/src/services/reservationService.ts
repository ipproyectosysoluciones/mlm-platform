/**
 * @fileoverview Reservation Service - API client for property and tour reservations
 * @description HTTP methods for creating, listing, and cancelling reservations
 *               Métodos HTTP para crear, listar y cancelar reservas
 * @module services/reservationService
 * @author Nexo Real Development Team
 */

import api from './api';

// ============================================
// Types / Tipos
// ============================================

/**
 * Reservation status enum matching backend Reservation model
 * Enum de estado de reserva que coincide con el modelo de backend
 */
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

/**
 * Payment status enum
 * Enum de estado de pago
 */
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

/**
 * Reservation interface matching backend Reservation model
 * Interfaz de reserva que coincide con el modelo de backend
 */
export interface Reservation {
  id: string;
  userId: string;
  propertyId?: string;
  tourPackageId?: string;
  tourAvailabilityId?: string;
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  checkIn?: string;
  checkOut?: string;
  guests: number;
  totalAmount: number;
  currency: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Populated relations
  property?: { id: string; title: string; address: string; city: string; images: string[] };
  tourPackage?: { id: string; title: string; destination: string; images: string[] };
}

/**
 * Payload for creating a new reservation
 * Payload para crear una nueva reserva
 */
export interface CreateReservationPayload {
  propertyId?: string;
  tourPackageId?: string;
  tourAvailabilityId?: string;
  checkIn?: string;
  checkOut?: string;
  guests: number;
  notes?: string;
}

/**
 * Query params for reservation listing
 * Parámetros de consulta para listado de reservas
 */
export interface ReservationListParams {
  page?: number;
  limit?: number;
  status?: ReservationStatus;
}

/**
 * Paginated reservation list response
 * Respuesta de listado de reservas paginado
 */
export interface ReservationListResponse {
  data: Reservation[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// Service / Servicio
// ============================================

/**
 * @namespace reservationService
 * @description Reservation API methods / Métodos de API para reservas
 */
export const reservationService = {
  /**
   * Get the current user's reservations
   * Obtener las reservas del usuario actual
   * @param {ReservationListParams} params - Query parameters / Parámetros de consulta
   * @returns {Promise<ReservationListResponse>} Paginated reservations / Reservas paginadas
   */
  getMyReservations: async (params?: ReservationListParams): Promise<ReservationListResponse> => {
    const response = await api.get<{ success: boolean; data: ReservationListResponse }>(
      '/reservations',
      { params }
    );
    return response.data.data!;
  },

  /**
   * Get a single reservation by ID
   * Obtener una reserva por ID
   * @param {string} id - Reservation ID / ID de la reserva
   * @returns {Promise<Reservation>} Reservation data / Datos de la reserva
   */
  getReservation: async (id: string): Promise<Reservation> => {
    const response = await api.get<{ success: boolean; data: Reservation }>(`/reservations/${id}`);
    return response.data.data!;
  },

  /**
   * Create a new reservation (property or tour)
   * Crear una nueva reserva (propiedad o tour)
   * @param {CreateReservationPayload} data - Reservation data / Datos de la reserva
   * @returns {Promise<Reservation>} Created reservation / Reserva creada
   */
  createReservation: async (data: CreateReservationPayload): Promise<Reservation> => {
    const response = await api.post<{ success: boolean; data: Reservation }>('/reservations', data);
    return response.data.data!;
  },

  /**
   * Cancel a reservation
   * Cancelar una reserva
   * @param {string} id - Reservation ID / ID de la reserva
   * @returns {Promise<Reservation>} Updated reservation / Reserva actualizada
   */
  cancelReservation: async (id: string): Promise<Reservation> => {
    const response = await api.patch<{ success: boolean; data: Reservation }>(
      `/reservations/${id}/cancel`
    );
    return response.data.data!;
  },
};

export default reservationService;
