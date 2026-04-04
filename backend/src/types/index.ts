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

// ============================================
// Gift Card Types - Tipos de Gift Card
// ============================================

/**
 * Gift card status
 * Estado de gift card
 */
export const GIFT_CARD_STATUS = {
  ACTIVE: 'active',
  REDEEMED: 'redeemed',
  EXPIRED: 'expired',
} as const;

export type GiftCardStatus = (typeof GIFT_CARD_STATUS)[keyof typeof GIFT_CARD_STATUS];

/**
 * Gift card transaction type
 * Tipo de transacción de gift card
 */
export const GIFT_CARD_TRANSACTION_TYPE = {
  REDEMPTION: 'redemption',
  REFUND: 'refund',
  ADJUSTMENT: 'adjustment',
} as const;

export type GiftCardTransactionType =
  (typeof GIFT_CARD_TRANSACTION_TYPE)[keyof typeof GIFT_CARD_TRANSACTION_TYPE];

/**
 * Gift card transaction status
 * Estado de transacción de gift card
 */
export const GIFT_CARD_TRANSACTION_STATUS = {
  COMPLETED: 'completed',
  REFUNDED: 'refunded',
  FAILED: 'failed',
} as const;

export type GiftCardTransactionStatus =
  (typeof GIFT_CARD_TRANSACTION_STATUS)[keyof typeof GIFT_CARD_TRANSACTION_STATUS];

/**
 * Gift card attributes
 * Atributos de gift card
 */
