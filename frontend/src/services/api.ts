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
  Product,
  ProductListParams,
  ProductListResponse,
  Order,
  OrderListParams,
  OrderListResponse,
  CreateOrderRequest,
  StreamingPlatform,
  WalletBalance,
  WithdrawalRequest,
  TransactionListParams,
  TransactionListResponse,
  CryptoPrices,
  CreateProductPayload,
  UpdateProductPayload,
  InventoryReservePayload,
  InventoryReleasePayload,
  InventoryAdjustPayload,
  InventoryInitialPayload,
  InventoryReturnPayload,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  Vendor,
  VendorRegistrationPayload,
  VendorDashboard,
  VendorPayoutRequest,
} from '../types';

/** @constant {string} API_URL - Backend base URL / URL base del backend */
const API_URL = import.meta.env.VITE_API_URL || '/api';

/** @constant {string} CF_ACCESS_CLIENT_ID - Cloudflare Access Client ID */
const CF_ACCESS_CLIENT_ID = import.meta.env.VITE_CF_ACCESS_CLIENT_ID;

/** @constant {string} CF_ACCESS_CLIENT_SECRET - Cloudflare Access Client Secret */
const CF_ACCESS_CLIENT_SECRET = import.meta.env.VITE_CF_ACCESS_CLIENT_SECRET;

/**
 * Axios instance with default config and interceptors
 * Instancia de Axios con configuración por defecto e interceptores
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    // Cloudflare Access headers (if configured)
    ...(CF_ACCESS_CLIENT_ID &&
      CF_ACCESS_CLIENT_SECRET && {
        'CF-Access-Client-Id': CF_ACCESS_CLIENT_ID,
        'CF-Access-Client-Secret': CF_ACCESS_CLIENT_SECRET,
      }),
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
    const response = await api.get<{ success: boolean; data: { tree: TreeNode; stats: any } }>(
      `/users/${userId}/tree${queryString ? `?${queryString}` : ''}`
    );
    // API returns { tree: {...}, stats: {...} so we need to extract just the tree
    return response.data.data!.tree;
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
    const response = await api.get<{ success: boolean; data: { tree: TreeNode; stats: any } }>(
      `/users/me/tree${queryString ? `?${queryString}` : ''}`
    );
    // API returns { tree: {...}, stats: {...} so we need to extract just the tree
    return response.data.data!.tree;
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

/**
 * @namespace crmService
 * @description CRM API methods / Métodos de API de CRM
 */
