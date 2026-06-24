# Technical Debt Audit — Sprint 9 Exploration

**Status**: RESEARCH ONLY (No implementation yet)  
**Date**: April 11, 2026  
**Version**: v2.4.0 (Sprint 8 complete)  
**Investigation Scope**: Full monorepo — backend, frontend, bot

---

## Executive Summary

**67 distinct technical debt items** identified across 3 packages:

- **CRITICAL**: 5 issues (orphaned routes, bot zero tests, security defaults)
- **HIGH**: 9 issues (any types, missing controller tests, error handling gaps)
- **MEDIUM**: 14 issues (inconsistencies, TODOs, accessibility)
- **LOW**: 35+ issues (nice-to-have improvements)

**Estimated effort**: ~150+ hours (~4 sprints at 40 hrs/week capacity)

**Sprint 9 can fix**: ~15-20 hours (orphaned routes, security, console logging)
**Sprint 10-11**: ~60-80 hours (test coverage, accessibility, refactoring)

---

## CRITICAL ISSUES (Fix Immediately)

### 1. Orphaned Admin-Reservation Routes
**Severity**: 🔴 BLOCKING  
**Effort**: S (< 1hr)

Routes fully implemented with Swagger docs but NEVER mounted:
- `backend/src/routes/admin-reservation.routes.ts` — 6 endpoints completely unreachable
- `admin-tour.routes.ts`, `admin-property.routes.ts`, `property.routes.ts`, `tour.routes.ts`, `bot-leads.routes.ts` — 5 more orphaned

**Solution**: Add imports and `router.use()` calls to `backend/src/routes/index.ts`

---

### 2. Commission Config Routes Mounted Incorrectly
**Severity**: 🔴 ARCHITECTURAL  
**Effort**: S (< 1hr)

Mounted in `app.ts:212` instead of through `routes/index.ts`. Breaks route registry pattern.

**Solution**: Move to unified route mounting in `routes/index.ts`

---

### 3. Bot Package: ZERO Test Infrastructure
**Severity**: 🔴 CRITICAL  
**Effort**: XL (8-10hrs minimum)

- No Jest config
- No test scripts
- No test files (28 production files, ~1200 LOC, 0 tests)
- BuilderBot flows are untested state machines

**Impact**: Production bot failures go undetected. WhatsApp UX breaks silently.

**Solution**:
1. Install Jest + ts-jest
2. Create `jest.config.cjs`
3. Create `bot/src/__tests__/` structure
4. Write unit tests for 6 main flows: welcome, balance, network, reservations, tours, schedule
5. Add test scripts to package.json

---

### 4. 302 Console Statements in Production Code
**Severity**: 🔴 OPERATIONAL  
**Effort**: M (2-3hrs)

Should use pino (already configured) instead of console. Console output lost in Docker/production.

**Files affected**: Controllers, services, models across backend

**Solution**: Replace all `console.*` with `logger.*` calls

---

### 5. Default JWT Secret in Config
**Severity**: 🔴 SECURITY  
**Effort**: S (< 1hr)

`backend/src/config/env.ts` defaults to `'default-secret-change-in-production'` if env var missing.

**Risk**: Token forgery if deployment forgets env var.

**Solution**: Remove defaults, throw error at startup if missing.

---

## HIGH PRIORITY ISSUES (Sprint 9-10)

### 6. 59 `any` Type Declarations
**Severity**: 🟠 TYPE SAFETY  
**Effort**: M (3-4hrs backend, 2-3hrs frontend)

Spread across:
- Error handlers: `catch (error: any)` — 30+ instances
- Request type casting: `req as any`, `res as any`
- Array mapping: `map((item: any) => ...)` — 10+ instances

**Solution**: Create proper error types, extend Express types, use generics

---

### 7. 45 Controllers Without Test Coverage
**Severity**: 🟠 REGRESSION RISK  
**Effort**: L (6-8hrs for high-priority 10, XL for all 45)

Missing tests for:
- `ProductController`, `OrderController`, `CartController`
- `PaymentMercadoPagoController`, `PaymentPayPalController`
- All admin controllers
- Most business logic controllers

