# Exploration: Backend Audit Pre-Phase 2

> SDD Explore Phase — Comprehensive backend audit of the MLM platform (Nexo Real)
> Date: 2026-07-17 | Branch: development | Version: v3.2.0 (Sprint 14)

## Current State

The backend is a Node.js/TypeScript Express 5 server with PostgreSQL + Redis, Sequelize 6, and 39 services handling real estate, tourism, and MLM commissions. The system has 47 Sequelize models, 30+ route groups, and CI/CD with 3-shard Jest. The last major audit (technical-debt.md) identified 67 items (~150+ hours). Since then, Sprint 9-14 completed with 15+ PRs merged, but many systemic issues remain.

---

## Findings

### F001 — CRITICAL: No Process Error Handlers

**File**: `backend/src/server.ts`

The server has no `process.on('unhandledRejection')` or `process.on('uncaughtException')` handlers. An unhandled promise rejection in any async route, service, or middleware will crash the Node.js process silently with no logging.

**Impact**: Silent production crashes, zero observability on process-level failures.

**Fix**: Add global error handlers to `server.ts` that log to Sentry + logger before calling `process.exit(1)`.

**Recommended Issue**: YES

---

### F002 — HIGH: SchedulerService is Dead Code

**File**: `backend/src/services/SchedulerService.ts`, `backend/src/server.ts`

`SchedulerService.start()` is never called in `server.ts` or anywhere else. The service implements abandoned cart recovery, email campaigns, email queue processing, daily payout calculation, and weekly digest — none of it runs.

**Impact**: 5 scheduled jobs completely inactive. Users receive no abandoned cart emails, no campaign emails, no weekly digest.

**Fix**: Wire `schedulerService.start()` into `server.ts` after DB sync, with graceful shutdown handling.

**Recommended Issue**: YES

---

### F003 — HIGH: In-Memory Rate Limiting (Memory Leak)

**File**: `backend/src/middleware/auth.middleware.ts`

`rateLimitStore` is a plain `Map` with no TTL eviction, no size limit, and no cleanup. In production, every unique IP grows the map indefinitely.

**Impact**: Unbounded memory growth → eventual OOM in production.

**Fix**: Replace with Redis-backed rate limiter (e.g., `rate-limiter-flexible` with Redis store) or add TTL eviction to the in-memory Map.

**Recommended Issue**: YES

---

### F004 — HIGH: N+1 Query in CommissionService.getCommissionStats()

**File**: `backend/src/services/CommissionService.ts`

Fetches ALL commissions into memory, then iterates to build stats. Should use SQL `SUM`, `COUNT`, `GROUP BY` aggregation instead.

**Impact**: O(n) DB rows fetched for every stats request. Scales linearly with commission count.

**Fix**: Replace with Sequelize `findAll({ attributes: [[fn('sum', col('amount')), 'total'], ...], group: [...] })`.

**Recommended Issue**: YES

---

### F005 — HIGH: N+1 in CommissionService.calculateCommissions()

**File**: `backend/src/services/CommissionService.ts`

`getCommissionRate()` is called inside a loop — each call is a separate DB query to `commission_configs`.

**Impact**: O(n) DB round-trips per order. 10 commissions = 10 queries for rates alone.

**Fix**: Batch-load all commission rates before the loop with a single query, then use in-memory lookup.

**Recommended Issue**: YES

---

### F006 — MEDIUM: Dockerfile Uses `--alter` Flag

**File**: `backend/Dockerfile`

The ENTRYPOINT runs `sequelize db:migrate --alter`. Sequelize's `alter` mode can DROP columns and MODIFY types, which is dangerous in production with real data.

**Impact**: Potential data loss on schema changes in production.

**Fix**: Remove `--alter` from ENTRYPOINT. Run migrations without alter, and handle destructive changes via explicit migration scripts.

**Recommended Issue**: YES

---

### F007 — MEDIUM: `mysql2` Dependency in PostgreSQL Project

**File**: `backend/package.json`

