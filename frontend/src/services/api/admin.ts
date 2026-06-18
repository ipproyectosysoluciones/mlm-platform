/**
 * @fileoverview Admin service - Admin API methods
 * @module services/api/admin
 */
import api from './client';

/**
 * @namespace adminService
 * @description Admin API methods / Métodos de API de administración
 */
export const adminService = {
  /**
   * Get global statistics
   * Obtener estadísticas globales
   */
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  /**
   * Get all users with pagination
   * Obtener todos los usuarios con paginación
   */
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  /**
   * Get user by ID
   * Obtener usuario por ID
   */
  getUserById: async (userId: string) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Update user status
   * Actualizar estado del usuario
   */
  updateUserStatus: async (userId: string, status: 'active' | 'inactive') => {
    const response = await api.patch(`/admin/users/${userId}/status`, { status });
    return response.data;
  },

  /**
   * Promote user to admin
   * Promover usuario a admin
   */
  promoteToAdmin: async (userId: string) => {
    const response = await api.patch(`/admin/users/${userId}/promote`);
    return response.data;
  },

  /**
   * Get commissions report
   * Obtener reporte de comisiones
   */
  getCommissionsReport: async (params?: {
    startDate?: string;
    endDate?: string;
    type?: string;
  }) => {
    const response = await api.get('/admin/reports/commissions', { params });
    return response.data;
  },

  /**
   * Get all commission configs
   * Obtener todas las configuraciones de comisiones
   */
  getCommissionConfigs: async () => {
    const response = await api.get('/admin/commissions/config');
    return response.data;
  },

  /**
   * Get commission config by ID
   * Obtener configuración de comisión por ID
   */
  getCommissionConfigById: async (id: string) => {
    const response = await api.get(`/admin/commissions/config/${id}`);
    return response.data;
  },

  /**
   * Create commission config
   * Crear configuración de comisión
   */
  createCommissionConfig: async (data: {
    businessType: string;
    customBusinessName?: string;
    level: string;
    percentage: number;
  }) => {
    const response = await api.post('/admin/commissions/config', data);
    return response.data;
  },

  /**
   * Update commission config
   * Actualizar configuración de comisión
   */
  updateCommissionConfig: async (id: string, data: { percentage?: number; isActive?: boolean }) => {
    const response = await api.put(`/admin/commissions/config/${id}`, data);
    return response.data;
  },

  /**
   * Delete commission config
   * Eliminar configuración de comisión
   */
  deleteCommissionConfig: async (id: string) => {
    const response = await api.delete(`/admin/commissions/config/${id}`);
    return response.data;
  },

  /**
   * Get active commission rates for a business type
   * Obtener tasas de comisión activas para un tipo de negocio
   */
  getCommissionRates: async (businessType: string) => {
    const response = await api.get(`/admin/commissions/rates/${businessType}`);
    return response.data;
  },

  // ============================================
  // ADMIN — Properties CRUD
  // Propiedades — CRUD administrador
  // ============================================

  /**
   * List properties with optional filters and pagination (admin)
   * Listar propiedades con filtros opcionales y paginación (admin)
   * @param {object} [params] - Query params / Parámetros de consulta
   * @param {number} [params.page] - Page number / Número de página
   * @param {number} [params.limit] - Items per page / Items por página
   * @param {string} [params.status] - Filter by status (available|rented|sold|paused) / Filtrar por estado
   * @param {string} [params.type] - Filter by type (rental|sale|management) / Filtrar por tipo
   * @param {string} [params.city] - Filter by city / Filtrar por ciudad
   */
  getAdminProperties: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    city?: string;
  }) => {
    const response = await api.get('/admin/properties', { params });
    return response.data;
  },

  /**
   * Create a new property (admin)
   * Crear una nueva propiedad (admin)
   * @param {object} data - Property data / Datos de la propiedad
   */
  createProperty: async (data: {
    type: 'rental' | 'sale' | 'management';
    title: string;
    titleEn?: string;
    description?: string;
    descriptionEn?: string;
    price: number;
    currency?: string;
    priceNegotiable?: boolean;
    bedrooms?: number;
    bathrooms?: number;
    areaM2?: number;
    address: string;
    city: string;
    country?: string;
    lat?: number;
    lng?: number;
    amenities?: string[];
    status?: 'available' | 'rented' | 'sold' | 'paused';
  }) => {
    const response = await api.post('/admin/properties', data);
    return response.data;
  },

  /**
   * Update a property by ID (admin)
   * Actualizar una propiedad por ID (admin)
   * @param {string} id - Property ID / ID de la propiedad
   * @param {object} data - Fields to update / Campos a actualizar
   */
  updateProperty: async (
    id: string,
    data: Partial<{
      type: 'rental' | 'sale' | 'management';
      title: string;
      titleEn: string;
      description: string;
      descriptionEn: string;
      price: number;
      currency: string;
      priceNegotiable: boolean;
      bedrooms: number;
      bathrooms: number;
      areaM2: number;
      address: string;
      city: string;
      country: string;
      lat: number;
      lng: number;
      amenities: string[];
      status: 'available' | 'rented' | 'sold' | 'paused';
    }>
  ) => {
    const response = await api.put(`/admin/properties/${id}`, data);
    return response.data;
  },

  /**
   * Delete a property by ID (admin)
   * Eliminar una propiedad por ID (admin)
   * @param {string} id - Property ID / ID de la propiedad
   */
  deleteProperty: async (id: string) => {
    const response = await api.delete(`/admin/properties/${id}`);
    return response.data;
  },

  // ============================================
  // ADMIN — Tours CRUD
  // Tours — CRUD administrador
  // ============================================

  /**
   * List tour packages with optional filters and pagination (admin)
   * Listar paquetes turísticos con filtros opcionales y paginación (admin)
   * @param {object} [params] - Query params / Parámetros de consulta
   * @param {number} [params.page] - Page number / Número de página
   * @param {number} [params.limit] - Items per page / Items por página
   * @param {string} [params.status] - Filter by status (active|inactive|draft) / Filtrar por estado
   * @param {string} [params.destination] - Filter by destination / Filtrar por destino
   * @param {string} [params.type] - Filter by type / Filtrar por tipo
   */
  getAdminTours: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    destination?: string;
    type?: string;
  }) => {
    const response = await api.get('/admin/tours', { params });
    return response.data;
  },

  /**
   * Create a new tour package (admin)
   * Crear un nuevo paquete turístico (admin)
   * @param {object} data - Tour package data / Datos del paquete turístico
   */
  createTour: async (data: {
    type: 'adventure' | 'cultural' | 'relaxation' | 'gastronomic' | 'ecotourism' | 'luxury';
    title: string;
    titleEn?: string;
    description?: string;
    descriptionEn?: string;
    destination: string;
    country?: string;
    durationDays: number;
    price: number;
    currency?: string;
    priceIncludes?: string[];
    priceExcludes?: string[];
    maxCapacity?: number;
    minGroupSize?: number;
    status?: 'active' | 'inactive' | 'draft';
  }) => {
    const response = await api.post('/admin/tours', data);
    return response.data;
  },

  /**
   * Update a tour package by ID (admin)
   * Actualizar un paquete turístico por ID (admin)
   * @param {string} id - Tour package ID / ID del paquete turístico
   * @param {object} data - Fields to update / Campos a actualizar
   */
  updateTour: async (
    id: string,
    data: Partial<{
      type: 'adventure' | 'cultural' | 'relaxation' | 'gastronomic' | 'ecotourism' | 'luxury';
      title: string;
      titleEn: string;
      description: string;
      descriptionEn: string;
      destination: string;
      country: string;
      durationDays: number;
      price: number;
      currency: string;
      priceIncludes: string[];
      priceExcludes: string[];
      maxCapacity: number;
      minGroupSize: number;
      status: 'active' | 'inactive' | 'draft';
    }>
  ) => {
    const response = await api.put(`/admin/tours/${id}`, data);
    return response.data;
  },

  /**
   * Delete a tour package by ID (admin)
   * Eliminar un paquete turístico por ID (admin)
   * @param {string} id - Tour package ID / ID del paquete turístico
   */
  deleteTour: async (id: string) => {
    const response = await api.delete(`/admin/tours/${id}`);
    return response.data;
  },

  // ============================================
  // ADMIN — Reservations
  // Reservas — administrador
  // ============================================

  /**
   * List reservations with optional filters and pagination (admin)
   * Listar reservas con filtros opcionales y paginación (admin)
   * @param {object} [params] - Query params / Parámetros de consulta
   * @param {number} [params.page] - Page number / Número de página
   * @param {number} [params.limit] - Items per page / Items por página
   * @param {string} [params.type] - Filter by type (property|tour) / Filtrar por tipo
   * @param {string} [params.status] - Filter by status / Filtrar por estado
   * @param {string} [params.userId] - Filter by user ID / Filtrar por ID de usuario
   */
  getAdminReservations: async (params?: {
    page?: number;
    limit?: number;
    type?: 'property' | 'tour';
    status?: string;
    userId?: string;
  }) => {
    const response = await api.get('/admin/reservations', { params });
    return response.data;
  },

  /**
   * Update reservation status and optional admin notes (admin)
   * Actualizar estado de reserva y notas opcionales del admin (admin)
   * @param {string} id - Reservation ID / ID de la reserva
   * @param {string} status - New status / Nuevo estado
   * @param {string} [adminNotes] - Optional admin notes / Notas opcionales del admin
   */
  updateReservationStatus: async (id: string, status: string, adminNotes?: string) => {
    const response = await api.put(`/admin/reservations/${id}`, { status, adminNotes });
    return response.data;
  },

  /**
   * Confirm a reservation (admin)
   * Confirmar una reserva (admin)
   * @param {string} id - Reservation ID / ID de la reserva
   */
  confirmReservation: async (id: string) => {
    const response = await api.post(`/admin/reservations/${id}/confirm`);
    return response.data;
  },

  /**
   * Cancel a reservation (admin)
   * Cancelar una reserva (admin)
   * @param {string} id - Reservation ID / ID de la reserva
   * @param {string} [reason] - Cancellation reason / Razón de cancelación
   */
  cancelReservation: async (id: string, reason?: string) => {
    const response = await api.post(`/admin/reservations/${id}/cancel`, { reason });
    return response.data;
  },
};
