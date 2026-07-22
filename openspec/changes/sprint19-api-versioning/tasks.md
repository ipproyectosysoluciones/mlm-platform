# Tasks: API Versioning (Sprint 19)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 300–380 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Backend core: dual-mount, redirect, Swagger, rate limiters | PR 1 | `pnpm --filter backend test` | supertest via existing test infra | `backend/src/app.ts`, `backend/src/config/swagger.ts` |
| 2 | Test URL migration across 23 test files | PR 2 | `pnpm --filter backend test` | existing Jest test suite | all `__tests__/**/*.ts` files |
| 3 | Consumer updates: frontend, bot, vercel, nginx | PR 3 | manual smoke: frontend login + bot health | SPA + bot container | `frontend/`, `bot/` configs |

## Phase 1: Backend Core — Dual-Mount & Redirect (PR 1)

- [x] 1.1 **Add legacy 307 redirect middleware** in `backend/src/app.ts` — insert BEFORE all rate limiters and route mounts. Skips `/api/v1` paths and non-GET non-webhook requests. For webhooks specifically: redirect POST from `/api/payment/paypal/webhook` → `/api/v1/payment/paypal/webhook` and `/api/payment/mercadopago/webhook` → `/api/v1/payment/mercadopago/webhook`. For GET: redirect any `/api/{path}` → `/api/v1/{path}`. Use `req.originalUrl` for target construction. **~20 lines added.** Risk: Must NOT redirect `/api/v1/*`, `/api/health` (health check), or non-HTTP-webhook paths.
- [x] 1.2 **Add `/api/v1` rate limiter mounts** in `backend/src/app.ts` — duplicate every existing `/api/*` rate limiter to `/api/v1/*`. Lines 132, 172-174, 198-200: add `app.use('/api/v1', globalLimiter)`, `app.use('/api/v1/auth/login', authLimiter)`, etc. **~12 lines added.** Risk: Skip `isTest` guard must apply to v1 mounts too.
- [x] 1.3 **Mount canonical `/api/v1` routes** in `backend/src/app.ts` — add `app.use('/api/v1', routes)`, `app.use('/api/v1/admin', adminRoutes)`, `app.use('/api/v1/crm', crmRoutes)`, `app.use('/api/v1', landingRoutes)`, `app.use('/api/v1/payment', paymentRoutes)`. Place BEFORE existing `/api` legacy mounts. **~5 lines added.** Risk: v1 mount must come before legacy for priority.
- [x] 1.4 **Move Swagger UI to `/api/v1/docs`** in `backend/src/app.ts` — change line 205 from `app.use('/api-docs', ...)` to `app.use('/api/v1/docs', ...)`. Add `app.get('/api-docs', (req, res) => res.redirect(307, '/api/v1/docs'))` for backward compat. **~3 lines changed, 1 added.**
- [x] 1.5 **Update health endpoint skip** in `backend/src/app.ts` — line 127: change `req.path === '/api/health'` to also include `/api/v1/health`. **~1 line changed.**
- [x] 1.6 **Update swagger server URLs** in `backend/src/config/swagger.ts` — lines 69, 73, 77: append `/v1` to all three server URLs (`/api` → `/api/v1`). **~3 lines changed.** Risk: Verify swagger-jsdoc path concatenation works correctly with relative paths in route files (e.g. `/auth/register` + server `/api/v1` → `/api/v1/auth/register`).

**PR 1 total estimate: ~45 lines changed/added. ~290-line budget remaining.**

## Phase 2: Test URL Migration (PR 2)

- [ ] 2.1 **Update integration test URLs** — mechanical find-replace `'/api/` → `'/api/v1/` in all 18 integration test files under `backend/src/__tests__/integration/`. Files: `routes.smoke.test.ts`, `auth.test.ts`, `rbac.test.ts`, `wallet.test.ts`, `tree.test.ts`, `commissions.test.ts`, `carts.integration.test.ts`, `gift-cards.integration.test.ts`, `crm.test.ts`, `contracts.integration.test.ts`, `products-orders.test.ts`, `products-admin.integration.test.ts`, `categories.integration.test.ts`, `push.test.ts`, `two-factor.test.ts`, `validation.test.ts`, `email-campaigns.integration.test.ts`, `landing-public.test.ts`. **~200 lines changed (mechanical).** Risk: Verify no false positives — exclude mock/stub strings if any contain `/api/` as data.
- [ ] 2.2 **Update unit test URLs** — same find-replace in `backend/src/__tests__/unit/Middleware.test.ts` (only unit test with `/api/` route references). **~10 lines changed.**
- [ ] 2.3 **Add new versioning test cases** — add to `routes.smoke.test.ts`: test that `GET /api/v1/admin/reservations` returns non-404, test that `GET /api/admin/reservations` also returns non-404 (dual-mount), test that `GET /api/v1/health` returns 200. **~15 lines added.**
- [ ] 2.4 **Verify CI gate passes** — run `pnpm --filter backend test` and `tsc --noEmit` from repo root. Both must exit 0. Risk: jest may have hardcoded paths in setup.ts or fixtures.ts.

**PR 2 total estimate: ~225 lines changed.**

## Phase 3: Consumer Updates (PR 3)

- [ ] 3.1 **Update frontend API baseURL** in `frontend/src/services/api/client.ts` — line 11: change `'/api'` → `'/api/v1'`. **1 line changed.**
- [ ] 3.2 **Verify Vite dev proxy** — `frontend/vite.config.ts` line 264: proxy key `/api` already matches `/api/v1/*`. No change needed. Document as no-op. **0 lines.**
- [ ] 3.3 **Verify vercel.json rewrites** — line 9: `"/api/(.*)"` already forwards correctly for dual-mount. No change needed. **0 lines.**
- [ ] 3.4 **Verify nginx.conf** — line 63: `location /api/` already proxies to backend. No change needed for dual-mount. **0 lines.**
- [ ] 3.5 **Update bot API baseURL** in `bot/src/services/mlm-api.service.ts` — line 13: change `'http://backend:3000/api'` → `'http://backend:3000/api/v1'`. Also update JSDoc comment on line 3. **~2 lines changed.** Risk: `MLM_BACKEND_URL` env var override still works — users with custom env must update.

**PR 3 total estimate: ~3 lines changed.**

## Phase 4: Post-Implementation (PR 3 or separate)

- [ ] 4.1 **Re-sync Postman collection** — export new collection with `/api/v1/*` paths. Manual step: run collection in Postman, verify all 255 endpoints respond.
- [ ] 4.2 **Update CHANGELOG.md** — add Sprint 19 entry documenting API versioning, dual-mount deprecation window, Swagger relocation.

## Open Questions (from design.md)

- [ ] **Webhook 307 redirect scope**: Current redirect middleware only handles GET. POST/PUT webhooks (PayPal, MercadoPago) are served by dual-mount without redirect. Should we add explicit POST redirects for webhook paths? (Deferred to user decision — current behavior is correct for Sprint 19.)

## Notes

- **JSDoc paths NOT updated**: Route files use relative paths (`/auth/register:`) which are concatenated with the server URL by swagger-jsdoc. Changing the server URL from `/api` to `/api/v1` correctly generates `/api/v1/auth/register` in the spec. The 238 `@swagger` blocks across 42 route files do NOT need path changes.
- **`/q/:shortCode` untouched**: Stays at root level, no versioning applied.
- **Deprecation window**: 90 days from Phase 1 deploy. Legacy mount removal is Sprint 23.
