/**
 * @fileoverview Integration tests for Achievement API endpoints
 * @description Tests for:
 *              - GET /api/achievements → 200 with array
 *              - GET /api/achievements/me → 401 without auth
 *              - GET /api/achievements/me → 200 with valid auth token
 * @module __tests__/integration/achievements
 */

import { testAgent } from '../setup';
import { createTestUser, getAuthHeaders } from '../fixtures';

describe('Achievements API', () => {
  // ── GET /api/achievements ─────────────────────────────────────────────────

  describe('GET /api/achievements', () => {
    it('should return 200 with an array of achievements when authenticated', async () => {
      const user = await createTestUser();
      const headers = getAuthHeaders(user);

      const res = await testAgent.get('/api/achievements').set(headers).expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 401 when no auth token is provided', async () => {
      const res = await testAgent.get('/api/achievements').expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/achievements/me ──────────────────────────────────────────────

  describe('GET /api/achievements/me', () => {
    it('should return 401 without auth token', async () => {
      const res = await testAgent.get('/api/achievements/me').expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should return 200 with authenticated user (array of unlocked achievements)', async () => {
      const user = await createTestUser();
      const headers = getAuthHeaders(user);

      const res = await testAgent.get('/api/achievements/me').set(headers).expect(200);

      expect(res.body.success).toBe(true);
      // A new user has no unlocked achievements yet
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
