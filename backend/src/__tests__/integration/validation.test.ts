/**
 * @fileoverview Validation Integration Tests
 * @description Tests for input validation across all endpoints
 *
 * @module __tests__/integration/validation
 */

import { testAgent } from '../setup';
import { createTestUser, createAdminUser, getAuthHeaders } from '../fixtures';

describe('Validation Integration Tests', () => {
  describe('Auth Registration Validation', () => {
    it('should accept valid email format', async () => {
      const res = await testAgent
        .post('/api/auth/register')
        .send({
          email: `valid${Date.now()}@example.com`,
          password: 'ValidPass123!',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('should reject email without @', async () => {
      const res = await testAgent
        .post('/api/auth/register')
        .send({
          email: 'invalid-email.com',
          password: 'ValidPass123!',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject password shorter than 8 characters', async () => {
      const res = await testAgent
        .post('/api/auth/register')
        .send({
          email: `short${Date.now()}@test.com`,
          password: 'Short1!',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should accept password without uppercase letter if other requirements met', async () => {
      const res = await testAgent
        .post('/api/auth/register')
        .send({
          email: `noupper${Date.now()}@test.com`,
          password: 'lowercase123!',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('should accept password with only letters if it meets basic requirements', async () => {
      const res = await testAgent
        .post('/api/auth/register')
        .send({
          email: `letters${Date.now()}@test.com`,
          password: 'Password123',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('should accept password with common special characters', async () => {
      const res = await testAgent
        .post('/api/auth/register')
        .send({
          email: `special${Date.now()}@test.com`,
          password: 'Password123!',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('should reject missing email', async () => {
      const res = await testAgent
        .post('/api/auth/register')
        .send({
          password: 'ValidPass123!',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject missing password', async () => {
      const res = await testAgent
        .post('/api/auth/register')
        .send({
          email: `missing${Date.now()}@test.com`,
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject empty body', async () => {
      const res = await testAgent.post('/api/auth/register').send({}).expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Auth Login Validation', () => {
    it('should reject empty email', async () => {
      const res = await testAgent
        .post('/api/auth/login')
        .send({
          email: '',
          password: 'ValidPass123!',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject invalid email format', async () => {
      const res = await testAgent
        .post('/api/auth/login')
        .send({
          email: 'notanemail',
          password: 'ValidPass123!',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject missing password', async () => {
      const res = await testAgent
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject empty body', async () => {
      const res = await testAgent.post('/api/auth/login').send({}).expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Commission Purchase Validation', () => {
    it('should reject negative amount', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/commissions')
        .set(headers)
        .send({
          amount: -100,
          currency: 'USD',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject zero amount', async () => {
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

    it('should accept valid amount', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/commissions')
        .set(headers)
        .send({
          amount: 100.5,
          currency: 'USD',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('should reject missing amount', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/commissions')
        .set(headers)
        .send({
          currency: 'USD',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Admin Status Update Validation', () => {
    it('should accept valid status values', async () => {
      const admin = await createAdminUser();
      const headers = await getAuthHeaders(admin);
      const user = await createTestUser();

      const res = await testAgent
        .patch(`/api/admin/users/${user.id}/status`)
        .set(headers)
        .send({ status: 'active' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should accept inactive status', async () => {
      const admin = await createAdminUser();
      const headers = await getAuthHeaders(admin);
      const user = await createTestUser();

      const res = await testAgent
        .patch(`/api/admin/users/${user.id}/status`)
        .set(headers)
        .send({ status: 'inactive' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should reject invalid status value', async () => {
      const admin = await createAdminUser();
      const headers = await getAuthHeaders(admin);
      const user = await createTestUser();

      const res = await testAgent
        .patch(`/api/admin/users/${user.id}/status`)
        .set(headers)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject missing status field', async () => {
      const admin = await createAdminUser();
      const headers = await getAuthHeaders(admin);
      const user = await createTestUser();

      const res = await testAgent
        .patch(`/api/admin/users/${user.id}/status`)
        .set(headers)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('CRM Lead Validation', () => {
    it('should reject invalid email in lead', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/crm')
        .set(headers)
        .send({
          contactName: 'Test Lead',
          contactEmail: 'not-valid-email',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid lead data', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/crm')
        .set(headers)
        .send({
          contactName: 'Valid Lead',
          contactEmail: 'not-valid',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Authorization Header Validation', () => {
    it('should reject malformed Authorization header', async () => {
      const res = await testAgent
        .get('/api/auth/me')
        .set('Authorization', 'NotBearer token')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject Basic Auth instead of Bearer', async () => {
      const res = await testAgent
        .get('/api/auth/me')
        .set('Authorization', 'Basic dXNlcjpwYXNz')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject invalid JWT', async () => {
      const res = await testAgent
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
