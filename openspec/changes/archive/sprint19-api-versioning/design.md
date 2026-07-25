# Design: API Versioning (Sprint 19)

## Technical Approach

Mount all API routes under `/api/v1` as the canonical prefix via a new Express Router wrapper. Dual-mount: both `/api/v1/*` (canonical) and `/api/*` (legacy, with 307 redirects) serve requests during the deprecation window. No route logic changes — only prefix wiring, redirect middleware, and consumer baseURL updates. Webhook paths (`/api/payment/paypal/webhook`, `/api/payment/mercadopago/webhook`) get explicit 307 redirects to `/api/v1/payment/...` since payment providers cannot be updated mid-flight.

## Architecture Decisions

| Decision | Options | Tradeoff | Decision |
|----------|---------|----------|----------|
| Redirect strategy | Middleware vs separate mount | Middleware = single entry point, harder to remove later. Separate mount = explicit, easy to delete. | Middleware — single regex handler, easier to reason about. |
| Rate limiter paths | Duplicate mounts vs regex | Duplicate = clear, doubles config. Regex = DRY, fragile to path changes. | Duplicate mounts — clarity wins for rate limit correctness. |
| Redirect URL source | `req.originalUrl` vs `req.baseUrl` | `originalUrl` = full path including prefix. `baseUrl` = stripped. | `req.originalUrl` — reliable for constructing the target. |
| Deprecation window | 30 / 60 / 90 days | 30 = aggressive, risks webhook breakage. 90 = safe, slower cleanup. | 90 days — payment providers need buffer. |
| Swagger docs path | Move vs add alias | Move = one path. Add alias = backward-compat. | 307 redirect from `/api-docs` to `/api/v1/docs`, serve only at new path. |

## Data Flow

    Client ──→ Express ──→ Rate Limiters (dual) ──→ Middleware
       │                                                │
       │  GET /api/v1/auth/me                           │
       │  ──────────────────→ route matches v1 mount ──→ handler ──→ Response
       │
       │  GET /api/auth/me (legacy)                     │
       │  ──────────────→ redirect middleware ──→ 307 to /api/v1/auth/me
       │
       │  POST /api/payment/paypal/webhook (webhook)    │
       │  ──────────────────────────────→ redirect middleware ──→ 307 to /api/v1/payment/paypal/webhook

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/src/app.ts` | Modify | Dual-mount `/api/v1` + `/api` legacy, add redirect middleware, rate limiter mounts, Swagger UI path |
| `backend/src/config/swagger.ts` | Modify | Server URLs: append `/v1` to all three server URLs |
| `bot/src/services/mlm-api.service.ts` | Modify | `baseURL` default: `/api` → `/api/v1` |
| `frontend/src/services/api/client.ts` | Modify | `VITE_API_URL` default: `/api` → `/api/v1` |
| `frontend/vite.config.ts` | Modify | Proxy: `/api` → `/api/v1` (keep `/api` prefix for both to avoid double-proxy) |
| `frontend/vercel.json` | Modify | Rewrite: `/api/(.*)` already forwards correctly (no change needed for dual-mount) |

### app.ts — Detailed Changes

**Current (lines 132, 172-175, 198-201, 205, 221-225):**
```typescript
app.use('/api', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/orders', orderLimiter);
app.use('/api/auth/2fa/verify', twoFALimiter);
app.use('/api/auth/2fa/verify-setup', twoFALimiter);
app.use('/api-docs', swaggerUi.serve, ...);
app.use('/api', routes);
app.use('/api/admin', adminRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api', landingRoutes);
app.use('/api/payment', paymentRoutes);
```

**After:**
```typescript
// --- 307 Legacy Redirect Middleware (runs before route mounts) ---
app.use('/api', (req, res, next) => {
  // Skip if already on /api/v1 or non-GET legacy webhook paths handled by dual-mount
  if (req.path.startsWith('/v1') || req.method !== 'GET') {
    return next();
  }
  // Redirect GET requests from /api/* to /api/v1/*
  const target = `/api/v1${req.path}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`;
  res.redirect(307, target);
});

// --- Global rate limiter on both prefixes ---
app.use('/api/v1', globalLimiter);
app.use('/api', globalLimiter);

// --- Endpoint-specific rate limiters on both prefixes ---
if (!isTest) {
  app.use('/api/v1/auth/login', authLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/v1/auth/register', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/v1/orders', orderLimiter);
  app.use('/api/orders', orderLimiter);
  app.use('/api/v1/auth/2fa/verify', twoFALimiter);
  app.use('/api/auth/2fa/verify', twoFALimiter);
  app.use('/api/v1/auth/2fa/verify-setup', twoFALimiter);
  app.use('/api/auth/2fa/verify-setup', twoFALimiter);
}

// --- Swagger UI at /api/v1/docs with legacy redirect ---
app.use('/api/v1/docs', swaggerUi.serve, (req, res, next) => { ... });
app.get('/api-docs', (req, res) => res.redirect(307, '/api/v1/docs'));

// --- Canonical v1 routes (primary mount) ---
app.use('/api/v1', routes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/crm', crmRoutes);
app.use('/api/v1', landingRoutes);
app.use('/api/v1/payment', paymentRoutes);

// --- Legacy dual-mount (serves existing /api/* paths) ---
app.use('/api', routes);
app.use('/api/admin', adminRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api', landingRoutes);
app.use('/api/payment', paymentRoutes);
```

**Note on webhook 307 redirect:** The redirect middleware only handles GET. POST/PUT webhooks from PayPal/MercadoPago hitting `/api/payment/paypal/webhook` will still be served by the legacy mount (dual-mount serves both). The 307 redirect is for GET-based documentation/health-check URLs and future consumer migration. Webhook providers keep their existing URL until they re-register.

### config/swagger.ts — Server URLs

```typescript
// Before
servers: [
  { url: 'https://api.nexoreal.com.co/api', ... },
  { url: 'https://staging-api.nexoreal.com.co/api', ... },
  { url: 'http://localhost:3000/api', ... },
]

// After
servers: [
  { url: 'https://api.nexoreal.com.co/api/v1', ... },
  { url: 'https://staging-api.nexoreal.com.co/api/v1', ... },
  { url: 'http://localhost:3000/api/v1', ... },
]
```

### frontend/src/services/api/client.ts

```typescript
// Before
const API_URL = import.meta.env.VITE_API_URL || '/api';

// After
const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
```

### frontend/vite.config.ts

```typescript
// Before
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    secure: false,
  },
}

// After — keep /api prefix to match both old and new paths
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    secure: false,
  },
}
// No change needed — /api prefix matches /api/v1/* too
```

### bot/src/services/mlm-api.service.ts

```typescript
// Before
baseURL: process.env.MLM_BACKEND_URL ?? 'http://backend:3000/api',

