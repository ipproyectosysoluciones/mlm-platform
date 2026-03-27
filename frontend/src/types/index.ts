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

export interface AuthResponse {
  token: string;
  user: User;
}

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
export type PaymentMethod = 'credit_card' | 'debit_card' | 'simulated';

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
