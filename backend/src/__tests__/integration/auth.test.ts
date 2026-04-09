/**
 * @fileoverview Auth Integration Tests
 * @description Tests for authentication endpoints: register, login, protected routes
 *
 * @module __tests__/integration/auth
 * @requires supertest
 * @requires fixtures
 */

import { testAgent } from '../setup';
import { createTestUser, getAuthHeaders } from '../fixtures';

describe('Auth Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register new user with valid credentials', async () => {
      const res = await testAgent
        .post('/api/auth/register')
        .send({
          email: 'newuser@test.mlm',
          password: 'ValidPass123!',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user.email).toBe('newuser@test.mlm');
      expect(res.body.data.user).toHaveProperty('referralCode');
    });

    it('should register user with sponsor_code', async () => {
      await createTestUser({
        email: 'sponsor@test.mlm',
        referralCode: 'SPONSOR123',
      });

      const res = await testAgent
        .post('/api/auth/register')
        .send({
          email: 'referred@test.mlm',
          password: 'ValidPass123!',
          sponsor_code: 'SPONSOR123',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('referralCode');
    });

    it('should reject registration with duplicate email', async () => {
      await createTestUser({ email: 'duplicate@test.mlm' });

      const res = await testAgent
        .post('/api/auth/register')
        .send({
          email: 'duplicate@test.mlm',
          password: 'ValidPass123!',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    it('should reject registration with invalid email', async () => {
      const res = await testAgent
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'ValidPass123!',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject registration with weak password (too short)', async () => {
      const res = await testAgent
        .post('/api/auth/register')
        .send({
          email: 'user@test.mlm',
          password: 'short',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject registration with weak password (no number)', async () => {
      const res = await testAgent
        .post('/api/auth/register')
        .send({
          email: 'user@test.mlm',
          password: 'NoNumbersHere!',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject registration with missing email', async () => {
      const res = await testAgent
        .post('/api/auth/register')
        .send({
          password: 'ValidPass123!',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      await createTestUser({
        email: 'loginuser@test.mlm',
        password: 'TestPass123!',
      });

      const res = await testAgent
        .post('/api/auth/login')
        .send({
          email: 'loginuser@test.mlm',
          password: 'TestPass123!',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('user');
    });

    it('should reject login with wrong password', async () => {
      await createTestUser({
        email: 'wrongpass@test.mlm',
        password: 'CorrectPass123!',
      });

      const res = await testAgent
        .post('/api/auth/login')
        .send({
          email: 'wrongpass@test.mlm',
          password: 'WrongPassword!',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      // API returns UNAUTHORIZED or INVALID_CREDENTIALS depending on implementation
      expect(['UNAUTHORIZED', 'INVALID_CREDENTIALS']).toContain(res.body.error?.code);
    });

    it('should reject login with non-existent user', async () => {
      const res = await testAgent
        .post('/api/auth/login')
        .send({
          email: 'nobody@test.mlm',
          password: 'AnyPassword123!',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject login with missing credentials', async () => {
      const res = await testAgent.post('/api/auth/login').send({}).expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user data with valid token', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent.get('/api/auth/me').set(headers).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(user.email);
    });

    it('should reject request without token', async () => {
      const res = await testAgent.get('/api/auth/me').expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const res = await testAgent
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject request with malformed Authorization header', async () => {
      const res = await testAgent
        .get('/api/auth/me')
        .set('Authorization', 'NotBearer sometoken')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
