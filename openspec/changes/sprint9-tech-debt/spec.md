# Sprint 9 Tech Debt — Delta Specifications

**Change**: `sprint9-tech-debt`  
**Type**: Pure refactor / infrastructure (no new features, no API shape changes, no DB schema changes)  
**Date**: 2026-04-11

---

## Phase 1: Quick Wins & Security

### SPEC-1.1: Orphaned Routes Mounted

**Requirement**: The system MUST mount all 6 orphaned route files in `backend/src/routes/index.ts` so their endpoints are reachable via HTTP.

Files to mount:
| Route file | Mount path |
|---|---|
| `admin-reservation.routes.ts` | `/admin/reservations` |
| `admin-tour.routes.ts` | `/admin/tours` |
| `admin-property.routes.ts` | `/admin/properties` |
| `property.routes.ts` | `/properties` |
| `tour.routes.ts` | `/tours` |
| `bot-leads.routes.ts` | `/bot-leads` |

#### Scenario: Orphaned route is reachable after mount

- GIVEN the server has started with all 6 routes imported and mounted in `routes/index.ts`
- WHEN an HTTP GET request is sent to `/api/admin/reservations`
- THEN the response is NOT 404
- AND the same applies for all other 5 newly mounted paths

#### Scenario: Route mount does not affect other routes

- GIVEN the 6 routes have been added to `routes/index.ts`
- WHEN the existing 528 backend tests run
- THEN all tests pass without regression

---

### SPEC-1.2: commission-config Moved to routes/index.ts

**Requirement**: `commissionConfigRoutes` MUST be imported and mounted in `routes/index.ts`, and its direct `app.use` call in `app.ts` (line 212) MUST be removed.

#### Scenario: commission-config reachable via unified router

- GIVEN `commissionConfigRoutes` is mounted at `/admin/commissions` inside `routes/index.ts`
- AND the `app.use('/api/admin/commissions', commissionConfigRoutes)` line is removed from `app.ts`
- WHEN an HTTP request is sent to `/api/admin/commissions`
- THEN the response is NOT 404

#### Scenario: No duplicate mounting

- GIVEN `app.ts` no longer imports `commission-config.routes`
- WHEN the codebase is inspected
- THEN `commissionConfigRoutes` appears in ONLY one file (`routes/index.ts`)

---

### SPEC-1.3: JWT Secret Throws at Startup if Missing

**Requirement**: `config.jwt.secret` MUST throw an error at startup if `JWT_SECRET` env var is absent or empty. `TWO_FACTOR_SECRET_KEY` MUST throw if absent or empty. Neither MAY have a fallback default value.

**Current state**: `JWT_SECRET` defaults to `'default-secret-change-in-production'` (line 69, `env.ts`).

#### Scenario: Missing JWT_SECRET causes startup failure

- GIVEN `JWT_SECRET` is not set in the environment
- WHEN the application starts (config module is imported)
- THEN an error is thrown with a message identifying `JWT_SECRET` as missing
- AND the process exits before serving any requests

#### Scenario: Missing TWO_FACTOR_SECRET_KEY causes startup failure

- GIVEN `TWO_FACTOR_SECRET_KEY` is not set in the environment
- WHEN the application starts
- THEN an error is thrown with a message identifying `TWO_FACTOR_SECRET_KEY` as missing

#### Scenario: Valid secrets allow normal startup

- GIVEN both `JWT_SECRET` and `TWO_FACTOR_SECRET_KEY` are set to non-empty strings
- WHEN the application starts
- THEN no error is thrown and the server starts normally

#### Scenario: No default secret fallback exists in code

- GIVEN the `backend/src/config/env.ts` file is inspected
- WHEN the source is searched for `'default-secret'`
- THEN zero matches are found

---

## Phase 2: Operational Stability

### SPEC-2.1: Zero console Statements in backend/src/

**Requirement**: The `backend/src/` directory MUST contain zero `console.log`, `console.warn`, or `console.error` calls. All logging MUST use the pino logger already configured in `app.ts`.

#### Scenario: No console calls in production code

- GIVEN all `console.*` calls have been replaced with `logger.*`
- WHEN the command `grep -r "console\." backend/src/` is run
- THEN zero matches are returned

#### Scenario: Pino logger used for same-level equivalents

- GIVEN a file that previously used `console.error`
- WHEN the file is inspected
- THEN it uses `logger.error` from the pino instance
- AND the log level and message are preserved

#### Scenario: Existing test suite unaffected

- GIVEN all console statements replaced with logger calls
- WHEN the full backend test suite runs
- THEN all 528+ tests pass

---

### SPEC-2.2: PLATFORM_DOMAIN Replaces Hardcoded Domain

**Requirement**: All hardcoded `nexoreal.xyz` references in `backend/src/` MUST be replaced with `config.platform.domain` (or equivalent env-backed config). A `PLATFORM_DOMAIN` env var MUST be introduced in `config/env.ts`.

