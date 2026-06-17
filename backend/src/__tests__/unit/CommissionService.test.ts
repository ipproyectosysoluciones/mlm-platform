/**
 * @fileoverview Unit tests for CommissionService
 * @description Tests for:
 *   - Vendor commission split (3-way: vendor, MLM, platform)
 *   - N-level unilevel calculateCommissions (Phase 4 #157)
 *   - generateLevelKey usage, config-driven depth, model='unilevel'
 * @module __tests__/unit/CommissionService.test
 */

import { generateLevelKey } from '../../types/index';

// ============================================================
// Mock setup — shared across all describe blocks
// ============================================================

const mockTransaction = {
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
};

// Default upline: 2 ancestors (for existing vendor tests)
let mockUplineResult: Array<{ id: string; depth: number }> = [
  { id: 'ancestor-1', depth: 1 },
  { id: 'ancestor-2', depth: 2 },
];

jest.mock('../../config/database', () => ({
  sequelize: {
    transaction: jest.fn().mockImplementation(() => Promise.resolve(mockTransaction)),
    query: jest.fn().mockImplementation(() => Promise.resolve(mockUplineResult)),
    sync: jest.fn().mockResolvedValue({}),
    authenticate: jest.fn().mockResolvedValue(undefined),
  },
  resetSequelize: jest.fn(),
}));

// Track Commission.create calls to verify arguments
const mockCommissionCreate = jest
  .fn()
  .mockImplementation((data: Record<string, unknown>) =>
    Promise.resolve({ id: `comm-${Date.now()}-${Math.random()}`, ...data })
  );

// Track CommissionConfig.findOne for config-driven depth
const mockConfigFindOne = jest.fn().mockResolvedValue(null);

// Track CommissionConfig.count for max depth
const mockConfigCount = jest.fn().mockResolvedValue(10);

