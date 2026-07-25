# Delta for Admin Rate Limiting

## ADDED Requirements

### Requirement: Shared Admin Rate Limiter

The system SHALL provide a shared `adminLimiter` middleware that rate-limits all admin API endpoints to 60 requests per minute per client IP. The limiter MUST be defined in a single reusable location and imported by each admin route file.

Configuration:
- `windowMs`: 60,000 (1 minute)
- `max`: 1,000 in test, 60 in production
- `standardHeaders`: true
- `legacyHeaders`: false
- `keyGenerator`: default (client IP via `req.ip`)
- `message`: `{ success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests. Please try again later.' } }`

#### Scenario: Admin endpoint enforces 60 req/min limit

- GIVEN an admin route file imports and applies the shared `adminLimiter`
- WHEN a single client IP sends 60 requests within 60 seconds
- THEN all 60 requests succeed with 200/201 responses

#### Scenario: Admin endpoint rejects excess requests

- GIVEN an admin route file applies the shared `adminLimiter`
- WHEN a single client IP sends 61 requests within 60 seconds
- THEN the 61st request returns HTTP 429 with `error.code: 'RATE_LIMIT'`

#### Scenario: Rate limit resets after window expires

- GIVEN a client IP has exhausted the 60 req/min window
- WHEN 60 seconds elapse and the client sends a new request
- THEN the request succeeds (window has reset)

#### Scenario: Test environment bypass

- GIVEN `NODE_ENV` is `test`
- WHEN any admin endpoint receives requests
- THEN the rate limit maximum is 1,000 requests per window (effectively disabled)

### Requirement: Admin Rate Limiter Application

The shared `adminLimiter` SHALL be applied via `router.use(adminLimiter)` in each of the following 7 route files that currently lack dedicated rate limiting:

| # | File | Current Limiter | Endpoints Affected |
|---|------|-----------------|--------------------|
| 1 | `admin.routes.ts` | None | 7 (stats, users, promote, role, reports) |
| 2 | `admin-product.routes.ts` | None | 11 (CRUD + inventory) |
| 3 | `admin-category.routes.ts` | None | 5 (CRUD) |
| 4 | `admin-contract.routes.ts` | None | 5 (CRUD + revoke) |
| 5 | `admin-reservation.routes.ts` | None | 6 (CRUD + cancel/confirm) |
| 6 | `admin-vendor.routes.ts` | None | 6 (list, approve, reject, suspend, commission) |
| 7 | `commission-config.routes.ts` | None | 6 (CRUD + rates) |

#### Scenario: Unprotected admin routes receive rate limiting

- GIVEN `admin.routes.ts` previously had no rate limiter
- WHEN the shared `adminLimiter` is applied via `router.use()`
- THEN all 7 endpoints under `/admin/stats`, `/admin/users`, etc. are rate-limited to 60 req/min

#### Scenario: All 7 files apply the same shared instance

- GIVEN the shared `adminLimiter` is imported from `backend/src/middleware/rateLimit.ts`
- WHEN each of the 7 route files imports and applies it
- THEN all files share the same 60 req/min threshold (not separate counters per file)

### Requirement: Existing Property and Tour Limiters Retained

The existing `adminPropertyLimiter` in `admin-property.routes.ts` and `adminTourLimiter` in `admin-tour.routes.ts` SHALL remain as-is. These files already enforce 60 req/min and will NOT be modified in this change.

#### Scenario: Property routes keep existing limiter

- GIVEN `admin-property.routes.ts` defines its own `adminPropertyLimiter` at 60 req/min
- WHEN this change is applied
- THEN `admin-property.routes.ts` continues using its local limiter (no shared import added)

#### Scenario: Tour routes keep existing limiter

- GIVEN `admin-tour.routes.ts` defines its own `adminTourLimiter` at 60 req/min
- WHEN this change is applied
- THEN `admin-tour.routes.ts` continues using its local limiter (no shared import added)

## REMOVED Requirements

None.

## RENAMED Requirements

None.