**Current hardcoded locations** (from audit): `env.ts` (3 places), `AuthController.ts` (1), `InvoicePdfController.ts` (1), `swagger.ts` (1).

#### Scenario: PLATFORM_DOMAIN drives domain references

- GIVEN `PLATFORM_DOMAIN=myplatform.com` is set in environment
- WHEN the application starts and domain is referenced (e.g., in email sender or Swagger)
- THEN the domain `myplatform.com` is used instead of `nexoreal.xyz`

#### Scenario: No hardcoded nexoreal.xyz in backend/src/

- GIVEN all replacements have been applied
- WHEN `grep -r "nexoreal.xyz" backend/src/` is run
- THEN zero matches are returned

#### Scenario: Missing PLATFORM_DOMAIN uses safe fallback

- GIVEN `PLATFORM_DOMAIN` is not set
- WHEN the config is loaded
- THEN a default value (e.g., `'localhost'`) is used without throwing
- AND a warning is logged at startup

---

## Phase 3: Bot Test Infrastructure

### SPEC-3.1: Jest Config Exists for Bot Package

**Requirement**: `bot/jest.config.cjs` MUST exist and configure Jest to handle TypeScript ESM source files via `ts-jest` or `babel-jest` with ESM support.

> **Critical constraint**: `bot/package.json` has `"type": "module"` — the bot is ESM TypeScript. Jest config MUST handle ESM interop. `jest.config.cjs` uses CJS format only for the config file itself (required by Jest when package.json has `"type": "module"`).

#### Scenario: Jest config file present and valid

- GIVEN `bot/jest.config.cjs` exists
- WHEN `node -e "require('./jest.config.cjs')"` is run from `bot/`
- THEN the file parses without errors and exports a valid Jest config object

#### Scenario: ts-jest or equivalent transformer configured

- GIVEN `bot/jest.config.cjs` is loaded
- WHEN the config is inspected
- THEN a transformer for `.ts` files is declared (e.g., `ts-jest` or `@swc/jest`)

---

### SPEC-3.2: pnpm test Works in Bot Directory

**Requirement**: `bot/package.json` MUST include a `"test"` script. Running `pnpm test` from `bot/` MUST execute Jest and exit with code 0 when all tests pass.

#### Scenario: test script defined in package.json

- GIVEN `bot/package.json` is read
- WHEN the `scripts` section is inspected
- THEN a `"test"` entry exists pointing to Jest

#### Scenario: pnpm test exits cleanly

- GIVEN Jest and all dependencies are installed and tests are present
- WHEN `pnpm test` is run from `bot/`
- THEN the command exits with code 0

---

### SPEC-3.3: Minimum 20 Bot Test Cases

**Requirement**: The bot test suite MUST contain at least 20 passing test cases covering the core flows: `welcome`, `balance`, `network`, `reservations`.

#### Scenario: Welcome flow tests exist

- GIVEN `bot/src/__tests__/flows/welcome.flow.test.ts` exists
- WHEN the test file is run
- THEN at least 5 test cases pass covering: trigger keyword detection, greeting message sent, language prompt shown

#### Scenario: Balance flow tests exist

- GIVEN `bot/src/__tests__/flows/balance.flow.test.ts` exists
- WHEN the test file is run
- THEN at least 5 test cases pass covering: authenticated user gets balance, unauthenticated user gets error

#### Scenario: Network flow tests exist

- GIVEN `bot/src/__tests__/flows/network.flow.test.ts` exists
- WHEN the test file is run
- THEN at least 5 test cases pass

#### Scenario: Reservations flow tests exist

- GIVEN `bot/src/__tests__/flows/reservations.flow.test.ts` exists
- WHEN the test file is run
- THEN at least 5 test cases pass

---

### SPEC-3.4: Bot Tests Use ESM with ts-jest or vitest

**Requirement**: Bot tests MUST be written in TypeScript using ESM-compatible imports (not `require()`), matching the bot's `"type": "module"` ESM convention.

> **Correction from proposal**: The proposal stated "CommonJS" for bot tests. The actual bot package is `"type": "module"` (ESM TypeScript). Tests MUST follow ESM conventions. `jest.config.cjs` filename is a Jest workaround for ESM packages, not a signal that code is CJS.

#### Scenario: Test files use ESM import syntax

- GIVEN any bot test file
- WHEN the file is inspected
- THEN it uses `import` / `export` syntax
- AND DOES NOT use `require()` or `module.exports`

#### Scenario: Vitest is an acceptable fallback

- GIVEN that `ts-jest` ESM integration proves unstable with BuilderBot
- WHEN vitest is used instead of Jest
- THEN `bot/vitest.config.ts` exists and `pnpm test` still passes

---

## Phase 4: Type Safety & Error Handling

### SPEC-4.1: Zero `any` Types in backend/src/

**Requirement**: `backend/src/` MUST contain zero `any` type declarations. All `catch (error: any)` MUST be replaced with `catch (error: unknown)` + type guards. All `as any` casts MUST be replaced with proper types or type-safe alternatives.