jest.mock('../../models', () => ({
  User: {
    findByPk: jest.fn().mockImplementation((id: string) => {
      if (id === 'buyer-123') {
        return Promise.resolve({ id: 'buyer-123', sponsorId: 'sponsor-123', currency: 'USD' });
      }
      return Promise.resolve({ id: id, sponsorId: null, currency: 'USD' });
    }),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
  Purchase: {
    findByPk: jest.fn().mockImplementation((id: string) => {
      if (id === 'purchase-10levels') {
        return Promise.resolve({
          id: 'purchase-10levels',
          userId: 'buyer-123',
          amount: 100,
          currency: 'USD',
          businessType: 'membresia',
        });
      }
      if (id === 'purchase-3levels') {
        return Promise.resolve({
          id: 'purchase-3levels',
          userId: 'buyer-123',
          amount: 200,
          currency: 'USD',
          businessType: 'producto',
        });
      }
      return Promise.resolve(null);
    }),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
  Commission: {
    create: mockCommissionCreate,
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
  CommissionConfig: {
    findOne: mockConfigFindOne,
    count: mockConfigCount,
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
  Vendor: {
    findByPk: jest.fn().mockImplementation((id: string) => {
      if (id === 'vendor-123') {
        return Promise.resolve({
          id: 'vendor-123',
          status: 'approved',
          commissionRate: 0.7,
        });
      }
      if (id === 'vendor-suspended') {
        return Promise.resolve({
          id: 'vendor-suspended',
          status: 'suspended',
          commissionRate: 0.7,
        });
      }
      return Promise.resolve(null);
    }),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
}));

// Mock wallet service
jest.mock('../../services/WalletService', () => ({
  walletService: {
    creditCommission: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock email service
jest.mock('../../services/EmailService', () => ({
  emailService: {
    sendCommission: jest.fn().mockResolvedValue(undefined),
  },
}));

import { CommissionService } from '../../services/CommissionService';
import { User } from '../../models';

describe('CommissionService - Vendor Commission Split', () => {
  let commissionService: CommissionService;

  beforeEach(() => {
    commissionService = new CommissionService();
    jest.clearAllMocks();
    // Reset to default 2-ancestor upline for vendor tests
    mockUplineResult = [
      { id: 'ancestor-1', depth: 1 },
      { id: 'ancestor-2', depth: 2 },
    ];
  });

  describe('calculateVendorCommission', () => {
    describe('Vendor product error cases', () => {
      it('should throw error for non-approved vendor', async () => {
        await expect(
          commissionService.calculateVendorCommission(100, 'vendor-suspended', 'buyer-123')
        ).rejects.toThrow('Vendor is not approved');
      });

      it('should throw error for non-existent vendor', async () => {
        await expect(
          commissionService.calculateVendorCommission(100, 'vendor-nonexistent', 'buyer-123')
        ).rejects.toThrow('Vendor not found');
      });
    });

    describe('createMlmCommissionsFromSplit', () => {
      it('should create MLM commissions from split results', async () => {
        const mlmCommissions = [
          { userId: 'upline-1', level: 'level_1', amount: 2.1 },
          { userId: 'upline-2', level: 'level_2', amount: 0.9 },
        ];

        const result = await commissionService.createMlmCommissionsFromSplit(
          mlmCommissions,
          'purchase-123',
          'buyer-123',
          100
        );

        expect(result.length).toBe(2);
      });

      it('should handle empty MLM commissions array', async () => {
        const result = await commissionService.createMlmCommissionsFromSplit(
          [],
          'purchase-123',
          'buyer-123',
          100
        );

        expect(result).toEqual([]);
      });
    });
  });
});

// ============================================================
// Phase 4 (#157): N-level Unilevel calculateCommissions
// ============================================================
describe('CommissionService - N-level Unilevel (Phase 4 #157)', () => {
  let commissionService: CommissionService;

  beforeEach(() => {
    commissionService = new CommissionService();
    jest.clearAllMocks();
    mockConfigCount.mockResolvedValue(10);
    mockConfigFindOne.mockResolvedValue(null); // fallback to COMMISSION_RATES
  });

  describe('calculateCommissions — 10 levels of upline', () => {
    it('should generate 10 commission records + 1 direct for 10 levels of upline', async () => {
      // 11 configs = direct + level_1..level_10 → maxDepth = 10
      mockConfigCount.mockResolvedValue(11);

      // 10 upline ancestors at depth 1..10 (none being sponsor-123)
      mockUplineResult = Array.from({ length: 10 }, (_, i) => ({
        id: `ancestor-${i + 1}`,
        depth: i + 1,
      }));

      // Mock sponsor lookup
      (User.findByPk as jest.Mock).mockImplementation((id: string) => {
        if (id === 'buyer-123') {
          return Promise.resolve({
            id: 'buyer-123',
            sponsorId: 'sponsor-123',
            email: 'buyer@test.com',
            currency: 'USD',
          });
        }
        if (id === 'sponsor-123') {
          return Promise.resolve({ id: 'sponsor-123', email: 'sponsor@test.com', currency: 'USD' });
        }
        return Promise.resolve({ id, email: `${id}@test.com`, currency: 'USD' });
      });

      const result = await commissionService.calculateCommissions('purchase-10levels');

      // 11 configs (direct + 10 levels) → maxDepth = 10
      // 1 direct (sponsor) + 10 upline (depth 1..10) = 11 total
      expect(result.length).toBe(11);

      // Verify commission types use generateLevelKey convention
      const types = mockCommissionCreate.mock.calls.map(
        (c: Array<Record<string, unknown>>) => c[0].type
      );
      expect(types[0]).toBe('direct');
      for (let i = 1; i <= 10; i++) {
        expect(types[i]).toBe(generateLevelKey(i));
      }
    });
  });

  describe('calculateCommissions — 3 levels only (no error for missing levels)', () => {
    it('should generate only 3 upline commissions + 1 direct when upline has 3 ancestors', async () => {
      mockUplineResult = [
        { id: 'ancestor-1', depth: 1 },
        { id: 'ancestor-2', depth: 2 },
        { id: 'ancestor-3', depth: 3 },
      ];

      (User.findByPk as jest.Mock).mockImplementation((id: string) => {
        if (id === 'buyer-123') {
          return Promise.resolve({
            id: 'buyer-123',
            sponsorId: 'sponsor-123',
            email: 'buyer@test.com',
            currency: 'USD',
          });
        }
        if (id === 'sponsor-123') {
          return Promise.resolve({ id: 'sponsor-123', email: 'sponsor@test.com', currency: 'USD' });
        }
        return Promise.resolve({ id, email: `${id}@test.com`, currency: 'USD' });
      });

      const result = await commissionService.calculateCommissions('purchase-3levels');

      // 1 direct + 3 upline = 4 total
      expect(result.length).toBe(4);

      const types = mockCommissionCreate.mock.calls.map(
        (c: Array<Record<string, unknown>>) => c[0].type
      );
      expect(types).toEqual(['direct', 'level_1', 'level_2', 'level_3']);
    });
  });

  describe('calculateCommissions — inactive sponsor skipped', () => {
    it('should skip ancestor whose id matches buyer.sponsorId in the upline loop', async () => {
      // sponsor-123 appears in upline at depth 1 — should be skipped (direct is handled separately)
      mockUplineResult = [
        { id: 'sponsor-123', depth: 1 },
        { id: 'ancestor-2', depth: 2 },
        { id: 'ancestor-3', depth: 3 },
      ];

      (User.findByPk as jest.Mock).mockImplementation((id: string) => {
        if (id === 'buyer-123') {
          return Promise.resolve({
            id: 'buyer-123',
            sponsorId: 'sponsor-123',
            email: 'buyer@test.com',
            currency: 'USD',
          });
        }
        if (id === 'sponsor-123') {
          return Promise.resolve({ id: 'sponsor-123', email: 'sponsor@test.com', currency: 'USD' });
        }
        return Promise.resolve({ id, email: `${id}@test.com`, currency: 'USD' });
      });

      const result = await commissionService.calculateCommissions('purchase-3levels');

      // 1 direct + 2 upline (sponsor-123 at depth 1 is skipped) = 3
      expect(result.length).toBe(3);

      const types = mockCommissionCreate.mock.calls.map(
        (c: Array<Record<string, unknown>>) => c[0].type
      );
      // sponsor-123 at depth=1 is skipped → depth=2 maps to level_1, depth=3 maps to level_2
      expect(types).toEqual(['direct', 'level_1', 'level_2']);
    });
  });

  describe('calculateCommissions — commission types use generateLevelKey convention', () => {
    it('should use direct, level_1, level_2, ..., level_9 as commission types', async () => {
      mockUplineResult = Array.from({ length: 9 }, (_, i) => ({
        id: `ancestor-${i + 1}`,
        depth: i + 1,
      }));

      (User.findByPk as jest.Mock).mockImplementation((id: string) => {
        if (id === 'buyer-123') {
          return Promise.resolve({
            id: 'buyer-123',
            sponsorId: 'sponsor-123',
            email: 'buyer@test.com',
            currency: 'USD',
          });
        }
        if (id === 'sponsor-123') {
          return Promise.resolve({ id: 'sponsor-123', email: 'sponsor@test.com', currency: 'USD' });
        }
        return Promise.resolve({ id, email: `${id}@test.com`, currency: 'USD' });
      });

      await commissionService.calculateCommissions('purchase-10levels');

      const types = mockCommissionCreate.mock.calls.map(
        (c: Array<Record<string, unknown>>) => c[0].type
      );
      // direct + level_1 through level_9
      expect(types[0]).toBe('direct');
      expect(types[1]).toBe('level_1');
      expect(types[5]).toBe('level_5');
      expect(types[9]).toBe('level_9');
    });
  });

  describe('calculateCommissions — model column set to unilevel', () => {
    it('should set model: "unilevel" on all created commission records', async () => {
      mockUplineResult = [
        { id: 'ancestor-1', depth: 1 },
        { id: 'ancestor-2', depth: 2 },
      ];

      (User.findByPk as jest.Mock).mockImplementation((id: string) => {
        if (id === 'buyer-123') {
          return Promise.resolve({
            id: 'buyer-123',
            sponsorId: 'sponsor-123',
            email: 'buyer@test.com',
            currency: 'USD',
          });
        }
        if (id === 'sponsor-123') {
          return Promise.resolve({ id: 'sponsor-123', email: 'sponsor@test.com', currency: 'USD' });
        }
        return Promise.resolve({ id, email: `${id}@test.com`, currency: 'USD' });
      });

      await commissionService.calculateCommissions('purchase-10levels');

      // Every Commission.create call should have model: 'unilevel'
      for (const call of mockCommissionCreate.mock.calls) {
        expect(call[0].model).toBe('unilevel');
      }
    });
  });

  describe('calculateVendorCommission — uses generateLevelKey for platform products', () => {
    it('should use generateLevelKey types in mlmCommissions for platform product (no vendor)', async () => {
      mockUplineResult = Array.from({ length: 6 }, (_, i) => ({
        id: `ancestor-${i + 1}`,
        depth: i + 1,
      }));

      (User.findByPk as jest.Mock).mockImplementation((id: string) => {
        if (id === 'buyer-123') {
          return Promise.resolve({ id: 'buyer-123', sponsorId: 'sponsor-123', currency: 'USD' });
        }
        return Promise.resolve({ id, sponsorId: null, currency: 'USD' });
      });

      const result = await commissionService.calculateVendorCommission(
        100,
        null,
        'buyer-123',
        'producto'
      );

      // Should have 6 mlm commission entries with correct level keys
      expect(result.mlmCommissions.length).toBe(6);
      expect(result.mlmCommissions[0].level).toBe('level_1');
      expect(result.mlmCommissions[5].level).toBe('level_6');
    });
  });

  describe('calculateVendorCommission — uses generateLevelKey for vendor products', () => {
    it('should use generateLevelKey types in mlmCommissions for vendor product', async () => {
      mockUplineResult = [
        { id: 'sponsor-123', depth: 1 },
        { id: 'ancestor-2', depth: 2 },
        { id: 'ancestor-3', depth: 3 },
        { id: 'ancestor-4', depth: 4 },
        { id: 'ancestor-5', depth: 5 },
      ];

      (User.findByPk as jest.Mock).mockImplementation((id: string) => {
        if (id === 'buyer-123') {
          return Promise.resolve({ id: 'buyer-123', sponsorId: 'sponsor-123', currency: 'USD' });
        }
        return Promise.resolve({ id, sponsorId: null, currency: 'USD' });
      });

      const result = await commissionService.calculateVendorCommission(
        100,
        'vendor-123',
        'buyer-123',
        'producto'
      );

      // sponsor-123 at depth 1 is skipped (handled separately), so 4 MLM commissions
      // depth=2→level_1, depth=3→level_2, depth=4→level_3, depth=5→level_4
      expect(result.mlmCommissions.length).toBe(4);
      expect(result.mlmCommissions[0].level).toBe('level_1');
      expect(result.mlmCommissions[3].level).toBe('level_4');
    });
  });
});
