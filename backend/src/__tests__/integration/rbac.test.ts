/**
 * @fileoverview RBAC Integration Tests
 * @description Tests for Role-Based Access Control - admin vs regular user permissions
 *
 * @module __tests__/integration/rbac
 */

import { testAgent } from '../setup';
import { createTestUser, createAdminUser, createRegularUser, getAuthHeaders } from '../fixtures';

describe('RBAC Integration Tests', () => {
  describe('Admin Endpoints - Access Control', () => {
    describe('GET /api/admin/stats', () => {
      it('should allow admin to access stats', async () => {
        const admin = await createAdminUser();
        const headers = await getAuthHeaders(admin);

        const res = await testAgent.get('/api/admin/stats').set(headers).expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('totalUsers');
      });

      it('should deny regular user access to stats', async () => {
        const user = await createRegularUser();
        const headers = await getAuthHeaders(user);

        const res = await testAgent.get('/api/admin/stats').set(headers);
        // Expect either 403 (forbidden) or other error status
        expect([401, 403]).toContain(res.status);
        expect(res.body.success).toBe(false);
      });

      it('should deny unauthenticated request to stats', async () => {
        const res = await testAgent.get('/api/admin/stats');
        expect([401, 403]).toContain(res.status);
      });
    });

    describe('GET /api/admin/users', () => {
      it('should allow admin to list users', async () => {
        const admin = await createAdminUser();
        const headers = await getAuthHeaders(admin);

        const res = await testAgent.get('/api/admin/users').set(headers).expect(200);

        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.users)).toBe(true);
      });

      it('should deny regular user access to user list', async () => {
        const user = await createRegularUser();
        const headers = await getAuthHeaders(user);

        const res = await testAgent.get('/api/admin/users').set(headers).expect(403);

        expect(res.body.success).toBe(false);
      });

      it('should support pagination for admin users list', async () => {
        const admin = await createAdminUser();
        const headers = await getAuthHeaders(admin);

        const res = await testAgent
          .get('/api/admin/users')
          .query({ limit: 10, offset: 0 })
          .set(headers)
          .expect(200);

        expect(res.body.success).toBe(true);
      });
    });

    describe('GET /api/admin/users/:userId', () => {
      it('should allow admin to get specific user', async () => {
        const admin = await createAdminUser();
        const targetUser = await createTestUser({
          email: 'target@test.mlm',
        });
        const headers = await getAuthHeaders(admin);

        const res = await testAgent
          .get(`/api/admin/users/${targetUser.id}`)
          .set(headers)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.user.email).toBe('target@test.mlm');
      });

      it('should deny regular user access to specific user', async () => {
        const user = await createRegularUser();
        const targetUser = await createTestUser();
        const headers = await getAuthHeaders(user);

        const res = await testAgent
          .get(`/api/admin/users/${targetUser.id}`)
          .set(headers)
          .expect(403);

        expect(res.body.success).toBe(false);
      });

      it('should return 404 for non-existent user', async () => {
        const admin = await createAdminUser();
        const headers = await getAuthHeaders(admin);

        const res = await testAgent
          .get('/api/admin/users/non-existent-id')
          .set(headers)
          .expect(404);

        expect(res.body.success).toBe(false);
      });
    });

    describe('PATCH /api/admin/users/:userId/status', () => {
      it('should allow admin to update user status', async () => {
        const admin = await createAdminUser();
        const targetUser = await createTestUser({
          email: 'updatestatus@test.mlm',
        });
        const headers = await getAuthHeaders(admin);

        const res = await testAgent
          .patch(`/api/admin/users/${targetUser.id}/status`)
          .set(headers)
          .send({ status: 'inactive' })
          .expect(200);

        expect(res.body.success).toBe(true);
      });

      it('should deny regular user from updating status', async () => {
        const user = await createRegularUser();
        const targetUser = await createTestUser();
        const headers = await getAuthHeaders(user);

        const res = await testAgent
          .patch(`/api/admin/users/${targetUser.id}/status`)
          .set(headers)
          .send({ status: 'inactive' })
          .expect(403);

        expect(res.body.success).toBe(false);
      });

      it('should validate status values', async () => {
        const admin = await createAdminUser();
        const targetUser = await createTestUser();
        const headers = await getAuthHeaders(admin);

        const res = await testAgent
          .patch(`/api/admin/users/${targetUser.id}/status`)
          .set(headers)
          .send({ status: 'invalid_status' })
          .expect(400);

        expect(res.body.success).toBe(false);
      });
    });

    describe('PATCH /api/admin/users/:userId/promote', () => {
      it('should allow admin to promote user to admin', async () => {
        const admin = await createAdminUser();
        const targetUser = await createTestUser({
          email: 'promote@test.mlm',
        });
        const headers = await getAuthHeaders(admin);

        const res = await testAgent
          .patch(`/api/admin/users/${targetUser.id}/promote`)
          .set(headers)
          .expect(200);

        expect(res.body.success).toBe(true);
      });

      it('should deny regular user from promoting others', async () => {
        const user = await createRegularUser();
        const targetUser = await createTestUser();
        const headers = await getAuthHeaders(user);

        const res = await testAgent
          .patch(`/api/admin/users/${targetUser.id}/promote`)
          .set(headers)
          .expect(403);

        expect(res.body.success).toBe(false);
      });
    });

    describe('GET /api/admin/reports/commissions', () => {
      it('should allow admin to get commissions report', async () => {
        const admin = await createAdminUser();
        const headers = await getAuthHeaders(admin);

        const res = await testAgent.get('/api/admin/reports/commissions').set(headers).expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('commissions');
        expect(res.body.data).toHaveProperty('byType');
      });

      it('should deny regular user access to commissions report', async () => {
        const user = await createRegularUser();
        const headers = await getAuthHeaders(user);

        const res = await testAgent.get('/api/admin/reports/commissions').set(headers).expect(403);

        expect(res.body.success).toBe(false);
      });
    });
  });

  describe('Regular User Endpoints', () => {
    it('should allow regular user to access their own profile', async () => {
      const user = await createRegularUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent.get('/api/users/me').set(headers).expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should allow regular user to update their own profile', async () => {
      const user = await createRegularUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .patch('/api/users/me')
        .set(headers)
        .send({ firstName: 'John', lastName: 'Doe' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should allow regular user to view their own tree', async () => {
      const user = await createRegularUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent.get('/api/users/me/tree').set(headers).expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('Cross-User Access', () => {
    it('should allow user to view other users trees', async () => {
      const user1 = await createTestUser({
        email: 'user1@test.mlm',
        referralCode: 'USER1REF',
      });
      const user2 = await createTestUser({
        email: 'user2@test.mlm',
      });
      const headers = await getAuthHeaders(user1);

      const res = await testAgent.get(`/api/users/${user2.id}/tree`).set(headers).expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
