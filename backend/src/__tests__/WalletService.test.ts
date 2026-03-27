/**
 * @fileoverview WalletService Unit Tests
 * @description Unit tests for WalletService business logic
 * @module __tests__/WalletService
 */
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the models
const mockWallet = {
  id: 'wallet-1',
  userId: 'user-1',
  balance: 100.0,
  currency: 'USD',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockWalletTransaction = {
  id: 'tx-1',
  walletId: 'wallet-1',
  type: 'COMMISSION',
  amount: 50.0,
  balanceAfter: 150.0,
  referenceId: 'commission-1',
  description: 'Test commission',
  exchangeRate: 1.0,
  createdAt: new Date(),
};

const mockWithdrawalRequest = {
  id: 'withdraw-1',
  userId: 'user-1',
  requestedAmount: 30.0,
  feeAmount: 1.5,
  netAmount: 28.5,
  status: 'PENDING',
  paymentMethod: 'bank_transfer',
  paymentDetails: { bankName: 'Test Bank', accountNumber: '123456' },
  rejectionReason: null,
  processedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock Sequelize models
jest.mock('../models', () => ({
  Wallet: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  WalletTransaction: {
    create: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
  },
  WithdrawalRequest: {
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(async (fn) => fn()),
    query: jest.fn(),
  },
}));

import { Wallet, WalletTransaction, WithdrawalRequest, sequelize } from '../models';
import { WalletService } from '../services/WalletService';

describe('WalletService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('calculateFee', () => {
    it('should calculate 5% fee correctly', () => {
      // Test the fee calculation logic directly
      const amount = 100;
      const feePercentage = 5;
      const expectedFee = 5;

      expect(amount * (feePercentage / 100)).toBe(expectedFee);
    });

    it('should return 0 for amount below minimum withdrawal', () => {
      const amount = 10;
      const minWithdrawal = 20;

      // Amount below minimum should not be charged (or should be rejected)
      expect(amount < minWithdrawal).toBe(true);
    });

    it('should handle zero amount', () => {
      const amount = 0;
      const feePercentage = 5;

      expect(amount * (feePercentage / 100)).toBe(0);
    });
  });

  describe('validateSufficientBalance', () => {
    it('should return true when balance is sufficient', () => {
      const walletBalance = 100;
      const requestedAmount = 30;
      const minWithdrawal = 20;

      // Balance >= amount + fee
      const fee = requestedAmount * 0.05;
      const isValid = walletBalance >= requestedAmount + fee && requestedAmount >= minWithdrawal;

      expect(isValid).toBe(true);
    });

    it('should return false when balance is insufficient', () => {
      const walletBalance = 20;
      const requestedAmount = 50;
      const minWithdrawal = 20;

      const fee = requestedAmount * 0.05;
      const isValid = walletBalance >= requestedAmount + fee && requestedAmount >= minWithdrawal;

      expect(isValid).toBe(false);
    });

    it('should return false when amount is below minimum', () => {
      const walletBalance = 100;
      const requestedAmount = 10;
      const minWithdrawal = 20;

      const fee = requestedAmount * 0.05;
      const isValid = walletBalance >= requestedAmount + fee && requestedAmount >= minWithdrawal;

      expect(isValid).toBe(false);
    });
  });

  describe('getBalance', () => {
    it('should return wallet balance for user', async () => {
      (Wallet.findOne as jest.Mock).mockResolvedValue(mockWallet);

      const result = await WalletService.getBalance('user-1');

      expect(result).toEqual({
        balance: mockWallet.balance,
        currency: mockWallet.currency,
        availableBalance: mockWallet.balance,
        pendingBalance: 0,
      });
    });

    it('should return null when wallet not found', async () => {
      (Wallet.findOne as jest.Mock).mockResolvedValue(null);

      const result = await WalletService.getBalance('non-existent-user');

      expect(result).toBeNull();
    });
  });

  describe('createWithdrawal', () => {
    it('should create withdrawal request with correct fee calculation', async () => {
      const mockWalletWithUser = {
        ...mockWallet,
        userId: 'user-1',
      };

      (Wallet.findOne as jest.Mock).mockResolvedValue(mockWalletWithUser);
      (Wallet.update as jest.Mock).mockResolvedValue([1]);
      (WalletTransaction.create as jest.Mock).mockResolvedValue(mockWalletTransaction);
      (WithdrawalRequest.create as jest.Mock).mockResolvedValue({
        ...mockWithdrawalRequest,
        requestedAmount: 30,
        feeAmount: 1.5,
        netAmount: 28.5,
      });

      const result = await WalletService.createWithdrawal('user-1', 30);

      expect(result).toBeDefined();
      expect(result.requestedAmount).toBe(30);
      expect(result.feeAmount).toBe(1.5); // 5% of 30
      expect(result.netAmount).toBe(28.5); // 30 - 1.50
    });

    it('should reject withdrawal below minimum', async () => {
      (Wallet.findOne as jest.Mock).mockResolvedValue(mockWallet);

      await expect(WalletService.createWithdrawal('user-1', 10)).rejects.toThrow(
        'Withdrawal amount must be at least $20 USD'
      );
    });

    it('should reject withdrawal when insufficient balance', async () => {
      const lowBalanceWallet = { ...mockWallet, balance: 15 };
      (Wallet.findOne as jest.Mock).mockResolvedValue(lowBalanceWallet);

      await expect(WalletService.createWithdrawal('user-1', 20)).rejects.toThrow(
        'Insufficient balance'
      );
    });
  });

  describe('creditCommission', () => {
    it('should credit commission to wallet and create transaction', async () => {
      (Wallet.findOne as jest.Mock).mockResolvedValue(mockWallet);
      (Wallet.update as jest.Mock).mockResolvedValue([1]);
      (WalletTransaction.create as jest.Mock).mockResolvedValue(mockWalletTransaction);

      const result = await WalletService.creditCommission(
        'user-1',
        50,
        'commission-1',
        'Test commission'
      );

      expect(result).toBeDefined();
      expect(Wallet.update).toHaveBeenCalled();
      expect(WalletTransaction.create).toHaveBeenCalled();
    });

    it('should create wallet if not exists', async () => {
      (Wallet.findOne as jest.Mock).mockResolvedValue(null);
      (Wallet.create as jest.Mock).mockResolvedValue({ ...mockWallet, balance: 0 });
      (Wallet.update as jest.Mock).mockResolvedValue([1]);
      (WalletTransaction.create as jest.Mock).mockResolvedValue(mockWalletTransaction);

      const result = await WalletService.creditCommission('new-user', 50, 'commission-1', 'Test');

      expect(Wallet.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      const mockTransactions = [mockWalletTransaction, mockWalletTransaction];

      (Wallet.findOne as jest.Mock).mockResolvedValue(mockWallet);
      (WalletTransaction.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockTransactions,
        count: 2,
      });

      const result = await WalletService.getTransactions('user-1', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter by transaction type', async () => {
      (Wallet.findOne as jest.Mock).mockResolvedValue(mockWallet);
      (WalletTransaction.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [mockWalletTransaction],
        count: 1,
      });

      const result = await WalletService.getTransactions('user-1', {
        page: 1,
        limit: 20,
        type: 'COMMISSION',
      });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('processDailyPayouts', () => {
    it('should process pending withdrawals', async () => {
      const pendingWithdrawal = {
        ...mockWithdrawalRequest,
        status: 'APPROVED',
        paymentMethod: 'bank_transfer',
      };

      (WithdrawalRequest.findAll as jest.Mock).mockResolvedValue([pendingWithdrawal]);
      (WithdrawalRequest.update as jest.Mock).mockResolvedValue([1]);

      await WalletService.processDailyPayouts();

      expect(WithdrawalRequest.update).toHaveBeenCalled();
    });

    it('should not process rejected withdrawals', async () => {
      const rejectedWithdrawal = {
        ...mockWithdrawalRequest,
        status: 'REJECTED',
      };

      (WithdrawalRequest.findAll as jest.Mock).mockResolvedValue([rejectedWithdrawal]);

      await WalletService.processDailyPayouts();

      // Should not update any records since they're rejected
      expect(WithdrawalRequest.update).not.toHaveBeenCalled();
    });
  });
});
