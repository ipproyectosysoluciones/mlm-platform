/**
 * @fileoverview Central mock API handler for Playwright E2E tests
 * @description Intercepts all /api/* requests and returns realistic mock data
 *              so tests can run without a running backend server.
 *
 *              Use `setupMockApi(page)` in any test or helper that needs
 *              backend-independent API responses.
 *
 * @module e2e/mock-api
 */

import type { Page, Route } from '@playwright/test';

// ─── Shared user mock ─────────────────────────────────────────────────────────

const mockUser = {
  id: '1',
  email: 'admin@mlm.com',
  referralCode: 'ADMIN',
  level: 1,
  levelName: 'Ejecutivo',
  role: 'admin',
  firstName: 'Admin',
  lastName: 'User',
};

const mockToken = 'mock-jwt-token';

/**
 * Public auth endpoints that don't require a valid token.
 * Normalized paths (without /v1/) — path normalization is applied before matching.
 */
const PUBLIC_AUTH_ENDPOINTS = new Set(['/api/auth/login', '/api/auth/register']);

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/**
 * Extract the Bearer token from the request's Authorization header, if present.
 */
function getAuthToken(route: Route): string | null {
  const authHeader = route.request().headers()['authorization'] ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(authHeader);
  return match ? match[1] : null;
}

/**
 * Return a 401 Unauthorized response.
 */
function unauthorized(route: Route) {
  return route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ success: false, error: 'Unauthorized' }),
  });
}

// ─── Route handler ────────────────────────────────────────────────────────────

/**
 * Setup mock API interception for all `/api/*` requests on the given page.
 * Call this BEFORE any navigation that triggers API calls.
 *
 * @param page - Playwright Page instance
 */
