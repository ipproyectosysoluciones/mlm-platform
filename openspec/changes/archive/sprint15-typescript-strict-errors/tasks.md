# Tasks: TypeScript Strict Error Elimination (Sprint 15)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1500–1800 total (across 8 PRs) |
| 400-line budget risk | Low (per PR, with chain) |
| Chained PRs recommended | Yes |
| Suggested split | PR1 → PR2 → PR3 → PR4 → PR5 → PR6 → PR7 → PR8 |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Codemod .js extensions | PR 1 | `tsc --noEmit 2>&1 \| grep -c TS2835` | `pnpm test` | scripts/codemod-extensions.mjs + all import lines (revert script, imports revert with it) |
| 2 | Fix broken import paths | PR 2 | `tsc --noEmit 2>&1 \| grep TS2307 \| wc -l` | `pnpm test` | ~30 import path fixes (independent file-level) |
| 3 | Explicit any annotations | PR 3 | `tsc --noEmit 2>&1 \| grep TS7006 \| wc -l` | `pnpm test` | ~25 type annotation files (no runtime change) |
| 4 | PaymentPayPalController types | PR 4 | `tsc --noEmit 2>&1 \| grep -c "PaymentPayPalController\|PaymentMercadoPagoController"` | `pnpm test` | 2 controller files + asyncHandler (revert 3 files) |
| 5 | req.user type widening | PR 5 | `tsc --noEmit 2>&1 \| grep TS2698` | `pnpm test` | 2 controller files + response.util (revert 3 files) |
| 6 | Infrastructure types | PR 6 | `tsc --noEmit 2>&1 \| grep -c "error TS"` | `pnpm test` | ~9 files (redis, services, types, middleware) |
| 7 | CI tsc gate | PR 7 | `cat .github/workflows/typecheck.yml` | Push to branch, verify CI runs | .github/workflows/typecheck.yml only |
| 8 | Docs update | PR 8 | `cat PROJECT_STATE.md ROADMAP.md` | N/A | 2 markdown files only |

## Phase 1: Codemod — Import Extensions (649 errors)

- [ ] 1.1 Create `scripts/codemod-extensions.mjs` — Node.js script that scans `backend/src/**/*.ts`, regex-matches `from '(\.\.[^']+|\.\/[^']+)'` without `.js`/`.json` extension, appends `.js`. Handle both single/double quotes and `import()` dynamic imports. Skip `*.d.ts`, `node_modules`, `dist`.
- [ ] 1.2 Run codemod: `node scripts/codemod-extensions.mjs` — verify output shows file count and change count.
- [ ] 1.3 Verify: `cd backend && npx tsc --noEmit 2>&1 | grep -c TS2835` — expect 0.
- [ ] 1.4 Verify: `cd backend && pnpm test` — all 887+ tests pass, no runtime breakage.
- [ ] 1.5 Commit: `chore: add .js extensions to relative imports via codemod`

**PR 1 — base: feature/sprint15-ts-strict**

## Phase 2: Broken Import Paths (166 errors)

- [ ] 2.1 Audit TS2307 errors: `cd backend && npx tsc --noEmit 2>&1 | grep TS2307` — categorize into (a) missing .js after codemod, (b) dead imports, (c) missing modules.
- [ ] 2.2 Fix `error.middleware` import paths across all controllers/services that reference it — verify each resolved file exists.
- [ ] 2.3 Remove dead imports (unused `import` statements causing TS2307) — grep each unused import, confirm no references.
- [ ] 2.4 Create missing barrel exports in `backend/src/routes/` if any route file is unreferenced (admin.routes, crm.routes, etc.).
- [ ] 2.5 Verify: `cd backend && npx tsc --noEmit 2>&1 | grep TS2307 | wc -l` — expect 0.
- [ ] 2.6 Verify: `cd backend && pnpm test` — all tests pass.
- [ ] 2.7 Commit: `fix: resolve broken import paths and remove dead imports`

**PR 2 — base: PR 1 branch**

## Phase 3: Explicit Type Annotations (91 errors)

- [x] 3.1 Type TreeService callbacks (lines ~363, ~433): add explicit parameter types to `.reduce()`, `.filter()`, `.map()` callbacks — e.g., `(item: any) => ...`.
- [x] 3.2 Type VendorService callbacks (lines ~14-15, ~220, ~234, ~276): same pattern, add explicit types to iterator params.
- [x] 3.3 Fix catch blocks: change `catch(error)` → `catch(error: unknown)` across all affected files with type narrowing where accessed.
- [x] 3.4 Type remaining implicit-any parameters in ~25 affected files — prioritize service-layer files.
- [x] 3.5 Verify: `cd backend && npx tsc --noEmit 2>&1 | grep TS7006 | wc -l` — expect 0.
- [x] 3.6 Verify: `cd backend && pnpm test` — all tests pass (annotations are compile-time only).
- [x] 3.7 Commit: `fix: add explicit type annotations to eliminate implicit any`

