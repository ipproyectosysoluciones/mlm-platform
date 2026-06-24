# Tasks: Sprint 9 Tech Debt

> **TDD Mode**: STRICT. Every task marked 🔴 writes a failing test first. 🟢 makes it pass.
> **Test runner**: `cd backend && pnpm test` (Jest) | `cd bot && pnpm test` (Vitest)
> **Total tasks**: 47 | **Total estimated hours**: ~28h

---

## Commit 1 — `fix(routes): mount 6 orphaned routes + relocate commission-config`

### Phase 1.1: Route Mounting (Est. 1.5h)

- [ ] 1.1 🔴 **RED** — Write supertest smoke tests for each of the 6 orphaned routes in `backend/src/__tests__/integration/routes.smoke.test.ts`. Assert each returns non-404 for a GET request with a valid auth token: `/api/admin/reservations`, `/api/admin/tours`, `/api/admin/properties`, `/api/properties`, `/api/tours`, `/api/bot/leads`.
- [ ] 1.2 🟢 **GREEN** — In `backend/src/routes/index.ts`, add 6 imports (lines 30–31, before `const router`):
  ```
  admin-reservation.routes → router.use('/admin/reservations', ...)
  admin-tour.routes        → router.use('/admin/tours', ...)
  admin-property.routes    → router.use('/admin/properties', ...)
  property.routes          → router.use('/properties', ...)
  tour.routes              → router.use('/tours', ...)
  bot-leads.routes         → router.use('/bot/leads', ...)
  ```
  Place admin mounts after existing `/admin/contracts` block (~line 69). Public routes after existing public block.
- [ ] 1.3 🟢 **GREEN** — Add `commissionConfigRoutes` import + `router.use('/admin/commissions', commissionConfigRoutes)` to `routes/index.ts`. Remove `import commissionConfigRoutes` (line 16) and `app.use('/api/admin/commissions', ...)` (line 212) from `backend/src/app.ts`.
- [ ] 1.4 ✅ **VERIFY** — Run `cd backend && pnpm test`. Confirm all 528+ tests pass. Confirm smoke tests for new routes pass. Confirm `grep "commissionConfigRoutes" backend/src/app.ts` returns 0 matches.

---

## Commit 2 — `fix(security): remove JWT/2FA default secrets, fail-fast on missing`

### Phase 2.1: Secret Fail-Fast + Test Bootstrap (Est. 1.5h)

- [ ] 2.1 🔴 **RED** — In `backend/src/__tests__/setup.ts` (line 1, before any import), add:
  ```ts
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-jest';
  process.env.TWO_FACTOR_SECRET_KEY = process.env.TWO_FACTOR_SECRET_KEY || 'test-2fa-key-for-jest';
  ```
  > **CRITICAL**: These lines MUST precede all `import` statements. Jest runs `setup.ts` via `setupFilesAfterFramework` — but `jest.config.cjs` doesn't have `setupFiles`. Add `setupFiles: ['<rootDir>/src/__tests__/env-setup.ts']` to `jest.config.cjs` and create `env-setup.ts` with only the two `process.env` assignments. Do NOT put them in `setup.ts` (which runs after imports).
- [ ] 2.2 🟢 **GREEN** — In `backend/src/config/env.ts`:
  - Remove `|| 'default-secret-change-in-production'` from `jwt.secret` (line 69) — use bare `process.env.JWT_SECRET as string`.
  - Remove `|| ''` fallback from `twoFactor.secretKey` (line 77) — use bare `process.env.TWO_FACTOR_SECRET_KEY as string`.
  - After `export const config`, append:
    ```ts
    if (!process.env.JWT_SECRET) {
      throw new Error('FATAL: JWT_SECRET env var is required.');
    }
    if (!process.env.TWO_FACTOR_SECRET_KEY) {
      throw new Error('FATAL: TWO_FACTOR_SECRET_KEY env var is required.');
    }
    ```
- [ ] 2.3 ✅ **VERIFY** — Run `cd backend && pnpm test`. Confirm: (a) `grep "default-secret" backend/src/config/env.ts` = 0 matches, (b) all tests pass.

---

## Commit 3 — `refactor(logging): replace console.* with pino logger across backend`

### Phase 3.1: Logger Singleton (Est. 0.5h)