**Solution**: Prioritize: orders, payments, users, admin (10 controllers), then others

---

### 8. 4 Services Without Error Handling
**Severity**: 🟠 OPERATIONAL  
**Effort**: M (2-3hrs)

No try/catch blocks in:
- `R2Service.ts` — S3 uploads fail silently
- `QRService.ts` — QR generation fails
- `MercadoPagoService.ts` — Payment integration fails
- `LeaderboardService.ts` — Calculations fail

**Solution**: Add try/catch, proper error typing

---

### 9. 4 Skipped Push Notification Integration Tests
**Severity**: 🟠 FEATURE BROKEN  
**Effort**: M (2-3hrs)

Tests skipped in `backend/src/__tests__/integration/push.test.ts` (lines 29, 130, 150, 187):
- Root cause: PushSubscription model issues
- Push notifications untested in CI

**Solution**: Fix PushSubscription model associations, unskip tests

---

### 10. Payment Integration Gaps
**Severity**: 🟠 FINANCIAL CORRECTNESS  
**Effort**: M (3-4hrs)

Incomplete payment flows:
- **PayPal** (line 148-154):
  - TODO: Trigger commission calculation
  - TODO: Reverse commissions on refunds
- **MercadoPago** (line 157, 185):
  - TODO: Signature verification
  - TODO: Handle payment notification

**Solution**: Implement commission triggers for both payment providers

---

### 11. 313 UI Elements Lacking Accessibility
**Severity**: 🟠 WCAG COMPLIANCE  
**Effort**: L (5-6hrs audit + fixes)

Missing:
- `aria-label` / `aria-labelledby` on buttons
- `alt` attributes on images
- `role` attributes for custom elements
- Semantic HTML (div buttons instead of `<button>`)

**Solution**: Add ARIA labels systematically, create accessibility checklist

---

### 12. Frontend Component Test Coverage: 15 Tests for 91 Components
**Severity**: 🟠 REGRESSION RISK  
**Effort**: L (6-8hrs for 20-30 essential tests)

Only ~16% coverage. Missing:
- Layout components
- Form components
- Card/List components
- Modal/Dialog components
- All page components

**Solution**: Focus on high-impact components first (Layout, Forms, Pages)

---

### 13-14. Missing Controller Tests
**Severity**: 🟠 SECURITY/FEATURE RISK  
**Effort**: M (2-3hrs each)

Specific critical gaps:
- `TwoFactorController` — security-critical, completely untested
- `BotController` — WhatsApp integration endpoints untested
- `GiftCardController` — revenue feature, controller logic untested
- Admin controllers — admin operations unvalidated

---

## MEDIUM PRIORITY ISSUES (Sprint 10-11)

### 15. 46 TODO/FIXME Comments
**Severity**: 🟡 BLOCKED WORK  
**Effort**: S-M (planning)

Examples:
- 20+ "TODO: domain pending" (hardcoded nexoreal.xyz)
- "TODO: Signature verification" (PayPal)
- "TODO: Calculate actual count" (Notification stats)

**Solution**: Create openspec tickets for each TODO

---

### 16. Hardcoded Domain "nexoreal.xyz" — 20+ References
**Severity**: 🟡 OPERATIONAL FLEXIBILITY  
**Effort**: S (1hr)

Hardcoded instead of using config. Blocks domain migration.

**Solution**: Create `PLATFORM_DOMAIN` env var, use everywhere

---

### 17. Routes Mounted Inconsistently
**Severity**: 🟡 CODE QUALITY  
**Effort**: S (1hr)

- 35+ routes via `routes/index.ts` (correct)
- 6+ routes mounted directly in `app.ts` (wrong)

**Solution**: Consolidate all routes through `routes/index.ts`

---

### 18. Express Type Casting (`as any`)
**Severity**: 🟡 TYPE SAFETY  
**Effort**: S (1hr)

`const user = (req as any).user;` in 3+ places in rate limiters

**Solution**: Create custom `AuthenticatedRequest` type extending Express Request

---

### 19. Mixed Error Type Handling
**Severity**: 🟡 ERROR HANDLING  
**Effort**: M (2-3hrs)