export interface GiftCardAttributes {
  id: string;
  code: string;
  qrCodeData: string | null;
  balance: number; // DECIMAL(10,2)
  status: GiftCardStatus;
  isActive: boolean;
  createdByUserId: string;
  redeemedByUserId: string | null;
  expiresAt: Date;
  redeemedAt: Date | null;
  deletedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Gift card creation attributes
 * Atributos para crear gift card
 */
export interface GiftCardCreationAttributes {
  code: string;
  qrCodeData?: string | null;
  balance: number;
  status?: GiftCardStatus;
  isActive?: boolean;
  createdByUserId: string;
  redeemedByUserId?: string | null;
  expiresAt: Date;
  redeemedAt?: Date | null;
  deletedAt?: Date | null;
}

/**
 * QR mapping attributes
 * Atributos de mapeo QR
 */
export interface QrMappingAttributes {
  id: string;
  shortCode: string;
  giftCardId: string;
  scanCount: number;
  lastScannedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * QR mapping creation attributes
 * Atributos para crear mapeo QR
 */
export interface QrMappingCreationAttributes {
  shortCode: string;
  giftCardId: string;
  scanCount?: number;
  lastScannedAt?: Date | null;
}

/**
 * Gift card transaction attributes
 * Atributos de transacción de gift card
 */
export interface GiftCardTransactionAttributes {
  id: string;
  giftCardId: string;
  orderId: string | null;
  redeemedByUserId: string;
  amountRedeemed: number; // DECIMAL(10,2)
  transactionType: GiftCardTransactionType;
  status: GiftCardTransactionStatus;
  metadata: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Gift card transaction creation attributes
 * Atributos para crear transacción de gift card
 */
export interface GiftCardTransactionCreationAttributes {
  giftCardId: string;
  orderId?: string | null;
  redeemedByUserId: string;
  amountRedeemed: number;
  transactionType: GiftCardTransactionType;
  status?: GiftCardTransactionStatus;
  metadata?: Record<string, unknown> | null;
}

/**
 * Gift card validation result
 * Resultado de validación de gift card
 */
export interface GiftCardValidationResult {
  isValid: boolean;
  reason?: 'NOT_FOUND' | 'ALREADY_REDEEMED' | 'EXPIRED' | 'INACTIVE';
  card?: GiftCardAttributes;
}

// ============================================
// GENERIC PRODUCTS — Multi-type Product System (#27)
// PRODUCTOS GENÉRICOS — Sistema de productos multi-tipo (#27)
// ============================================

/**
 * Product types for generic product catalog
 * Tipos de productos para catálogo genérico
 */
export const PRODUCT_TYPE = {
  PHYSICAL: 'physical',
  DIGITAL: 'digital',
  SUBSCRIPTION: 'subscription',
  SERVICE: 'service',
} as const;

export type ProductType = (typeof PRODUCT_TYPE)[keyof typeof PRODUCT_TYPE];

/**
 * Inventory movement types for stock audit trail
 * Tipos de movimiento de inventario para trazabilidad de stock
 */
export const INVENTORY_MOVEMENT_TYPE = {
  INITIAL: 'initial',
  RESERVE: 'reserve',
  RELEASE: 'release',
  ADJUST: 'adjust',
  RETURN: 'return',
} as const;

export type InventoryMovementType =
  (typeof INVENTORY_MOVEMENT_TYPE)[keyof typeof INVENTORY_MOVEMENT_TYPE];

/**
 * Category attributes for hierarchical categories
 * Atributos de categoría para categorías jerárquicas
 */
export interface CategoryAttributes {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CategoryCreationAttributes {
  parentId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

/**
 * Extended Product attributes for generic products
 * Atributos extendidos de producto para productos genéricos
 */
export interface GenericProductAttributes extends ProductAttributes {
  type: ProductType;
  sku: string | null;
  categoryId: string | null;
  stock: number;
  isDigital: boolean;
  maxQuantityPerUser: number | null;
  metadata: Record<string, unknown> | null;
  images: string[];
  vendorId: string | null;
}

export interface GenericProductCreationAttributes extends ProductCreationAttributes {
  type?: ProductType;
  sku?: string | null;
  categoryId?: string | null;
  stock?: number;
  isDigital?: boolean;
  maxQuantityPerUser?: number | null;
  metadata?: Record<string, unknown> | null;
  images?: string[];
  vendorId?: string | null;
}

/**
 * Inventory movement attributes for audit trail
 * Atributos de movimiento de inventario para trazabilidad
 */
export interface InventoryMovementAttributes {
  id: string;
  productId: string;
  type: InventoryMovementType;
  quantity: number;
  reason: string;
  referenceId: string | null;
  performedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InventoryMovementCreationAttributes {
  productId: string;
  type: InventoryMovementType;
  quantity: number;
  reason: string;
  referenceId?: string | null;
  performedBy: string;
}

/**
 * Product list options for filtering
 * Opciones de listado de productos para filtrado
 */
export interface GenericProductListOptions extends ProductListOptions {
  type?: ProductType;
  categoryId?: string;
  minStock?: number;
  maxStock?: number;
  search?: string;
}

// ============================================
// CART — Abandoned Cart Recovery (#21)
// CARRITO — Recuperación de carritos abandonados (#21)
// ============================================

/**
 * Cart status lifecycle
 * Ciclo de vida del estado del carrito
 */
export const CART_STATUS = {
  ACTIVE: 'active',
  ABANDONED: 'abandoned',
  RECOVERED: 'recovered',
  CHECKED_OUT: 'checked_out',
  EXPIRED: 'expired',
} as const;

export type CartStatus = (typeof CART_STATUS)[keyof typeof CART_STATUS];

/**
 * Cart recovery token status
 * Estado del token de recuperación del carrito
 */
export const CART_RECOVERY_TOKEN_STATUS = {
  PENDING: 'pending',
  USED: 'used',
  EXPIRED: 'expired',
} as const;

export type CartRecoveryTokenStatus =
  (typeof CART_RECOVERY_TOKEN_STATUS)[keyof typeof CART_RECOVERY_TOKEN_STATUS];

/**
 * Cart attributes
 * Atributos del carrito
 */
export interface CartAttributes {
  id: string;
  userId: string;
  status: CartStatus;
  lastActivityAt: Date;
  abandonedAt: Date | null;
  recoveredAt: Date | null;
  checkedOutAt: Date | null;
  deletedAt: Date | null;
  totalAmount: number;
  itemCount: number;
  metadata: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Cart creation attributes
 * Atributos para crear carrito
 */
export interface CartCreationAttributes {
  userId: string;
  status?: CartStatus;
  lastActivityAt?: Date;
  abandonedAt?: Date | null;
  recoveredAt?: Date | null;
  checkedOutAt?: Date | null;
  deletedAt?: Date | null;
  totalAmount?: number;
  itemCount?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Cart item attributes
 * Atributos de item del carrito
 */
export interface CartItemAttributes {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  addedAt: Date;
  metadata: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Cart item creation attributes
 * Atributos para crear item del carrito
 */
export interface CartItemCreationAttributes {
  cartId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  addedAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Cart recovery token attributes
 * Atributos del token de recuperación del carrito
 */
export interface CartRecoveryTokenAttributes {
  id: string;
  cartId: string;
  userId: string;
  tokenHash: string;
  status: CartRecoveryTokenStatus;
  expiresAt: Date;
  usedAt: Date | null;
  emailSentAt: Date | null;
  clickCount: number;
  lastClickedAt: Date | null;
  metadata: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Cart recovery token creation attributes
 * Atributos para crear token de recuperación
 */
export interface CartRecoveryTokenCreationAttributes {
  cartId: string;
  userId: string;
  tokenHash: string;
  status?: CartRecoveryTokenStatus;
  expiresAt: Date;
  usedAt?: Date | null;
  emailSentAt?: Date | null;
  clickCount?: number;
  lastClickedAt?: Date | null;
  metadata?: Record<string, unknown>;
}

// ============================================
// EMAIL AUTOMATION — Email Campaign System (#22)
// AUTOMATIZACIÓN DE EMAIL — Sistema de campañas (#22)
// ============================================

/**
 * Email campaign status lifecycle
 * Ciclo de vida del estado de campaña de email
 */
export const EMAIL_CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  SENDING: 'sending',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type EmailCampaignStatus =
  (typeof EMAIL_CAMPAIGN_STATUS)[keyof typeof EMAIL_CAMPAIGN_STATUS];

/**
 * Campaign recipient delivery status
 * Estado de entrega de destinatario de campaña
 */
export const CAMPAIGN_RECIPIENT_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  OPENED: 'opened',
  CLICKED: 'clicked',
  BOUNCED: 'bounced',
  FAILED: 'failed',
} as const;

export type CampaignRecipientStatus =
  (typeof CAMPAIGN_RECIPIENT_STATUS)[keyof typeof CAMPAIGN_RECIPIENT_STATUS];

/**
 * Email queue item status
 * Estado de item en cola de email
 */
export const EMAIL_QUEUE_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SENT: 'sent',
  DEFERRED: 'deferred',
  FAILED: 'failed',
} as const;

export type EmailQueueStatus = (typeof EMAIL_QUEUE_STATUS)[keyof typeof EMAIL_QUEUE_STATUS];

/**
 * Allowed template variables (allowlist)
 * Variables de template permitidas (allowlist)
 */
export const ALLOWED_TEMPLATE_VARIABLES = [
  'firstName',
  'lastName',
  'email',
  'referralCode',
  'discountCode',
  'expiresAt',
] as const;

export type TemplateVariable = (typeof ALLOWED_TEMPLATE_VARIABLES)[number];

/**
 * Email template attributes
 * Atributos de template de email
 */
export interface EmailTemplateAttributes {
  id: string;
  createdByUserId: string;
  name: string;
  subjectLine: string;
  htmlContent: string;
  wysiwygState: Record<string, unknown>;
  variablesUsed: string[];
  deletedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Email template creation attributes
 * Atributos para crear template de email
 */
export interface EmailTemplateCreationAttributes {
  createdByUserId: string;
  name: string;
  subjectLine: string;
  htmlContent: string;
  wysiwygState?: Record<string, unknown>;
  variablesUsed?: string[];
  deletedAt?: Date | null;
}

/**
 * Email campaign attributes
 * Atributos de campaña de email
 */
export interface EmailCampaignAttributes {
  id: string;
  createdByUserId: string;
  emailTemplateId: string;
  name: string;
  status: EmailCampaignStatus;
  scheduledFor: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  recipientSegment: Record<string, unknown> | null;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  deferredCount: number;
  bounceCount: number;
  openCount: number;
  clickCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Email campaign creation attributes
 * Atributos para crear campaña de email
 */
export interface EmailCampaignCreationAttributes {
  createdByUserId: string;
  emailTemplateId: string;
  name: string;
  status?: EmailCampaignStatus;
  scheduledFor?: Date | null;
  recipientSegment?: Record<string, unknown> | null;
  recipientCount?: number;
}

/**
 * Campaign recipient attributes
 * Atributos de destinatario de campaña
 */
export interface CampaignRecipientAttributes {
  id: string;
  campaignId: string;
  userId: string;
  emailAddress: string;
  status: CampaignRecipientStatus;
  openedAt: Date | null;
  firstClickAt: Date | null;
  clickCount: number;
  sentAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Campaign recipient creation attributes
 * Atributos para crear destinatario de campaña
 */
export interface CampaignRecipientCreationAttributes {
  campaignId: string;
  userId: string;
  emailAddress: string;
  status?: CampaignRecipientStatus;
  openedAt?: Date | null;
  firstClickAt?: Date | null;
  clickCount?: number;
  sentAt?: Date | null;
}

/**
 * Email queue attributes
 * Atributos de cola de email
 */
export interface EmailQueueAttributes {
  id: string;
  campaignId: string;
  campaignRecipientId: string;
  userId: string;
  emailAddress: string;
  subjectLine: string;
  htmlContent: string;
  status: EmailQueueStatus;
  retryCount: number;
  nextRetryAt: Date | null;
  lastError: string | null;
  brevoMessageId: string | null;
  brevoResponse: Record<string, unknown> | null;
  createdAt?: Date;
  processedAt: Date | null;
}

/**
 * Email queue creation attributes
 * Atributos para crear item en cola de email
 */
export interface EmailQueueCreationAttributes {
  campaignId: string;
  campaignRecipientId: string;
  userId: string;
  emailAddress: string;
  subjectLine: string;
  htmlContent: string;
  status?: EmailQueueStatus;
  retryCount?: number;
  nextRetryAt?: Date | null;
  lastError?: string | null;
  brevoMessageId?: string | null;
  brevoResponse?: Record<string, unknown> | null;
  processedAt?: Date | null;
}

/**
 * Email campaign log attributes
 * Atributos de log de campaña de email
 */
export interface EmailCampaignLogAttributes {
  id: string;
  campaignId: string;
  campaignRecipientId: string | null;
  eventType: string;
  eventTimestamp: Date;
  details: Record<string, unknown>;
  createdAt?: Date;
}

/**
 * Email campaign log creation attributes
 * Atributos para crear log de campaña de email
 */
export interface EmailCampaignLogCreationAttributes {
  campaignId: string;
  campaignRecipientId?: string | null;
  eventType: string;
  eventTimestamp?: Date;
  details?: Record<string, unknown>;
}

/**
 * Template validation result
 * Resultado de validación de template
 */
export interface TemplateValidationResult {
  valid: boolean;
  variablesUsed?: string[];
  error?: string;
  allowed?: readonly string[];
}

/**
 * Create campaign DTO
 * DTO para crear campaña
 */
export interface CreateCampaignDto {
  createdByUserId: string;
  emailTemplateId: string;
  name: string;
  recipientSegment?: Record<string, unknown> | null;
  scheduledFor?: Date | null;
}

// ============================================
// MARKETPLACE MULTI-VENDOR — Phase 2 (#25)
// MULTI-VENDEDOR — Fase 2 (#25)
// ============================================

/**
 * Vendor status lifecycle
 * Ciclo de vida del estado del vendedor
 */
export const VENDOR_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  SUSPENDED: 'suspended',
  REJECTED: 'rejected',
} as const;

export type VendorStatus = (typeof VENDOR_STATUS)[keyof typeof VENDOR_STATUS];

/**
 * Vendor order status
 * Estado del pedido del vendedor
 */
export const VENDOR_ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type VendorOrderStatus = (typeof VENDOR_ORDER_STATUS)[keyof typeof VENDOR_ORDER_STATUS];

/**
 * Vendor payout status
 * Estado del pago al vendedor
 */
export const VENDOR_PAYOUT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type VendorPayoutStatus = (typeof VENDOR_PAYOUT_STATUS)[keyof typeof VENDOR_PAYOUT_STATUS];

/**
 * Vendor attributes
 * Atributos del vendedor
 */
export interface VendorAttributes {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  status: VendorStatus;
  commissionRate: number; // DECIMAL(5,4) - default 0.7000 (70%)
  contactEmail: string;
  contactPhone: string | null;
  address: Record<string, unknown> | null;
  bankDetails: Record<string, unknown> | null; // Encrypted
  metadata: Record<string, unknown> | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  deletedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Vendor creation attributes
 * Atributos para crear vendedor
 */
export interface VendorCreationAttributes {
  userId: string;
  businessName: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  status?: VendorStatus;
  commissionRate?: number;
  contactEmail: string;
  contactPhone?: string | null;
  address?: Record<string, unknown> | null;
  bankDetails?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Vendor order attributes
 * Atributos del pedido del vendedor
 */
export interface VendorOrderAttributes {
  id: string;
  orderId: string;
  vendorId: string | null; // null for platform orders
  subtotal: number;
  commissionAmount: number; // DECIMAL(10,4)
  vendorAmount: number; // DECIMAL(10,4)
  platformAmount: number; // DECIMAL(10,4)
  status: VendorOrderStatus;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Vendor order creation attributes
 * Atributos para crear pedido de vendedor
 */
export interface VendorOrderCreationAttributes {
  orderId: string;
  vendorId?: string | null;
  subtotal: number;
  commissionAmount?: number;
  vendorAmount?: number;
  platformAmount?: number;
  status?: VendorOrderStatus;
  notes?: string | null;
}

/**
 * Vendor payout attributes
 * Atributos del pago al vendedor
 */
export interface VendorPayoutAttributes {
  id: string;
  vendorId: string;
  amount: number; // DECIMAL(10,2)
  currency: string; // Default: 'USD'
  status: VendorPayoutStatus;
  paymentMethod: string | null;
  paymentReference: string | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  requestedAt: Date;
  processedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Vendor payout creation attributes
 * Atributos para crear pago al vendedor
 */
export interface VendorPayoutCreationAttributes {
  vendorId: string;
  amount: number;
  currency?: string;
  status?: VendorPayoutStatus;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  periodStart?: Date | null;
  periodEnd?: Date | null;
}

/**
 * Commission split result for vendor orders
 * Resultado de división de comisiones para pedidos de vendedor
 */
export interface VendorCommissionSplit {
  vendorAmount: number;
  platformFee: number;
  mlmCommissions: Array<{
    userId: string;
    level: string;
    amount: number;
  }>;
  platformNet: number;
}

/**
 * Vendor dashboard data
 * Datos del panel del vendedor
 */
export interface VendorDashboardData {
  totalSales: number;
  totalRevenue: number;
  pendingPayouts: number;
  productCount: number;
  recentSales: Array<{
    orderId: string;
    amount: number;
    status: VendorOrderStatus;
    createdAt: Date;
  }>;
}
