# Tasks: Sprint 17 — Admin Rate Limiting & Swagger Gaps

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 100–140 |
| 400-line budget risk | Low |
| Chained PRs recommended | Yes (per design — 2 independent concerns) |
| Suggested split | PR 1 (rate limiting) → PR 2 (Swagger gaps) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Shared admin rate limiting across 9 admin routes | PR 1 | `pnpm test:unit && pnpm test:integration:rbac` | N/A — test bypass via NODE_ENV=test; manual curl for 429 | `backend/src/middleware/rateLimit.ts` + all route import changes revert cleanly |
| 2 | Swagger annotation gaps across 9 files | PR 2 | `tsc --noEmit` + visual Swagger UI check | N/A — docs-only, no runtime behavior | All JSDoc annotations are additive; single revert |

---

## Phase 1: PR #1 — Rate Limiting Foundation

- [ ] 1.1 Create `backend/src/middleware/rateLimit.ts` — export `adminLimiter` using `express-rate-limit` with windowMs=60000, max=60 (1000 in test), standardHeaders=true, legacyHeaders=false, message with `RATE_LIMIT` code (~20 lines)

## Phase 2: PR #1 — Apply Shared Limiter to Routes

- [ ] 2.1 Update `backend/src/routes/admin.routes.ts` — add `import { adminLimiter }` + `router.use(adminLimiter)` after auth middleware (~3 lines)
- [ ] 2.2 Update `backend/src/routes/admin-product.routes.ts` — add `import { adminLimiter }` + `router.use(adminLimiter)` before auth middleware (~3 lines)
- [ ] 2.3 Update `backend/src/routes/admin-category.routes.ts` — add `import { adminLimiter }` + `router.use(adminLimiter)` before auth middleware (~3 lines)
- [ ] 2.4 Update `backend/src/routes/admin-contract.routes.ts` — add `import { adminLimiter }` + `router.use(adminLimiter)` before route handlers (~3 lines)
- [ ] 2.5 Update `backend/src/routes/admin-reservation.routes.ts` — add `import { adminLimiter }` + `router.use(adminLimiter)` before route handlers (~3 lines)
- [ ] 2.6 Update `backend/src/routes/admin-vendor.routes.ts` — add `import { adminLimiter }` + `router.use(adminLimiter)` before route handlers (~3 lines)
- [ ] 2.7 Update `backend/src/routes/commission-config.routes.ts` — add `import { adminLimiter }` + `router.use(adminLimiter)` before route handlers (~3 lines)
- [ ] 2.8 Update `backend/src/routes/admin-property.routes.ts` — remove local `adminPropertyLimiter` import/definition/use, replace with shared `adminLimiter` (~6 lines changed)
- [ ] 2.9 Update `backend/src/routes/admin-tour.routes.ts` — remove local `adminTourLimiter` import/definition/use, replace with shared `adminLimiter` (~6 lines changed)

## Phase 3: PR #1 — Verification

- [ ] 3.1 Run `tsc --noEmit` — confirm no type errors
- [ ] 3.2 Run `pnpm test:unit` — confirm tests pass with NODE_ENV=test bypass
- [ ] 3.3 Run `pnpm test:integration:rbac` — confirm RBAC integration tests pass unchanged
- [ ] 3.4 Manual curl: send 61+ rapid requests to any admin endpoint — confirm 429 response with `RATE_LIMIT` code

## Phase 4: PR #2 — Swagger Annotation Gaps

- [ ] 4.1 Annotate 2 missing endpoints in `backend/src/routes/product.routes.ts` (~12 lines)
- [ ] 4.2 Annotate 2 missing endpoints in `backend/src/routes/order.routes.ts` (~12 lines)
- [ ] 4.3 Annotate 2 missing endpoints in `backend/src/routes/admin-contract.routes.ts` (~12 lines)
- [ ] 4.4 Annotate 2 missing endpoints in `backend/src/routes/wallet.routes.ts` (~12 lines)
- [ ] 4.5 Annotate 2 missing endpoints in `backend/src/routes/invoices.routes.ts` (~12 lines)
- [ ] 4.6 Annotate 1 missing endpoint in `backend/src/routes/admin-property.routes.ts` (~6 lines)
- [ ] 4.7 Annotate 2 missing endpoints in `backend/src/routes/admin-product.routes.ts` (~12 lines)
- [ ] 4.8 Annotate 1 missing endpoint in `backend/src/routes/admin-tour.routes.ts` (~6 lines)
- [ ] 4.9 Annotate 1 missing endpoint in `backend/src/routes/landing-public.routes.ts` (~6 lines)

## Phase 5: PR #2 — Verification

- [ ] 5.1 Run `tsc --noEmit` — confirm no type errors
- [ ] 5.2 Start dev server, open `/api-docs` — confirm all 15 previously missing endpoints now appear with proper summaries, tags, and response schemas