export function setupMockApi(page: Page): void {
  // Use a function-based URL matcher so only requests to /api/<path> are intercepted.
  // A glob like `**/api/**` would ALSO match source files like `/src/services/api/index.ts`.
  // Remove any existing route handler first to avoid duplicates.
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  page.unroute((url) => url.pathname.startsWith('/api/'));
  page.context().unroute((url) => url.pathname.startsWith('/api/'));
  page.context().route(
    (url) => url.pathname.startsWith('/api/'),
    async (route) => {
      const url = new URL(route.request().url());
      const method = route.request().method();
      const pathname = url.pathname;

      // Normalize /api/v1/* → /api/* so mock checks match frontend's baseURL prefix.
      // e.g. /api/v1/auth/login → /api/auth/login
      const normalizedPath = pathname.replace(/^\/api\/v1/, '/api');

      // ── Auth endpoints (no token required) ────────────────────────────────

      if (normalizedPath === '/api/auth/login' && method === 'POST') {
        let body: Record<string, unknown> = {};
        try {
          body = JSON.parse(route.request().postData() ?? '{}');
        } catch {
          /* ignore parse errors */
        }
        const email = String(body.email ?? '');
        const password = String(body.password ?? '');
        const valid = email === 'admin@mlm.com' && password === 'admin123';

        if (!valid) {
          return route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
            }),
          });
        }

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { token: mockToken, user: mockUser },
          }),
        });
      }

      if (normalizedPath === '/api/auth/register' && method === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              token: 'mock-jwt-token-new',
              user: {
                ...mockUser,
                id: '2',
                email: 'newuser@mlm.com',
                referralCode: 'NEWUSER',
              },
            },
          }),
        });
      }

      // ── Properties (public — no auth required) ───────────────────────────
      const MOCK_PROPERTIES = [
        {
          id: 'prop-001',
          type: 'rental',
          title: 'Casa en la playa',
          titleEn: 'Beach House',
          description: 'Hermosa casa frente al mar con 3 habitaciones',
          descriptionEn: 'Beautiful beachfront house with 3 bedrooms',
          price: 250,
          currency: 'USD',
          priceNegotiable: true,
          bedrooms: 3,
          bathrooms: 2,
          areaM2: 120,
          address: 'Calle del Mar 123',
          city: 'Punta del Este',
          country: 'Uruguay',
          amenities: ['WiFi', 'Parking', 'Pool', 'AC'],
          images: ['/images/prop-001.jpg'],
          status: 'active',
          createdAt: '2026-06-01T00:00:00Z',
          updatedAt: '2026-06-15T00:00:00Z',
        },
        {
          id: 'prop-002',
          type: 'rental',
          title: 'Apartamento centro',
          titleEn: 'Downtown Apartment',
          description: 'Moderno apartamento en el centro de la ciudad',
          descriptionEn: 'Modern downtown apartment',
          price: 150,
          currency: 'USD',
          priceNegotiable: false,
          bedrooms: 2,
          bathrooms: 1,
          areaM2: 80,
          address: 'Av. Principal 456',
          city: 'Montevideo',
          country: 'Uruguay',
          amenities: ['WiFi', 'AC', 'Gym'],
          images: ['/images/prop-002.jpg'],
          status: 'active',
          createdAt: '2026-06-01T00:00:00Z',
          updatedAt: '2026-06-15T00:00:00Z',
        },
      ];

      if (normalizedPath === '/api/properties' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: MOCK_PROPERTIES,
            pagination: { total: MOCK_PROPERTIES.length, page: 1, limit: 20, totalPages: 1 },
          }),
        });
      }

      const propertyIdMatch = normalizedPath.match(/^\/api\/properties\/([a-zA-Z0-9_-]+)$/);
      if (propertyIdMatch && method === 'GET') {
        const property = MOCK_PROPERTIES.find((p) => p.id === propertyIdMatch[1]);
        if (property) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: property }),
          });
        }
        return route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Property not found' }),
        });
      }

      // ── Reservations (public — no auth required) ────────────────────────
      const MOCK_RESERVATIONS = [
        {
          id: 'res-001',
          userId: '1',
          propertyId: 'prop-001',
          status: 'confirmed',
          paymentStatus: 'paid',
          checkIn: '2026-07-01',
          checkOut: '2026-07-05',
          guests: 2,
          totalAmount: 1000,
          currency: 'USD',
          notes: null,
          createdAt: '2026-06-20T10:00:00Z',
          updatedAt: '2026-06-20T10:00:00Z',
          property: {
            id: 'prop-001',
            title: 'Casa en la playa',
            address: 'Calle del Mar 123',
            city: 'Punta del Este',
            images: ['/images/prop-001.jpg'],
          },
        },
        {
          id: 'res-002',
          userId: '1',
          propertyId: 'prop-002',
          status: 'pending',
          paymentStatus: 'pending',
          checkIn: null,
          checkOut: null,
          guests: 1,
          totalAmount: 150,
          currency: 'USD',
          notes: 'Pending confirmation',
          createdAt: '2026-06-22T14:00:00Z',
          updatedAt: '2026-06-22T14:00:00Z',
          property: {
            id: 'prop-002',
            title: 'Downtown Apartment',
            address: 'Av. Principal 456',
            city: 'Montevideo',
            images: ['/images/prop-002.jpg'],
          },
        },
      ];

      // GET /api/reservations — list
      if (normalizedPath === '/api/reservations' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              data: MOCK_RESERVATIONS,
              pagination: { total: MOCK_RESERVATIONS.length, page: 1, limit: 20, totalPages: 1 },
            },
          }),
        });
      }

      // POST /api/reservations — create
      if (normalizedPath === '/api/reservations' && method === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'res-new-001',
              userId: '1',
              propertyId: 'prop-001',
              status: 'pending',
              paymentStatus: 'pending',
              checkIn: '2026-07-01',
              checkOut: '2026-07-05',
              guests: 2,
              totalAmount: 500,
              currency: 'USD',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              property: {
                id: 'prop-001',
                title: 'Casa en la playa',
                address: 'Calle del Mar 123',
                city: 'Punta del Este',
                images: ['/images/prop-001.jpg'],
              },
            },
          }),
        });
      }

      // GET /api/reservations/:id — single reservation
      const getReservationIdMatch = normalizedPath.match(/^\/api\/reservations\/([a-zA-Z0-9_-]+)$/);
      if (getReservationIdMatch && method === 'GET') {
        const reservation = MOCK_RESERVATIONS.find((r) => r.id === getReservationIdMatch[1]);
        if (reservation) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: reservation }),
          });
        }
        return route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Reservation not found' }),
        });
      }

      // ── All remaining endpoints require a valid token ─────────────────────

      if (!PUBLIC_AUTH_ENDPOINTS.has(normalizedPath)) {
        const token = getAuthToken(route);
        if (token !== mockToken) {
          return unauthorized(route);
        }
      }

      // ── Auth /me endpoint ─────────────────────────────────────────────────

      if (normalizedPath === '/api/auth/me' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockUser,
          }),
        });
      }

      // ── Dashboard endpoint ────────────────────────────────────────────────

      if (normalizedPath === '/api/dashboard' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: mockUser,
              stats: {
                totalReferrals: 42,
                leftCount: 25,
                rightCount: 17,
                totalEarnings: 12500.5,
                pendingEarnings: 3200.0,
              },
              referralLink: 'https://mlm.com/ref/ADMIN',
              recentCommissions: [
                {
                  id: 'c1',
                  type: 'direct',
                  amount: 150.0,
                  currency: 'USD',
                  createdAt: '2026-06-17T10:00:00Z',
                  fromUser: { email: 'user1@mlm.com', referralCode: 'USER1' },
                },
                {
                  id: 'c2',
                  type: 'binary',
                  amount: 75.5,
                  currency: 'USD',
                  createdAt: '2026-06-16T14:30:00Z',
                  fromUser: { email: 'user2@mlm.com', referralCode: 'USER2' },
                },
              ],
              recentReferrals: [
                {
                  id: 'r1',
                  email: 'newuser1@mlm.com',
                  position: 'left',
                  createdAt: '2026-06-15T08:00:00Z',
                },
                {
                  id: 'r2',
                  email: 'newuser2@mlm.com',
                  position: 'right',
                  createdAt: '2026-06-14T16:00:00Z',
                },
              ],
            },
          }),
        });
      }

      // ── Wallet endpoints ──────────────────────────────────────────────────

      if (normalizedPath === '/api/wallet' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'w1',
              userId: '1',
              balance: 5200.0,
              currency: 'USD',
              lastUpdated: '2026-06-17T12:00:00Z',
            },
          }),
        });
      }

      if (normalizedPath === '/api/wallet/config' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              minimumWithdrawal: 20,
              maximumWithdrawal: 500,
              maximumWithdrawalDailyPerUser: 1000,
              payoutMode: 'manual',
              feePercentage: 5,
            },
          }),
        });
      }

      if (normalizedPath === '/api/wallet/transactions' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } },
          }),
        });
      }

      if (normalizedPath === '/api/wallet/prices' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { bitcoin: 65000, ethereum: 3500 },
          }),
        });
      }

      // POST /api/wallet/withdraw — create withdrawal request
      if (normalizedPath === '/api/wallet/withdraw' && method === 'POST') {
        let body: Record<string, unknown> = {};
        try {
          body = JSON.parse(route.request().postData() ?? '{}');
        } catch {
          /* ignore */
        }
        const amount = Number(body.amount ?? 0);
        const destination = body.destination as { method: string; email: string } | undefined;
        const feeAmount = amount * 0.05;
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'wd-001',
              userId: '1',
              requestedAmount: amount,
              feeAmount: feeAmount,
              netAmount: amount - feeAmount,
              status: 'pending',
              destination: destination || { method: 'paypal', email: 'test@example.com' },
              createdAt: new Date().toISOString(),
            },
          }),
        });
      }

      // GET /api/wallet/withdrawals — list withdrawal requests
      if (normalizedPath === '/api/wallet/withdrawals' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } },
          }),
        });
      }

      // ── Tree endpoint ─────────────────────────────────────────────────────

      if (normalizedPath === '/api/users/me/tree' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              tree: {
                id: '1',
                email: 'admin@mlm.com',
                referralCode: 'ADMIN',
                position: 'left',
                level: 0,
                stats: { leftCount: 25, rightCount: 17 },
                children: [],
              },
              stats: { totalLeft: 25, totalRight: 17, totalDepth: 3 },
            },
          }),
        });
      }

      // GET /api/users/:userId/tree — specific user's tree
      const userTreeMatch = normalizedPath.match(/^\/api\/users\/([^/]+)\/tree$/);
      if (userTreeMatch && method === 'GET') {
        const uid = userTreeMatch[1];
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              tree: {
                id: uid,
                email: 'user@mlm.com',
                referralCode: 'USER',
                position: 'left',
                level: 0,
                stats: { leftCount: 5, rightCount: 3 },
                children: [],
              },
              stats: { totalLeft: 5, totalRight: 3, totalDepth: 2 },
            },
          }),
        });
      }

      // PATCH /api/users/me — update profile
      if (normalizedPath === '/api/users/me' && method === 'PATCH') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: mockUser }),
        });
      }

      // POST /api/users/me/change-password
      if (normalizedPath === '/api/users/me/change-password' && method === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { message: 'Password changed' } }),
        });
      }

      // GET /api/users/search
      if (normalizedPath === '/api/users/search' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
      }

      // GET /api/users/:userId/details
      const userDetailsMatch = normalizedPath.match(/^\/api\/users\/([^/]+)\/details$/);
      if (userDetailsMatch && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...mockUser,
              id: userDetailsMatch[1],
              binaryBalance: 2500,
              networkBalance: 3500,
              totalCommissions: 12500,
            },
          }),
        });
      }

      // ── Admin endpoints ───────────────────────────────────────────────────

      if (normalizedPath === '/api/admin/stats' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              totalUsers: 150,
              activeUsers: 120,
              inactiveUsers: 30,
              totalCommissions: 45000,
              pendingCommissions: 5000,
            },
          }),
        });
      }

      if (normalizedPath === '/api/admin/users' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              users: [
                {
                  id: '1',
                  email: 'admin@mlm.com',
                  role: 'admin',
                  active: true,
                  referralCode: 'ADMIN',
                  createdAt: '2026-01-01T00:00:00Z',
                },
              ],
              total: 1,
              page: 1,
              limit: 20,
              totalPages: 1,
            },
          }),
        });
      }

      // ── Admin properties ────────────────────────────────────────────────

      if (normalizedPath === '/api/admin/properties' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              properties: [
                {
                  id: 'prop-001',
                  type: 'rental',
                  title: 'Casa en la playa',
                  titleEn: 'Beach House',
                  description: 'Hermosa casa frente al mar',
                  descriptionEn: 'Beautiful beachfront house',
                  price: 250,
                  currency: 'USD',
                  priceNegotiable: true,
                  bedrooms: 3,
                  bathrooms: 2,
                  areaM2: 120,
                  address: 'Calle del Mar 123',
                  city: 'Punta del Este',
                  country: 'Uruguay',
                  amenities: ['WiFi', 'Parking', 'Pool'],
                  images: ['/images/prop-001.jpg'],
                  status: 'active',
                  createdAt: '2026-06-01T00:00:00Z',
                  updatedAt: '2026-06-15T00:00:00Z',
                },
                {
                  id: 'prop-002',
                  type: 'sale',
                  title: 'Apartamento centro',
                  titleEn: 'Downtown Apartment',
                  description: 'Moderno apartamento en el centro',
                  descriptionEn: 'Modern downtown apartment',
                  price: 95000,
                  currency: 'USD',
                  priceNegotiable: false,
                  bedrooms: 2,
                  bathrooms: 1,
                  areaM2: 80,
                  address: 'Av. Principal 456',
                  city: 'Montevideo',
                  country: 'Uruguay',
                  amenities: ['WiFi', 'AC'],
                  images: ['/images/prop-002.jpg'],
                  status: 'active',
                  createdAt: '2026-06-01T00:00:00Z',
                  updatedAt: '2026-06-15T00:00:00Z',
                },
              ],
              total: 2,
              page: 1,
              limit: 20,
              totalPages: 1,
            },
          }),
        });
      }

      // ── Admin tours ─────────────────────────────────────────────────────

      if (normalizedPath === '/api/admin/tours' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              tours: [
                {
                  id: 'tour-001',
                  type: 'adventure',
                  title: 'Trekking en Patagonia',
                  titleEn: 'Patagonia Trekking',
                  description: 'Aventura por la Patagonia argentina',
                  descriptionEn: 'Adventure through Argentine Patagonia',
                  destination: 'El Chaltén',
                  country: 'Argentina',
                  durationDays: 7,
                  price: 85000,
                  currency: 'ARS',
                  priceIncludes: ['Alojamiento', 'Comidas', 'Guía'],
                  priceExcludes: ['Vuelos', 'Seguro'],
                  maxCapacity: 12,
                  minGroupSize: 4,
                  status: 'active',
                  images: [],
                  createdAt: '2026-06-01T00:00:00Z',
                  updatedAt: '2026-06-15T00:00:00Z',
                },
                {
                  id: 'tour-002',
                  type: 'gastronomic',
                  title: 'Bodega & Vino en Mendoza',
                  titleEn: 'Mendoza Winery Tour',
                  description: 'Recorrido por bodegas de Mendoza',
                  descriptionEn: 'Mendoza winery tour',
                  destination: 'Luján de Cuyo',
                  country: 'Argentina',
                  durationDays: 3,
                  price: 45000,
                  currency: 'ARS',
                  priceIncludes: ['Degustación', 'Transporte'],
                  priceExcludes: ['Alojamiento'],
                  maxCapacity: 8,
                  minGroupSize: 2,
                  status: 'active',
                  images: [],
                  createdAt: '2026-06-01T00:00:00Z',
                  updatedAt: '2026-06-15T00:00:00Z',
                },
              ],
              total: 2,
              page: 1,
              limit: 20,
              totalPages: 1,
            },
          }),
        });
      }

      // ── Admin reservations ──────────────────────────────────────────────

      if (normalizedPath === '/api/admin/reservations' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              reservations: [
                {
                  id: 'res-001',
                  userId: '1',
                  type: 'property',
                  propertyId: 'prop-001',
                  status: 'confirmed',
                  paymentStatus: 'paid',
                  checkIn: '2026-07-01',
                  checkOut: '2026-07-05',
                  guests: 2,
                  totalAmount: 1000,
                  currency: 'USD',
                  adminNotes: null,
                  createdAt: '2026-06-20T10:00:00Z',
                  updatedAt: '2026-06-20T10:00:00Z',
                  user: { id: '1', email: 'admin@mlm.com' },
                  property: { id: 'prop-001', title: 'Casa en la playa', city: 'Punta del Este' },
                },
                {
                  id: 'res-002',
                  userId: '2',
                  type: 'tour',
                  tourId: 'tour-001',
                  status: 'pending',
                  paymentStatus: 'pending',
                  checkIn: '2026-08-01',
                  checkOut: '2026-08-08',
                  guests: 4,
                  totalAmount: 340000,
                  currency: 'ARS',
                  adminNotes: null,
                  createdAt: '2026-06-22T14:00:00Z',
                  updatedAt: '2026-06-22T14:00:00Z',
                  user: { id: '2', email: 'user1@mlm.com' },
                  tour: {
                    id: 'tour-001',
                    title: 'Trekking en Patagonia',
                    destination: 'El Chaltén',
                  },
                },
              ],
              total: 2,
              page: 1,
              limit: 20,
              totalPages: 1,
            },
          }),
        });
      }

      // ── CRM automation endpoints ─────────────────────────────────────────

      if (normalizedPath === '/api/crm/automation/status' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              totalExecutions: 25,
              pendingFollowUps: 3,
              lastActionAt: '2026-06-17T10:00:00Z',
            },
          }),
        });
      }

      if (normalizedPath === '/api/crm/automation/executions' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'exec1',
                leadId: 'lead1',
                workflowName: 'Welcome Email',
                actionType: 'send_email',
                status: 'completed',
                n8nExecutionId: 'n8n-001',
                errorMessage: null,
                createdAt: '2026-06-17T09:00:00Z',
                Lead: { contactName: 'Juan Pérez', contactPhone: '+123456789' },
              },
              {
                id: 'exec2',
                leadId: 'lead2',
                workflowName: 'Follow-up Call',
                actionType: 'create_task',
                status: 'pending',
                n8nExecutionId: 'n8n-002',
                errorMessage: null,
                createdAt: '2026-06-17T08:30:00Z',
                Lead: { contactName: 'María García', contactPhone: null },
              },
            ],
            total: 2,
            page: 1,
            limit: 20,
          }),
        });
      }

      // ── Categories ──────────────────────────────────────────────────────

      if (normalizedPath === '/api/categories/tree' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'cat-001',
                name: 'Streaming',
                slug: 'streaming',
                children: [
                  {
                    id: 'cat-002',
                    name: 'Video',
                    slug: 'video',
                    children: [],
                  },
                  {
                    id: 'cat-003',
                    name: 'Music',
                    slug: 'music',
                    children: [],
                  },
                ],
              },
              {
                id: 'cat-004',
                name: 'Gift Cards',
                slug: 'gift-cards',
                children: [],
              },
            ],
          }),
        });
      }

      if (normalizedPath === '/api/categories' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              { id: 'cat-001', name: 'Streaming', slug: 'streaming', isActive: true },
              { id: 'cat-002', name: 'Video', slug: 'video', isActive: true },
              { id: 'cat-003', name: 'Music', slug: 'music', isActive: true },
              { id: 'cat-004', name: 'Gift Cards', slug: 'gift-cards', isActive: true },
            ],
          }),
        });
      }

      // ── Product Catalog ──────────────────────────────────────────────────

      if (normalizedPath === '/api/products' && method === 'GET') {
        const products = [
          {
            id: 'prod-001',
            name: 'Netflix Premium',
            platform: 'netflix',
            description: 'Acceso a Netflix en calidad 4K',
            price: 15.99,
            currency: 'USD',
            durationDays: 30,
            imageUrl: '/images/netflix.png',
            isActive: true,
          },
          {
            id: 'prod-002',
            name: 'Spotify Family',
            platform: 'spotify',
            description: 'Spotify Premium para hasta 6 cuentas',
            price: 12.99,
            currency: 'USD',
            durationDays: 30,
            imageUrl: '/images/spotify.png',
            isActive: true,
          },
          {
            id: 'prod-003',
            name: 'HBO Max',
            platform: 'hbo_max',
            description: 'Todo el contenido de HBO Max',
            price: 9.99,
            currency: 'USD',
            durationDays: 30,
            imageUrl: '/images/hbo.png',
            isActive: true,
          },
          {
            id: 'prod-004',
            name: 'Disney+ Standard',
            platform: 'disney_plus',
            description: 'Disney+, Marvel, Star Wars y más',
            price: 7.99,
            currency: 'USD',
            durationDays: 30,
            imageUrl: '/images/disney.png',
            isActive: true,
          },
          {
            id: 'prod-005',
            name: 'Amazon Prime Video',
            platform: 'amazon_prime',
            description: 'Amazon Prime Video + envíos gratis',
            price: 14.99,
            currency: 'USD',
            durationDays: 30,
            imageUrl: '/images/amazon.png',
            isActive: true,
          },
        ];

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              products,
              total: products.length,
              page: 1,
              limit: 20,
              totalPages: 1,
            },
          }),
        });
      }

      // ── Single Product (by ID) ──────────────────────────────────────────

      const productIdMatch = normalizedPath.match(/^\/api\/products\/([a-zA-Z0-9_-]+)$/);
      if (productIdMatch && method === 'GET') {
        const productId = productIdMatch[1];
        const products = [
          {
            id: 'prod-001',
            name: 'Netflix Premium',
            platform: 'netflix',
            description: 'Acceso a Netflix en calidad 4K',
            price: 15.99,
            currency: 'USD',
            durationDays: 30,
            imageUrl: '/images/netflix.png',
            isActive: true,
          },
          {
            id: 'prod-002',
            name: 'Spotify Family',
            platform: 'spotify',
            description: 'Spotify Premium para hasta 6 cuentas',
            price: 12.99,
            currency: 'USD',
            durationDays: 30,
            imageUrl: '/images/spotify.png',
            isActive: true,
          },
          {
            id: 'prod-003',
            name: 'HBO Max',
            platform: 'hbo_max',
            description: 'Todo el contenido de HBO Max',
            price: 9.99,
            currency: 'USD',
            durationDays: 30,
            imageUrl: '/images/hbo.png',
            isActive: true,
          },
          {
            id: 'prod-004',
            name: 'Disney+ Standard',
            platform: 'disney_plus',
            description: 'Disney+, Marvel, Star Wars y más',
            price: 7.99,
            currency: 'USD',
            durationDays: 30,
            imageUrl: '/images/disney.png',
            isActive: true,
          },
          {
            id: 'prod-005',
            name: 'Amazon Prime Video',
            platform: 'amazon_prime',
            description: 'Amazon Prime Video + envíos gratis',
            price: 14.99,
            currency: 'USD',
            durationDays: 30,
            imageUrl: '/images/amazon.png',
            isActive: true,
          },
        ];
        const product = products.find((p) => p.id === productId);

        if (product) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: product }),
          });
        }

        return route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Product not found' }),
        });
      }

      // ── Orders ──────────────────────────────────────────────────────────

      // POST /api/orders — create order
      if (normalizedPath === '/api/orders' && method === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'order-001',
              orderNumber: 'ORD-20260619-001',
              status: 'completed',
              paymentMethod: 'simulated',
              amount: 15.99,
              currency: 'USD',
              productId: 'prod-001',
              product: {
                id: 'prod-001',
                name: 'Netflix Premium',
                platform: 'netflix',
                description: 'Acceso a Netflix en calidad 4K',
                price: 15.99,
                currency: 'USD',
                durationDays: 30,
                imageUrl: '/images/netflix.png',
                isActive: true,
              },
              userId: 'user-1',
              commissionTotal: 1.6,
              createdAt: new Date().toISOString(),
            },
          }),
        });
      }

      // GET /api/orders — list orders (MUST come before :orderId regex)
      if (normalizedPath === '/api/orders' && method === 'GET') {
        const page = parseInt(new URL(route.request().url()).searchParams.get('page') || '1');
        const limit = parseInt(new URL(route.request().url()).searchParams.get('limit') || '20');
        const total = 42;
        const totalPages = Math.ceil(total / limit);

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              orders: [
                {
                  id: 'order-001',
                  orderNumber: 'ORD-20260619-001',
                  userId: 'user-1',
                  productId: 'prod-001',
                  purchaseId: 'purchase-001',
                  totalAmount: 15.99,
                  currency: 'USD',
                  status: 'completed',
                  paymentMethod: 'simulated',
                  notes: null,
                  createdAt: '2026-06-19T10:00:00.000Z',
                  updatedAt: '2026-06-19T10:00:00.000Z',
                  product: {
                    id: 'prod-001',
                    name: 'Netflix Premium',
                    platform: 'netflix',
                    price: 15.99,
                    durationDays: 30,
                    description: 'Acceso a Netflix en calidad 4K',
                  },
                },
                {
                  id: 'order-002',
                  orderNumber: 'ORD-20260618-001',
                  userId: 'user-1',
                  productId: 'prod-002',
                  purchaseId: 'purchase-002',
                  totalAmount: 12.99,
                  currency: 'USD',
                  status: 'completed',
                  paymentMethod: 'simulated',
                  notes: null,
                  createdAt: '2026-06-18T14:30:00.000Z',
                  updatedAt: '2026-06-18T14:30:00.000Z',
                  product: {
                    id: 'prod-002',
                    name: 'Spotify Family',
                    platform: 'spotify',
                    price: 12.99,
                    durationDays: 30,
                    description: 'Spotify Premium para hasta 6 cuentas',
                  },
                },
                {
                  id: 'order-003',
                  orderNumber: 'ORD-20260617-001',
                  userId: 'user-1',
                  productId: 'prod-003',
                  purchaseId: null,
                  totalAmount: 9.99,
                  currency: 'USD',
                  status: 'pending',
                  paymentMethod: 'simulated',
                  notes: 'Awaiting payment confirmation',
                  createdAt: '2026-06-17T09:15:00.000Z',
                  updatedAt: '2026-06-17T09:15:00.000Z',
                  product: {
                    id: 'prod-003',
                    name: 'HBO Max',
                    platform: 'hbo_max',
                    price: 9.99,
                    durationDays: 30,
                    description: 'Todo el contenido de HBO Max',
                  },
                },
              ],
              total,
              page,
              limit,
              totalPages,
            },
          }),
        });
      }

      // GET /api/orders/:orderId — get single order (used by OrderSuccess page)
      const getOrderIdMatch = normalizedPath.match(/^\/api\/orders\/([a-zA-Z0-9_-]+)$/);
      if (getOrderIdMatch && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: getOrderIdMatch[1],
              orderNumber: 'ORD-20260619-001',
              status: 'completed',
              paymentMethod: 'simulated',
              amount: 15.99,
              currency: 'USD',
              productId: 'prod-001',
              product: {
                id: 'prod-001',
                name: 'Netflix Premium',
                platform: 'netflix',
                description: 'Acceso a Netflix en calidad 4K',
                price: 15.99,
                currency: 'USD',
                durationDays: 30,
                imageUrl: '/images/netflix.png',
                isActive: true,
              },
              userId: 'user-1',
              commissionTotal: 1.6,
              createdAt: new Date().toISOString(),
            },
          }),
        });
      }

      // ── Landing Pages endpoints ────────────────────────────────────────────

      const landingMatch = normalizedPath.match(/^\/api\/landing\/stats$/);
      if (landingMatch) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              total: 3,
              active: 2,
              totalViews: 245,
              totalConversions: 32,
              conversionRate: 13.1,
            },
          }),
        });
      }

      if (normalizedPath === '/api/landing' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'landing-1',
                slug: 'summer-promo',
                title: 'Summer Promotion',
                description: 'Summer promo landing page',
                template: 'hero',
                content: {
                  headline: 'Summer Sale!',
                  subheadline: 'Get 20% off',
                  ctaText: 'Shop Now',
                  ctaColor: '#ff0000',
                  backgroundColor: '#ffffff',
                  textColor: '#000000',
                  showReferralCode: true,
                  showStats: true,
                },
                metaTitle: null,
                metaDescription: null,
                isActive: true,
                views: 150,
                conversions: 22,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: 'landing-2',
                slug: 'winter-campaign',
                title: 'Winter Campaign',
                description: 'Winter campaign',
                template: 'minimal',
                content: {
                  headline: 'Winter Deals',
                  subheadline: 'Limited time',
                  ctaText: 'Get Deal',
                  ctaColor: '#00ff00',
                  backgroundColor: '#f0f0f0',
                  textColor: '#333333',
                  showReferralCode: false,
                  showStats: true,
                },
                metaTitle: null,
                metaDescription: null,
                isActive: false,
                views: 95,
                conversions: 10,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          }),
        });
      }

      // ── Email Campaigns endpoints ─────────────────────────────────────────

      if (normalizedPath === '/api/email-campaigns' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'camp-001',
                name: 'Summer Blast',
                subject: 'Check out our summer deals!',
                status: 'sent',
                type: 'marketing',
                scheduledAt: null,
                sentAt: new Date(Date.now() - 86400000).toISOString(),
                stats: { sent: 1500, opened: 320, clicked: 85, bounced: 5 },
                createdAt: new Date(Date.now() - 604800000).toISOString(),
                updatedAt: new Date(Date.now() - 86400000).toISOString(),
              },
              {
                id: 'camp-002',
                name: 'Welcome Series',
                subject: 'Welcome to MLM!',
                status: 'draft',
                type: 'automated',
                scheduledAt: null,
                sentAt: null,
                stats: { sent: 0, opened: 0, clicked: 0, bounced: 0 },
                createdAt: new Date(Date.now() - 259200000).toISOString(),
                updatedAt: new Date(Date.now() - 259200000).toISOString(),
              },
            ],
          }),
        });
      }

      // ── CRM endpoints (page-load support) ─────────────────────────────────

      // GET /api/crm — leads list
      if (normalizedPath === '/api/crm' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              leads: [
                {
                  id: 'lead1',
                  contactName: 'Juan Pérez',
                  contactEmail: 'juan@example.com',
                  contactPhone: '+123456789',
                  status: 'new',
                  source: 'web',
                  notes: 'Interested in property',
                  createdAt: '2026-06-10T10:00:00Z',
                  updatedAt: '2026-06-10T10:00:00Z',
                },
                {
                  id: 'lead2',
                  contactName: 'María García',
                  contactEmail: 'maria@example.com',
                  contactPhone: null,
                  status: 'contacted',
                  source: 'referral',
                  notes: null,
                  createdAt: '2026-06-12T14:00:00Z',
                  updatedAt: '2026-06-12T14:00:00Z',
                },
              ],
              total: 2,
              page: 1,
              limit: 20,
              totalPages: 1,
            },
          }),
        });
      }

      // GET /api/crm/stats
      if (normalizedPath === '/api/crm/stats' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              totalLeads: 2,
              newLeads: 1,
              contactedLeads: 1,
              convertedLeads: 0,
              conversionRate: 0,
            },
          }),
        });
      }

      // GET /api/crm/tasks
      if (normalizedPath === '/api/crm/tasks' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
      }

      // GET /api/crm/alerts
      if (normalizedPath === '/api/crm/alerts' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
      }

      // ── Admin products ────────────────────────────────────────────────────

      if (normalizedPath === '/api/admin/products' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              products: [
                {
                  id: 'prod-001',
                  name: 'Netflix Premium',
                  platform: 'netflix',
                  price: 15.99,
                  currency: 'USD',
                  durationDays: 30,
                  isActive: true,
                  description: 'Acceso a Netflix en calidad 4K',
                  imageUrl: '/images/netflix.png',
                },
              ],
              total: 1,
              page: 1,
              limit: 20,
              totalPages: 1,
            },
          }),
        });
      }

      // ── Admin vendors ─────────────────────────────────────────────────────

      if (normalizedPath === '/api/admin/vendors' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { vendors: [], total: 0, page: 1, limit: 20, totalPages: 0 },
          }),
        });
      }

      // ── Vendor products ───────────────────────────────────────────────────

      if (normalizedPath === '/api/vendors/me/products' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { products: [], total: 0, page: 1, limit: 20, totalPages: 0 },
          }),
        });
      }

      // ── Public landing page ───────────────────────────────────────────────

      const publicLandingMatch = normalizedPath.match(/^\/api\/public\/landing\/([^/]+)$/);
      if (publicLandingMatch && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'landing-1',
              slug: publicLandingMatch[1],
              title: 'Summer Promotion',
              description: 'Summer promo landing page',
              template: 'hero',
              content: {
                headline: 'Summer Sale!',
                subheadline: 'Get 20% off',
                ctaText: 'Shop Now',
                ctaColor: '#ff0000',
                backgroundColor: '#ffffff',
                textColor: '#000000',
                showReferralCode: true,
                showStats: true,
              },
              isActive: true,
            },
          }),
        });
      }

      // ── Admin commission config ───────────────────────────────────────────

      if (normalizedPath === '/api/admin/commissions/config' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'cc1',
                businessType: 'property_rental',
                level: 'ejecutivo',
                percentage: 5,
                isActive: true,
              },
            ],
          }),
        });
      }

      // GET /api/admin/commissions/rates/:businessType
      const commRatesMatch = normalizedPath.match(/^\/api\/admin\/commissions\/rates\/([^/]+)$/);
      if (commRatesMatch && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              businessType: commRatesMatch[1],
              rates: [{ level: 'ejecutivo', percentage: 5 }],
            },
          }),
        });
      }

      // GET /api/admin/reports/commissions
      if (normalizedPath === '/api/admin/reports/commissions' && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { reports: [], total: 0, page: 1, limit: 20, totalPages: 0 },
          }),
        });
      }

      // ── Catch-all for unknown endpoints ───────────────────────────────────

      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: {} }),
        });
      }

      // POST, PUT, PATCH, DELETE — return empty success
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} }),
      });
    }
  );
}
