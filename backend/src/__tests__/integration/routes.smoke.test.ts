/**
 * @fileoverview Smoke tests for route mounting verification
 * @description Verifies that all routes are properly mounted in the Express app
 *              and respond with non-404 status codes. Routes may return 401 (Unauthorized)
 *              which is expected — the test validates mounting, not authorization.
 *
 *              Pruebas de humo para verificación de montaje de rutas.
 *              Verifica que todas las rutas están correctamente montadas en la app Express
 *              y responden con códigos de estado distintos a 404. Las rutas pueden retornar
 *              401 (No autorizado) lo cual es esperado — el test valida montaje, no autorización.
 *
 * @module __tests__/integration/routes.smoke
 * @requires supertest
 * @see routes/index.ts
 */

import { testAgent } from '../setup';

describe('Route Mounting Smoke Tests / Pruebas de Montaje de Rutas', () => {
  /**
   * Each route must be reachable (not 404).
   * A 401 response confirms the route IS mounted but requires authentication.
   *
   * Cada ruta debe ser alcanzable (no 404).
   * Una respuesta 401 confirma que la ruta ESTÁ montada pero requiere autenticación.
   */

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

  it('GET /api/v1/bot/leads should be mounted (not 404)', async () => {
    const res = await testAgent.get('/api/v1/bot/leads');
    expect(res.status).not.toBe(404);
  });

  it('GET /api/v1/admin/commissions should be mounted after relocation (not 404)', async () => {
    const res = await testAgent.get('/api/v1/admin/commissions');
    expect(res.status).not.toBe(404);
  });
});
