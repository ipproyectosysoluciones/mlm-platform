# Proposal: API Versioning (Sprint 19)

## Intent

255 endpoints under `/api/` with no version prefix. Breaking changes force synchronized deploys across all consumers. API versioning decouples release cadence from breaking changes.

## Scope

### In Scope
- Mount routes under `/api/v1` prefix via Express Router
- Dual-mount backward-compat: `/api` + `/api/v1` simultaneously
- Webhook 307 redirect during deprecation window (PayPal, MercadoPago)
- Swagger UI: `/api-docs` → `/api/v1/docs`; server URL update
- JSDoc `@path` in ~30 route files → `/api/v1/...`
- Test URLs in ~30 test files + integration script
- Frontend `baseURL`, Vercel proxy, Vite proxy (1 file each)
- Bot `MLM_BACKEND_URL` env var reference

### Out of Scope
- API structure redesign — routes stay as-is, just prefixed
- Auth/middleware logic changes
- Versioning `/q/:shortCode` — stays at root
- Response format versioning (HATEOAS, media types)

## Capabilities

### New Capabilities
- `api-versioning`: Version prefix, dual-mount lifecycle, deprecation redirects, Swagger relocation

### Modified Capabilities
- `backend`: JSDoc paths and Swagger server URL reference `/api/v1`

## Approach

`app.use('/api/v1', routes)` as canonical. Phase 1: dual-mount (`/api` legacy + `/api/v1`), legacy includes 307 redirects for webhooks. Phase 3: remove legacy mount after deprecation window.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/app.ts` | Modified | `/api/v1` + `/api` dual-mount, Swagger UI path, rate limiter paths |
| `backend/src/config/swagger.ts` | Modified | Server URL, docs path |
| `backend/src/routes/**/*.ts` | Modified | ~30 files: JSDoc `@path` |
| `backend/src/__tests__/**/*.ts` | Modified | ~30 files: test URLs |
| `frontend/src/lib/api.ts` | Modified | `baseURL` |
| `vercel.json` | Modified | Proxy rewrite |
| `frontend/vite.config.ts` | Modified | Dev proxy |
| `bot/.env` | Modified | `MLM_BACKEND_URL` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Payment webhook breakage for integrators | High | 307 redirect + deprecation window; document re-registration |
| Postman drift | Medium | Re-sync after implementation |
| Rate limiter paths miss prefix | Medium | Audit all middleware mounts |

## Rollback Plan

Remove `/api/v1` mount. Revert to single `/api`. Revert frontend baseURL, proxy configs, bot env var. Pure routing change — no data migration.

## Dependencies

- Sprint 18 (Postman sync) complete — 255-endpoint baseline

## Success Criteria

- [ ] `GET /api/v1/auth/me` returns 200 with valid token
- [ ] Dual-mount: `/api/auth/me` works via legacy mount
- [ ] Swagger UI loads at `/api/v1/docs`
- [ ] PayPal webhook `/api/v1/paypal/webhook` → 307 to `/api/paypal/webhook`
- [ ] Frontend SPA calls `/api/v1/*` successfully
- [ ] Bot health check `/api/v1/bot/health` returns 200
- [ ] All backend tests pass
