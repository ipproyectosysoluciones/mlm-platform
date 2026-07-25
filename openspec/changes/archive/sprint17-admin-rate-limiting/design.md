# Design: Sprint 17 — Admin Rate Limiting & Swagger Gaps

## Technical Approach

Create a shared `adminLimiter` middleware (60 req/min) in a new `backend/src/middleware/rateLimit.ts` file, applied to all 9 admin route files. Replace the 2 existing per-file limiters (admin-property, admin-tour) with the shared instance. Separately, fix 15 Swagger annotation gaps across 9 files. Two independent PRs.

## Architecture Decisions

| Decision | Options | Tradeoff | Choice |
|----------|---------|----------|--------|
| **File location** | New `middleware/rateLimit.ts` vs. add to `auth.middleware.ts` | auth.middleware.ts already has an unrelated in-memory rateLimit function; mixing concerns muddies the module | **New file** — clean separation |
| **Consolidate existing limiters** | Keep adminPropertyLimiter + adminTourLimiter separate vs. replace with shared adminLimiter | DRY: 2 identical limiters duplicated across files; shared instance is identical config | **Consolidate** — remove per-file limiters, use `adminLimiter` |
| **Rate limit config** | 60 req/min (existing admin pattern) vs. 30 or 100 | 60 matches the existing admin-property/admin-tour pattern already in production | **60 req/min** — no behavior change for existing limited routes |
| **KeyGenerator** | Default `req.ip` vs. `req.user.id` | Admin routes are already authenticated; IP-based is simpler and matches existing pattern (admin-property/tour don't use keyGenerator) | **Default `req.ip`** — matches existing pattern |
| **Test bypass** | `NODE_ENV === 'test'` → max 1000 | Matches globalLimiter, authLimiter, and existing admin limiters | **max 1000** |
| **PR chain order** | Rate limit first (security) vs. Swagger first | Rate limiting is security-critical; Swagger is docs-only. Security ships first | **PR #1: rate limit, PR #2: swagger** |
| **PR parallelization** | Sequential vs. parallel | Zero overlap — PR #1 touches middleware + route imports, PR #2 touches JSDoc comments only | **Can parallelize** on separate branches |

## Data Flow

```
Request → express-rate-limit (adminLimiter)
              │
              ├── keyGenerator: req.ip
              ├── windowMs: 60000
              ├── max: 60 (1000 in test)
              │
              ├── PASS → router.use(authenticate) → handler
              │
              └── FAIL → 429 { success: false, error: { code: 'RATE_LIMIT', message: '...' } }
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/src/middleware/rateLimit.ts` | **Create** | Shared `adminLimiter` export using `express-rate-limit` |
| `backend/src/routes/admin-property.routes.ts` | **Modify** | Remove `import rateLimit` + `adminPropertyLimiter` definition + `router.use(adminPropertyLimiter)`. Add `import { adminLimiter }` + `router.use(adminLimiter)` |
| `backend/src/routes/admin-tour.routes.ts` | **Modify** | Same as admin-property: remove local limiter, use shared |
| `backend/src/routes/admin-category.routes.ts` | **Modify** | Add `import { adminLimiter }` + `router.use(adminLimiter)` before auth middleware |
| `backend/src/routes/admin-contract.routes.ts` | **Modify** | Add `import { adminLimiter }` + `router.use(adminLimiter)` before route handlers |
| `backend/src/routes/admin-product.routes.ts` | **Modify** | Add `import { adminLimiter }` + `router.use(adminLimiter)` before auth middleware |
| `backend/src/routes/admin-reservation.routes.ts` | **Modify** | Add `import { adminLimiter }` + `router.use(adminLimiter)` before route handlers |
| `backend/src/routes/admin-vendor.routes.ts` | **Modify** | Add `import { adminLimiter }` + `router.use(adminLimiter)` before route handlers |
| `backend/src/routes/admin.routes.ts` | **Modify** | Add `import { adminLimiter }` + `router.use(adminLimiter)` after auth middleware |

**Note on ordering**: `router.use(adminLimiter)` goes BEFORE `router.use(authenticate)` / `router.use(requireAdmin)` where those exist. This ensures rate limiting runs before auth checks — cheaper to reject an unauthenticated flood.

## Interfaces / Contracts

```typescript
// backend/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,           // 1 minute
  max: isTest ? 1000 : 60,      // 60 req/min production, 1000 for tests
  standardHeaders: true,         // Return rate limit info in headers
  legacyHeaders: false,          // Disable X-RateLimit-* headers
  message: {
    success: false,
    error: { code: 'RATE_LIMIT', message: 'Too many requests. Please try again later.' },
  },
});
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `adminLimiter` returns correct headers and 429 on excess | Supertest: send 61+ requests to any admin route, assert 429 response and `RateLimit-*` headers |
| Integration | Rate limiting doesn't block normal admin operations | Existing integration tests (rbac, categories, products-admin) must pass unchanged with `NODE_ENV=test` |
| E2E | Rate limit headers present in Swagger UI responses | Manual: verify `/api-docs` shows admin endpoints with `429` response codes |

**Validation approach**: Run existing test suite (`pnpm test:unit` + `pnpm test:integration:rbac`) — if green, rate limiter test bypass works. Manual curl test for 429 behavior.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. This change adds HTTP-level rate limiting middleware to existing Express routes.

## Migration / Rollout

No migration required. Rate limiting is additive — existing behavior is preserved:
- Routes without limiters now get 60 req/min (harder to hit in normal use)
- Routes with existing identical limiters (admin-property, admin-tour) get the same behavior via shared module
- `NODE_ENV=test` bypass ensures CI is unaffected

## Open Questions

- [ ] None — all decisions have clear rationale from existing codebase patterns
