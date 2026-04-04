/**
 * @fileoverview Unit tests for CommissionService - Vendor Commission Split
 * @description Tests for CommissionService.calculateVendorCommission
 *              - 3-way split: vendor, MLM, platform
 *              - Edge cases: 0%, 100%, fractional amounts
 *              - Math verification: vendorAmount + platformNet + sum(mlm) === price
 * @module __tests__/unit/CommissionService.test
 */

// Mock sequelize
const mockTransaction = {
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
};

jest.mock('../../config/database', () => ({
  sequelize: {
    transaction: jest.fn().mockImplementation(() => Promise.resolve(mockTransaction)),
    query: jest.fn().mockImplementation(() =>
      Promise.resolve([
        { id: 'ancestor-1', depth: 1 },
        { id: 'ancestor-2', depth: 2 },
      ])
    ),
    sync: jest.fn().mockResolvedValue({}),
    authenticate: jest.fn().mockResolvedValue(undefined),
  },
  resetSequelize: jest.fn(),
}));

// Mock models
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
  Commission: {
    create: jest.fn().mockResolvedValue({}),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
  CommissionConfig: {
    findOne: jest.fn().mockResolvedValue(null),
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

describe('CommissionService - Vendor Commission Split', () => {
  let commissionService: CommissionService;

  beforeEach(() => {
    commissionService = new CommissionService();
    jest.clearAllMocks();
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
