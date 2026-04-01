export interface UserAttributes {
  id: string;
  email: string;
  passwordHash: string;
  referralCode: string;
  sponsorId: string | null;
  position: 'left' | 'right' | null;
  level: number;
  status: 'active' | 'inactive';
  role: 'admin' | 'user';
  currency: 'USD' | 'COP' | 'MXN';
  // Notification preferences
  emailNotifications: boolean;
  smsNotifications: boolean;
  twoFactorEnabled: boolean;
  twoFactorPhone: string | null;
  weeklyDigest: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes {
  email: string;
  passwordHash: string;
  referralCode: string;
  sponsorId?: string | null;
  position?: 'left' | 'right' | null;
  level?: number;
  status?: 'active' | 'inactive';
  role?: 'admin' | 'user';
  currency?: 'USD' | 'COP' | 'MXN';
}

export interface UserClosureAttributes {
  ancestorId: string;
  descendantId: string;
  depth: number;
}

export interface CommissionAttributes {
  id: string;
  userId: string;
  fromUserId: string;
  purchaseId: string | null;
  type: 'direct' | 'level_1' | 'level_2' | 'level_3' | 'level_4';
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'paid';
  description?: string | null;
  migratedToWallet?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PurchaseAttributes {
  id: string;
  userId: string;
  productId: string | null;
  businessType: 'suscripcion' | 'producto' | 'membresia' | 'servicio' | 'otro';
  amount: number;
  currency: string;
  description: string | null;
  status: 'pending' | 'completed' | 'refunded';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T | null;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user';
}

export interface TreeNode {
  id: string;
  email: string;
  referralCode: string;
  position: 'left' | 'right';
  level: number;
  stats: {
    leftCount: number;
    rightCount: number;
  };
  children: TreeNode[];
}

/**
 * Commission rates configuration for MLM binary affiliations
 * Configuración de tasas de comisión para afiliaciones binarias MLM
 *
 * @constant {Object} COMMISSION_RATES
 * @type {Object}
 *
 * @example
 * // English: Calculate commission for a $100 purchase at direct rate
 * const commission = 100 * COMMISSION_RATES.direct; // $10
 *
 * // Español: Calcular comisión para una compra de $100 en tasa directa
 * const commission = 100 * COMMISSION_RATES.direct; // $10
 *
 * @example
 * // English: Apply level 2 commission (3%)
 * const level2Commission = purchaseAmount * COMMISSION_RATES.level_2;
 *
 * // Español: Aplicar comisión nivel 2 (3%)
 * const level2Commission = purchaseAmount * COMMISSION_RATES.level_2;
 */
export const COMMISSION_RATES = {
  direct: 0.1, // 10% / 10 por ciento - Direct referral commission
  level_1: 0.05, // 5% / 5 por ciento - Level 1 downline commission
  level_2: 0.03, // 3% / 3 por ciento - Level 2 downline commission
  level_3: 0.02, // 2% / 2 por ciento - Level 3 downline commission
  level_4: 0.01, // 1% / 1 por ciento - Level 4 downline commission
} as const;

// ============================================
// Business Types - Tipos de Negocio
// ============================================

export const BUSINESS_TYPES = {
  SUSCRIPCION: 'suscripcion',
  PRODUCTO: 'producto',
  MEMBRESIA: 'membresia',
  SERVICIO: 'servicio',
  OTRO: 'otro',
} as const;

export type BusinessType = (typeof BUSINESS_TYPES)[keyof typeof BUSINESS_TYPES];

// Commission levels
export const COMMISSION_LEVELS = {
  DIRECT: 'direct',
  LEVEL_1: 'level_1',
  LEVEL_2: 'level_2',
  LEVEL_3: 'level_3',
  LEVEL_4: 'level_4',
} as const;

export type CommissionLevel = (typeof COMMISSION_LEVELS)[keyof typeof COMMISSION_LEVELS];

// Map level names to display
export const COMMISSION_LEVEL_NAMES: Record<CommissionLevel, string> = {
  direct: 'Directo',
  level_1: 'Nivel 1',
  level_2: 'Nivel 2',
  level_3: 'Nivel 3',
  level_4: 'Nivel 4',
};

// Map business types to display names
export const BUSINESS_TYPE_NAMES: Record<BusinessType, string> = {
  suscripcion: 'Suscripción',
  producto: 'Producto',
  membresia: 'Membresía',
  servicio: 'Servicio',
  otro: 'Otro',
};

/**
 * Level names mapping for user hierarchy
 * Mapeo de nombres de nivel para jerarquía de usuarios
 *
 * @constant {Record<number, string>} LEVEL_NAMES
 *
 * @example
 * // English: Get level name for user level
 * const levelName = LEVEL_NAMES[user.level] || 'Starter';
 * // Output: "Bronze", "Silver", "Gold", or "Starter" (default)
 *
 * // Español: Obtener nombre de nivel para nivel de usuario
 * const levelName = LEVEL_NAMES[user.level] || 'Starter';
 * // Salida: "Bronze", "Silver", "Gold", o "Starter" (por defecto)
 *
 * @example
 * // English: Display level badge
 * // <Badge>{LEVEL_NAMES[user.level]}</Badge>
 *
 * // Español: Mostrar insignia de nivel
 * // <Badge>{LEVEL_NAMES[user.level]}</Badge>
 */
export const LEVEL_NAMES: Record<number, string> = {
  1: 'Starter',
  2: 'Bronze',
  3: 'Silver',
  4: 'Gold',
};

// Product types for streaming subscriptions e-commerce
export interface ProductAttributes {
  id: string;
  name: string;
  platform:
    | 'netflix'
    | 'disney_plus'
    | 'spotify'
    | 'hbo_max'
    | 'amazon_prime'
    | 'youtube_premium'
    | 'apple_tv'
    | 'other';
  description: string | null;
  price: number; // DECIMAL(10,2)
  currency: string; // Default: 'USD'
  durationDays: number; // Subscription duration in days
  isActive: boolean; // Whether product is available for purchase
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductCreationAttributes {
  name: string;
  platform: ProductAttributes['platform'];
  description?: string | null;
  price: number;
  currency?: string;
  durationDays: number;
  isActive?: boolean;
}

// Order types for streaming subscriptions e-commerce
export interface OrderAttributes {
  id: string;
  orderNumber: string; // Human-readable order number (e.g., "ORD-20260325-001")
  userId: string;
  productId: string; // FK to products table
  purchaseId: string | null; // FK to purchases table (nullable)
  totalAmount: number; // Order total (matches product price)
  currency: string; // Default: 'USD'
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: 'manual' | 'simulated'; // MVP: only simulated
  notes: string | null; // Optional internal notes
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderCreationAttributes {
  userId: string;
  productId: string;
  purchaseId?: string | null;
  totalAmount: number;
  currency?: string;
  status?: 'pending' | 'completed' | 'failed';
  paymentMethod?: 'manual' | 'simulated';
  notes?: string | null;
}

// ============================================
// Wallet Types - Digital Wallet System
// ============================================

/**
 * Wallet transaction types
 * Tipos de transacción de wallet
 */
export const WALLET_TRANSACTION_TYPE = {
  COMMISSION_EARNED: 'commission_earned',
  WITHDRAWAL: 'withdrawal',
  FEE: 'fee',
  ADJUSTMENT: 'adjustment',
} as const;

export type WalletTransactionType =
  (typeof WALLET_TRANSACTION_TYPE)[keyof typeof WALLET_TRANSACTION_TYPE];

/**
 * Withdrawal request status
 * Estado de solicitud de retiro
 */
export const WITHDRAWAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type WithdrawalStatus = (typeof WITHDRAWAL_STATUS)[keyof typeof WITHDRAWAL_STATUS];

/**
 * Wallet attributes
 * Atributos de wallet
 */
export interface WalletAttributes {
  id: string;
  userId: string;
  balance: number; // DECIMAL(10,2)
  currency: string; // Always USD
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Wallet creation attributes
 * Atributos para crear wallet
 */
export interface WalletCreationAttributes {
  userId: string;
  balance?: number;
  currency?: string;
}

/**
 * Wallet transaction attributes
 * Atributos de transacción de wallet
 */
export interface WalletTransactionAttributes {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number; // Positive for credit, negative for debit
  currency: string;
  referenceId: string | null; // commission_id or withdrawal_request_id
  description: string;
  exchangeRate: number | null; // Rate used if original currency != USD
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Wallet transaction creation attributes
 * Atributos para crear transacción
 */
export interface WalletTransactionCreationAttributes {
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  currency?: string;
  referenceId?: string | null;
  description?: string;
  exchangeRate?: number | null;
}

/**
 * Withdrawal request attributes
 * Atributos de solicitud de retiro
 */
export interface WithdrawalRequestAttributes {
  id: string;
  userId: string;
  requestedAmount: number;
  feeAmount: number;
  netAmount: number;
  status: WithdrawalStatus;
  rejectionReason: string | null;
  approvalComment: string | null;
  processedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Withdrawal request creation attributes
 * Atributos para crear solicitud de retiro
 */
export interface WithdrawalRequestCreationAttributes {
  userId: string;
  requestedAmount: number;
  feeAmount: number;
  netAmount: number;
  status?: WithdrawalStatus;
  rejectionReason?: string | null;
  approvalComment?: string | null;
  processedAt?: Date | null;
}

// ============================================
// API Response Types - Wallet
// ============================================

/**
 * Get wallet balance response
 * Respuesta de obtener balance de wallet
 */
export interface GetWalletResponse {
  success: boolean;
  data: {
    id: string;
    userId: string;
    balance: number;
    currency: string;
    lastUpdated: string;
  };
  error?: string;
}

/**
 * Get wallet transactions response
 * Respuesta de obtener transacciones de wallet
 */
export interface GetTransactionsResponse {
  success: boolean;
  data: WalletTransactionAttributes[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

/**
 * Create withdrawal request body
 * Body para crear solicitud de retiro
 */
export interface CreateWithdrawalRequest {
  amount: number; // Must be >= 20 (configurable)
}

/**
 * Create withdrawal response
 * Respuesta de crear solicitud de retiro
 */
export interface CreateWithdrawalResponse {
  success: boolean;
  data: WithdrawalRequestAttributes;
  message: string;
  error?: string;
}

/**
 * Get withdrawal status response
 * Respuesta de obtener estado de retiro
 */
export interface GetWithdrawalStatusResponse {
  success: boolean;
  data: WithdrawalRequestAttributes;
  error?: string;
}

// ============================================
// Crypto Price Types - Tipos de Precios Crypto
// ============================================

/**
 * Cryptocurrency price from API
 * Precio de criptomoneda de API
 */
export interface CryptoPrice {
  usd: number;
  usd_24h_change?: number;
}

/**
 * All supported cryptocurrency prices
 * Precios de todas las criptomonedas soportadas
 */
export interface CryptoPrices {
  bitcoin: CryptoPrice;
  ethereum: CryptoPrice;
  tether: CryptoPrice;
  lastUpdated: Date;
}

/**
 * API response for crypto prices
 * Respuesta de API para precios crypto
 */
export interface GetCryptoPricesResponse {
  success: boolean;
  data: CryptoPrices;
}

// ============================================
// Push Notification Types - Tipos de Notificaciones Push
// ============================================

/**
 * Push subscription keys from browser
 * Claves de suscripción push del navegador
 */
export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

/**
 * Push subscription attributes
 * Atributos de suscripción push
 */
export interface PushSubscriptionAttributes {
  id: string;
  userId: string | null;
  endpoint: string;
  keys: PushSubscriptionKeys;
  browser: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Push subscription creation attributes
 * Atributos para crear suscripción push
 */
export interface PushSubscriptionCreationAttributes {
  userId?: string | null;
  endpoint: string;
  keys: PushSubscriptionKeys;
  browser?: string | null;
}

/**
 * Push notification payload
 * Payload de notificación push
 */
export interface PushNotificationPayload {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}
