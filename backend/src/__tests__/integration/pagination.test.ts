/**
 * @fileoverview Pagination Integration Tests
 * @description Tests for pagination across list endpoints
 *
 * @module __tests__/integration/pagination
 */

import { testAgent } from '../setup';
import { createTestUser, createAdminUser, getAuthHeaders } from '../fixtures';

describe('Pagination Integration Tests', () => {
  describe('GET /api/commissions - Pagination', () => {
    it('should return default pagination when no params provided', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent.get('/api/commissions').set(headers).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('pagination');
    });

    it('should accept custom page and limit', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .get('/api/commissions')
        .query({ page: 2, limit: 5 })
        .set(headers)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.limit).toBe(5);
    });

    it('should return empty array when page exceeds total', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .get('/api/commissions')
        .query({ page: 999, limit: 10 })
        .set(headers)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/admin/users - Pagination', () => {
    it('should return pagination for admin', async () => {
      const admin = await createAdminUser();
      const headers = await getAuthHeaders(admin);

      const res = await testAgent.get('/api/admin/users').set(headers).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('pagination');
    });

    it('should accept custom page and limit', async () => {
      const admin = await createAdminUser();
      const headers = await getAuthHeaders(admin);

      const res = await testAgent
        .get('/api/admin/users')
        .query({ page: 3, limit: 50 })
        .set(headers)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.pagination.page).toBe(3);
      expect(res.body.data.pagination.limit).toBe(50);
    });
  });

  describe('Pagination Structure', () => {
    it('should include page, limit, and total in pagination', async () => {
      const admin = await createAdminUser();
      const headers = await getAuthHeaders(admin);

      const res = await testAgent.get('/api/admin/users').set(headers).expect(200);

      expect(res.body.data.pagination).toHaveProperty('page');
      expect(res.body.data.pagination).toHaveProperty('limit');
      expect(res.body.data.pagination).toHaveProperty('total');
    });
  });
});
