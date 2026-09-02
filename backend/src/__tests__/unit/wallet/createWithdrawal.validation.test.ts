/**
 * @fileoverview createWithdrawal validation unit tests
 * @description Tests for WalletService.createWithdrawal with destination validation:
 *   INVALID_DESTINATION, LIMIT_EXCEEDED (max + daily), INSUFFICIENT_BALANCE,
 *   MINIMUM_AMOUNT, and destination immutability (no update endpoint).
 *
 * @module __tests__/unit/wallet/createWithdrawal.validation
 */

// ============================================
// MOCKS — Must go BEFORE imports
// ============================================

jest.mock('../../../config/env', () => ({
  config: {
    wallet: {
      minWithdrawal: 20,
      maxWithdrawal: 500,
      maxWithdrawalDailyPerUser: 1000,
      feePercentage: 5,
      payoutMode: 'manual',
      cronTime: '0 0 * * *',
      pollCron: '0 */4 * * *',
      budgetPaypal: 5000,
      budgetMercadopago: 0,
    },
    features: { cryptoWallet: true },
  },
}));

jest.mock('../../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../config/database', () => ({
  sequelize: {
    transaction: jest.fn(),
  },
}));

jest.mock('../../../services/payouts', () => ({
  getPayoutGateway: jest.fn(),
}));

// Mock Sequelize models
const mockWithdrawalRequestCreate = jest.fn();
const mockWalletFindOne = jest.fn();
const mockWalletSave = jest.fn();
const mockWalletTransactionCreate = jest.fn();
const mockWithdrawalRequestFindAll = jest.fn();

jest.mock('../../../models/index', () => ({
  get WithdrawalRequest() {
    return {
      create: mockWithdrawalRequestCreate,
      findAll: mockWithdrawalRequestFindAll,
      findByPk: jest.fn(),
    };
  },
  get Wallet() {
    return {
      findOne: mockWalletFindOne,
      create: jest.fn(),
    };
  },
  get WalletTransaction() {
    return {
      create: mockWalletTransactionCreate,
    };
  },
  get User() {
    return {
      findByPk: jest.fn(),
    };
  },
}));

import { WalletService } from '../../../services/WalletService';

const walletService = new WalletService();

const validDestination = { method: 'paypal' as const, email: 'user@example.com' };

