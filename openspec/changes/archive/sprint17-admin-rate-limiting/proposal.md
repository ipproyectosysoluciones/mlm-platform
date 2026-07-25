# Proposal: Sprint 17 — Admin Rate Limiting & Swagger Gaps

## Intent

CodeQL flagged 48 admin endpoints across 7 route files with no dedicated rate limiting — only protected by global 200/min limiter. Admin routes perform write operations and authorization checks, requiring stricter limits. Additionally, ~15 endpoints across 9 files lack Swagger annotations, creating API documentation gaps.

## Scope

### In Scope
- Create shared `adminLimiter` middleware (60 req/min) for all admin routes
- Apply `adminLimiter` to 7 route files: admin.routes.ts, admin-product.routes.ts, admin-category.routes.ts, admin-contract.routes.ts, admin-reservation.routes.ts, admin-vendor.routes.ts, commission-config.routes.ts
- Review admin-property.routes.ts and admin-tour.routes.ts existing limiters for consolidation
- Add missing Swagger annotations to 15 endpoints across 9 files

### Out of Scope
- Postman Collection Sync (98 endpoints behind)
- API Versioning (/api/v1/ prefix)
- CI/CD Enhancement (dev auto-deploy)

## Capabilities

### New Capabilities
- `admin-rate-limiting`: Shared middleware for admin route rate limiting with 60 req/min threshold

### Modified Capabilities
- `backend-api-documentation`: Complete Swagger coverage for all endpoints

## Approach

**PR 1 — Rate Limiting:**
1. Create shared `adminLimiter` middleware in `backend/src/middleware/rateLimit.ts`
2. Apply to 7 admin route files via `router.use(adminLimiter)`
3. Review existing limiters in admin-property.routes.ts and admin-tour.routes.ts for consolidation
4. Maintain test bypass: `process.env.NODE_ENV === 'test' ? 1000 : 60`

**PR 2 — Swagger Gaps:**
1. Add missing `@swagger` annotations to endpoints in:
   - admin-contract.routes.ts (2 endpoints)
   - wallet.routes.ts (1 endpoint)
   - admin-property.routes.ts (2 image endpoints)
   - admin-tour.routes.ts (2 image endpoints)
   - landing-public.routes.ts (1 debug endpoint)
   - product.routes.ts, order.routes.ts, admin-product.routes.ts (verify coverage)

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/middleware/rateLimit.ts` | New | Shared admin rate limiter |
| `backend/src/routes/admin*.routes.ts` | Modified | Apply shared limiter |
| `backend/src/routes/commission-config.routes.ts` | Modified | Apply shared limiter |
| `backend/src/routes/*.routes.ts` | Modified | Add missing Swagger annotations |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking admin API for legitimate high-volume users | Low | 60 req/min is generous for admin operations; test bypass available |
| Consolidating limiters changes behavior for property/tour admins | Low | Review existing rate limits before consolidation |

## Rollback Plan

1. Remove `adminLimiter` middleware from route files
2. Delete shared `adminLimiter` from rateLimit.ts
3. Revert Swagger annotation additions
4. Existing global limiter (200/min) remains as fallback

## Dependencies

- None

## Success Criteria

- [ ] All 48 admin endpoints protected by dedicated 60 req/min limiter
- [ ] CodeQL high-severity flag resolved
- [ ] All 15 missing Swagger annotations added
- [ ] No breaking changes to existing admin API behavior
- [ ] Test suite passes with rate limit bypass