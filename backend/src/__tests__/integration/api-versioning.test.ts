/**
 * @fileoverview API versioning integration tests
 * @description Verifies dual-mount (/api + /api/v1), 307 redirects,
 *              health endpoint, Swagger redirect, and rate limiter coverage.
 *
 *              NOTE: These tests require a running PostgreSQL database.
 *              Run with: TEST_DB_NAME=mlm_test pnpm test:integration
 *
 * @module __tests__/integration/api-versioning
 * @requires supertest
 */

import { testAgent } from '../setup';

// Skip if no database is available (unit test suite)
const describeDb = process.env.TEST_DB_NAME ? describe : describe.skip;

describeDb('API Versioning — Sprint 19', () => {
  // ── 307 Redirect: GET /api/* → /api/v1/* ─────────────────────────

  describe('307 Redirect: GET /api/* → /api/v1/*', () => {
    it('GET /api/health should redirect (307) to /api/v1/health', async () => {
      const res = await testAgent.get('/api/health');
      expect(res.status).toBe(307);
      expect(res.headers.location).toBe('/api/v1/health');
    });

    it('GET /api/auth/me should redirect (307) to /api/v1/auth/me', async () => {
      const res = await testAgent.get('/api/auth/me');
      expect(res.status).toBe(307);
      expect(res.headers.location).toBe('/api/v1/auth/me');
    });

    it('GET /api/products should redirect (307) to /api/v1/products', async () => {
      const res = await testAgent.get('/api/products');
      expect(res.status).toBe(307);
      expect(res.headers.location).toBe('/api/v1/products');
    });

    it('GET /api/v1/health should NOT redirect (already versioned)', async () => {
      const res = await testAgent.get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('POST /api/payment/paypal/webhook should redirect (307)', async () => {
      const res = await testAgent
        .post('/api/payment/paypal/webhook')
        .send({ event_type: 'PAYMENT.CAPTURE.COMPLETED' });
      expect(res.status).toBe(307);
      expect(res.headers.location).toBe('/api/v1/payment/paypal/webhook');
    });

    it('POST /api/payment/mercadopago/webhook should redirect (307)', async () => {
      const res = await testAgent
        .post('/api/payment/mercadopago/webhook')
        .send({ type: 'payment' });
      expect(res.status).toBe(307);
      expect(res.headers.location).toBe('/api/v1/payment/mercadopago/webhook');
    });
  });

  // ── Canonical /api/v1 routes ──────────────────────────────────────

  describe('Canonical /api/v1 routes', () => {
    it('GET /api/v1/health should return 200', async () => {
      const res = await testAgent.get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('GET /api/v1/auth/me should be mounted (not 404)', async () => {
      const res = await testAgent.get('/api/v1/auth/me');
      expect(res.status).not.toBe(404);
    });

    it('GET /api/v1/admin/reservations should be mounted (not 404)', async () => {
      const res = await testAgent.get('/api/v1/admin/reservations');
      expect(res.status).not.toBe(404);
    });

    it('GET /api/v1/admin/tours should be mounted (not 404)', async () => {
      const res = await testAgent.get('/api/v1/admin/tours');
      expect(res.status).not.toBe(404);
    });

    it('GET /api/v1/admin/properties should be mounted (not 404)', async () => {
      const res = await testAgent.get('/api/v1/admin/properties');
      expect(res.status).not.toBe(404);
    });

    it('GET /api/v1/properties should be mounted (not 404)', async () => {
      const res = await testAgent.get('/api/v1/properties');
      expect(res.status).not.toBe(404);
    });

    it('GET /api/v1/tours should be mounted (not 404)', async () => {
      const res = await testAgent.get('/api/v1/tours');
      expect(res.status).not.toBe(404);
    });

    it('GET /api/v1/products should be mounted (not 404)', async () => {
      const res = await testAgent.get('/api/v1/products');
      expect(res.status).not.toBe(404);
    });
  });

  // ── Swagger redirect ──────────────────────────────────────────────

  describe('Swagger UI redirect', () => {
    it('GET /api-docs should redirect (307) to /api/v1/docs', async () => {
      const res = await testAgent.get('/api-docs');
      expect(res.status).toBe(307);
      expect(res.headers.location).toBe('/api/v1/docs');
    });
  });

  // ── Short code routes unaffected ──────────────────────────────────

  describe('Short code routes — no versioning', () => {
    it('GET /q/TEST123 should NOT be affected by versioning', async () => {
      const res = await testAgent.get('/q/TEST123');
      expect(res.status).not.toBe(307);
    });
  });
});
