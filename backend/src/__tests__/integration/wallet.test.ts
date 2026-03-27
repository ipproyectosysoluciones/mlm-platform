/**
 * @fileoverview Wallet Integration Tests
 * @description Tests for wallet balance, transactions, and withdrawal endpoints
 *
 * @module __tests__/integration/wallet
 */

import { testAgent } from '../setup';
import { createTestUser, getAuthHeaders } from '../fixtures';
import { Wallet, WalletTransaction, WithdrawalRequest, Commission, User } from '../../models';

describe('Wallet Integration Tests', () => {
  let testUser: any;
  let authHeaders: Record<string, string>;

  beforeEach(async () => {
    // Create test user and get auth
    testUser = await createTestUser();
    authHeaders = await getAuthHeaders(testUser);

    // Clean up wallet data before each test
    await WithdrawalRequest.destroy({ where: {}, truncate: true });
    await WalletTransaction.destroy({ where: {}, truncate: true });
    await Wallet.destroy({ where: {}, truncate: true });
  });

  afterEach(async () => {
    // Clean up after each test
    await WithdrawalRequest.destroy({ where: {}, truncate: true });
    await WalletTransaction.destroy({ where: {}, truncate: true });
    await Wallet.destroy({ where: {}, truncate: true });
  });

  describe('GET /api/wallets/:userId (Get Balance)', () => {
    it('should return wallet balance for authenticated user', async () => {
      // First create a wallet with some balance
      const wallet = await Wallet.create({
        userId: testUser.id,
        balance: 100.0,
        currency: 'USD',
      });

      const res = await testAgent.get(`/api/wallets/${testUser.id}`).set(authHeaders).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('balance');
      expect(res.body.data.balance).toBe('100.00');
    });

    it('should return 404 when wallet not found', async () => {
      const res = await testAgent
        .get('/api/wallets/non-existent-user')
        .set(authHeaders)
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it('should return 403 when accessing another users wallet', async () => {
      // Create another user
      const otherUser = await createTestUser();

      // Try to access their wallet
      const res = await testAgent.get(`/api/wallets/${otherUser.id}`).set(authHeaders).expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/wallets/:userId/transactions', () => {
    it('should return paginated transactions', async () => {
      // Create wallet and transactions
      const wallet = await Wallet.create({
        userId: testUser.id,
        balance: 100.0,
        currency: 'USD',
      });

      await WalletTransaction.create({
        walletId: wallet.id,
        type: 'COMMISSION',
        amount: 50.0,
        balanceAfter: 150.0,
        referenceId: 'comm-1',
        description: 'Test commission',
        exchangeRate: 1.0,
      });

      const res = await testAgent
        .get(`/api/wallets/${testUser.id}/transactions`)
        .set(authHeaders)
        .query({ page: 1, limit: 20 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.pagination).toHaveProperty('total');
    });

    it('should filter transactions by type', async () => {
      const wallet = await Wallet.create({
        userId: testUser.id,
        balance: 100.0,
        currency: 'USD',
      });

      // Create commission transaction
      await WalletTransaction.create({
        walletId: wallet.id,
        type: 'COMMISSION',
        amount: 50.0,
        balanceAfter: 150.0,
        referenceId: 'comm-1',
        description: 'Commission',
        exchangeRate: 1.0,
      });

      // Create withdrawal transaction
      await WalletTransaction.create({
        walletId: wallet.id,
        type: 'WITHDRAWAL',
        amount: -20.0,
        balanceAfter: 130.0,
        referenceId: 'withdraw-1',
        description: 'Withdrawal',
        exchangeRate: 1.0,
      });

      const res = await testAgent
        .get(`/api/wallets/${testUser.id}/transactions`)
        .set(authHeaders)
        .query({ type: 'COMMISSION' })
        .expect(200);

      expect(res.body.success).toBe(true);
      // Should filter to only COMMISSION type
      res.body.data.forEach((tx: any) => {
        expect(tx.type).toBe('COMMISSION');
      });
    });
  });

  describe('POST /api/wallets/withdraw', () => {
    it('should create withdrawal request with sufficient balance', async () => {
      // Create wallet with balance
      const wallet = await Wallet.create({
        userId: testUser.id,
        balance: 100.0,
        currency: 'USD',
      });

      const res = await testAgent
        .post('/api/wallets/withdraw')
        .set(authHeaders)
        .send({
          amount: 30,
          paymentMethod: 'bank_transfer',
          paymentDetails: {
            bankName: 'Test Bank',
            accountNumber: '1234567890',
          },
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.requestedAmount).toBe('30.00');
      expect(res.body.data.feeAmount).toBe('1.50'); // 5% fee
      expect(res.body.data.netAmount).toBe('28.50'); // 30 - 1.50
      expect(res.body.data.status).toBe('PENDING');
    });

    it('should reject withdrawal below minimum ($20)', async () => {
      const wallet = await Wallet.create({
        userId: testUser.id,
        balance: 100.0,
        currency: 'USD',
      });

      const res = await testAgent
        .post('/api/wallets/withdraw')
        .set(authHeaders)
        .send({
          amount: 10,
          paymentMethod: 'paypal',
          paymentDetails: {
            email: 'test@example.com',
          },
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('minimum');
    });

    it('should reject withdrawal when insufficient balance', async () => {
      const wallet = await Wallet.create({
        userId: testUser.id,
        balance: 15.0, // Less than $20 minimum
        currency: 'USD',
      });

      const res = await testAgent
        .post('/api/wallets/withdraw')
        .set(authHeaders)
        .send({
          amount: 20,
          paymentMethod: 'bank_transfer',
          paymentDetails: {
            bankName: 'Test Bank',
            accountNumber: '123456',
          },
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Insufficient');
    });
  });

  describe('GET /api/wallets/withdrawals/:id', () => {
    it('should return withdrawal request status', async () => {
      const wallet = await Wallet.create({
        userId: testUser.id,
        balance: 100.0,
        currency: 'USD',
      });

      const withdrawal = await WithdrawalRequest.create({
        userId: testUser.id,
        requestedAmount: 30.0,
        feeAmount: 1.5,
        netAmount: 28.5,
        status: 'PENDING',
        paymentMethod: 'bank_transfer',
        paymentDetails: { bankName: 'Test Bank', accountNumber: '123456' },
      });

      const res = await testAgent
        .get(`/api/wallets/withdrawals/${withdrawal.id}`)
        .set(authHeaders)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(withdrawal.id);
      expect(res.body.data.status).toBe('PENDING');
    });

    it('should return 404 for non-existent withdrawal', async () => {
      const res = await testAgent
        .get('/api/wallets/withdrawals/non-existent-id')
        .set(authHeaders)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/wallets/withdrawals/:id (Cancel)', () => {
    it('should cancel pending withdrawal', async () => {
      const wallet = await Wallet.create({
        userId: testUser.id,
        balance: 100.0,
        currency: 'USD',
      });

      const withdrawal = await WithdrawalRequest.create({
        userId: testUser.id,
        requestedAmount: 30.0,
        feeAmount: 1.5,
        netAmount: 28.5,
        status: 'PENDING',
        paymentMethod: 'bank_transfer',
        paymentDetails: { bankName: 'Test Bank', accountNumber: '123456' },
      });

      const res = await testAgent
        .delete(`/api/wallets/withdrawals/${withdrawal.id}`)
        .set(authHeaders)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('CANCELLED');
    });

    it('should not cancel already processed withdrawal', async () => {
      const wallet = await Wallet.create({
        userId: testUser.id,
        balance: 100.0,
        currency: 'USD',
      });

      const withdrawal = await WithdrawalRequest.create({
        userId: testUser.id,
        requestedAmount: 30.0,
        feeAmount: 1.5,
        netAmount: 28.5,
        status: 'APPROVED', // Already processed
        paymentMethod: 'bank_transfer',
        paymentDetails: { bankName: 'Test Bank', accountNumber: '123456' },
      });

      const res = await testAgent
        .delete(`/api/wallets/withdrawals/${withdrawal.id}`)
        .set(authHeaders)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('cannot be cancelled');
    });
  });

  describe('Daily Payout Job', () => {
    it('should process approved withdrawals', async () => {
      // Create wallet with balance
      const wallet = await Wallet.create({
        userId: testUser.id,
        balance: 100.0,
        currency: 'USD',
      });

      // Create approved withdrawal
      const withdrawal = await WithdrawalRequest.create({
        userId: testUser.id,
        requestedAmount: 30.0,
        feeAmount: 1.5,
        netAmount: 28.5,
        status: 'APPROVED',
        paymentMethod: 'bank_transfer',
        paymentDetails: { bankName: 'Test Bank', accountNumber: '123456' },
        processedAt: null,
      });

      // Trigger payout processing (would normally be called by scheduler)
      // For testing, we'll call the service method directly
      const { WalletService } = await import('../../services/WalletService');
      await WalletService.processDailyPayouts();

      // Check withdrawal was processed
      const updatedWithdrawal = await WithdrawalRequest.findByPk(withdrawal.id);
      expect(updatedWithdrawal?.processedAt).toBeTruthy();
    });
  });
});
