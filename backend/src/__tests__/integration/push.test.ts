/**
 * @fileoverview Push Integration Tests
 * @description Tests for push notification endpoints: subscribe, unsubscribe, vapid-public-key
 *
 * @module __tests__/integration/push
 * @requires supertest
 * @requires fixtures
 */

import { testAgent } from '../setup';
import { createTestUser, getAuthHeaders } from '../fixtures';
import { PushSubscription } from '../models';

describe('Push Integration Tests', () => {
  let testUser: ReturnType<typeof createTestUser> extends Promise<infer T> ? T : never;
  let authHeaders: Record<string, string>;

  beforeEach(async () => {
    // Create test user and get auth headers
    testUser = await createTestUser({
      email: 'push-test@test.mlm',
      password: 'TestPass123!',
      referralCode: 'PUSHTEST',
    });
    authHeaders = getAuthHeaders(testUser);
  });

  describe('POST /api/push/subscribe', () => {
    it('should create push subscription with valid data', async () => {
      const subscriptionData = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-123',
        keys: {
          p256dh: 'BPcM1X3M1X3M1X3M1X3M1X3M1X3M1X3M1X3M1X3M1X3M1X3M1X3M1X3',
          auth: 'tW5t5W5t5W5t5W5t5W5W5',
        },
      };

      const res = await testAgent
        .post('/api/push/subscribe')
        .set(authHeaders)
        .send(subscriptionData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('createdAt');
    });

    it('should reject subscription without auth token', async () => {
      const subscriptionData = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: {
          p256dh: 'test-p256dh',
          auth: 'test-auth',
        },
      };

      const res = await testAgent.post('/api/push/subscribe').send(subscriptionData).expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject subscription with invalid endpoint', async () => {
      const subscriptionData = {
        endpoint: 'not-a-valid-url',
        keys: {
          p256dh: 'test-p256dh',
          auth: 'test-auth',
        },
      };

      const res = await testAgent
        .post('/api/push/subscribe')
        .set(authHeaders)
        .send(subscriptionData)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject subscription with missing keys', async () => {
      const subscriptionData = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
      };

      const res = await testAgent
        .post('/api/push/subscribe')
        .set(authHeaders)
        .send(subscriptionData)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject subscription with missing p256dh key', async () => {
      const subscriptionData = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: {
          auth: 'test-auth',
        },
      };

      const res = await testAgent
        .post('/api/push/subscribe')
        .set(authHeaders)
        .send(subscriptionData)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject subscription with missing auth key', async () => {
      const subscriptionData = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: {
          p256dh: 'test-p256dh',
        },
      };

      const res = await testAgent
        .post('/api/push/subscribe')
        .set(authHeaders)
        .send(subscriptionData)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should create subscription with user agent', async () => {
      const subscriptionData = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-with-ua',
        keys: {
          p256dh: 'test-p256dh',
          auth: 'test-auth',
        },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
      };

      const res = await testAgent
        .post('/api/push/subscribe')
        .set(authHeaders)
        .send(subscriptionData)
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('should update existing subscription when endpoint already exists', async () => {
      const subscriptionData = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/duplicate-endpoint',
        keys: {
          p256dh: 'test-p256dh-v2',
          auth: 'test-auth-v2',
        },
      };

      // First subscription
      await testAgent
        .post('/api/push/subscribe')
        .set(authHeaders)
        .send(subscriptionData)
        .expect(201);

      // Create another user and try to use same endpoint
      const user2 = await createTestUser({
        email: 'push-test-2@test.mlm',
        password: 'TestPass123!',
        referralCode: 'PUSHTEST2',
      });
      const headers2 = getAuthHeaders(user2);

      // Second subscription with same endpoint should update ownership
      const res = await testAgent
        .post('/api/push/subscribe')
        .set(headers2)
        .send(subscriptionData)
        .expect(201);

      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/push/unsubscribe', () => {
    it('should unsubscribe with valid endpoint', async () => {
      // First subscribe
      const subscriptionData = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/unsubscribe-test',
        keys: {
          p256dh: 'test-p256dh',
          auth: 'test-auth',
        },
      };

      await testAgent
        .post('/api/push/subscribe')
        .set(authHeaders)
        .send(subscriptionData)
        .expect(201);

      // Then unsubscribe
      const res = await testAgent
        .delete('/api/push/unsubscribe')
        .set(authHeaders)
        .send({ endpoint: 'https://fcm.googleapis.com/fcm/send/unsubscribe-test' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should reject unsubscribe without auth token', async () => {
      const res = await testAgent
        .delete('/api/push/unsubscribe')
        .send({ endpoint: 'https://fcm.googleapis.com/fcm/send/test' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject unsubscribe with missing endpoint', async () => {
      const res = await testAgent
        .delete('/api/push/unsubscribe')
        .set(authHeaders)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return success even if subscription does not exist', async () => {
      const res = await testAgent
        .delete('/api/push/unsubscribe')
        .set(authHeaders)
        .send({ endpoint: 'https://fcm.googleapis.com/fcm/send/nonexistent' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/push/vapid-public-key', () => {
    it('should return VAPID public key without auth', async () => {
      const res = await testAgent.get('/api/push/vapid-public-key').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('publicKey');
      // VAPID public key should be a base64-like string
      expect(typeof res.body.data.publicKey).toBe('string');
      expect(res.body.data.publicKey.length).toBeGreaterThan(0);
    });

    it('should return the same key on multiple calls', async () => {
      const res1 = await testAgent.get('/api/push/vapid-public-key').expect(200);
      const res2 = await testAgent.get('/api/push/vapid-public-key').expect(200);

      expect(res1.body.data.publicKey).toBe(res2.body.data.publicKey);
    });

    it('should work without any auth headers', async () => {
      const res = await testAgent
        .get('/api/push/vapid-public-key')
        .set('Accept', 'application/json')
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