#### Scenario: No any declarations in source

- GIVEN all `any` types have been replaced
- WHEN `grep -r ": any\|as any\|<any>" backend/src/` is run
- THEN zero matches are returned (excluding comments and test files)

#### Scenario: Error handler pattern uses unknown

- GIVEN a catch block that previously used `catch (error: any)`
- WHEN the block is inspected
- THEN it uses `catch (error: unknown)` with `instanceof Error` or equivalent type guard

#### Scenario: TypeScript compilation succeeds

- GIVEN all `any` types replaced
- WHEN `tsc --noEmit` is run in `backend/`
- THEN the compiler exits with code 0

---

### SPEC-4.2: R2, QR, MercadoPago, Leaderboard Services Have Error Handling

**Requirement**: `R2Service`, `QRService`, `MercadoPagoService`, and `LeaderboardService` MUST wrap all async operations in `try/catch`. Errors MUST be typed (not `any`) and propagated or logged via pino.

#### Scenario: R2Service upload failure is caught

- GIVEN `R2Service.upload()` is called and the S3 operation throws
- WHEN the error occurs
- THEN the error is caught, logged via pino, and a typed error is propagated (not swallowed)

#### Scenario: MercadoPagoService payment failure is caught

- GIVEN `MercadoPagoService.createPreference()` throws a network error
- WHEN the error occurs
- THEN the error is caught and propagated as a typed service error

#### Scenario: All 4 services have at least one try/catch

- GIVEN the 4 service files are inspected
- WHEN each file's async methods are checked
- THEN every async method contains at least one `try/catch` block

---

### SPEC-4.3: PushSubscription Model Fixed, 4 Tests Unskipped

**Requirement**: The PushSubscription Sequelize model MUST be fixed so that the 4 skipped tests in `backend/src/__tests__/integration/push.test.ts` pass. All `.skip` markers on those 4 tests MUST be removed.

**Skipped tests** (lines 29, 130, 150, 187 in `push.test.ts`):
- Create subscription with valid data
- Create subscription with user agent
- Update existing subscription
- Unsubscribe endpoint

#### Scenario: No .skip on push tests

- GIVEN `push.test.ts` is inspected
- WHEN the file is searched for `.skip`
- THEN zero `.skip` markers are found on those 4 tests

#### Scenario: All 4 previously-skipped tests pass

- GIVEN the model is fixed
- WHEN `pnpm test -- push.test.ts` is run
- THEN all 4 tests pass with green status

---

## Phase 5: Test Coverage Expansion

### SPEC-5.1: 10 New Controller Test Files Created

**Requirement**: At least 10 new controller test files MUST be created in `backend/src/__tests__/unit/controllers/` targeting the highest-priority controllers.

**Priority controllers** (from audit, highest risk first):
1. `PaymentMercadoPagoController`
2. `PaymentPayPalController`
3. `TwoFactorController`
4. `BotController`
5. `GiftCardController`
6. `AdminUsersController`
7. `DashboardController`
8. `LeaderboardController`
9. `NotificationController`
10. `OrderController`

#### Scenario: 10 test files exist post-sprint

- GIVEN the sprint is complete
- WHEN `ls backend/src/__tests__/unit/controllers/` is run
- THEN at least 10 new test files are present (beyond pre-existing ones)

#### Scenario: Each test file has minimum coverage

- GIVEN each new controller test file
- WHEN the file is inspected
- THEN it contains at least 3 `it()` / `test()` cases

---

### SPEC-5.2: Non-Regression — All Existing Tests Still Pass

**Requirement**: After all Sprint 9 changes, the full backend test suite MUST pass. No previously-passing test MAY be broken by this sprint's refactoring.

#### Scenario: Full test suite passes after Sprint 9

- GIVEN all Sprint 9 changes are applied
- WHEN `pnpm test` is run in `backend/`
- THEN all tests pass
- AND zero tests that previously passed now fail

#### Scenario: E2E tests unaffected

- GIVEN Sprint 9 is route-mount and refactor only (no API contract changes)
- WHEN E2E tests are run
- THEN all E2E tests pass

---

### SPEC-5.3: Backend Test Count Increases to 600+

**Requirement**: The total number of passing backend tests MUST reach at least 600 after Sprint 9 (up from 528 baseline).

#### Scenario: Test count meets target

- GIVEN all new controller tests are written and passing
- WHEN `pnpm test -- --coverage` is run and the summary is inspected
- THEN the total passing test count is >= 600

---

## Non-Regression Constraints (All Phases)

These constraints apply globally across all spec items:

1. **No API contract changes**: No endpoint path, HTTP method, request body schema, or response shape changes.
2. **No DB schema changes**: No new migrations, no model field additions or removals.
3. **No new dependencies in backend**: Only pino (already present) and TypeScript type utilities.
4. **Bot new deps only**: Jest/vitest, ts-jest/@swc/jest, @types/jest (dev only).
5. **1236 total tests**: All 1236 existing tests across the monorepo MUST still pass post-sprint.
