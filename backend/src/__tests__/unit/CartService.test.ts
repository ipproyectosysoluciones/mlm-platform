/**
 * @fileoverview CartService Unit Tests — Recovery Token Logic
 * @description Tests for the recoverCart() method: two-phase token lookup (find by hash,
 *              then check status) to correctly distinguish 400 (invalid) vs 410 (already used).
 *              Pruebas para el método recoverCart(): búsqueda de token en dos fases (buscar por hash,
 *              luego verificar estado) para distinguir correctamente 400 (inválido) vs 410 (ya usado).
 * @module __tests__/unit/CartService
 */

// ============================================
// MOCKS — Must go BEFORE imports / Deben ir ANTES de los imports
// ============================================

const mockTransaction = {
  LOCK: { UPDATE: 'UPDATE' },
  commit: jest.fn(),
  rollback: jest.fn(),
};

jest.mock('../../config/database', () => ({
  sequelize: {
    transaction: jest.fn((cb: (t: unknown) => Promise<unknown>) => cb(mockTransaction)),
  },
}));

jest.mock('../../models', () => ({
  Cart: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    count: jest.fn(),
    destroy: jest.fn(),
  },
  CartItem: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
  },
  CartRecoveryToken: {
    findAll: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
  },
  Product: {
    findByPk: jest.fn(),
  },
  User: {
    findAll: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-token'),
}));

jest.mock('sequelize', () => ({
  Op: {
    gt: Symbol('gt'),
    lt: Symbol('lt'),
    in: Symbol('in'),
    gte: Symbol('gte'),
  },
}));

import { CartService, cartService } from '../../services/CartService';
import { Cart, CartItem, CartRecoveryToken, Product, User } from '../../models';
import { CART_RECOVERY_TOKEN_STATUS, CART_STATUS } from '../../types';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

describe('CartService — Recovery Token Logic (recoverCart)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // recoverCart — two-phase token lookup
  // ============================================

  describe('recoverCart()', () => {
    it('should call CartRecoveryToken.findAll WITHOUT status filter to support 410 detection', async () => {
      // Setup: findAll returns a matching PENDING token
      const mockToken = {
        id: 'token-1',
        cartId: 'cart-1',
        tokenHash: '$2a$12$hashed',
        status: CART_RECOVERY_TOKEN_STATUS.PENDING,
        usedAt: null,
        clickCount: 0,
        update: jest.fn().mockResolvedValue(undefined),
      };

      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        status: CART_STATUS.ABANDONED,
        update: jest.fn().mockResolvedValue(undefined),
      };

      (CartRecoveryToken.findAll as jest.Mock).mockResolvedValue([mockToken]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (Cart.findByPk as jest.Mock)
        .mockResolvedValueOnce(mockCart) // first call: find cart for update
        .mockResolvedValueOnce(mockCart); // second call: reload with includes

      await cartService.recoverCart('plain-token-123');

      // CRITICAL ASSERTION: The where clause must NOT include status filter
      // so that USED tokens are found and can trigger 410 instead of 400
      const findAllArgs = (CartRecoveryToken.findAll as jest.Mock).mock.calls[0][0];
      expect(findAllArgs.where).not.toHaveProperty('status');
      expect(findAllArgs.where).toHaveProperty('expiresAt');
      expect(findAllArgs.lock).toBe('UPDATE');
      expect(findAllArgs.transaction).toBeDefined();
    });

    it('should return 410 when token is found but already USED (replay prevention)', async () => {
      const mockUsedToken = {
        id: 'token-1',
        cartId: 'cart-1',
        tokenHash: '$2a$12$hashed',
        status: CART_RECOVERY_TOKEN_STATUS.USED,
        usedAt: new Date(),
        clickCount: 1,
        update: jest.fn().mockResolvedValue(undefined),
      };

      (CartRecoveryToken.findAll as jest.Mock).mockResolvedValue([mockUsedToken]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(cartService.recoverCart('used-token')).rejects.toThrow('Token already used');

      try {
        await cartService.recoverCart('used-token');
      } catch (error: any) {
        expect(error.statusCode).toBe(410);
      }
    });

    it('should recover cart when token matches (bcrypt.compare → true)', async () => {
      const mockToken = {
        id: 'token-1',
        cartId: 'cart-1',
        tokenHash: '$2a$12$hashed',
        status: CART_RECOVERY_TOKEN_STATUS.PENDING,
        usedAt: null,
        clickCount: 0,
        update: jest.fn().mockResolvedValue(undefined),
      };

      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        status: CART_STATUS.ABANDONED,
        update: jest.fn().mockResolvedValue(undefined),
      };

      const mockCartWithItems = {
        ...mockCart,
        items: [],
      };

      (CartRecoveryToken.findAll as jest.Mock).mockResolvedValue([mockToken]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (Cart.findByPk as jest.Mock)
        .mockResolvedValueOnce(mockCart) // find cart to update
        .mockResolvedValueOnce(mockCartWithItems); // reload with includes

      const result = await cartService.recoverCart('valid-token');

      // Token should be marked as used
      expect(mockToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: CART_RECOVERY_TOKEN_STATUS.USED,
          usedAt: expect.any(Date),
        }),
        expect.objectContaining({ transaction: expect.anything() })
      );

      // Cart should be marked as recovered
      expect(mockCart.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: CART_STATUS.RECOVERED,
          recoveredAt: expect.any(Date),
        }),
        expect.objectContaining({ transaction: expect.anything() })
      );

      expect(result).toEqual(mockCartWithItems);
    });

    it('should throw error when no matching tokens found (invalid token)', async () => {
      // No tokens returned OR bcrypt.compare returns false for all
      (CartRecoveryToken.findAll as jest.Mock).mockResolvedValue([]);

      await expect(cartService.recoverCart('bad-token')).rejects.toThrow(
        'Invalid or expired recovery token'
      );
    });
  });

  // ============================================
  // SINGLETON EXPORT
  // ============================================

  describe('singleton export', () => {
    it('should export a singleton instance of CartService', () => {
      expect(cartService).toBeInstanceOf(CartService);
    });
  });
});
