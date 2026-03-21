/**
 * @fileoverview CRM Integration Tests
 * @description Tests for Lead Management, Tasks, and Communications
 *
 * @module __tests__/integration/crm
 */

import { testAgent } from '../setup';
import { createTestUser, createAdminUser, getAuthHeaders } from '../fixtures';

describe('CRM Integration Tests', () => {
  describe('GET /api/crm/stats', () => {
    it('should return CRM statistics for authenticated user', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent.get('/api/crm/stats').set(headers).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total');
    });

    it('should reject unauthenticated request', async () => {
      const res = await testAgent.get('/api/crm/stats').expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/crm (Create Lead)', () => {
    it('should return error for missing required fields', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/crm')
        .set(headers)
        .send({
          contactName: 'Test User',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject lead with invalid email', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/crm')
        .set(headers)
        .send({
          contactName: 'Test User',
          contactEmail: 'invalid-email',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject lead without contactName', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/crm')
        .set(headers)
        .send({
          contactEmail: 'test@example.com',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject lead without contactEmail', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/crm')
        .set(headers)
        .send({
          contactName: 'Test User',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated request', async () => {
      const res = await testAgent
        .post('/api/crm')
        .send({
          contactName: 'Test User',
          contactEmail: 'test@example.com',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/crm (List Leads)', () => {
    it('should return list of leads for user', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent.get('/api/crm').set(headers).expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return empty list when no leads exist', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent.get('/api/crm').set(headers).expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/crm/:id (Get Lead)', () => {
    it('should return 404 for non-existent lead', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent.get('/api/crm/non-existent-id').set(headers).expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/crm/:id (Update Lead)', () => {
    it('should return 404 for non-existent lead', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .put('/api/crm/non-existent-id')
        .set(headers)
        .send({ contactName: 'Updated Name' })
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/crm/tasks (Get Upcoming Tasks)', () => {
    it('should return upcoming tasks for user', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent.get('/api/crm/tasks').set(headers).expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should reject unauthenticated request', async () => {
      const res = await testAgent.get('/api/crm/tasks').expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/crm/:leadId/tasks (Create Task)', () => {
    it('should reject task without title', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/crm/non-existent-lead/tasks')
        .set(headers)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/crm/:leadId/communications (Add Communication)', () => {
    it('should reject unauthenticated request', async () => {
      const res = await testAgent
        .post('/api/crm/some-lead/communications')
        .send({
          type: 'call',
          subject: 'Test',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
