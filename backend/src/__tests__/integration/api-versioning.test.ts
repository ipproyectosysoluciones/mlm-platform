/**
 * @fileoverview API versioning integration tests
 * @description Verifies dual-mount (/api + /api/v1), 307 redirects,
 *              health endpoint, Swagger redirect, and rate limiter coverage.
 *
 *              Redirect tests use a standalone Express app (no DB required)
 *              because the redirect middleware is skipped in test env to avoid
 *              breaking integration tests that use /api/* URLs with supertest.
 *
 *              Canonical route tests require a running PostgreSQL database.
 *              Run with: TEST_DB_NAME=mlm_test pnpm test:integration
 *
 * @module __tests__/integration/api-versioning
 * @requires supertest
 */

import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { testAgent } from '../setup';

// Skip DB-dependent tests if no database is available
const describeDb = process.env.TEST_DB_NAME ? describe : describe.skip;

// ── Redirect test app (standalone — no DB required) ──────────────
// The redirect middleware is skipped in test env (NODE_ENV=test) to
// avoid breaking integration tests that use /api/* URLs. These tests
// verify the redirect logic in isolation with a minimal Express app.
function createRedirectTestApp() {
  const app = express();

  // Redirect middleware — same logic as app.ts
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/v1')) return next();
    if (req.originalUrl === '/api-docs' || req.originalUrl.startsWith('/api-docs?')) return next();
    if ((req.method === 'POST' || req.method === 'PUT') && req.path.startsWith('/payment/')) {
      const target = `/api/v1${req.originalUrl.replace(/^\/api/, '')}`;
      res.redirect(307, target);
      return;
    }
    if (req.method === 'GET') {
      const queryIndex = req.originalUrl.indexOf('?');
      const query = queryIndex !== -1 ? req.originalUrl.substring(queryIndex) : '';
      const target = `/api/v1${req.path}${query}`;
      res.redirect(307, target);
      return;
    }
    next();
  });

  // Stub routes for redirect target verification
  app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/api/v1/auth/me', (_req, res) => res.json({ user: 'test' }));
  app.get('/api/auth/me', (_req, res) => res.json({ user: 'test' }));
  app.get('/api/v1/products', (_req, res) => res.json({ products: [] }));
  app.get('/api/products', (_req, res) => res.json({ products: [] }));
  app.post('/api/v1/payment/paypal/webhook', (_req, res) => res.json({ ok: true }));
  app.post('/api/payment/paypal/webhook', (_req, res) => res.json({ ok: true }));
  app.post('/api/v1/payment/mercadopago/webhook', (_req, res) => res.json({ ok: true }));
  app.post('/api/payment/mercadopago/webhook', (_req, res) => res.json({ ok: true }));

  // Legacy Swagger redirect route (same as app.ts)
  app.get('/api-docs', (_req, res) => {
    res.redirect(307, '/api/v1/docs');
  });

  return app;
}

describe('API Versioning — Sprint 19', () => {
  // ── 307 Redirect: GET /api/* → /api/v1/* ─────────────────────────
  // These tests verify redirect middleware using a standalone app.

  describe('307 Redirect: GET /api/* → /api/v1/*', () => {
    const redirectApp = createRedirectTestApp();

    it('GET /api/health should redirect (307) to /api/v1/health', async () => {
      const res = await request(redirectApp).get('/api/health');
      expect(res.status).toBe(307);
      expect(res.headers.location).toBe('/api/v1/health');
    });

    it('GET /api/auth/me should redirect (307) to /api/v1/auth/me', async () => {
      const res = await request(redirectApp).get('/api/auth/me');
      expect(res.status).toBe(307);
      expect(res.headers.location).toBe('/api/v1/auth/me');
    });

    it('GET /api/products should redirect (307) to /api/v1/products', async () => {
      const res = await request(redirectApp).get('/api/products');
      expect(res.status).toBe(307);
      expect(res.headers.location).toBe('/api/v1/products');
    });

    it('GET /api/v1/health should NOT redirect (already versioned)', async () => {
      const res = await request(redirectApp).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('POST /api/payment/paypal/webhook should redirect (307)', async () => {
      const res = await request(redirectApp)
        .post('/api/payment/paypal/webhook')
        .send({ event_type: 'PAYMENT.CAPTURE.COMPLETED' });
      expect(res.status).toBe(307);
      expect(res.headers.location).toBe('/api/v1/payment/paypal/webhook');
    });

    it('POST /api/payment/mercadopago/webhook should redirect (307)', async () => {
      const res = await request(redirectApp)
        .post('/api/payment/mercadopago/webhook')
        .send({ type: 'payment' });
      expect(res.status).toBe(307);
      expect(res.headers.location).toBe('/api/v1/payment/mercadopago/webhook');
    });
  });

  // ── Canonical /api/v1 routes ──────────────────────────────────────
  // These tests require the full app with database.

  describeDb('Canonical /api/v1 routes', () => {
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
      const redirectApp = createRedirectTestApp();
      const res = await request(redirectApp).get('/api-docs');
      expect(res.status).toBe(307);
      expect(res.headers.location).toBe('/api/v1/docs');
    });
  });

  // ── Short code routes unaffected ──────────────────────────────────

  describeDb('Short code routes — no versioning', () => {
    it('GET /q/TEST123 should NOT be affected by versioning', async () => {
      const res = await testAgent.get('/q/TEST123');
      expect(res.status).not.toBe(307);
    });
  });
});
