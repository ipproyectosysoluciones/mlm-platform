export interface User {
  id: string;
  email: string;
  referralCode: string;
  level: number;
  levelName?: string;
  role?: 'admin' | 'user';
  sponsorId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  sponsorReferralCode?: string;
}

/**
 * Normal login response — token + user data
 * Respuesta de login normal — token + datos de usuario
 */
export interface AuthLoginResponse {
  token: string;
  user: User;
}

/**
 * 2FA required response — indicates a second factor is needed before login completes
 * Respuesta de 2FA requerido — indica que se necesita un segundo factor antes de completar el login
 */
export interface Auth2FARequiredResponse {
  requires2FA: true;
  tempToken: string;
  userId: string;
}

/**
 * Discriminated union for auth login outcomes.
 * When `requires2FA` is `true`, the user must complete 2FA verification with a temp token.
 * Otherwise, the response contains the final token and user data.
 *
 * Unión discriminada para resultados del login de auth.
 * Cuando `requires2FA` es `true`, el usuario debe completar la verificación 2FA con un token temporal.
 * De lo contrario, la respuesta contiene el token final y los datos de usuario.
 */
export type AuthResponse = AuthLoginResponse | Auth2FARequiredResponse;

/**
 * Type guard to check if an auth response requires 2FA verification.
 * Guarda de tipo para verificar si una respuesta de auth requiere verificación 2FA.
 *
 * @param response - The auth response to check / La respuesta de auth a verificar
 * @returns `true` if 2FA is required, narrowing the type to `Auth2FARequiredResponse`
 *          `true` si se requiere 2FA, estrechando el tipo a `Auth2FARequiredResponse`
 */
export function is2FARequired(response: AuthResponse): response is Auth2FARequiredResponse {
  return 'requires2FA' in response && response.requires2FA === true;
}

/**
 * SessionStorage key for the temporary JWT token during 2FA login flow.
 * Clave de sessionStorage para el token JWT temporal durante el flujo de login 2FA.
 */
export const TWO_FA_TEMP_TOKEN_KEY = '2fa_temp_token';

/**
 * SessionStorage key for the user ID during 2FA login flow.
 * Clave de sessionStorage para el ID de usuario durante el flujo de login 2FA.
 */
export const TWO_FA_USER_ID_KEY = '2fa_user_id';

export interface DashboardStats {
  totalReferrals: number;
  leftCount: number;
  rightCount: number;
  totalEarnings: number;
  pendingEarnings: number;
}

export interface DashboardData {
  user: User;
  stats: DashboardStats;
  referralLink: string;
  recentCommissions: Commission[];
  recentReferrals: Referral[];
  referralsChart?: { month: string; count: number }[];
  commissionsChart?: { month: string; amount: number }[];
}

export interface Commission {
  id: string;
  type: string;
  amount: number;
  currency: string;
  createdAt: Date;
  fromUser?: {
    email: string;
    referralCode: string;
  };
}

