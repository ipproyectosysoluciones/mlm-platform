/**
 * @fileoverview API Service - Axios HTTP client configuration
 * @description Centralized API client for backend communication with interceptors
 *               Cliente HTTP centralizado para comunicación con el backend
 * @module services/api
 */

import axios from 'axios';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  DashboardData,
  TreeNode,
  User,
  UserDetails,
} from '../types';

/** @constant {string} API_URL - Backend base URL / URL base del backend */
const API_URL = 'http://localhost:3000/api';

/**
 * Axios instance with default config and interceptors
 * Instancia de Axios con configuración por defecto e interceptores
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor to add auth token
 * Interceptor de requests para agregar token de auth
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * @namespace authService
 * @description Authentication API methods / Métodos de API de autenticación
 */
export const authService = {
  /**
   * Login user
   * Iniciar sesión de usuario
   * @param {LoginRequest} data - Login credentials / Credenciales de login
   * @returns {Promise<AuthResponse>} Auth response with token and user / Respuesta con token y usuario
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', data);
    return response.data.data!;
  },

  /**
   * Register new user
   * Registrar nuevo usuario
   * @param {RegisterRequest} data - Registration data / Datos de registro
   * @returns {Promise<AuthResponse>} Auth response with token and user / Respuesta con token y usuario
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<{ success: boolean; data: AuthResponse }>(
      '/auth/register',
      data
    );
    return response.data.data!;
  },

  /**
   * Get current user profile
   * Obtener perfil del usuario actual
   * @returns {Promise} API response with user data / Respuesta de API con datos de usuario
   */
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: { firstName?: string; lastName?: string; phone?: string }) => {
    const response = await api.patch('/users/me', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/users/me/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  deleteAccount: async (password: string) => {
    const response = await api.post('/users/me/delete', { password });
    return response.data;
  },
};

/**
 * @namespace dashboardService
 * @description Dashboard API methods / Métodos de API del dashboard
 */
export const dashboardService = {
  /**
   * Get dashboard data with stats
   * Obtener datos del dashboard con estadísticas
   * @returns {Promise<DashboardData>} Dashboard data / Datos del dashboard
   */
  getDashboard: async (): Promise<DashboardData> => {
    const response = await api.get<{ success: boolean; data: DashboardData }>('/dashboard');
    return response.data.data!;
  },
};

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
};

/**
 * @namespace treeService
 * @description Binary tree API methods / Métodos de API del árbol binario
 */
export const treeService = {
  /**
   * Get tree for specific user
   * Obtener árbol de usuario específico
   * @param {string} userId - User ID / ID de usuario
   * @param {number} [maxDepth] - Maximum depth to retrieve / Profundidad máxima a recuperar
   * @param {number} [page] - Page number for pagination / Número de página
   * @param {number} [limit] - Items per page / Items por página
   * @returns {Promise<TreeNode>} Tree node data / Datos del nodo del árbol
   */
  getTree: async (
    userId: string,
    maxDepth?: number,
    page?: number,
    limit?: number
  ): Promise<TreeNode> => {
    const params = new URLSearchParams();
    if (maxDepth) params.append('depth', maxDepth.toString());
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const queryString = params.toString();
    const response = await api.get<{ success: boolean; data: TreeNode }>(
      `/users/${userId}/tree${queryString ? `?${queryString}` : ''}`
    );
    return response.data.data!;
  },

  /**
   * Get current user's tree
   * Obtener árbol del usuario actual
   * @param {number} [maxDepth] - Maximum depth to retrieve / Profundidad máxima a recuperar
   * @param {number} [page] - Page number for pagination / Número de página
   * @param {number} [limit] - Items per page / Items por página
   * @returns {Promise<TreeNode>} Tree node data / Datos del nodo del árbol
   */
  getMyTree: async (maxDepth?: number, page?: number, limit?: number): Promise<TreeNode> => {
    const params = new URLSearchParams();
    if (maxDepth) params.append('depth', maxDepth.toString());
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const queryString = params.toString();
    const response = await api.get<{ success: boolean; data: TreeNode }>(
      `/users/me/tree${queryString ? `?${queryString}` : ''}`
    );
    return response.data.data!;
  },
};

/**
 * @namespace userService
 * @description User API methods (Phase 3) / Métodos de API de usuario
 */
export const userService = {
  /**
   * Search users in current user's network
   * Busca usuarios en la red del usuario actual
   * @param {string} query - Search term (email or referral code) / Término de búsqueda
   * @param {number} [limit] - Results limit / Límite de resultados
   * @returns {Promise<User[]>} Array of matching users / Array de usuarios coincidentes
   */
  searchUsers: async (query: string, limit?: number): Promise<User[]> => {
    const params = new URLSearchParams({ q: query });
    if (limit) params.append('limit', limit.toString());
    const response = await api.get<{ success: boolean; data: User[] }>(
      `/users/search?${params.toString()}`
    );
    return response.data.data || [];
  },

  /**
   * Get detailed information about a user
   * Obtiene información detallada de un usuario
   * @param {string} userId - User ID / ID de usuario
   * @returns {Promise<UserDetails>} User details / Detalles del usuario
   */
  getUserDetails: async (userId: string): Promise<UserDetails> => {
    const response = await api.get<{ success: boolean; data: UserDetails }>(
      `/users/${userId}/details`
    );
    return response.data.data!;
  },
};

export default api;