describe('WalletService.createWithdrawal — validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: wallet with sufficient balance
    mockWalletFindOne.mockResolvedValue({
      id: 'wallet-1',
      userId: 'user-1',
      balance: 1000,
      currency: 'USD',
      save: mockWalletSave.mockResolvedValue(true),
    });

    // Default: no prior withdrawals today (daily limit check)
    mockWithdrawalRequestFindAll.mockResolvedValue([]);

    // Default: successful creation
    mockWithdrawalRequestCreate.mockResolvedValue({
      id: 'withdrawal-1',
      userId: 'user-1',
      requestedAmount: 50,
      feeAmount: 2.5,
      netAmount: 47.5,
      status: 'pending',
      destination: validDestination,
      gateway: 'paypal',
      createdAt: new Date(),
    });

    mockWalletTransactionCreate.mockResolvedValue({});
  });

  describe('INVALID_DESTINATION', () => {
    it('rejects withdrawal when destination is missing', async () => {
      await expect(walletService.createWithdrawal('user-1', 50, null as any)).rejects.toThrow(
        /destino/i
      );
    });

    it('rejects withdrawal when destination email is missing', async () => {
      await expect(
        walletService.createWithdrawal('user-1', 50, { method: 'paypal' })
      ).rejects.toThrow(/Email/i);
    });

    it('rejects withdrawal when destination email is invalid format', async () => {
      await expect(
        walletService.createWithdrawal('user-1', 50, { method: 'paypal', email: 'not-an-email' })
      ).rejects.toThrow(/Email/i);
    });

    it('rejects withdrawal when destination email is empty string', async () => {
      await expect(
        walletService.createWithdrawal('user-1', 50, { method: 'paypal', email: '' })
      ).rejects.toThrow(/Email/i);
    });
  });

  describe('MINIMUM_AMOUNT', () => {
    it('rejects withdrawal below minimum ($20)', async () => {
      await expect(
        walletService.createWithdrawal('user-1', 10, validDestination)
      ).rejects.toThrow();
    });

    it('rejects withdrawal at $0', async () => {
      await expect(walletService.createWithdrawal('user-1', 0, validDestination)).rejects.toThrow();
    });

    it('accepts withdrawal at exactly $20 (minimum)', async () => {
      const result = await walletService.createWithdrawal('user-1', 20, validDestination);
      expect(result).toBeDefined();
      expect(result.status).toBe('pending');
    });
  });

  describe('LIMIT_EXCEEDED — max per withdrawal', () => {
    it('rejects withdrawal exceeding max ($500)', async () => {
      await expect(walletService.createWithdrawal('user-1', 501, validDestination)).rejects.toThrow(
        /max/i
      );
    });

    it('accepts withdrawal at exactly $500 (max)', async () => {
      const result = await walletService.createWithdrawal('user-1', 500, validDestination);
      expect(result).toBeDefined();
      expect(result.status).toBe('pending');
    });
  });

  describe('LIMIT_EXCEEDED — daily UTC max per user', () => {
    it('rejects when daily sum would exceed limit', async () => {
      // Override: user already has $900 in prior withdrawals today
      mockWithdrawalRequestFindAll.mockResolvedValueOnce([{ requestedAmount: 900 }]);
      // Override: wallet with enough balance so balance check passes
      mockWalletFindOne.mockResolvedValueOnce({
        id: 'wallet-1',
        userId: 'user-1',
        balance: 1500,
        currency: 'USD',
        save: mockWalletSave.mockResolvedValue(true),
      });

      // Trying to withdraw $200 more → 900 + 200 = 1100 > 1000 limit
      await expect(walletService.createWithdrawal('user-1', 200, validDestination)).rejects.toThrow(
        /daily/i
      );
    });

    it('accepts when daily sum is within limit', async () => {
      // User has $800 in prior withdrawals today
      mockWithdrawalRequestFindAll.mockResolvedValueOnce([{ requestedAmount: 800 }]);

      // Trying to withdraw $200 → 800 + 200 = 1000 = limit (ok)
      const result = await walletService.createWithdrawal('user-1', 200, validDestination);
      expect(result).toBeDefined();
    });

    it('allows withdrawal when no prior withdrawals today', async () => {
      mockWithdrawalRequestFindAll.mockResolvedValueOnce([]);
      const result = await walletService.createWithdrawal('user-1', 50, validDestination);
      expect(result).toBeDefined();
    });
  });

  describe('INSUFFICIENT_BALANCE', () => {
    it('rejects when wallet balance < amount + fee', async () => {
      // Override: no prior daily withdrawals (so daily check passes)
      mockWithdrawalRequestFindAll.mockResolvedValueOnce([]);
      mockWalletFindOne.mockResolvedValueOnce({
        id: 'wallet-1',
        userId: 'user-1',
        balance: 40, // 40 < 50 + 2.50 fee
        currency: 'USD',
        save: mockWalletSave.mockResolvedValue(true),
      });

      await expect(walletService.createWithdrawal('user-1', 50, validDestination)).rejects.toThrow(
        /balance/i
      );
    });

    it('accepts when wallet balance >= amount + fee', async () => {
      // Override: no prior daily withdrawals
      mockWithdrawalRequestFindAll.mockResolvedValueOnce([]);
      mockWalletFindOne.mockResolvedValueOnce({
        id: 'wallet-1',
        userId: 'user-1',
        balance: 52.5, // 52.5 >= 50 + 2.50 fee
        currency: 'USD',
        save: mockWalletSave.mockResolvedValue(true),
      });

      const result = await walletService.createWithdrawal('user-1', 50, validDestination);
      expect(result).toBeDefined();
    });
  });

  describe('destination immutability', () => {
    it('creates withdrawal with destination stored on the record', async () => {
      const result = await walletService.createWithdrawal('user-1', 50, validDestination);

      expect(mockWithdrawalRequestCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          destination: validDestination,
        })
      );
    });

    it('there is no updateDestination endpoint — verify no method exists', () => {
      // This is a design constraint: destination is set at creation and never modified.
      // If someone adds an update method in the future, this test will catch it.
      expect(typeof (walletService as any).updateDestination).toBe('undefined');
      expect(typeof (walletService as any).changeDestination).toBe('undefined');
    });
  });

  describe('happy path — successful creation', () => {
    it('creates withdrawal with correct fee calculation', async () => {
      const result = await walletService.createWithdrawal('user-1', 100, validDestination);

      expect(result).toBeDefined();
      expect(result.status).toBe('pending');

      // Fee = 100 * 5% = 5.00
      expect(mockWithdrawalRequestCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          requestedAmount: 100,
          feeAmount: 5,
          netAmount: 95,
        })
      );
    });

    it('deducts requestedAmount from wallet balance', async () => {
      // Track the wallet object returned by mock
      const walletObj = {
        id: 'wallet-1',
        userId: 'user-1',
        balance: 1000,
        currency: 'USD',
        save: jest.fn().mockResolvedValue(true),
      };
      mockWalletFindOne.mockResolvedValueOnce(walletObj);

      await walletService.createWithdrawal('user-1', 50, validDestination);

      // save() should have been called (balance was updated)
      expect(walletObj.save).toHaveBeenCalled();
      // Balance should have been reduced by the requested amount
      expect(walletObj.balance).toBe(950); // 1000 - 50
    });

    it('creates fee and withdrawal transactions', async () => {
      await walletService.createWithdrawal('user-1', 50, validDestination);

      expect(mockWalletTransactionCreate).toHaveBeenCalledTimes(2);

      // First call: fee transaction
      const feeTx = mockWalletTransactionCreate.mock.calls[0][0];
      expect(feeTx.type).toBe('fee');
      expect(feeTx.amount).toBe(-2.5);

      // Second call: withdrawal transaction
      const withdrawalTx = mockWalletTransactionCreate.mock.calls[1][0];
      expect(withdrawalTx.type).toBe('withdrawal');
      expect(withdrawalTx.amount).toBe(-50);
    });
  });
});