export interface Referral {
  id: string;
  email: string;
  position: string;
  createdAt: Date;
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * UserDetails - Información extendida de usuario (Phase 3)
 * UserDetails - Extended user information (Phase 3)
 */
export interface UserDetails {
  id: string;
  email: string;
  referralCode: string;
  position: 'left' | 'right';
  level: number;
  status: 'active' | 'inactive';
  createdAt: string;
  stats: {
    leftCount: number;
    rightCount: number;
    totalDownline: number;
  };
}

// CRM Types
export interface Lead {
  id: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  company?: string;
  source: 'website' | 'referral' | 'social' | 'landing_page' | 'manual' | 'other';
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  leadId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: Date;
  createdAt: Date;
}

export interface Communication {
  id: string;
  leadId: string;
  type: 'email' | 'call' | 'meeting' | 'note';
  content: string;
  createdAt: Date;
}

export interface CRMStats {
  totalLeads: number;
  wonLeads: number;
  inProgress: number;
  conversionRate: number;
}

// Product Types - Streaming Subscriptions E-Commerce
export type StreamingPlatform =
  | 'netflix'
  | 'disney_plus'
  | 'spotify'
  | 'hbo_max'
  | 'amazon_prime'
  | 'youtube_premium'
  | 'apple_tv_plus';

export interface Product {
  id: string;
  name: string;
  platform: StreamingPlatform;
  description?: string;
  price: number;
  currency: string;
  durationDays: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  platform?: StreamingPlatform;
  isActive?: boolean;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Order Types - Streaming Subscriptions E-Commerce
export type OrderStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'simulated' | 'paypal' | 'mercadopago';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  productId: string;
  product?: Product;
  purchaseId?: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: string;
  commissionTotal?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateOrderRequest {
  productId: string;
  paymentMethod: PaymentMethod;
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Wallet Types - Digital Wallet
export interface WalletBalance {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  lastUpdated: string;
}

export type WalletTransactionType = 'commission' | 'withdrawal' | 'refund';

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  currency: string;
  referenceId?: string;
  description?: string;
  exchangeRate?: number;
  createdAt: Date;
}

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'processed' | 'cancelled';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  requestedAmount: number;
  feeAmount: number;
  netAmount: number;
  status: WithdrawalStatus;
  rejectionReason?: string;
  approvalComment?: string;
  processedAt?: Date;
  createdAt: Date;
}

export interface TransactionListParams {
  page?: number;
  limit?: number;
  type?: WalletTransactionType;
  startDate?: string;
  endDate?: string;
}

export interface TransactionListResponse {
  data: WalletTransaction[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Crypto Price Types
export interface CryptoPriceInfo {
  usd: number;
  usd_24h_change?: number;
}

export interface CryptoPrices {
  bitcoin: CryptoPriceInfo;
  ethereum: CryptoPriceInfo;
  tether: CryptoPriceInfo;
  lastUpdated: string;
}

// Commission Config Types
export type BusinessType = 'suscripcion' | 'producto' | 'membresia' | 'servicio' | 'otro';
export type CommissionLevel = 'direct' | 'level_1' | 'level_2' | 'level_3' | 'level_4';

export interface CommissionConfig {
  id: string;
  businessType: BusinessType;
  customBusinessName?: string;
  level: CommissionLevel;
  percentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionConfigCreate {
  businessType: BusinessType;
  customBusinessName?: string;
  level: CommissionLevel;
  percentage: number;
}

export interface CommissionConfigUpdate {
  percentage?: number;
  isActive?: boolean;
}

export interface CommissionRates {
  businessType: BusinessType;
  levels: Record<CommissionLevel, number>;
}

// ============================================
// GENERIC PRODUCTS — Multi-type Product System (#27)
// PRODUCTOS GENÉRICOS — Sistema de productos multi-tipo (#27)
// ============================================

/**
 * Product types for generic product catalog
 * Tipos de productos para catálogo genérico
 */
export type ProductType = 'physical' | 'digital' | 'subscription' | 'service';

/**
 * Inventory movement types for stock audit trail
 * Tipos de movimiento de inventario para trazabilidad de stock
 */
export type InventoryMovementType = 'initial' | 'reserve' | 'release' | 'adjust' | 'return';

/**
 * Category for hierarchical categories
 * Categoría para categorías jerárquicas
 */
export interface Category {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  children?: Category[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Extended Product for generic products
 * Producto extendido para productos genéricos
 */
export interface GenericProduct extends Product {
  type: ProductType;
  sku?: string | null;
  categoryId?: string | null;
  category?: Category;
  stock: number;
  isDigital: boolean;
  maxQuantityPerUser?: number | null;
  metadata?: Record<string, unknown> | null;
  images?: string[];
}

/**
 * Inventory movement for audit trail
 * Movimiento de inventario para trazabilidad
 */
export interface InventoryMovement {
  id: string;
  productId: string;
  type: InventoryMovementType;
  quantity: number;
  reason: string;
  referenceId?: string | null;
  performedBy: string;
  performedByUser?: { email: string };
  createdAt: string;
}

/**
 * Product list params with generic filters
 * Params de listado de productos con filtros genéricos
 */
export interface GenericProductListParams extends ProductListParams {
  type?: ProductType;
  categoryId?: string;
  minStock?: number;
  maxStock?: number;
  search?: string;
}

// Gift Card Types
export type GiftCardStatus = 'active' | 'redeemed' | 'expired';

// ============================================
// ADMIN PRODUCT TYPES
// ============================================

export interface AdminProductResponse {
  id: string;
  name: string;
  platform: StreamingPlatform;
  description?: string;
  price: number;
  currency: string;
  durationDays: number;
  isActive: boolean;
  type: ProductType;
  sku?: string | null;
  categoryId?: string | null;
  category?: Category;
  stock: number;
  isDigital: boolean;
  maxQuantityPerUser?: number | null;
  metadata?: Record<string, unknown> | null;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductPayload {
  name: string;
  platform?: StreamingPlatform;
  description?: string;
  price: number;
  currency?: string;
  durationDays?: number;
  isActive?: boolean;
  type?: ProductType;
  sku?: string | null;
  categoryId?: string | null;
  stock?: number;
  isDigital?: boolean;
  maxQuantityPerUser?: number | null;
  metadata?: Record<string, unknown> | null;
  images?: string[];
}

export interface UpdateProductPayload {
  name?: string;
  platform?: StreamingPlatform;
  description?: string | null;
  price?: number;
  currency?: string;
  durationDays?: number;
  isActive?: boolean;
  type?: ProductType;
  sku?: string | null;
  categoryId?: string | null;
  stock?: number;
  isDigital?: boolean;
  maxQuantityPerUser?: number | null;
  metadata?: Record<string, unknown> | null;
  images?: string[];
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  platform?: StreamingPlatform;
  isActive?: boolean;
  type?: ProductType;
  categoryId?: string;
  minStock?: number;
  maxStock?: number;
  search?: string;
}

// Inventory management types
export interface InventoryReservePayload {
  quantity: number;
  referenceId: string;
}

export interface InventoryReleasePayload {
  quantity: number;
  referenceId: string;
}

export interface InventoryAdjustPayload {
  quantity: number;
  reason: string;
}

export interface InventoryInitialPayload {
  quantity: number;
}

export interface InventoryReturnPayload {
  quantity: number;
  reason: string;
  referenceId?: string;
}

// ============================================
// ADMIN CATEGORY TYPES
// ============================================

export interface CreateCategoryPayload {
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface GiftCardResponse {
  id: string;
  code: string;
  balance: number;
  status: GiftCardStatus;
  isActive: boolean;
  expiresAt: string;
  qrCodeData: string | null;
  createdByUserId?: string;
  redeemedByUserId?: string | null;
  redeemedAt?: string | null;
  createdAt: string;
}

export interface GiftCardTransactionResponse {
  id: string;
  giftCardId: string;
  amountRedeemed: number;
  transactionType: string;
  status: string;
  createdAt: string;
}

export interface GiftCardCreatePayload {
  amount: number;
  expiresInDays?: number;
}

export interface GiftCardRedeemPayload {
  orderId?: string;
}

export interface GiftCardValidateResponse {
  isValid: boolean;
  reason?: 'NOT_FOUND' | 'ALREADY_REDEEMED' | 'EXPIRED' | 'INACTIVE';
  card?: GiftCardResponse;
}

export interface GiftCardListParams {
  page?: number;
  limit?: number;
  status?: GiftCardStatus;
}

// Email Campaign Types

/**
 * Campaign status values / Valores de estado de campaña
 */
export type EmailCampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'completed'
  | 'paused'
  | 'failed';

/**
 * Recipient log status values / Valores de estado de log de destinatario
 */
export type RecipientLogStatus = 'pending' | 'sent' | 'failed' | 'bounced' | 'deferred';

/**
 * Recipient segment values / Valores de segmento de destinatarios
 */
export type RecipientSegment = 'all_users' | 'high_value' | 'new_users' | 'inactive';

/**
 * Email template response / Respuesta de plantilla de email
 */
export interface EmailTemplate {
  id: string;
  name: string;
  subjectLine: string;
  htmlContent: string;
  wysiwygState?: Record<string, unknown>;
  variablesUsed: string[];
  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create email template payload / Payload para crear plantilla de email
 */
export interface EmailTemplateCreatePayload {
  name: string;
  subjectLine: string;
  htmlContent: string;
  wysiwygState?: Record<string, unknown>;
}

/**
 * Email campaign response / Respuesta de campaña de email
 */
export interface EmailCampaign {
  id: string;
  name: string;
  emailTemplateId: string;
  status: EmailCampaignStatus;
  scheduledFor: string | null;
  startedAt: string | null;
  completedAt: string | null;
  recipientSegment: RecipientSegment;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  deferredCount: number;
  bounceCount: number;
  openCount: number;
  clickCount: number;
  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Campaign stats from API / Estadísticas de campaña desde la API
 */
export interface EmailCampaignStats {
  sentCount: number;
  failedCount: number;
  deferredCount: number;
  bounceCount: number;
  openCount: number;
  clickCount: number;
  deliveryRate: string;
  openRate: string;
  clickRate: string;
}

/**
 * Full campaign detail with stats / Detalle completo de campaña con estadísticas
 */
export interface EmailCampaignDetail extends EmailCampaign {
  stats: EmailCampaignStats;
}

/**
 * Create campaign payload / Payload para crear campaña
 */
export interface EmailCampaignCreatePayload {
  name: string;
  emailTemplateId: string;
  recipientSegment: RecipientSegment;
  scheduledFor?: string | null;
}

/**
 * Send campaign payload / Payload para enviar campaña
 */
export interface EmailCampaignSendPayload {
  sendNow: boolean;
}

/**
 * Campaign log entry / Entrada de log de campaña
 */
export interface CampaignLogEntry {
  recipientEmail: string;
  status: RecipientLogStatus;
  sentAt: string | null;
  errorReason: string | null;
  retryCount: number;
  nextRetryAt?: string | null;
}

/**
 * Campaign logs response with pagination / Respuesta de logs de campaña con paginación
 */
export interface CampaignLogsResponse {
  data: CampaignLogEntry[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * Campaign logs query params / Parámetros de consulta de logs de campaña
 */
export interface CampaignLogsParams {
  status?: RecipientLogStatus;
  limit?: number;
  offset?: number;
}

/**
 * Template variable validation result / Resultado de validación de variables de plantilla
 */
export interface TemplateValidationResult {
  valid: boolean;
  variablesUsed?: string[];
  error?: string;
  allowed?: string[];
}

/**
 * Retry failed response / Respuesta de reintentar fallidos
 */
export interface RetryFailedResponse {
  retriedCount: number;
  message: string;
}

/**
 * Allowed template variables / Variables de plantilla permitidas
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

// Push Notification Types
export * from './push';

// ============================================
// MARKETPLACE MULTI-VENDOR — Phase 2 (#25)
// MULTI-VENDEDOR — Fase 2 (#25)
// ============================================

/**
 * Vendor status lifecycle
 * Ciclo de vida del estado del vendedor
 */
export type VendorStatus = 'pending' | 'approved' | 'suspended' | 'rejected';

/**
 * Vendor order status
 * Estado del pedido del vendedor
 */
export type VendorOrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

/**
 * Vendor payout status
 * Estado del pago al vendedor
 */
export type VendorPayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Vendor attributes
 * Atributos del vendedor
 */
export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  status: VendorStatus;
  commissionRate: number;
  contactEmail: string;
  contactPhone?: string | null;
  address?: Record<string, unknown> | null;
  bankDetails?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Vendor creation payload
 * Payload para crear vendedor
 */
export interface VendorRegistrationPayload {
  businessName: string;
  contactEmail: string;
  contactPhone?: string;
  description?: string;
  address?: Record<string, unknown>;
}

/**
 * Vendor order attributes
 * Atributos del pedido del vendedor
 */
export interface VendorOrder {
  id: string;
  orderId: string;
  vendorId?: string | null;
  subtotal: number;
  commissionAmount: number;
  vendorAmount: number;
  platformAmount: number;
  status: VendorOrderStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Vendor payout attributes
 * Atributos del pago al vendedor
 */
export interface VendorPayout {
  id: string;
  vendorId: string;
  amount: number;
  currency: string;
  status: VendorPayoutStatus;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  requestedAt: string;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Vendor payout request
 * Solicitud de pago del vendedor
 */
export interface VendorPayoutRequest {
  amount: number;
  paymentMethod?: string;
}

/**
 * Vendor dashboard data
 * Datos del panel del vendedor
 */
export interface VendorDashboard {
  totalSales: number;
  totalRevenue: number;
  pendingPayouts: number;
  productCount: number;
  recentSales: Array<{
    orderId: string;
    amount: number;
    status: VendorOrderStatus;
    createdAt: string;
  }>;
}

// ============================================
// AFFILIATE CONTRACTS — Phase 3.5 (#44)
// CONTRATOS DE AFILIADO — Fase 3.5 (#44)
// ============================================

export type ContractType =
  | 'AFFILIATE_AGREEMENT'
  | 'COMPENSATION_PLAN'
  | 'PRIVACY_POLICY'
  | 'TERMS_OF_SERVICE';

export type ContractStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'REVOKED';

export interface Contract {
  id: string;
  type: ContractType;
  version: string;
  title: string;
  content: string;
  effectiveFrom: string;
  status: ContractStatus | null;
  signedAt: string | null;
  contentHash: string;
}

export interface ContractAcceptanceRequest {
  templateId: string;
}

export interface ContractAcceptanceResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    status: ContractStatus;
    signedAt: string;
  };
}
