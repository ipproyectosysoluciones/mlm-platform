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
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PurchaseAttributes {
  id: string;
  userId: string;
  productId: string | null;
  amount: number;
  currency: string;
  description: string | null;
  status: 'pending' | 'completed' | 'refunded';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
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
