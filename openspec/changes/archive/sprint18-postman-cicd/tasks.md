# Tasks: Sprint 18 — Postman Collection Sync & CI/CD Auto-Deploy

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 150–250 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | PR1 (Postman) → PR2 (CI/CD) → PR3 (Quick Wins) |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Regenerate Postman collection with test scripts | PR1 | `node scripts/generate-postman.sh` + `jq '.item[] \| .item[] \| .request.url.raw' postman/MLM-API.postman_collection.json \| wc -l` | Start backend, curl /api-docs/swagger.json, compare counts | Revert `postman/` directory only |
| 2 | Auto-deploy on development push with health check | PR2 | Push test commit to development, verify GH Actions run + health check | Real CI: push to development triggers cd-backend.yml | Revert `.github/workflows/cd-backend.yml` only |
| 3 | JSDoc fixes + CHANGELOG + CodeQL | PR3 | `grep -r '/api/v1/' backend/src/controllers/CartController.ts backend/src/controllers/EmailCampaignController.ts` returns 0 | N/A — documentation-only changes | Revert individual commits |

## Phase 1: Postman Collection Sync (PR #1)

- [ ] 1.1 Add `swagger-to-postman` as devDependency in root `package.json` (~2 lines)
- [ ] 1.2 Create `scripts/generate-postman.sh` — starts backend, curls `/api-docs/swagger.json`, runs swagger-to-postman, injects test scripts, saves to `postman/MLM-API.postman_collection.json` (~45 lines)
- [ ] 1.3 Run `scripts/generate-postman.sh` and verify collection has 224+ endpoints — compare with Swagger path count (manual step)
- [ ] 1.4 Inject `pm.test` status-code assertions into every endpoint in the regenerated collection (~300 lines of test scripts in JSON)
- [ ] 1.5 Add pre-request script on Login endpoint to store JWT token: `pm.collectionVariables.set('token', data.data.token)` (~5 lines)
- [ ] 1.6 Add `Authorization: Bearer {{token}}` header to all authenticated endpoints in collection (~50 lines in JSON)
- [ ] 1.7 Verify/update `postman/MLM-Development.postman_environment.json` — ensure `baseUrl`, `token`, `adminEmail`, `adminPassword` vars are present (~5 lines)
- [ ] 1.8 Run collection in Postman with dev environment — spot-check 5 endpoints (login, list products, get cart, create order, admin users)

## Phase 2: CI/CD Auto-Deploy (PR #2)

- [ ] 2.1 Add `development` branch to push triggers in `.github/workflows/cd-backend.yml` (~1 line change)
- [ ] 2.2 Add deploy job using `appleboy/ssh-action@v1.2.0` — SSH to prod, `docker pull`, `docker compose up -d backend` (~30 lines)
- [ ] 2.3 Add health check step — `curl -sf http://localhost:3000/api/health` with 3 retries at 30s intervals, fail job on non-200 (~20 lines)
- [ ] 2.4 Add rollback-on-failure: log previous image tag, fail with descriptive error if health check fails (~10 lines)
- [ ] 2.5 Document required secrets (`SSH_PRIVATE_KEY`, `PROD_HOST`, `PROD_USER`, `PROD_PATH`) as YAML comments in workflow file (~10 lines)
- [ ] 2.6 Verify existing `release` branch + `v*` tag flow is untouched — no regressions (manual review)

## Phase 3: Quick Wins (PR #3)

- [ ] 3.1 Fix JSDoc `@route` annotations in `backend/src/controllers/CartController.ts` — change `/api/v1/carts/` to `/api/carts/` in 7 methods (~7 lines changed)
- [ ] 3.2 Fix JSDoc `@example` in `backend/src/controllers/EmailCampaignController.ts` — change `/api/v1/email-templates` to `/api/email-templates` (~1 line changed)
- [ ] 3.3 Add `[3.3.0]` section to `CHANGELOG.md` — document Postman sync, CI/CD auto-deploy, JSDoc fixes, CodeQL re-scan (~25 lines)
- [ ] 3.4 Run CodeQL re-scan via GitHub Actions to confirm zero open alerts (manual trigger)

## Phase 4: Verification

- [ ] 4.1 Verify Postman collection covers 224+ endpoints (PR #1 acceptance)
- [ ] 4.2 Verify auto-deploy triggers on development push and health check passes (PR #2 acceptance)
- [ ] 4.3 Verify `grep -r '/api/v1/' backend/src/controllers/` returns 0 results (PR #3 acceptance)
- [ ] 4.4 Verify CHANGELOG.md has Sprint 18 section (PR #3 acceptance)
- [ ] 4.5 Verify zero CodeQL alerts (PR #3 acceptance)
