/**
 * @fileoverview ProductService Inventory Unit Tests
 * @description Simplified tests for inventory operations.
 * @module __tests__/unit/InventoryMovement
 */

jest.mock('../../models', () => ({
  Product: { findByPk: jest.fn(), findAll: jest.fn() },
  Category: { findByPk: jest.fn() },
  InventoryMovement: { findAll: jest.fn(), create: jest.fn() },
  User: { findAll: jest.fn() },
}));

jest.mock('../../config/database', () => ({
  sequelize: {
    transaction: jest.fn((cb: (t: unknown) => Promise<unknown>) => cb({})),
  },
}));

jest.mock('../../middleware/error.middleware', () => ({
  AppError: class AppError extends Error {
    statusCode: number;
    code: string;
    constructor(statusCode: number, code: string, message: string) {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
    }
  },
}));

import { productService } from '../../services/ProductService';
import { Product, InventoryMovement } from '../../models';

describe('ProductService Inventory Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reserveStock()', () => {
    it('should throw if quantity is not positive', async () => {
      await expect(productService.reserveStock('prod-1', 0, 'order-1', 'user-1')).rejects.toThrow(
        'Quantity must be positive'
      );

      await expect(productService.reserveStock('prod-1', -5, 'order-1', 'user-1')).rejects.toThrow(
        'Quantity must be positive'
      );
    });
  });

  describe('releaseStock()', () => {
    it('should throw if quantity is not positive', async () => {
      await expect(productService.releaseStock('prod-1', 0, 'order-1', 'user-1')).rejects.toThrow(
        'Quantity must be positive'
      );
    });
  });

  describe('getInventoryMovements()', () => {
    it('should return inventory movements for a product', async () => {
      const mockProduct = { id: 'prod-1' };
      const mockMovements = [
        { id: 'mov-1', type: 'reserve', quantity: -10 },
        { id: 'mov-2', type: 'release', quantity: 5 },
      ];

      (Product.findByPk as jest.Mock).mockResolvedValue(mockProduct);
      (InventoryMovement.findAll as jest.Mock).mockResolvedValue(mockMovements);

      const result = await productService.getInventoryMovements('prod-1');
      expect(result).toHaveLength(2);
    });

    it('should respect limit parameter', async () => {
      const mockProduct = { id: 'prod-1' };
      (Product.findByPk as jest.Mock).mockResolvedValue(mockProduct);
      (InventoryMovement.findAll as jest.Mock).mockResolvedValue([]);

      await productService.getInventoryMovements('prod-1', 10);
      const callArgs = (InventoryMovement.findAll as jest.Mock).mock.calls[0][0];
      expect(callArgs.limit).toBe(10);
    });
  });
});
