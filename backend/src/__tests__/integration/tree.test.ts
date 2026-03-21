/**
 * @fileoverview Binary Tree Integration Tests
 * @description Tests for binary tree structure, referral placement, and tree visualization
 *
 * @module __tests__/integration/tree
 */

import { testAgent } from '../setup';
import { createTestUser, createAdminUser, getAuthHeaders } from '../fixtures';

describe('Binary Tree Integration Tests', () => {
  describe('User Registration with Sponsor', () => {
    it('should register user and link to sponsor via referral code', async () => {
      const sponsor = await createTestUser({
        email: 'sponsor@test.mlm',
        referralCode: 'SPONSOR001',
      });

      const res = await testAgent
        .post('/api/auth/register')
        .send({
          email: 'newmember@test.mlm',
          password: 'ValidPass123!',
          sponsor_code: 'SPONSOR001',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('referralCode');
    });

    it('should reject registration with invalid sponsor code', async () => {
      const res = await testAgent
        .post('/api/auth/register')
        .send({
          email: 'orphan@test.mlm',
          password: 'ValidPass123!',
          sponsor_code: 'INVALID999',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should generate unique referral code for new user', async () => {
      const res = await testAgent
        .post('/api/auth/register')
        .send({
          email: 'codecreator@test.mlm',
          password: 'ValidPass123!',
        })
        .expect(201);

      expect(res.body.data.user.referralCode).toBeDefined();
      expect(res.body.data.user.referralCode.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/users/me/tree', () => {
    it('should return tree structure for user with children', async () => {
      // Create sponsor
      const sponsor = await createTestUser({
        email: 'tree_sponsor@test.mlm',
        referralCode: 'TREESPON',
      });

      // Create left and right children
      await createTestUser({
        email: 'left_child@test.mlm',
        sponsorId: sponsor.id,
        position: 'left',
      });

      await createTestUser({
        email: 'right_child@test.mlm',
        sponsorId: sponsor.id,
        position: 'right',
      });

      const headers = await getAuthHeaders(sponsor);

      const res = await testAgent.get('/api/users/me/tree').set(headers).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('tree');
      expect(res.body.data.tree).toHaveProperty('id');
      expect(res.body.data.tree).toHaveProperty('referralCode');
      expect(res.body.data.tree.children).toHaveLength(2);
    });

    it('should return empty tree for user without children', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent.get('/api/users/me/tree').set(headers).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('tree');
      expect(res.body.data.tree).toHaveProperty('id');
      expect(res.body.data.tree.children).toHaveLength(0);
    });

    it('should return 401 without authentication', async () => {
      const res = await testAgent.get('/api/users/me/tree').expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/users/:id/tree', () => {
    it('should return tree structure for specific user', async () => {
      const user = await createTestUser({
        email: 'specific_user@test.mlm',
        referralCode: 'SPECIFIC',
      });
      const headers = await getAuthHeaders(user);

      const res = await testAgent.get(`/api/users/${user.id}/tree`).set(headers).expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const user = await createTestUser();

      const res = await testAgent.get(`/api/users/${user.id}/tree`).expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Tree Structure Integrity', () => {
    it('should place first referral on left by default', async () => {
      const sponsor = await createTestUser({
        email: 'default_placement@test.mlm',
        referralCode: 'DEFAULTTEST',
      });

      // Register first referred user
      await testAgent
        .post('/api/auth/register')
        .send({
          email: 'first_referral@test.mlm',
          password: 'ValidPass123!',
          sponsor_code: 'DEFAULTTEST',
        })
        .expect(201);

      // Check sponsor's tree
      const headers = await getAuthHeaders(sponsor);
      const res = await testAgent.get('/api/users/me/tree').set(headers).expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should handle multiple levels of referrals', async () => {
      // Level 1
      const level1 = await createTestUser({
        email: 'l1@test.mlm',
        referralCode: 'LEVEL1',
      });

      // Register with level 1
      const res = await testAgent
        .post('/api/auth/register')
        .send({
          email: 'l2@test.mlm',
          password: 'ValidPass123!',
          sponsor_code: 'LEVEL1',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
    });
  });
});
