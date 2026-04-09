/**
 * @fileoverview Wallet Integration Tests
 * @description Tests for wallet balance, transactions, and withdrawal endpoints
 *
 * @module __tests__/integration/wallet
 */

import { testAgent } from '../setup';
import { createTestUser, getAuthHeaders } from '../fixtures';
import { Wallet, WalletTransaction, WithdrawalRequest } from '../../models';
import { WITHDRAWAL_STATUS, WALLET_TRANSACTION_TYPE } from '../../types';

describe('Wallet Integration Tests', () => {
  let testUser: any;
  let authHeaders: Record<string, string>;

  beforeEach(async () => {
    // Create test user and get auth
    testUser = await createTestUser();
    authHeaders = await getAuthHeaders(testUser);

    // Clean up wallet data before each test (use DELETE instead of truncate for FK)
    await WithdrawalRequest.destroy({ where: {} });
    await WalletTransaction.destroy({ where: {} });
    await Wallet.destroy({ where: {} });
  });

  afterEach(async () => {
    // Clean up after each test
    await WithdrawalRequest.destroy({ where: {} });
    await WalletTransaction.destroy({ where: {} });
    await Wallet.destroy({ where: {} });
  });

  describe('GET /api/wallets/:userId (Get Balance)', () => {
    it('should return wallet balance for authenticated user', async () => {
      // First create a wallet with some balance
      await Wallet.create({
        userId: testUser.id,
        balance: 100.0,
        currency: 'USD',
      });

      const res = await testAgent.get(`/api/wallets/${testUser.id}`).set(authHeaders).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('balance');
      expect(res.body.data.balance).toBe(100);
    });

    it('should return 404 when wallet not found', async () => {
      // Ensure no wallet exists for this user (beforeEach cleans all wallets)
      // Use the test user's own ID so ownership check passes
      const res = await testAgent.get(`/api/wallets/${testUser.id}`).set(authHeaders).expect(404);

      expect(res.body.success).toBe(false);
    });

    it('should return 403 when accessing another users wallet', async () => {
      // Create another user with a wallet
      const otherUser = await createTestUser();
      await Wallet.create({
        userId: otherUser.id,
        balance: 50.0,
        currency: 'USD',
      });

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
        type: WALLET_TRANSACTION_TYPE.COMMISSION_EARNED,
        amount: 50.0,
        currency: 'USD',
        referenceId: null,
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
        type: WALLET_TRANSACTION_TYPE.COMMISSION_EARNED,
        amount: 50.0,
        currency: 'USD',
        referenceId: null,
        description: 'Commission',
        exchangeRate: 1.0,
      });

      // Create withdrawal transaction
      await WalletTransaction.create({
        walletId: wallet.id,
        type: WALLET_TRANSACTION_TYPE.WITHDRAWAL,
        amount: -20.0,
        currency: 'USD',
        referenceId: null,
        description: 'Withdrawal',
        exchangeRate: 1.0,
      });

      const res = await testAgent
        .get(`/api/wallets/${testUser.id}/transactions`)
        .set(authHeaders)
        .query({ type: WALLET_TRANSACTION_TYPE.COMMISSION_EARNED })
        .expect(200);

      expect(res.body.success).toBe(true);
      // Should filter to only commission_earned type
      res.body.data.forEach((tx: any) => {
        expect(tx.type).toBe('commission_earned');
      });
    });
  });

  describe('POST /api/wallets/withdraw', () => {
    it('should create withdrawal request with sufficient balance', async () => {
      // Create wallet with balance
      await Wallet.create({
        userId: testUser.id,
        balance: 100.0,
        currency: 'USD',
      });

      const res = await testAgent
        .post('/api/wallets/withdraw')
        .set(authHeaders)
        .send({
          amount: 30,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.requestedAmount).toBe(30);
      expect(res.body.data.feeAmount).toBe(1.5); // 5% fee
      expect(res.body.data.netAmount).toBe(28.5); // 30 - 1.50
      expect(res.body.data.status).toBe(WITHDRAWAL_STATUS.PENDING);
    });

    it('should reject withdrawal below minimum ($20)', async () => {
      await Wallet.create({
        userId: testUser.id,
        balance: 100.0,
        currency: 'USD',
      });

      const res = await testAgent
        .post('/api/wallets/withdraw')
        .set(authHeaders)
        .send({
          amount: 10,
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      // Validation error returns object with details
      const errorStr = JSON.stringify(res.body.error);
      expect(errorStr).toMatch(/minimum|Minimum/);
    });

    it('should reject withdrawal when insufficient balance', async () => {
      await Wallet.create({
        userId: testUser.id,
        balance: 15.0, // Less than $20 minimum
        currency: 'USD',
      });

      const res = await testAgent.post('/api/wallets/withdraw').set(authHeaders).send({
        amount: 20,
      });

      // Could be 400 from validation (min 20) or from insufficient balance
      expect([400]).toContain(res.status);
      expect(res.body.success).toBe(false);
      const errorStr = JSON.stringify(res.body.error);
      expect(errorStr).toMatch(/insufficient|minimum/i);
    });
  });

  describe('GET /api/wallets/withdrawals/:id', () => {
    it('should return withdrawal request status', async () => {
      await Wallet.create({
        userId: testUser.id,
        balance: 100.0,
        currency: 'USD',
      });

      const withdrawal = await WithdrawalRequest.create({
        userId: testUser.id,
        requestedAmount: 30.0,
        feeAmount: 1.5,
        netAmount: 28.5,
        status: WITHDRAWAL_STATUS.PENDING,
      });

      const res = await testAgent
        .get(`/api/wallets/withdrawals/${withdrawal.id}`)
        .set(authHeaders)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(withdrawal.id);
      expect(res.body.data.status).toBe(WITHDRAWAL_STATUS.PENDING);
    });

    it('should return 404 for non-existent withdrawal', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000001';
      const res = await testAgent
        .get(`/api/wallets/withdrawals/${fakeId}`)
        .set(authHeaders)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/wallets/withdrawals/:id (Cancel)', () => {
    it('should cancel pending withdrawal', async () => {
      await Wallet.create({
        userId: testUser.id,
        balance: 100.0,
        currency: 'USD',
      });

      const withdrawal = await WithdrawalRequest.create({
        userId: testUser.id,
        requestedAmount: 30.0,
        feeAmount: 1.5,
        netAmount: 28.5,
        status: WITHDRAWAL_STATUS.PENDING,
      });

      const res = await testAgent
        .delete(`/api/wallets/withdrawals/${withdrawal.id}`)
        .set(authHeaders)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(WITHDRAWAL_STATUS.CANCELLED);
    });

    it('should not cancel already processed withdrawal', async () => {
      await Wallet.create({
        userId: testUser.id,
        balance: 100.0,
        currency: 'USD',
      });

      const withdrawal = await WithdrawalRequest.create({
        userId: testUser.id,
        requestedAmount: 30.0,
        feeAmount: 1.5,
        netAmount: 28.5,
        status: WITHDRAWAL_STATUS.APPROVED, // Not PENDING - cannot cancel
      });

      const res = await testAgent
        .delete(`/api/wallets/withdrawals/${withdrawal.id}`)
        .set(authHeaders)
        .expect(400);

      expect(res.body.success).toBe(false);
      const errorStr = JSON.stringify(res.body.error);
      expect(errorStr).toContain('pending');
    });
  });

  describe('Daily Payout Job', () => {
    it('should process approved withdrawals', async () => {
      // Create wallet with balance
      await Wallet.create({
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
        status: WITHDRAWAL_STATUS.APPROVED,
        processedAt: null,
      });

      // Trigger payout processing (would normally be called by scheduler)
      // For testing, we'll call the service method directly
      const { walletService } = await import('../../services/WalletService');
      await walletService.processDailyPayouts();

      // Check withdrawal was processed
      const updatedWithdrawal = await WithdrawalRequest.findByPk(withdrawal.id);
      expect(updatedWithdrawal?.processedAt).toBeTruthy();
    });
  });
});
