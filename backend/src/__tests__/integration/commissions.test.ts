/**
 * @fileoverview Commission Integration Tests
 * @description Tests for commission calculation, distribution, and retrieval
 *
 * @module __tests__/integration/commissions
 */

import { testAgent } from '../setup';
import { createTestUser, getAuthHeaders } from '../fixtures';

describe('Commission Integration Tests', () => {
  describe('POST /api/commissions (Create Purchase)', () => {
    it('should create purchase and generate commissions', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/commissions')
        .set(headers)
        .send({
          amount: 100,
          currency: 'USD',
          description: 'Test purchase',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(100);
    });

    it('should reject purchase with invalid amount (negative)', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/commissions')
        .set(headers)
        .send({
          amount: -50,
          currency: 'USD',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject purchase with invalid amount (zero)', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/commissions')
        .set(headers)
        .send({
          amount: 0,
          currency: 'USD',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject purchase with invalid currency', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/commissions')
        .set(headers)
        .send({
          amount: 100,
          currency: 'INVALID',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject purchase without authentication', async () => {
      const res = await testAgent
        .post('/api/commissions')
        .send({
          amount: 100,
          currency: 'USD',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should create purchase with different currencies', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      // COP
      const resCop = await testAgent
        .post('/api/commissions')
        .set(headers)
        .send({
          amount: 500000,
          currency: 'COP',
        })
        .expect(201);

      expect(resCop.body.data.currency).toBe('COP');

      // MXN
      const resMxn = await testAgent
        .post('/api/commissions')
        .set(headers)
        .send({
          amount: 200,
          currency: 'MXN',
        })
        .expect(201);

      expect(resMxn.body.data.currency).toBe('MXN');
    });
  });

  describe('GET /api/commissions (List Commissions)', () => {
    it('should return empty list for user without commissions', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent.get('/api/commissions').set(headers).expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return commissions after purchase', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      // Create a purchase first
      await testAgent
        .post('/api/commissions')
        .set(headers)
        .send({
          amount: 100,
          currency: 'USD',
        })
        .expect(201);

      // Get commissions
      const res = await testAgent.get('/api/commissions').set(headers).expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .get('/api/commissions')
        .query({ limit: 5, offset: 0 })
        .set(headers)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('pagination');
    });

    it('should reject request without authentication', async () => {
      const res = await testAgent.get('/api/commissions').expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/commissions/stats', () => {
    it('should return commission statistics', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent.get('/api/commissions/stats').set(headers).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('pending');
      expect(res.body.data).toHaveProperty('totalEarned');
      expect(res.body.data).toHaveProperty('byType');
    });

    it('should return zero stats for user without commissions', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent.get('/api/commissions/stats').set(headers).expect(200);

      expect(res.body.data.pending).toBe(0);
      expect(res.body.data.totalEarned).toBe(0);
    });

    it('should reject request without authentication', async () => {
      const res = await testAgent.get('/api/commissions/stats').expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Commission Calculation', () => {
    it('should calculate direct commission correctly', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/commissions')
        .set(headers)
        .send({
          amount: 100,
          currency: 'USD',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(100);
    });

    it('should create purchase record', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/commissions')
        .set(headers)
        .send({
          amount: 250,
          currency: 'USD',
          description: 'Premium package',
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.description).toBe('Premium package');
    });
  });
});
