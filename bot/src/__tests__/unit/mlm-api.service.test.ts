import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock axios BEFORE importing the service ──────────────────────────────────
//
// vi.mock() factories are hoisted above ALL variable declarations, so we cannot
// reference a `const` defined in the outer scope. Instead we use vi.hoisted()
// to create the shared mock instance in the hoisted zone, making it available
// both inside the factory AND in the test body.

const { mockAxiosInstance } = vi.hoisted(() => ({
  mockAxiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}));

vi.mock('../../services/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    alert: vi.fn().mockResolvedValue(undefined),
  },
}));

// ─── Imports AFTER mocks ───────────────────────────────────────────────────────

import { mlmApi } from '../../services/mlm-api.service.js';
import type {
  UserProfile,
  WalletBalance,
  NetworkSummary,
  Commission,
} from '../../services/mlm-api.service.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockUser: UserProfile = {
  id: 'user-uuid-123',
  username: 'juantest',
  email: 'juan@test.com',
  firstName: 'Juan',
  lastName: 'Test',
  phone: '5491122334455',
  role: 'member',
};

const mockWallet: WalletBalance = {
  balance: 1500.5,
  pendingWithdrawals: 200,
  totalEarned: 3000,
  currency: 'USD',
};

const mockNetwork: NetworkSummary = {
  totalReferrals: 15,
  activeReferrals: 8,
  leftLeg: 5,
  rightLeg: 3,
  level: 3,
};

const mockCommissions: Commission[] = [
  {
    amount: 150.0,
    type: 'direct',
    description: 'Direct sale',
    createdAt: '2026-03-01T10:00:00Z',
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('mlm-api.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── getUserByPhone ──────────────────────────────────────────────────────────

  describe('getUserByPhone', () => {
    it('returns the user profile on a successful API response', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { user: mockUser } });

      const result = await mlmApi.getUserByPhone('5491122334455');

      expect(result).toEqual(mockUser);
      expect(mockAxiosInstance.get).toHaveBeenCalledOnce();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/bot/user-by-phone/5491122334455');
    });

    it('returns null when the API throws an error', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await mlmApi.getUserByPhone('5490000000000');

      expect(result).toBeNull();
    });
  });

  // ─── getWalletBalance ────────────────────────────────────────────────────────

  describe('getWalletBalance', () => {
    it('returns wallet data on a successful API response', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { wallet: mockWallet } });

      const result = await mlmApi.getWalletBalance('user-uuid-123');

      expect(result).toEqual(mockWallet);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/bot/wallet/user-uuid-123');
    });

    it('returns null when the API throws an error', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Timeout'));

      const result = await mlmApi.getWalletBalance('user-uuid-123');

      expect(result).toBeNull();
    });
  });

  // ─── getNetworkSummary ───────────────────────────────────────────────────────

  describe('getNetworkSummary', () => {
    it('returns network data on a successful API response', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { network: mockNetwork } });

      const result = await mlmApi.getNetworkSummary('user-uuid-123');

      expect(result).toEqual(mockNetwork);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/bot/network/user-uuid-123');
    });

    it('returns null when the API throws an error', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Service unavailable'));

      const result = await mlmApi.getNetworkSummary('user-uuid-123');

      expect(result).toBeNull();
    });
  });

  // ─── getRecentCommissions ────────────────────────────────────────────────────

  describe('getRecentCommissions', () => {
    it('returns commission entries on a successful API response', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { commissions: mockCommissions },
      });

      const result = await mlmApi.getRecentCommissions('user-uuid-123');

      expect(result).toEqual(mockCommissions);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/bot/commissions/user-uuid-123?limit=5');
    });

    it('returns an empty array when the API throws an error', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Not found'));

      const result = await mlmApi.getRecentCommissions('user-uuid-123');

      expect(result).toEqual([]);
    });
  });
});