**PR 3 — base: PR 2 branch**

## Phase 4: Payment Controller Types (36 errors — D1)

- [ ] 4.1 RED: Write `tsc --noEmit` check for PaymentPayPalController — confirm 29 errors exist before fix.
- [ ] 4.2 Widen `asyncHandler` return type in `backend/src/middleware/asyncHandler.ts`: change `Promise<void>` → `Promise<Response | void>` in `AsyncRequestHandler` type.
- [ ] 4.3 Fix PaymentPayPalController: import `Request` from express, cast `req.body` as parsed webhook event type, add null guards for webhook event properties, fix `req.headers.get()` typing, type `req.params`.
- [ ] 4.4 Fix PaymentMercadoPagoController: fix nullable `string | undefined` → `string` with defaults, align return types.
- [ ] 4.5 GREEN: `tsc --noEmit 2>&1 | grep -c "PaymentPayPalController\|PaymentMercadoPagoController"` — expect 0.
- [ ] 4.6 Verify: `cd backend && pnpm test` — payment-related tests pass.
- [ ] 4.7 Commit: `fix: type payment controllers (PayPal + MercadoPago)`

**PR 4 — base: PR 3 branch**

## Phase 5: req.user + Response Types (11 errors — D2)

- [ ] 5.1 Fix ShippingAddressController: import `AuthenticatedRequest` from `auth.middleware`, replace `Request` with `AuthenticatedRequest` in handler signatures (~6 errors).
- [ ] 5.2 Fix ShipmentTrackingController: same pattern as ShippingAddress (~4 errors).
- [ ] 5.3 Fix `response.util.ts` line 42: use conditional spread with `Record<string, unknown>` type assertion for `details` field (1 error).
- [ ] 5.4 Verify: `cd backend && npx tsc --noEmit 2>&1 | grep -c TS2698` — expect 0.
- [ ] 5.5 Verify: `cd backend && pnpm test` — all tests pass.
- [ ] 5.6 Commit: `fix: type req.user access with AuthenticatedRequest imports`

**PR 5 — base: PR 4 branch**

## Phase 6: Infrastructure Types (26 errors — D3)

- [ ] 6.1 Fix `redis.ts`: change `import Redis from 'ioredis'` → `import { Redis } from 'ioredis'`. Verify compilation. If CJS interop breaks, fallback to `@ts-expect-error` with TODO comment.
- [x] 6.2 Fix `ProductService.ts`: import `Product` model aliased as `ProductModel` (or rename refs). Fix unique symbol index at line ~142 with `as string` cast.
- [ ] 6.3 Fix `WalletService.ts` lines ~294, ~297: cast `Op.gte`/`Op.lte` keys with `(where.created_at as Record<string, unknown>)[Op.gte as string]`.
- [ ] 6.4 Fix `CurrencyService.ts` lines ~52, ~58: type API response `data` as `{ rates: Record<string, number> }`.
- [x] 6.5 Move `ProductListOptions` interface from `ProductService.ts` to `backend/src/types/index.ts`. Update import in ProductService.
- [ ] 6.6 Fix `featureGuard.ts` line ~31: wrap symbol in `String()`.
- [ ] 6.7 Fix `N8nWebhookController.ts` line ~113: type catch block `catch (error: unknown)` with narrowing.
- [ ] 6.8 Fix `CommissionConfigReadController.ts` line ~121: type `unknown` → `number` with assertion.
- [ ] 6.9 Fix `__tests__/setup.ts`: null guard for `sequelizeInstance` (~line 104), fix supertest type (~line 149).
- [ ] 6.10 Verify: `cd backend && npx tsc --noEmit 2>&1 | grep -c "error TS"` — expect 0.
- [ ] 6.11 Verify: `cd backend && pnpm test` — all tests pass.
- [ ] 6.12 Commit: `fix: resolve infrastructure type errors (ioredis, services, types)`

**PR 6 — base: PR 5 branch**

## Phase 7: CI Typecheck Gate

- [ ] 7.1 Create `.github/workflows/typecheck.yml` with `tsc --noEmit` step — runs on PR to `development` and `main`, after `pnpm install`.
- [ ] 7.2 Verify workflow syntax: `act --list` or manual review of YAML structure.
- [ ] 7.3 Commit: `ci: add tsc --noEmit blocking gate`

**PR 7 — base: PR 6 branch**

## Phase 8: Documentation Update

- [ ] 8.1 Update `PROJECT_STATE.md`: reflect 0 tsc errors, CI gate enabled.
- [ ] 8.2 Update `ROADMAP.md`: mark Sprint 15 TypeScript strict mode as complete.
- [ ] 8.3 Commit: `docs: update project state and roadmap for Sprint 15 completion`

**PR 8 — base: PR 7 branch**
