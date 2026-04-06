/**
 * @fileoverview API Services Unit Tests
 * @description Tests for API service methods
 * @module services/api.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  authService,
  dashboardService,
  treeService,
  userService,
  productService,
  orderService,
  walletService,
} from '../services/api';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  DashboardData,
  TreeNode,
  User,
  UserDetails,
  Product,
  ProductListResponse,
  Order,
  OrderListResponse,
  WalletBalance,
  WithdrawalRequest,
  TransactionListResponse,
} from '../types';

// Test data
const mockAuthResponse: AuthResponse = {
  token: 'mock-jwt-token',
  user: {
    id: 'user-1',
    email: 'test@example.com',
    referralCode: 'ABC123',
    level: 1,
    firstName: 'Test',
    lastName: 'User',
  },
};

const mockDashboardData: DashboardData = {
  user: mockAuthResponse.user,
  stats: {
    totalReferrals: 10,
    leftCount: 5,
    rightCount: 5,
    totalEarnings: 500,
    pendingEarnings: 50,
  },
  referralLink: 'https://example.com/ref/ABC123',
  recentCommissions: [],
  recentReferrals: [],
};

const mockTreeNode: TreeNode = {
  id: 'user-1',
  email: 'test@example.com',
  referralCode: 'ABC123',
  position: 'left',
  level: 1,
  stats: { leftCount: 2, rightCount: 3 },
  children: [],
};

const mockUser: User = {
  id: 'user-2',
  email: 'user2@example.com',
  referralCode: 'DEF456',
  level: 2,
};

const mockUserDetails: UserDetails = {
  id: 'user-2',
  email: 'user2@example.com',
  referralCode: 'DEF456',
  position: 'right',
  level: 2,
  status: 'active',
  createdAt: '2024-01-01',
  stats: {
    leftCount: 1,
    rightCount: 2,
    totalDownline: 3,
  },
};

const mockProduct: Product = {
  id: 'product-1',
  name: 'Netflix Premium',
  platform: 'netflix',
  description: 'Premium Netflix subscription',
  price: 15.99,
  currency: 'USD',
  durationDays: 30,
  imageUrl: 'https://example.com/netflix.png',
  isActive: true,
};

const mockProductListResponse: ProductListResponse = {
  products: [mockProduct],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
};

const mockOrder: Order = {
  id: 'order-1',
  orderNumber: 'ORD-001',
  userId: 'user-1',
  productId: 'product-1',
  product: mockProduct,
  status: 'completed',
  paymentMethod: 'credit_card',
  amount: 15.99,
  currency: 'USD',
  createdAt: new Date(),
};

const mockOrderListResponse: OrderListResponse = {
  orders: [mockOrder],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
};

const mockWalletBalance: WalletBalance = {
  id: 'wallet-1',
  userId: 'user-1',
  balance: 100,
  currency: 'USD',
  lastUpdated: '2024-01-01',
};

const mockTransactionResponse: TransactionListResponse = {
  data: [
    {
      id: 'tx-1',
      walletId: 'wallet-1',
      type: 'commission',
      amount: 50,
      currency: 'USD',
      description: 'Test commission',
      createdAt: new Date(),
    },
  ],
  pagination: {
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  },
};

const mockWithdrawal: WithdrawalRequest = {
  id: 'withdraw-1',
  userId: 'user-1',
  requestedAmount: 50,
  feeAmount: 2.5,
  netAmount: 47.5,
  status: 'pending',
  createdAt: new Date(),
};

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose required methods', () => {
    expect(authService).toHaveProperty('login');
    expect(authService).toHaveProperty('register');
    expect(authService).toHaveProperty('getProfile');
    expect(authService).toHaveProperty('updateProfile');
    expect(authService).toHaveProperty('changePassword');
    expect(authService).toHaveProperty('deleteAccount');
  });
});

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose getDashboard method', () => {
    expect(dashboardService).toHaveProperty('getDashboard');
    expect(typeof dashboardService.getDashboard).toBe('function');
  });
});

describe('treeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose getMyTree and getTree methods', () => {
    expect(treeService).toHaveProperty('getMyTree');
    expect(treeService).toHaveProperty('getTree');
    expect(typeof treeService.getMyTree).toBe('function');
    expect(typeof treeService.getTree).toBe('function');
  });
});

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose searchUsers and getUserDetails methods', () => {
    expect(userService).toHaveProperty('searchUsers');
    expect(userService).toHaveProperty('getUserDetails');
    expect(typeof userService.searchUsers).toBe('function');
    expect(typeof userService.getUserDetails).toBe('function');
  });
});

describe('productService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose getProducts and getProduct methods', () => {
    expect(productService).toHaveProperty('getProducts');
    expect(productService).toHaveProperty('getProduct');
    expect(productService).toHaveProperty('getProductsByPlatform');
    expect(typeof productService.getProducts).toBe('function');
    expect(typeof productService.getProduct).toBe('function');
  });
});

describe('orderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose createOrder, getOrders and getOrder methods', () => {
    expect(orderService).toHaveProperty('createOrder');
    expect(orderService).toHaveProperty('getOrders');
    expect(orderService).toHaveProperty('getOrder');
    expect(orderService).toHaveProperty('getOrderWithProduct');
    expect(typeof orderService.createOrder).toBe('function');
    expect(typeof orderService.getOrders).toBe('function');
    expect(typeof orderService.getOrder).toBe('function');
  });
});

describe('walletService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose required wallet methods', () => {
    expect(walletService).toHaveProperty('getBalance');
    expect(walletService).toHaveProperty('getTransactions');
    expect(walletService).toHaveProperty('createWithdrawal');
    expect(walletService).toHaveProperty('getWithdrawalStatus');
    expect(walletService).toHaveProperty('cancelWithdrawal');
    expect(walletService).toHaveProperty('getCryptoPrices');
    expect(typeof walletService.getBalance).toBe('function');
    expect(typeof walletService.getTransactions).toBe('function');
    expect(typeof walletService.createWithdrawal).toBe('function');
  });
});

// ─── achievementService ───────────────────────────────────────────────────────

import { achievementService } from '../services/achievementService';

describe('achievementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose getAllAchievements method', () => {
    expect(achievementService).toHaveProperty('getAllAchievements');
    expect(typeof achievementService.getAllAchievements).toBe('function');
  });

  it('should expose getMyAchievements method', () => {
    expect(achievementService).toHaveProperty('getMyAchievements');
    expect(typeof achievementService.getMyAchievements).toBe('function');
  });

  it('should expose getMySummary method', () => {
    expect(achievementService).toHaveProperty('getMySummary');
    expect(typeof achievementService.getMySummary).toBe('function');
  });

  it('getAllAchievements should return a Promise', () => {
    // We only check it is a thenable — no HTTP call needed
    const result = achievementService.getAllAchievements();
    expect(result).toBeInstanceOf(Promise);
    // Suppress unhandled rejection — we don't care about the actual resolution
    result.catch(() => {});
  });
});

// ─── leaderboardService ───────────────────────────────────────────────────────

import { leaderboardService } from '../services/leaderboardService';

describe('leaderboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose getTopSellers method', () => {
    expect(leaderboardService).toHaveProperty('getTopSellers');
    expect(typeof leaderboardService.getTopSellers).toBe('function');
  });

  it('should expose getTopReferrers method', () => {
    expect(leaderboardService).toHaveProperty('getTopReferrers');
    expect(typeof leaderboardService.getTopReferrers).toBe('function');
  });

  it('should expose getMyRank method', () => {
    expect(leaderboardService).toHaveProperty('getMyRank');
    expect(typeof leaderboardService.getMyRank).toBe('function');
  });

  it('getTopSellers should return a Promise', () => {
    const result = leaderboardService.getTopSellers('weekly');
    expect(result).toBeInstanceOf(Promise);
    result.catch(() => {});
  });

  it('getTopReferrers should return a Promise', () => {
    const result = leaderboardService.getTopReferrers('monthly');
    expect(result).toBeInstanceOf(Promise);
    result.catch(() => {});
  });
});