30+ `catch (error: any)` blocks, cannot safely access properties

**Solution**: Create custom error classes, strongly type catch blocks

---

### 20. Sequelize Model Associations Audit
**Severity**: 🟡 DATA INTEGRITY  
**Effort**: M (3-4hrs)

45 models, 133 associations — need audit for:
- Missing reverse associations
- Cascade behavior (onDelete, onUpdate)
- Foreign key correctness

**Solution**: Create association checklist, audit systematically

---

## LOW PRIORITY ISSUES (Sprint 11+)

### 21-67. Additional Items
- Zustand store pattern inconsistencies
- Missing error boundaries in frontend
- No request timeout configuration
- No API versioning strategy
- Bot KB files not version-controlled
- CI/CD missing SAST (static security)
- No pre-commit hooks (console.log prevention)
- Incomplete Swagger docs for orphaned routes
- State hydration from localStorage not validated
- And more...

**Total**: 35+ low-priority items (~60+ hours total)

---

## EFFORT BREAKDOWN

| Priority | Items | Hours | Sprint Target |
|----------|-------|-------|----------------|
| CRITICAL | 5 | 13 | Sprint 9 (first 2 weeks) |
| HIGH | 9 | 30 | Sprint 9 (second 2 weeks) + Sprint 10 |
| MEDIUM | 14 | 45 | Sprint 10-11 |
| LOW | 35+ | 60+ | Sprint 11+ |
| **TOTAL** | **67+** | **~150+** | **~4 sprints** |

---

## DISCOVERY INSIGHTS

### Good Patterns Found
1. Consistent Swagger/OpenAPI documentation structure
2. Solid rate limiting infrastructure
3. Well-organized Jest test structure
4. Properly structured Sequelize models
5. Clean ESM module system across all packages
6. Pino logging infrastructure already in place

### Problem Areas
1. **Route mounting not enforced** — leads to forgotten routes like admin-reservation
2. **Type safety not enforced** — projects bypass with `.as any` instead of fixing
3. **Test coverage not gated** — skipped tests accumulate without forcing fixes
4. **Bot treated as separate** — zero test strategy despite production use
5. **Production logging bypassed** — uses console instead of pino despite setup

### Root Causes
- Missing enforcement (no CI gates for orphaned routes, type safety, test coverage)
- Fear of strict TypeScript (using `any` to bypass instead of fixing)
- Missing test infrastructure (bot has zero tests, no setup to add them)
- Incomplete payment implementations (TODOs never followed up)
- Accessibility not considered in initial design

---

## Recommended Sprint 9 Plan

**First 2 weeks (CRITICAL issues)**:
1. Mount orphaned admin-reservation routes (1hr)
2. Mount other orphaned routes (1hr)
3. Remove JWT secret defaults (1hr)
4. Add bot Jest infrastructure (4hrs)
5. Start bot test writing (~6hrs, continue to Sprint 10)
6. Replace console.log with pino (2-3hrs)

**Second 2 weeks (HIGH issues)**:
7. Add `any` type cleanup (3hrs)
8. Create missing controller tests (20 high-priority, ~8hrs)
9. Fix push notification model + unskip tests (2-3hrs)
10. Fix payment integration TODOs (3-4hrs)
11. Add accessibility fixes for top 50 UI elements (3hrs)

**Total**: ~35-40 hours allocated, ~10 items completed

---

## Recommended Sprint 10 Plan

- Bot test implementation (continue, ~8hrs)
- Full controller test coverage (30+ tests, ~12hrs)
- Frontend component tests (20-30 tests, ~8hrs)
- Sequelize audit (4hrs)
- UI/UX accessibility audit (4hrs)
- Error type cleanup (3hrs)
- Payment verification implementations (2hrs)

**Total**: ~40 hours, 6 major items completed

---

## References

- Engram memory: `sdd/sprint9-tech-debt/explore`
- Project version: v2.4.0, Sprint 8 complete
- Investigation date: April 11, 2026
- Scope: Full monorepo (backend ESM/Express, frontend React 19/Vite, bot BuilderBot)