- [ ] 3.1 🟢 **CREATE** `backend/src/utils/logger.ts` — extract pino config from `app.ts` (lines 35–38) into a singleton:
  ```ts
  import pino from 'pino';
  const isProduction = process.env.NODE_ENV === 'production';
  export const logger = pino({
    level: isProduction ? 'info' : 'debug',
    ...(isProduction ? {} : { transport: { target: 'pino-pretty' } }),
  });
  ```
  Update `backend/src/app.ts` to import `logger` from `'./utils/logger'` and remove the inline `pino({...})` instantiation.

### Phase 3.2: Console → Logger Migration (Est. 5h)

- [ ] 3.2 🟢 **MIGRATE** `app.ts` + `setup.ts` — replace all `console.*` calls with `logger.*` equivalents. For `setup.ts`, import `logger` from `'../utils/logger'`. Mapping: `console.log` → `logger.info`, `console.error` → `logger.error`, `console.warn` → `logger.warn`.
- [ ] 3.3 🟢 **MIGRATE** High-density controllers (est. 35+ console statements each group):
  - Group A: `backend/src/controllers/` — all `.ts` controller files (start with highest density: `AuthController.ts`, `InvoicePdfController.ts`). Add `import { logger } from '../utils/logger'` to each.
  - Group B: `backend/src/services/` — all `.ts` service files.
  - Group C: `backend/src/server.ts` — seed data console.log blocks (convert ALL per spec zero-tolerance).
  - Group D: `backend/src/config/`, `backend/src/middleware/`, `backend/src/utils/` (excluding `logger.ts` itself).
- [ ] 3.4 ✅ **VERIFY** — Run `grep -r "console\." backend/src/ --include="*.ts"` — must return 0 matches. Run `cd backend && pnpm test` — all tests pass.

---

## Commit 4 — `refactor(env): introduce PLATFORM_DOMAIN, remove hardcoded nexoreal.xyz`

### Phase 4.1: PLATFORM_DOMAIN Config (Est. 1h)

- [ ] 4.1 🟢 **ADD** `platform` section to `backend/src/config/env.ts`:
  ```ts
  platform: {
    domain: process.env.PLATFORM_DOMAIN || 'nexoreal.xyz',
  },
  ```
  Add startup warning if `PLATFORM_DOMAIN` not set: `logger.warn('PLATFORM_DOMAIN not set, using default nexoreal.xyz')`.

### Phase 4.2: Replace Hardcoded Domain References (Est. 1.5h)

- [ ] 4.2 🟢 **REPLACE** in `backend/src/config/env.ts`:
  - Line 121: `'noreply@nexoreal.xyz'` → `` `noreply@${config.platform.domain}` ``
  - Line 145: `'mailto:admin@nexoreal.xyz'` → `` `mailto:admin@${config.platform.domain}` ``
- [ ] 4.3 🟢 **REPLACE** in `backend/src/config/vapid.ts` (line 90): `'mailto:admin@nexoreal.xyz'` → `` `mailto:admin@${config.platform.domain}` `` (import `config` from `'./env'`).
- [ ] 4.4 🟢 **REPLACE** in `backend/src/config/swagger.ts` (line 63): `'support@nexoreal.xyz'` → `` `support@${config.platform.domain}` ``.
- [ ] 4.5 🟢 **REPLACE** in `backend/src/config/r2.ts` (line 38): `'https://media.nexoreal.xyz'` → `` `https://media.${config.platform.domain}` ``.
- [ ] 4.6 🟢 **REPLACE** in `backend/src/controllers/AuthController.ts` (line 116): `'https://nexoreal.xyz'` → `` `https://${config.platform.domain}` `` (or use `config.app.frontendUrl`).
- [ ] 4.7 🟢 **REPLACE** in `backend/src/controllers/invoices/InvoicePdfController.ts` (line 34): `'billing@nexoreal.xyz'` → `` `billing@${config.platform.domain}` ``.
- [ ] 4.8 ✅ **VERIFY** — `grep -r "nexoreal.xyz" backend/src/ --include="*.ts" | grep -v "__tests__\|seed\|comment"` = 0 actionable matches. All tests pass.

---

## Commit 5 — `refactor(types): eliminate any types in backend src`

### Phase 5.1: Type Elimination (Est. 6h)

