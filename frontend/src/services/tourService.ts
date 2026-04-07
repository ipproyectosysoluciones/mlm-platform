/**
 * @fileoverview Tour Service - API client for tourism packages
 * @description HTTP methods for tour packages and availability (public and authenticated)
 *               Métodos HTTP para paquetes de turismo y disponibilidad (público y autenticado)
 * @module services/tourService
 * @author Nexo Real Development Team
 */

import api from './api';

// ============================================
// Types / Tipos
// ============================================

/**
 * Tour category enum matching backend TourPackage model
 * Enum de categoría de tour que coincide con el modelo de backend
 */
export type TourCategory =
  | 'adventure'
  | 'cultural'
  | 'relaxation'
  | 'gastronomic'
  | 'ecotourism'
  | 'luxury';

/**
 * Tour availability for a specific date
 * Disponibilidad de tour para una fecha específica
 */
export interface TourAvailability {
  id: string;
  tourPackageId: string;
  date: string;
  availableSpots: number;
  totalSpots: number;
}

/**
 * Tour package interface matching backend TourPackage model
 * Interfaz de paquete de tour que coincide con el modelo de backend
 */
export interface TourPackage {
  id: string;
  title: string;
  description: string;
  category: TourCategory;
  destination: string;
  duration: number;
  price: number;
  currency: string;
  maxGuests: number;
  images: string[];
  includes: string[];
  excludes: string[];
  isActive: boolean;
  availabilities?: TourAvailability[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Query params for tour listing
 * Parámetros de consulta para listado de tours
 */
export interface TourListParams {
  page?: number;
  limit?: number;
  category?: TourCategory;
  destination?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

/**
 * Paginated tour list response
 * Respuesta de listado de tours paginado
 */
export interface TourListResponse {
  data: TourPackage[];
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
 * @namespace tourService
 * @description Tour packages API methods / Métodos de API para paquetes de turismo
 */
export const tourService = {
  /**
   * Get paginated list of tour packages with optional filters
   * Obtener listado paginado de paquetes de tours con filtros opcionales
   * @param {TourListParams} params - Query parameters / Parámetros de consulta
   * @returns {Promise<TourListResponse>} Paginated tour list / Listado paginado de tours
   */
  getTours: async (params?: TourListParams): Promise<TourListResponse> => {
    const response = await api.get<{ success: boolean; data: TourListResponse }>('/tours', {
      params,
    });
    return response.data.data!;
  },

  /**
   * Get a single tour package by ID (includes future availabilities)
   * Obtener un paquete de tour por ID (incluye disponibilidades futuras)
   * @param {string} id - Tour ID / ID del tour
   * @returns {Promise<TourPackage>} Tour data with availabilities / Datos del tour con disponibilidades
   */
  getTour: async (id: string): Promise<TourPackage> => {
    const response = await api.get<{ success: boolean; data: TourPackage }>(`/tours/${id}`);
    return response.data.data!;
  },
};

export default tourService;