export const crmService = {
  /**
   * Get leads list
   * Obtener lista de leads
   */
  getLeads: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    source?: string;
    search?: string;
    createdAtFrom?: string;
    createdAtTo?: string;
    valueMin?: number;
    valueMax?: number;
    nextFollowUpFrom?: string;
    nextFollowUpTo?: string;
  }) => {
    const response = await api.get('/crm', { params });
    return response.data;
  },

  /**
   * Get lead by ID
   * Obtener lead por ID
   */
  getLead: async (leadId: string) => {
    const response = await api.get(`/crm/${leadId}`);
    return response.data;
  },

  /**
   * Create new lead
   * Crear nuevo lead
   */
  createLead: async (data: {
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    company?: string;
    source?: string;
    notes?: string;
  }) => {
    const response = await api.post('/crm', data);
    return response.data;
  },

  /**
   * Import leads from CSV
   * Importar leads desde CSV
   */
  importLeads: async (csv: string) => {
    const response = await api.post('/crm/import', { csv });
    return response.data;
  },

  /**
   * Export leads to CSV
   * Exportar leads a CSV
   */
  exportLeads: async (params?: { status?: string; source?: string; search?: string }) => {
    const response = await api.get('/crm/export', { params, responseType: 'blob' });
    return response.data;
  },

  /**
   * Update lead
   * Actualizar lead
   */
  updateLead: async (
    leadId: string,
    data: Partial<{
      contactName: string;
      contactEmail: string;
      contactPhone: string;
      company: string;
      status: string;
      notes: string;
    }>
  ) => {
    const response = await api.patch(`/crm/${leadId}`, data);
    return response.data;
  },

  /**
   * Delete lead
   * Eliminar lead
   */
  deleteLead: async (leadId: string) => {
    const response = await api.delete(`/crm/${leadId}`);
    return response.data;
  },

  /**
   * Get CRM stats
   * Obtener estadísticas de CRM
   */
  getStats: async () => {
    const response = await api.get('/crm/stats');
    return response.data;
  },

  /**
   * Create task for lead
   * Crear tarea para lead
   */
  createTask: async (
    leadId: string,
    data: {
      title: string;
      description?: string;
      dueDate?: string;
      type?: string;
    }
  ) => {
    const response = await api.post(`/crm/${leadId}/tasks`, data);
    return response.data;
  },

  /**
   * Get tasks for lead
   * Obtener tareas de lead
   */
  getTasks: async (leadId: string) => {
    const response = await api.get(`/crm/${leadId}/tasks`);
    return response.data;
  },

  /**
   * Update task
   * Actualizar tarea
   */
  updateTask: async (
    taskId: string,
    data: { status?: string; title?: string; description?: string }
  ) => {
    const response = await api.patch(`/crm/tasks/${taskId}`, data);
    return response.data;
  },

  /**
   * Delete task
   * Eliminar tarea
   */
  deleteTask: async (taskId: string) => {
    const response = await api.delete(`/crm/tasks/${taskId}`);
    return response.data;
  },

  /**
   * Get upcoming tasks
   * Obtener tareas próximas
   */
  getUpcomingTasks: async () => {
    const response = await api.get('/crm/tasks');
    return response.data;
  },

  /**
   * Add communication to lead
   * Agregar comunicación a lead
   */
  addCommunication: async (
    leadId: string,
    data: {
      type: string;
      subject?: string;
      content: string;
      direction?: string;
    }
  ) => {
    const response = await api.post(`/crm/${leadId}/communications`, data);
    return response.data;
  },

  /**
   * Get communications for lead
   * Obtener comunicaciones de lead
   */
  getCommunications: async (leadId: string) => {
    const response = await api.get(`/crm/${leadId}/communications`);
    return response.data;
  },

  /**
   * Get analytics report by period
   * Obtener reporte de analítica por período
   */
  getAnalyticsReport: async (params?: {
    period?: 'week' | 'month' | 'quarter' | 'year';
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await api.get('/crm/analytics/report', { params });
    return response.data;
  },

  /**
   * Get CRM alerts
   * Obtener alertas de CRM
   */
  getAlerts: async (params?: { daysInactive?: number }) => {
    const response = await api.get('/crm/alerts', { params });
    return response.data;
  },

  /**
   * Export analytics report to CSV
   * Exportar reporte de analítica a CSV
   */
  exportAnalyticsReport: async (params?: {
    period?: 'week' | 'month' | 'quarter' | 'year';
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await api.get('/crm/analytics/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

/**
 * @namespace productService
 * @description Product API methods - Streaming subscriptions catalog / Métodos de API de productos
 */
export const productService = {
  /**
   * Get list of products with optional filtering and pagination
   * Obtener lista de productos con filtrado y paginación opcionales
   * @param {ProductListParams} params - Query parameters / Parámetros de consulta
   * @returns {Promise<ProductListResponse>} Product list response / Respuesta de lista de productos
   */
  getProducts: async (params?: ProductListParams): Promise<ProductListResponse> => {
    const response = await api.get<{ success: boolean; data: ProductListResponse }>('/products', {
      params,
    });
    return response.data.data!;
  },

  /**
   * Get single product by ID
   * Obtener producto por ID
   * @param {string} productId - Product ID / ID del producto
   * @returns {Promise<Product>} Product data / Datos del producto
   */
  getProduct: async (productId: string): Promise<Product> => {
    const response = await api.get<{ success: boolean; data: Product }>(`/products/${productId}`);
    return response.data.data!;
  },

  /**
   * Get products filtered by platform
   * Obtener productos filtrados por plataforma
   * @param {StreamingPlatform} platform - Platform to filter by / Plataforma a filtrar
   * @param {number} [limit] - Results limit / Límite de resultados
   * @returns {Promise<Product[]>} Array of products / Array de productos
   */
  getProductsByPlatform: async (
    platform: StreamingPlatform,
    limit?: number
  ): Promise<Product[]> => {
    const params: ProductListParams = { platform };
    if (limit) params.limit = limit;
    const response = await api.get<{ success: boolean; data: Product[] }>('/products', {
      params,
    });
    return response.data.data || [];
  },
};

/**
 * @namespace adminProductService
 * @description Admin Product API methods - Full CRUD + inventory management
 */
export const adminProductService = {
  /**
   * Get all products (admin view)
   */
  getProducts: async (params?: ProductListParams) => {
    const response = await api.get('/admin/products', { params });
    return response.data;
  },

  /**
   * Get product by ID (admin view)
   */
  getProduct: async (productId: string) => {
    const response = await api.get(`/admin/products/${productId}`);
    return response.data;
  },

  /**
   * Create a new product
   */
  createProduct: async (data: CreateProductPayload) => {
    const response = await api.post('/admin/products', data);
    return response.data;
  },

  /**
   * Update a product
   */
  updateProduct: async (productId: string, data: UpdateProductPayload) => {
    const response = await api.put(`/admin/products/${productId}`, data);
    return response.data;
  },

  /**
   * Delete a product (soft delete)
   */
  deleteProduct: async (productId: string) => {
    const response = await api.delete(`/admin/products/${productId}`);
    return response.data;
  },

  // Inventory management
  /**
   * Reserve stock
   */
  reserveStock: async (productId: string, data: InventoryReservePayload) => {
    const response = await api.post(`/admin/products/${productId}/inventory/reserve`, data);
    return response.data;
  },

  /**
   * Release stock
   */
  releaseStock: async (productId: string, data: InventoryReleasePayload) => {
    const response = await api.post(`/admin/products/${productId}/inventory/release`, data);
    return response.data;
  },

  /**
   * Adjust stock manually
   */
  adjustStock: async (productId: string, data: InventoryAdjustPayload) => {
    const response = await api.post(`/admin/products/${productId}/inventory/adjust`, data);
    return response.data;
  },

  /**
   * Set initial stock
   */
  setInitialStock: async (productId: string, data: InventoryInitialPayload) => {
    const response = await api.post(`/admin/products/${productId}/inventory/initial`, data);
    return response.data;
  },

  /**
   * Record return
   */
  recordReturn: async (productId: string, data: InventoryReturnPayload) => {
    const response = await api.post(`/admin/products/${productId}/inventory/return`, data);
    return response.data;
  },

  /**
   * Get inventory movements
   */
  getInventoryMovements: async (productId: string, limit?: number) => {
    const response = await api.get(`/admin/products/${productId}/inventory/movements`, {
      params: { limit },
    });
    return response.data;
  },
};

/**
 * @namespace categoryService
 * @description Category API methods - Category management
 */
export const categoryService = {
  /**
   * Get category tree
   */
  getTree: async (includeInactive?: boolean) => {
    const response = await api.get('/categories/tree', {
      params: { includeInactive },
    });
    return response.data;
  },

  /**
   * Get category by ID
   */
  getCategory: async (categoryId: string) => {
    const response = await api.get(`/categories/${categoryId}`);
    return response.data;
  },

  /**
   * Get breadcrumb for category
   */
  getBreadcrumb: async (categoryId: string) => {
    const response = await api.get(`/categories/${categoryId}/breadcrumb`);
    return response.data;
  },

  /**
   * List all categories
   */
  listCategories: async (params?: {
    includeInactive?: boolean;
    parentId?: string;
    isActive?: boolean;
  }) => {
    const response = await api.get('/categories', { params });
    return response.data;
  },

  // Admin methods
  /**
   * List all categories (admin)
   */
  listCategoriesAdmin: async (params?: { includeInactive?: boolean; parentId?: string }) => {
    const response = await api.get('/admin/categories', { params });
    return response.data;
  },

  /**
   * Get category by ID (admin)
   */
  getCategoryAdmin: async (categoryId: string) => {
    const response = await api.get(`/admin/categories/${categoryId}`);
    return response.data;
  },

  /**
   * Create a new category
   */
  createCategory: async (data: CreateCategoryPayload) => {
    const response = await api.post('/admin/categories', data);
    return response.data;
  },

  /**
   * Update a category
   */
  updateCategory: async (categoryId: string, data: UpdateCategoryPayload) => {
    const response = await api.put(`/admin/categories/${categoryId}`, data);
    return response.data;
  },

  /**
   * Delete a category
   */
  deleteCategory: async (categoryId: string) => {
    const response = await api.delete(`/admin/categories/${categoryId}`);
    return response.data;
  },
};

/**
 * @namespace orderService
 * @description Order API methods - Purchase orders / Métodos de API de órdenes
 */
export const orderService = {
  /**
   * Create a new order (purchase)
   * Crear una nueva orden (compra)
   * @param {CreateOrderRequest} data - Order data / Datos de la orden
   * @returns {Promise<Order>} Created order / Orden creada
   */
  createOrder: async (data: CreateOrderRequest): Promise<Order> => {
    const response = await api.post<{ success: boolean; data: Order }>('/orders', data);
    return response.data.data!;
  },

  /**
   * Get current user's orders
   * Obtener órdenes del usuario actual
   * @param {OrderListParams} params - Query parameters / Parámetros de consulta
   * @returns {Promise<OrderListResponse>} Order list response / Respuesta de lista de órdenes
   */
  getOrders: async (params?: OrderListParams): Promise<OrderListResponse> => {
    const response = await api.get<{ success: boolean; data: OrderListResponse }>('/orders', {
      params,
    });
    return response.data.data!;
  },

  /**
   * Get single order by ID
   * Obtener orden por ID
   * @param {string} orderId - Order ID / ID de la orden
   * @returns {Promise<Order>} Order data / Datos de la orden
   */
  getOrder: async (orderId: string): Promise<Order> => {
    const response = await api.get<{ success: boolean; data: Order }>(`/orders/${orderId}`);
    return response.data.data!;
  },

  /**
   * Get order details with product info
   * Obtener detalles de la orden con info del producto
   * @param {string} orderId - Order ID / ID de la orden
   * @returns {Promise<Order>} Order with product data / Orden con datos del producto
   */
  getOrderWithProduct: async (orderId: string): Promise<Order> => {
    const response = await api.get<{ success: boolean; data: Order }>(`/orders/${orderId}`);
    return response.data.data!;
  },
};

/**
 * @namespace walletService
 * @description Wallet API methods - Digital wallet operations / Métodos de API del wallet
 */
export const walletService = {
  /**
   * Get wallet balance
   * Obtener balance del wallet
   * @returns {Promise<WalletBalance>} Wallet balance / Balance del wallet
   */
  getBalance: async (): Promise<WalletBalance> => {
    const response = await api.get<{ success: boolean; data: WalletBalance }>('/wallet');
    return response.data.data!;
  },

  /**
   * Get wallet transactions
   * Obtener transacciones del wallet
   * @param {TransactionListParams} params - Query parameters / Parámetros de consulta
   * @returns {Promise<TransactionListResponse>} Transaction list response / Respuesta de lista de transacciones
   */
  getTransactions: async (params?: TransactionListParams): Promise<TransactionListResponse> => {
    const response = await api.get<{ success: boolean; data: TransactionListResponse }>(
      '/wallet/transactions',
      { params }
    );
    return response.data.data!;
  },

  /**
   * Create withdrawal request
   * Crear solicitud de retiro
   * @param {number} amount - Amount to withdraw / Monto a retirer
   * @returns {Promise<WithdrawalRequest>} Created withdrawal request / Solicitud de retiro creada
   */
  createWithdrawal: async (amount: number): Promise<WithdrawalRequest> => {
    const response = await api.post<{ success: boolean; data: WithdrawalRequest }>(
      '/wallet/withdraw',
      { amount }
    );
    return response.data.data!;
  },

  /**
   * Get withdrawal status
   * Obtener estado del retiro
   * @param {string} id - Withdrawal ID / ID del retiro
   * @returns {Promise<WithdrawalRequest>} Withdrawal request / Solicitud de retiro
   */
  getWithdrawalStatus: async (id: string): Promise<WithdrawalRequest> => {
    const response = await api.get<{ success: boolean; data: WithdrawalRequest }>(
      `/wallet/withdrawals/${id}`
    );
    return response.data.data!;
  },

  /**
   * Cancel withdrawal request
   * Cancelar solicitud de retiro
   * @param {string} id - Withdrawal ID / ID del retiro
   * @returns {Promise<WithdrawalRequest>} Cancelled withdrawal request / Solicitud de retiro cancelada
   */
  cancelWithdrawal: async (id: string): Promise<WithdrawalRequest> => {
    const response = await api.delete<{ success: boolean; data: WithdrawalRequest }>(
      `/wallet/withdrawals/${id}`
    );
    return response.data.data!;
  },

  /**
   * Get current cryptocurrency prices
   * Obtener precios actuales de criptomonedas
   * @returns {Promise<CryptoPrices>} Current crypto prices / Precios actuales de crypto
   */
  getCryptoPrices: async (): Promise<CryptoPrices> => {
    const response = await api.get<{ success: boolean; data: CryptoPrices }>('/wallet/prices');
    return response.data.data!;
  },
};

/**
 * @namespace vendorService
 * @description Vendor API methods - Marketplace vendor operations
 */
export const vendorService = {
  /**
   * Register as a vendor
   * Registrarse como vendedor
   * @param {VendorRegistrationPayload} data - Vendor registration data
   * @returns {Promise<Vendor>} Created vendor
   */
  register: async (data: VendorRegistrationPayload): Promise<Vendor> => {
    const response = await api.post<{ success: boolean; data: Vendor }>('/vendors/register', data);
    return response.data.data!;
  },

  /**
   * Get current vendor profile
   * Obtener perfil del vendedor actual
   * @returns {Promise<Vendor>} Vendor profile
   */
  getProfile: async (): Promise<Vendor> => {
    const response = await api.get<{ success: boolean; data: Vendor }>('/vendors/me');
    return response.data.data!;
  },

  /**
   * Get vendor products
   * Obtener productos del vendedor
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<{data: Product[]; pagination: any}>} Vendor products with pagination
   */
  getProducts: async (page?: number, limit?: number) => {
    const response = await api.get('/vendors/me/products', { params: { page, limit } });
    return response.data;
  },

  /**
   * Get vendor dashboard
   * Obtener panel del vendedor
   * @returns {Promise<VendorDashboard>} Dashboard data
   */
  getDashboard: async (): Promise<VendorDashboard> => {
    const response = await api.get<{ success: boolean; data: VendorDashboard }>(
      '/vendors/me/dashboard'
    );
    return response.data.data!;
  },

  /**
   * Request payout
   * Solicitar pago
   * @param {VendorPayoutRequest} data - Payout request data
   * @returns {Promise<any>} Created payout
   */
  requestPayout: async (data: VendorPayoutRequest) => {
    const response = await api.post<{ success: boolean; data: any }>('/vendors/me/payouts', data);
    return response.data.data!;
  },
};

/**
 * @namespace adminVendorService
 * @description Admin Vendor API methods - Vendor management for admins
 */
export const adminVendorService = {
  /**
   * List all vendors
   * Listar todos los vendedores
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {string} status - Filter by status
   * @returns {Promise<{data: Vendor[]; pagination: any}>} Vendor list with pagination
   */
  listVendors: async (page?: number, limit?: number, status?: string) => {
    const response = await api.get('/admin/vendors', { params: { page, limit, status } });
    return response.data;
  },

  /**
   * Get vendor by ID
   * Obtener vendedor por ID
   * @param {string} vendorId - Vendor ID
   * @returns {Promise<Vendor>} Vendor data
   */
  getVendor: async (vendorId: string): Promise<Vendor> => {
    const response = await api.get<{ success: boolean; data: Vendor }>(
      `/admin/vendors/${vendorId}`
    );
    return response.data.data!;
  },

  /**
   * Approve vendor
   * Aprobar vendedor
   * @param {string} vendorId - Vendor ID
   * @returns {Promise<Vendor>} Updated vendor
   */
  approveVendor: async (vendorId: string): Promise<Vendor> => {
    const response = await api.post<{ success: boolean; data: Vendor }>(
      `/admin/vendors/${vendorId}/approve`
    );
    return response.data.data!;
  },

  /**
   * Reject vendor
   * Rechazar vendedor
   * @param {string} vendorId - Vendor ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Vendor>} Updated vendor
   */
  rejectVendor: async (vendorId: string, reason: string): Promise<Vendor> => {
    const response = await api.post<{ success: boolean; data: Vendor }>(
      `/admin/vendors/${vendorId}/reject`,
      { reason }
    );
    return response.data.data!;
  },

  /**
   * Suspend vendor
   * Suspender vendedor
   * @param {string} vendorId - Vendor ID
   * @param {string} reason - Suspension reason
   * @returns {Promise<Vendor>} Updated vendor
   */
  suspendVendor: async (vendorId: string, reason: string): Promise<Vendor> => {
    const response = await api.post<{ success: boolean; data: Vendor }>(
      `/admin/vendors/${vendorId}/suspend`,
      { reason }
    );
    return response.data.data!;
  },

  /**
   * Update vendor commission rate
   * Actualizar tasa de comisión del vendedor
   * @param {string} vendorId - Vendor ID
   * @param {number} commissionRate - New commission rate (0-1)
   * @returns {Promise<Vendor>} Updated vendor
   */
  updateCommissionRate: async (vendorId: string, commissionRate: number): Promise<Vendor> => {
    const response = await api.patch<{ success: boolean; data: Vendor }>(
      `/admin/vendors/${vendorId}/commission-rate`,
      { commissionRate }
    );
    return response.data.data!;
  },
};

export default api;