- [ ] 5.1 🟢 **FIX** `backend/src/app.ts` (6 `any`) — replace Express handler `(req: any, res: any)` with `(req: Request, res: Response)`, import from `express`. Fix `as any` on line 219.
- [ ] 5.2 🟢 **FIX** high-density controllers/services (priority order per AD-6):
  - `CartService.ts` (8 any) — replace `catch (error: any)` → `catch (error: unknown)` + `instanceof Error` guard. Replace explicit `as any` casts with proper generics.
  - `ReservationController.ts` (6 any), `AdminVendorController.ts` (6 any) — same pattern.
  - `VendorController.ts` (5), `TourPackageController.ts` (5), `PropertyController.ts` (5), `MercadoPagoController.ts` (5), `NotificationController.ts` (5).
  - `UserService.ts` (5), `AchievementService.ts` (4), `CRMService.ts` (4).
  - `auth.middleware.ts` (3).
- [ ] 5.3 🟢 **FIX** `backend/src/__tests__/setup.ts` — replace `any` on lines 15 and 18 with proper types (`ReturnType<typeof supertest>` and `Sequelize`).
- [ ] 5.4 🟢 **FIX** Add try/catch to all async methods in these 4 services (SPEC-4.2):
  - `backend/src/services/R2Service.ts` — wrap S3 operations in try/catch, log via `logger.error`, rethrow typed error.
  - `backend/src/services/QRService.ts` — same pattern.
  - `backend/src/services/MercadoPagoService.ts` — wrap payment API calls.
  - `backend/src/services/LeaderboardService.ts` — wrap DB queries.
- [ ] 5.5 🟢 **FIX** `PushSubscription` model bug causing 4 `.skip` tests in `backend/src/__tests__/integration/push.test.ts` (lines 29, 130, 150, 187). Diagnose model mismatch, fix field definitions in model file. Remove `.skip` from all 4 tests.
- [ ] 5.6 ✅ **VERIFY** — `grep -r ": any\|as any\|<any>" backend/src/ --include="*.ts" | grep -v "__tests__\|.d.ts\|// eslint"` = 0 matches. `cd backend && npx tsc --noEmit` exits 0. `cd backend && pnpm test` — all 4 push tests now pass.

---

## Commit 6 — `feat(bot): add vitest infrastructure + initial test suite`

### Phase 6.1: Vitest Config + Package Setup (Est. 1h)

- [ ] 6.1 🟢 **CREATE** `bot/vitest.config.ts`:
  ```ts
  import { defineConfig } from 'vitest/config';
  export default defineConfig({
    test: { globals: true, environment: 'node', include: ['src/**/*.test.ts'] },
  });
  ```
- [ ] 6.2 🟢 **UPDATE** `bot/package.json` — add `"test": "vitest run"` to scripts. Add `"vitest": "^3.0.0"` to `devDependencies`. Run `pnpm install` from `bot/`.
- [ ] 6.3 🟢 **UPDATE** `bot/tsconfig.json` — add `"types": ["vitest/globals"]` to `compilerOptions`.

### Phase 6.2: Manual Mocks (Est. 1h)

- [ ] 6.4 🟢 **CREATE** `bot/src/__mocks__/openai.ts` — mock `OpenAI` default export with `chat.completions.create` as `vi.fn()`.
- [ ] 6.5 🟢 **CREATE** `bot/src/__mocks__/@builderbot/bot.ts` — mock `addKeyword`, `createFlow`, `EVENTS` constants.
- [ ] 6.6 🟢 **CREATE** `bot/src/__mocks__/@builderbot/provider-baileys.ts` — mock `BaileysProvider`.

### Phase 6.3: Service Tests (Est. 2.5h)

- [ ] 6.7 🔴 **RED** — Write `bot/src/services/ai.service.test.ts` (min 5 it()): mock OpenAI, test `buildSystemPrompt()`, test `getChatResponse()` with mock response, test session history management, test error handling when OpenAI throws.
- [ ] 6.8 🟢 **GREEN** — Make `ai.service.test.ts` pass (fix type issues, ensure mocks work).
- [ ] 6.9 🔴 **RED** — Write `bot/src/services/mlm-api.service.test.ts` (min 5 it()): mock axios, test `getUserBalance()`, `getNetworkInfo()`, `getReservations()`, error handling on 401/500.
- [ ] 6.10 🟢 **GREEN** — Make `mlm-api.service.test.ts` pass.

### Phase 6.4: Flow Tests (Est. 3h)