`mysql2` is listed as a dependency. The project is PostgreSQL-only.

**Impact**: Unnecessary ~10MB in Docker image, potential confusion for developers.

**Fix**: Remove `mysql2` from `package.json`.

**Recommended Issue**: YES

---

### F008 — MEDIUM: Debug Endpoints Accessible Without Auth

**File**: `backend/src/app.ts`

`/debug/routes` and `/debug/env` are accessible in non-production environments without any authentication. While gated behind `NODE_ENV !== 'production'`, any internal network request can reach them.

**Impact**: Route map and environment variables exposed to any service on the same network.

**Fix**: Add basic auth middleware to debug endpoints, or remove them entirely.

**Recommended Issue**: YES

---

### F009 — MEDIUM: Hardcoded Exchange Rates in WalletService

**File**: `backend/src/services/WalletService.ts`

Currency conversion uses hardcoded rates (e.g., 1 USD = X EUR). No external API integration for live rates.

**Impact**: Exchange rates drift from real market rates, financial discrepancies for multi-currency wallets.

**Fix**: Integrate with a free exchange rate API (e.g., exchangerate-api.com, frankfurter.app) with fallback to cached rates.

**Recommended Issue**: YES

---

### F010 — MEDIUM: Jest `detectOpenHandles: false`

**File**: `backend/jest.config.cjs`

Set to `false`, which masks open DB connections, Redis clients, or timers that aren't properly closed after tests.

**Impact**: Flaky tests in CI, false-positive green builds.

**Fix**: Set `detectOpenHandles: true` and fix any open handles discovered.

**Recommended Issue**: YES

---

### F011 — LOW: `--force-sync` Check Misaligned with Docker

**File**: `backend/src/server.ts`

Server.ts checks `process.argv.includes('--force-sync')` for Sequelize sync, but Docker ENTRYPOINT uses `--alter`. The two flags serve different purposes and may confuse operators.

**Impact**: Minor confusion. `--force-sync` does `alter: true` sync; Docker `--alter` runs migrations.

**Fix**: Document the distinction or unify the approach.

**Recommended Issue**: NO (documentation fix)

---

### F012 — INFO: refactoring-backend Change Not Yet Implemented

**File**: `openspec/changes/refactoring-backend/`

An SDD proposal exists with tasks ready, but no implementation PRs yet. Scope includes controller extraction, service layer cleanup, and middleware modularization.

**Impact**: Backend continues to accumulate structural debt.

**Recommended Issue**: NO (tracked in openspec)

---

### F013 — INFO: configurable-env-substitutes Completed

**File**: `openspec/changes/configurable-env-substitutes/`

All 3 PRs merged. Bot is now portable across tenants.

**Impact**: None — this is a completed success.

**Recommended Issue**: NO

---

## Test Coverage Gaps

### Services Without Unit Tests (20 of 39)

The following services have NO dedicated unit test file:

| Service | Risk Level | Notes |
|---------|-----------|-------|
| TreeService | HIGH | Binary tree traversal — complex logic |
| WalletService | HIGH | Financial operations, exchange rates |
| NotificationService | MEDIUM | User-facing notifications |
| ProductService | MEDIUM | Core product CRUD |
| PropertyService | MEDIUM | Core property CRUD |
| UserService | MEDIUM | User management, profiles |
| AuthService | MEDIUM | JWT, 2FA, password management |
| CRMService | MEDIUM | Customer relationship management |
| ReservationService | MEDIUM | Booking logic |
| AchievementService | LOW | Gamification features |
| CalendarService | LOW | Calendar integration |
| CartRecoveryEmailService | LOW | Depends on SchedulerService (dead) |
| CryptoPriceService | LOW | External API wrapper |
| CurrencyService | LOW | Currency conversion |
| EmailService | LOW | SMTP wrapper |
| LandingPageService | LOW | Marketing pages |
| LeaderboardService | LOW | Ranking logic |
| PushService | LOW | Push notifications |
| SMSService | LOW | SMS integration |
| TourPackageService | LOW | Tour package CRUD |

