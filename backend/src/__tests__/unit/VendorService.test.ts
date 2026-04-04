/**
 * @fileoverview Unit tests for VendorService
 * @description Tests for VendorService including:
 *              - Vendor registration, approval, rejection, suspension
 *              - Dashboard retrieval, payout requests
 * @module __tests__/unit/VendorService.test
 */

// Mock sequelize
jest.mock('../../config/database', () => ({
  sequelize: {
    transaction: jest.fn().mockImplementation(() =>
      Promise.resolve({
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
      })
    ),
    query: jest.fn(),
    sync: jest.fn().mockResolvedValue({}),
    authenticate: jest.fn().mockResolvedValue(undefined),
  },
  resetSequelize: jest.fn(),
}));

// Mock models
jest.mock('../../models', () => ({
  Vendor: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
  Product: {
    count: jest.fn().mockResolvedValue(5),
    findAndCountAll: jest.fn().mockResolvedValue({ rows: [], count: 0 }),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
  VendorOrder: {
    findAll: jest.fn().mockResolvedValue([]),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
  VendorPayout: {
    sum: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
}));

// Mock AppError
jest.mock('../../middleware/error.middleware', () => ({
  AppError: class AppError extends Error {
    statusCode: number;
    code: string;
    constructor(statusCode: number, code: string, message: string) {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
      this.name = 'AppError';
    }
  },
}));

import { VendorService } from '../../services/VendorService';
import { Vendor, Product, VendorOrder, VendorPayout } from '../../models';
import { AppError } from '../../middleware/error.middleware';

describe('VendorService', () => {
  let vendorService: VendorService;

  // Mock data
  const mockVendorInstance = {
    id: 'vendor-123',
    userId: 'user-123',
    businessName: 'Test Store',
    slug: 'test-store',
    status: 'pending' as const,
    commissionRate: 0.7,
    save: jest.fn().mockResolvedValue(true),
    toJSON: function () {
      return this;
    },
  };

  beforeEach(() => {
    vendorService = new VendorService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new vendor with pending status', async () => {
      (Vendor.findOne as jest.Mock).mockResolvedValueOnce(null);
      (Vendor.findOne as jest.Mock).mockResolvedValueOnce(null); // slug check
      (Vendor.create as jest.Mock).mockResolvedValueOnce({
        ...mockVendorInstance,
        status: 'pending',
      });

      const result = await vendorService.register('user-123', {
        businessName: 'Test Store',
        contactEmail: 'test@store.com',
        contactPhone: '+1234567890',
        description: 'Test description',
      });

      expect(Vendor.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          businessName: 'Test Store',
          slug: 'test-store',
          contactEmail: 'test@store.com',
          status: 'pending',
          commissionRate: 0.7,
        })
      );
      expect(result.status).toBe('pending');
    });

    it('should throw error if user already has vendor profile', async () => {
      (Vendor.findOne as jest.Mock).mockResolvedValueOnce({ id: 'existing-vendor' });

      await expect(
        vendorService.register('user-123', {
          businessName: 'Test Store',
          contactEmail: 'test@store.com',
        })
      ).rejects.toThrow('User already has a vendor profile');
    });

    it('should throw error if slug already exists', async () => {
      (Vendor.findOne as jest.Mock).mockResolvedValueOnce(null);
      (Vendor.findOne as jest.Mock).mockResolvedValueOnce({ slug: 'existing-slug' });

      await expect(
        vendorService.register('user-123', {
          businessName: 'Existing Store',
          contactEmail: 'test@store.com',
        })
      ).rejects.toThrow('Business name slug already exists');
    });
  });

  describe('approve', () => {
    it('should approve a pending vendor', async () => {
      const pendingVendor = {
        ...mockVendorInstance,
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
      };
      (Vendor.findByPk as jest.Mock).mockResolvedValueOnce(pendingVendor);

      const result = await vendorService.approve('vendor-123', 'admin-123');

      expect(result.status).toBe('approved');
      expect(result.approvedBy).toBe('admin-123');
      expect(pendingVendor.save).toHaveBeenCalled();
    });

    it('should throw error if vendor is not pending', async () => {
      (Vendor.findByPk as jest.Mock).mockResolvedValueOnce({
        ...mockVendorInstance,
        status: 'approved',
      });

      await expect(vendorService.approve('vendor-123', 'admin-123')).rejects.toThrow(
        'Only pending vendors can be approved'
      );
    });
  });

  describe('reject', () => {
    it('should reject a pending vendor with reason', async () => {
      const pendingVendor = {
        id: 'vendor-123',
        userId: 'user-123',
        businessName: 'Test Store',
        slug: 'test-store',
        status: 'pending' as const,
        commissionRate: 0.7,
        metadata: {} as Record<string, unknown>,
        save: jest.fn().mockResolvedValue(true),
      };
      (Vendor.findByPk as jest.Mock).mockResolvedValueOnce(pendingVendor);

      const result = await vendorService.reject('vendor-123', 'Incomplete documents');

      expect(result.status).toBe('rejected');
      expect(pendingVendor.metadata.rejectionReason).toBe('Incomplete documents');
    });

    it('should throw error if vendor is not pending', async () => {
      (Vendor.findByPk as jest.Mock).mockResolvedValueOnce({
        ...mockVendorInstance,
        status: 'approved',
      });

      await expect(vendorService.reject('vendor-123', 'reason')).rejects.toThrow(
        'Only pending vendors can be rejected'
      );
    });
  });

  describe('suspend', () => {
    it('should suspend an approved vendor', async () => {
      const approvedVendor = {
        ...mockVendorInstance,
        status: 'approved' as const,
        metadata: { suspensionReason: 'Policy violation' },
        save: jest.fn().mockResolvedValue(true),
      };
      (Vendor.findByPk as jest.Mock).mockResolvedValueOnce(approvedVendor);

      const result = await vendorService.suspend('vendor-123', 'Policy violation');

      expect(result.status).toBe('suspended');
      expect(approvedVendor.metadata.suspensionReason).toBe('Policy violation');
    });

    it('should throw error if vendor is not approved', async () => {
      (Vendor.findByPk as jest.Mock).mockResolvedValueOnce({
        ...mockVendorInstance,
        status: 'pending',
      });

      await expect(vendorService.suspend('vendor-123', 'reason')).rejects.toThrow(
        'Only approved vendors can be suspended'
      );
    });
  });

  describe('getByUserId', () => {
    it('should return vendor for user', async () => {
      (Vendor.findOne as jest.Mock).mockResolvedValueOnce(mockVendorInstance);

      const result = await vendorService.getByUserId('user-123');

      expect(result).toEqual(mockVendorInstance);
      expect(Vendor.findOne).toHaveBeenCalledWith({ where: { userId: 'user-123' } });
    });

    it('should return null if vendor not found', async () => {
      (Vendor.findOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await vendorService.getByUserId('user-123');

      expect(result).toBeNull();
    });
  });

  describe('getById', () => {
    it('should return vendor by ID', async () => {
      (Vendor.findByPk as jest.Mock).mockResolvedValueOnce(mockVendorInstance);

      const result = await vendorService.getById('vendor-123');

      expect(result).toEqual(mockVendorInstance);
    });

    it('should throw error if vendor not found', async () => {
      (Vendor.findByPk as jest.Mock).mockResolvedValueOnce(null);

      await expect(vendorService.getById('vendor-123')).rejects.toThrow('Vendor not found');
    });
  });

  describe('list', () => {
    it('should return paginated vendors', async () => {
      const vendors = [mockVendorInstance];
      (Vendor.findAndCountAll as jest.Mock).mockResolvedValueOnce({
        rows: vendors,
        count: 1,
      });

      const result = await vendorService.list({ page: 1, limit: 20 });

      expect(result.rows).toEqual(vendors);
      expect(result.count).toBe(1);
    });

    it('should filter by status', async () => {
      (Vendor.findAndCountAll as jest.Mock).mockResolvedValueOnce({
        rows: [mockVendorInstance],
        count: 1,
      });

      await vendorService.list({ status: 'approved' });

      expect(Vendor.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'approved' }),
        })
      );
    });
  });

  describe('getDashboard', () => {
    it('should return dashboard data with stats', async () => {
      const mockVendorOrders = [
        { vendorAmount: 100, status: 'completed', createdAt: new Date() },
        { vendorAmount: 50, status: 'completed', createdAt: new Date() },
      ];
      (VendorOrder.findAll as jest.Mock).mockResolvedValueOnce(mockVendorOrders);
      (VendorPayout.sum as jest.Mock).mockResolvedValueOnce(25);
      (Product.count as jest.Mock).mockResolvedValueOnce(10);

      const result = await vendorService.getDashboard('vendor-123');

      expect(result.totalSales).toBe(2);
      expect(result.totalRevenue).toBe(150);
      expect(result.pendingPayouts).toBe(25);
      expect(result.productCount).toBe(10);
    });

    it('should handle empty vendor orders', async () => {
      (VendorOrder.findAll as jest.Mock).mockResolvedValueOnce([]);
      (VendorPayout.sum as jest.Mock).mockResolvedValueOnce(0);
      (Product.count as jest.Mock).mockResolvedValueOnce(0);

      const result = await vendorService.getDashboard('vendor-123');

      expect(result.totalSales).toBe(0);
      expect(result.totalRevenue).toBe(0);
    });
  });

  describe('requestPayout', () => {
    it('should create payout request within available balance', async () => {
      const approvedVendor = {
        ...mockVendorInstance,
        status: 'approved',
      };
      (Vendor.findByPk as jest.Mock).mockResolvedValueOnce(approvedVendor);
      (VendorOrder.findAll as jest.Mock).mockResolvedValueOnce([
        { vendorAmount: 100 },
        { vendorAmount: 50 },
      ]);
      (VendorPayout.sum as jest.Mock).mockResolvedValueOnce(0);
      (VendorPayout.create as jest.Mock).mockResolvedValueOnce({
        id: 'payout-123',
        vendorId: 'vendor-123',
        amount: 50,
        status: 'pending',
      });

      const result = await vendorService.requestPayout('vendor-123', 50);

      expect(result.amount).toBe(50);
      expect(result.status).toBe('pending');
    });

    it('should throw error if payout exceeds balance', async () => {
      const approvedVendor = {
        ...mockVendorInstance,
        status: 'approved',
      };
      (Vendor.findByPk as jest.Mock).mockResolvedValueOnce(approvedVendor);
      (VendorOrder.findAll as jest.Mock).mockResolvedValueOnce([{ vendorAmount: 100 }]);
      (VendorPayout.sum as jest.Mock).mockResolvedValueOnce(0);

      await expect(vendorService.requestPayout('vendor-123', 150)).rejects.toThrow(
        'Payout amount exceeds available balance'
      );
    });

    it('should throw error if vendor not approved', async () => {
      (Vendor.findByPk as jest.Mock).mockResolvedValueOnce({
        ...mockVendorInstance,
        status: 'pending',
      });

      await expect(vendorService.requestPayout('vendor-123', 50)).rejects.toThrow(
        'Only approved vendors can request payouts'
      );
    });
  });
});