- [ ] 6.11 🔴 **RED** — Write `bot/src/flows/welcome.flow.test.ts` (min 5 it()): test keyword trigger detection, greeting message, language prompt display, valid/invalid keyword handling.
- [ ] 6.12 🟢 **GREEN** — Make `welcome.flow.test.ts` pass.
- [ ] 6.13 🔴 **RED** — Write `bot/src/flows/balance.flow.test.ts` (min 5 it()): authenticated user gets balance, unauthenticated gets error, API failure handled.
- [ ] 6.14 🟢 **GREEN** — Make `balance.flow.test.ts` pass.
- [ ] 6.15 🔴 **RED** — Write `bot/src/flows/network.flow.test.ts` (min 5 it()): network summary returned, hierarchy levels tested, edge case empty network.
- [ ] 6.16 🟢 **GREEN** — Make `network.flow.test.ts` pass.
- [ ] 6.17 🔴 **RED** — Write `bot/src/flows/reservations.flow.test.ts` (min 5 it()): reservation list returned, empty list handled, date formatting tested.
- [ ] 6.18 🟢 **GREEN** — Make `reservations.flow.test.ts` pass.
- [ ] 6.19 🟢 **ADD** `bot/src/config/keywords.test.ts` (min 3 it()): verify keyword arrays are non-empty, contain expected strings, no duplicates.
- [ ] 6.20 ✅ **VERIFY** — `cd bot && pnpm test` exits 0. Total test count ≥ 20. All test files use `import`/`export` (no `require()`).

---

## Commit 7 — `test(backend): add controller test files + unskip push tests`

### Phase 7.1: New Controller Test Files (Est. 5h)

> Each file lives in `backend/src/__tests__/unit/controllers/` unless an `integration/` equivalent is more appropriate. Min 3 `it()` per file.

- [ ] 7.1 🔴 **RED** → 🟢 **GREEN** — `PaymentMercadoPagoController.test.ts`: test createPreference success, createPreference failure (MP throws), webhook signature validation.
- [ ] 7.2 🔴 **RED** → 🟢 **GREEN** — `PaymentPayPalController.test.ts`: test createOrder success, capturePayment success, webhook event routing.
- [ ] 7.3 🔴 **RED** → 🟢 **GREEN** — `TwoFactorController.test.ts`: setup returns QR code, verify correct token, verify incorrect token returns 401.
- [ ] 7.4 🔴 **RED** → 🟢 **GREEN** — `BotController.test.ts`: lead registration success, duplicate lead returns 409, missing fields return 400.
- [ ] 7.5 🔴 **RED** → 🟢 **GREEN** — `GiftCardController.test.ts` (expand existing in `unit/`): test redeem valid code, redeem already-used code, generate new gift card.
- [ ] 7.6 🔴 **RED** → 🟢 **GREEN** — `AdminUsersController.test.ts`: list users (admin only), update user role, deactivate user.
- [ ] 7.7 🔴 **RED** → 🟢 **GREEN** — `DashboardController.test.ts`: returns revenue stats, returns user growth data, unauthorized request blocked.
- [ ] 7.8 🔴 **RED** → 🟢 **GREEN** — `LeaderboardController.test.ts`: returns top 10 entries, filters by period, handles empty leaderboard.
- [ ] 7.9 🔴 **RED** → 🟢 **GREEN** — `NotificationController.test.ts`: list notifications for user, mark as read, delete notification.
- [ ] 7.10 🔴 **RED** → 🟢 **GREEN** — `OrderController.test.ts`: list user orders, get single order by id, order not found returns 404.
- [ ] 7.11 ✅ **VERIFY** — `cd backend && pnpm test -- --verbose 2>&1 | tail -5`. Total passing tests ≥ 600 (was 528 baseline). Zero regressions.

---

## Final Verification Checklist

- [ ] F.1 `grep -r "console\." backend/src/ --include="*.ts"` = 0 matches
- [ ] F.2 `grep -r "nexoreal.xyz" backend/src/ --include="*.ts" | grep -v "__tests__"` = 0 actionable matches
- [ ] F.3 `grep -r ": any\|as any" backend/src/ --include="*.ts" | grep -v "__tests__\|eslint-disable"` = 0 matches
- [ ] F.4 `grep "default-secret" backend/src/config/env.ts` = 0 matches
- [ ] F.5 `cd backend && npx tsc --noEmit` exits 0
- [ ] F.6 `cd backend && pnpm test` — total passing ≥ 600, 0 failures
- [ ] F.7 `cd bot && pnpm test` — total passing ≥ 20, 0 failures
- [ ] F.8 `grep "commissionConfigRoutes" backend/src/app.ts` = 0 matches