// After
baseURL: process.env.MLM_BACKEND_URL ?? 'http://backend:3000/api/v1',
```

## Interfaces / Contracts

No new interfaces. All existing route handlers remain unchanged — they receive the same `req`/`res` objects. The versioning is purely at the Express Router mount layer.

## Threat Matrix

| Boundary | Applicability | Design Response |
|----------|--------------|-----------------|
| Documentation-like paths | N/A — no executable path handling |
| Git repository selection | N/A — no VCS automation |
| Commit state | N/A |
| Push state | N/A |
| PR commands | N/A |

This change is pure routing/prefix wiring. No routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary is affected.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Rate limiter applies on both `/api` and `/api/v1` paths | Jest: hit `/api/v1/auth/me` and `/api/auth/me` with rate limiter mock |
| Unit | 307 redirect fires for GET `/api/*` (not `/api/v1/*`) | Jest: GET `/api/auth/me` → expect 307 Location header |
| Unit | `/api-docs` redirects to `/api/v1/docs` | Jest: GET `/api-docs` → expect 307 Location `/api/v1/docs` |
| Integration | `/api/v1/health` returns 200 | Jest supertest: `GET /api/v1/health` → 200 |
| Integration | `/api/health` returns 200 (dual-mount) | Jest supertest: `GET /api/health` → 200 |
| Integration | `/q/:shortCode` unaffected | Jest supertest: short code path unchanged |
| E2E | Frontend SPA calls `/api/v1/*` successfully | Playwright: login flow hits `/api/v1/auth/login` |
| E2E | Bot health check `/api/v1/bot/health` | Manual or CI: bot `MLM_BACKEND_URL` set to `/api/v1` |

## Migration / Rollout

**Phase 1 (Sprint 19 — this change):** Dual-mount. Both `/api` and `/api/v1` serve requests. Frontend, bot, and Swagger updated to use `/api/v1`.

**Phase 2 (Sprint 21+):** Monitor analytics for `/api/*` usage. Email notification to any remaining integrators.

**Phase 3 (Sprint 23):** Remove legacy `/api` mount and redirect middleware. Deprecation window: 90 days from Phase 1 deploy.

**Rollback:** Remove `/api/v1` mount + redirect middleware. Revert frontend `client.ts`, bot `mlm-api.service.ts`, `swagger.ts` server URLs. Pure routing change — no data migration needed.

## Open Questions

- [ ] Should the redirect middleware also handle POST/PUT for non-webhook paths, or only GET? (Current design: GET only — webhooks served by dual-mount)
- [ ] Do any external integrators beyond PayPal/MercadoPago hit `/api/*` directly? (Need to audit access logs before Phase 3)
