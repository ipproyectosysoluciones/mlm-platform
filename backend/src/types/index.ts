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

export const COMMISSION_RATES = {
  direct: 0.1, // 10%
  level_1: 0.05, // 5%
  level_2: 0.03, // 3%
  level_3: 0.02, // 2%
  level_4: 0.01, // 1%
} as const;

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
  description: string | null;
  type: 'subscription' | 'one-time' | 'streaming';
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly' | null;
  features: string[] | null;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductCreationAttributes {
  name: string;
  description?: string | null;
  type: 'subscription' | 'one-time' | 'streaming';
  price: number;
  currency?: string;
  interval?: 'monthly' | 'yearly' | null;
  features?: string[] | null;
  status?: 'active' | 'inactive';
}

// Order types for streaming subscriptions e-commerce
export interface OrderAttributes {
  id: string;
  userId: string;
  productId: string | null;
  purchaseId: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  paymentMethod: string | null;
  transactionId: string | null;
  streamUrl: string | null;
  streamToken: string | null;
  expiresAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderCreationAttributes {
  userId: string;
  productId?: string | null;
  purchaseId?: string | null;
  amount: number;
  currency?: string;
  status?: 'pending' | 'completed' | 'cancelled' | 'refunded';
  paymentMethod?: string | null;
  transactionId?: string | null;
  streamUrl?: string | null;
  streamToken?: string | null;
  expiresAt?: Date | null;
}