### Skipped Tests

Only **1 skipped test** found in the entire codebase:
- `CategoryService.test.ts` line 141: `it.skip('should throw AppError 400 if parent chain exceeds 5 levels')`

---

## Affected Areas Summary

| File/Path | Issue | Severity |
|-----------|-------|----------|
| `backend/src/server.ts` | No process error handlers, SchedulerService not started | CRITICAL + HIGH |
| `backend/src/middleware/auth.middleware.ts` | In-memory rate limit store (memory leak) | HIGH |
| `backend/src/services/CommissionService.ts` | N+1 queries (2 locations) | HIGH |
| `backend/Dockerfile` | `--alter` in production ENTRYPOINT | MEDIUM |
| `backend/package.json` | `mysql2` unnecessary dependency | MEDIUM |
| `backend/src/app.ts` | Debug endpoints without auth | MEDIUM |
| `backend/src/services/WalletService.ts` | Hardcoded exchange rates | MEDIUM |
| `backend/jest.config.cjs` | `detectOpenHandles: false` | MEDIUM |
| `backend/src/services/SchedulerService.ts` | Dead code (never started) | HIGH |
| 20 service files | Missing unit tests | MEDIUM |

---

## Approaches

### Approach 1: Targeted Fixes (Recommended)

Fix the 5 critical/high issues individually as separate PRs:
1. Process error handlers (server.ts) — 30 min
2. Wire SchedulerService.start() — 1 hour
3. Redis-backed rate limiter — 2 hours
4. CommissionService N+1 fixes (2 queries) — 3 hours
5. Dockerfile --alter removal — 15 min

**Pros**: Low risk, each fix is isolated and testable, quick wins.
**Cons**: Doesn't address structural debt (refactoring-backend change).
**Effort**: Low-Medium

### Approach 2: Full Refactor (refactoring-backend)

Implement the existing `refactoring-backend` openspec proposal first, then fix bugs within the clean architecture.

**Pros**: Clean foundation, prevents future debt.
**Cons**: Large scope (~150+ hours), high risk, delays critical bug fixes.
**Effort**: High

### Approach 3: Hybrid — Critical Fixes + Refactor Tracks

Fix critical/high issues immediately (Approach 1), then run refactoring-backend as a parallel track.

**Pros**: System stable now, clean later.
**Cons**: Two parallel tracks need coordination.
**Effort**: Medium

---

## Recommendation

**Approach 3: Hybrid** — Fix the 5 critical/high items first (they're all small, isolated changes), then proceed with the refactoring-backend proposal as a separate SDD change. The critical items take <1 day total and eliminate production risk. The refactoring can then happen on a stable base.

Priority order for immediate fixes:
1. F001 (process handlers) — CRITICAL, 30 min
2. F003 (rate limit leak) — HIGH, 2 hours
3. F002 (SchedulerService) — HIGH, 1 hour
4. F004+F005 (CommissionService N+1) — HIGH, 3 hours
5. F006 (Dockerfile --alter) — MEDIUM, 15 min

---

## Risks

- **SchedulerService (F002)**: Enabling it may expose latent bugs in email campaigns or payout logic that was never tested running live.
- **Rate limiter (F003)**: Redis dependency adds infrastructure complexity; needs Redis availability confirmed in Docker Compose.
- **CommissionService N+1 (F004/F005)**: SQL aggregation must match existing business logic exactly — commission rates have complex rules (MLM levels, bonuses, caps).

---

## Ready for Proposal

**Yes** — This exploration is complete. The orchestrator should:
1. Present these 5 critical/high findings to the user
2. Ask whether to proceed with targeted fixes (Approach 1/3) or full refactor (Approach 2)
3. If targeted fixes: launch `sdd-propose` for a change like `backend-critical-fixes`
4. If hybrid: launch `sdd-propose` for both `backend-critical-fixes` and `refactoring-backend`
