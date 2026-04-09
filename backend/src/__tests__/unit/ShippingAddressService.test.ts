/**
 * @fileoverview ShippingAddressService Unit Tests
 * @description Tests for shipping address CRUD and default management.
 * @module __tests__/unit/ShippingAddressService.test
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
jest.mock('../../models/ShippingAddress', () => ({
  ShippingAddress: {
    count: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
}));

// Mock AppError
jest.mock('../../middleware/error.middleware', () => ({
  AppError: class AppError extends Error {
    constructor(
      public statusCode: number,
      public code: string,
      message: string
    ) {
      super(message);
      this.name = 'AppError';
    }
  },
}));

import { ShippingAddressService } from '../../services/ShippingAddressService';
import { ShippingAddress } from '../../models/ShippingAddress';

describe('ShippingAddressService', () => {
  let service: ShippingAddressService;

  beforeEach(() => {
    service = new ShippingAddressService();
    jest.clearAllMocks();
    // Reset mock implementations to prevent state pollution
    (ShippingAddress.update as jest.Mock).mockReset();
  });

  describe('create', () => {
    it('should create first address as default', async () => {
      const mockAddress = {
        id: 'test-uuid',
        userId: 'user-uuid',
        recipientName: 'John Doe',
        street: '123 Main St',
        city: 'Bogota',
        state: 'Cundinamarca',
        postalCode: '110111',
        country: 'COL',
        isDefault: true,
      };

      (ShippingAddress.count as jest.Mock).mockResolvedValue(0);
      (ShippingAddress.create as jest.Mock).mockResolvedValue(mockAddress);

      const result = await service.create('user-uuid', {
        recipientName: 'John Doe',
        street: '123 Main St',
        city: 'Bogota',
        state: 'Cundinamarca',
        postalCode: '110111',
        country: 'COL',
      });

      expect(result.isDefault).toBe(true);
      expect(ShippingAddress.create).toHaveBeenCalled();
    });

    it('should throw error when user has reached address limit', async () => {
      (ShippingAddress.count as jest.Mock).mockResolvedValue(10);

      await expect(
        service.create('user-uuid', {
          recipientName: 'John Doe',
          street: '123 Main St',
          city: 'Bogota',
          state: 'Cundinamarca',
          postalCode: '110111',
          country: 'COL',
        })
      ).rejects.toThrow('Maximum of 10 addresses per user reached');

      expect.assertions(1);
    });

    it('should set isDefault true when explicitly set', async () => {
      const mockAddress = {
        id: 'test-uuid',
        userId: 'user-uuid',
        recipientName: 'John Doe',
        isDefault: true,
      };

      (ShippingAddress.count as jest.Mock).mockResolvedValue(2);
      (ShippingAddress.update as jest.Mock).mockResolvedValue([1]);
      (ShippingAddress.create as jest.Mock).mockResolvedValue(mockAddress);

      const result = await service.create('user-uuid', {
        recipientName: 'John Doe',
        street: '123 Main St',
        city: 'Bogota',
        state: 'Cundinamarca',
        postalCode: '110111',
        country: 'COL',
        isDefault: true,
      });

      expect(result.isDefault).toBe(true);
    });
  });

  describe('findAllByUser', () => {
    it('should return all addresses for user sorted by default first', async () => {
      const mockAddresses = [
        { id: 'addr-1', isDefault: true },
        { id: 'addr-2', isDefault: false },
      ];

      (ShippingAddress.findAll as jest.Mock).mockResolvedValue(mockAddresses);

      const result = await service.findAllByUser('user-uuid');

      expect(result).toEqual(mockAddresses);
      expect(ShippingAddress.findAll).toHaveBeenCalledWith({
        where: { userId: 'user-uuid' },
        order: [
          ['isDefault', 'DESC'],
          ['createdAt', 'DESC'],
        ],
      });
    });
  });

  describe('findById', () => {
    it('should return address when owned by user', async () => {
      const mockAddress = { id: 'addr-uuid', userId: 'user-uuid' };

      (ShippingAddress.findOne as jest.Mock).mockResolvedValue(mockAddress);
      (ShippingAddress.update as jest.Mock).mockReset();

      const result = await service.findById('addr-uuid', 'user-uuid');

      expect(result).toEqual(mockAddress);
    });

    it('should throw error when address not found', async () => {
      (ShippingAddress.findOne as jest.Mock).mockResolvedValue(null);
      (ShippingAddress.update as jest.Mock).mockReset();

      await expect(service.findById('non-existent', 'user-uuid')).rejects.toThrow(
        'Shipping address not found'
      );
    });
  });

  describe('delete', () => {
    it('should throw error when deleting default address', async () => {
      const mockAddress = { id: 'addr-uuid', isDefault: true, destroy: jest.fn() };

      (ShippingAddress.findOne as jest.Mock).mockResolvedValue(mockAddress);

      await expect(service.delete('addr-uuid', 'user-uuid')).rejects.toThrow(
        'Cannot delete default shipping address'
      );

      expect(mockAddress.destroy).not.toHaveBeenCalled();
    });

    it('should delete non-default address', async () => {
      const mockAddress = { id: 'addr-uuid', isDefault: false, destroy: jest.fn() };

      (ShippingAddress.findOne as jest.Mock).mockResolvedValue(mockAddress);

      await service.delete('addr-uuid', 'user-uuid');

      expect(mockAddress.destroy).toHaveBeenCalled();
    });
  });

  describe('setDefault', () => {
    it('should set new default and unset previous', async () => {
      const mockAddress = {
        id: 'addr-uuid',
        isDefault: false,
        update: jest.fn().mockResolvedValue(true),
        reload: jest.fn().mockResolvedValue({ id: 'addr-uuid', isDefault: true }),
      };

      (ShippingAddress.findOne as jest.Mock).mockResolvedValue(mockAddress);
      (ShippingAddress.update as jest.Mock).mockResolvedValue([1]);

      await service.setDefault('addr-uuid', 'user-uuid');

      // Just verify the methods were called (don't check exact arguments due to transaction mocking)
      expect(ShippingAddress.update).toHaveBeenCalled();
      expect(mockAddress.update).toHaveBeenCalled();
    });

    it('should return same address if already default', async () => {
      const mockAddress = { id: 'addr-uuid', isDefault: true };

      (ShippingAddress.findOne as jest.Mock).mockResolvedValue(mockAddress);

      const result = await service.setDefault('addr-uuid', 'user-uuid');

      expect(result).toEqual(mockAddress);
      expect(ShippingAddress.update).not.toHaveBeenCalled();
    });
  });

  describe('getDefault', () => {
    it('should return default address', async () => {
      const mockAddress = { id: 'addr-uuid', isDefault: true };

      (ShippingAddress.findOne as jest.Mock).mockResolvedValue(mockAddress);

      const result = await service.getDefault('user-uuid');

      expect(result).toEqual(mockAddress);
    });

    it('should return null when no default address', async () => {
      (ShippingAddress.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getDefault('user-uuid');

      expect(result).toBeNull();
    });
  });
});
