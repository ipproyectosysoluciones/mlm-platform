/**
 * @fileoverview Property Service - API client for property listings
 * @description HTTP methods for real estate property listings (public and authenticated)
 *               Métodos HTTP para listados de propiedades inmobiliarias (público y autenticado)
 * @module services/propertyService
 * @author Nexo Real Development Team
 */

import api from './api';

// ============================================
// Types / Tipos
// ============================================

/**
 * Property type enum
 * Enum de tipo de propiedad
 */
export type PropertyType = 'rental' | 'sale' | 'management';

/**
 * Property status enum
 * Enum de estado de propiedad
 */
export type PropertyStatus = 'active' | 'inactive' | 'sold' | 'rented';

/**
 * Property interface matching backend Property model
 * Interfaz de propiedad que coincide con el modelo de backend
 */
export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  currency: string;
  address: string;
  city: string;
  country: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  images: string[];
  amenities: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Query params for property listing
 * Parámetros de consulta para listado de propiedades
 */
export interface PropertyListParams {
  page?: number;
  limit?: number;
  type?: PropertyType;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

/**
 * Paginated property list response
 * Respuesta de listado de propiedades paginado
 */
export interface PropertyListResponse {
  data: Property[];
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
 * @namespace propertyService
 * @description Property listings API methods / Métodos de API para listados de propiedades
 */
export const propertyService = {
  /**
   * Get paginated list of properties with optional filters
   * Obtener listado paginado de propiedades con filtros opcionales
   * @param {PropertyListParams} params - Query parameters / Parámetros de consulta
   * @returns {Promise<PropertyListResponse>} Paginated property list / Listado paginado de propiedades
   */
  getProperties: async (params?: PropertyListParams): Promise<PropertyListResponse> => {
    const response = await api.get<{ success: boolean; data: PropertyListResponse }>(
      '/properties',
      { params }
    );
    return (
      response.data.data ?? {
        data: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
      }
    );
  },

  /**
   * Get a single property by ID
   * Obtener una propiedad por ID
   * @param {string} id - Property ID / ID de la propiedad
   * @returns {Promise<Property>} Property data / Datos de la propiedad
   */
  getProperty: async (id: string): Promise<Property> => {
    const response = await api.get<{ success: boolean; data: Property }>(`/properties/${id}`);
    return response.data.data ?? ({} as Property);
  },
};

export default propertyService;
