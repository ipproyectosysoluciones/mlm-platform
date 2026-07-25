# Proposal: Sprint 9 — Critical & High-Priority Technical Debt

## Intent

Resolve the 11 most impactful technical debt items from the v2.4.0 audit (67 total). Focuses on **broken functionality** (6 orphaned route files), **security** (JWT default secret), **operational stability** (302 console statements → pino), **bot reliability** (zero test infrastructure), and **type safety** (59 `any` declarations). Sprint capacity: 35-40 hours.

## Scope

### In Scope
- **CRITICAL (~13h)**: Mount 6 orphaned routes, fix commission-config mounting, remove JWT default secret, replace 302 console.* with pino, bot test infrastructure + initial tests
- **HIGH (~20-25h)**: Clean 59 `any` types, add error handling to 4 services, fix 4 skipped push tests, test 10 priority controllers, fix hardcoded domain, consolidate route mounting

### Out of Scope
- Full accessibility audit (313 items) → Sprint 10
- Frontend component tests (91 components) → Sprint 10
- Bot full test suite → Sprint 10 (infrastructure only in S9)
- Sequelize associations audit → Sprint 10
- Payment integration TODOs (PayPal/MercadoPago) → Sprint 10
- All 35+ LOW priority items → Sprint 11+
- Storybook setup, Zustand store refactor, API versioning

## Capabilities

### New Capabilities
None — pure refactor and infrastructure work.

### Modified Capabilities
None — no spec-level behavior changes. All items are internal quality improvements (route wiring, logging, types, tests).

## Approach

**Phase 1 — Quick Wins & Security (Days 1-2, ~5h)**
Items 1-3: Mount orphaned routes, fix commission-config, remove JWT default. Zero-risk, immediate impact.

**Phase 2 — Operational Stability (Days 3-5, ~5h)**
Items 4, 10-11: Replace console.* with pino, fix hardcoded domain, consolidate route mounting. Systematic grep-and-replace.

**Phase 3 — Bot Test Infrastructure (Days 5-8, ~8-10h)**
Item 5: Jest config, test structure, initial tests for 6 core flows (welcome, balance, network, reservations, tours, schedule).

**Phase 4 — Type Safety & Error Handling (Days 8-12, ~7h)**
Items 6-7: Clean `any` types (backend-only in S9), add try/catch to R2, QR, MercadoPago, Leaderboard services.

**Phase 5 — Test Coverage (Days 12-15, ~8-11h)**
Items 8-9: Fix PushSubscription model + unskip 4 tests, write tests for 10 priority controllers (Orders, Payments, Users, Auth, Admin, Cart, Product, Dashboard, Notification, GiftCard).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/routes/index.ts` | Modified | Mount 6 orphaned routes + commission-config + consolidate |
| `backend/src/app.ts` | Modified | Remove direct route mounts, slim down |
| `backend/src/config/env.ts` | Modified | Remove JWT default, add PLATFORM_DOMAIN, throw on missing |
| `backend/src/**/*.ts` (302 files) | Modified | Replace console.* → logger.* |
| `bot/jest.config.cjs` | New | Bot test infrastructure |
| `bot/src/__tests__/` | New | Bot test files |
| `bot/package.json` | Modified | Add test scripts + devDependencies |
| `backend/src/services/{R2,QR,MercadoPago,Leaderboard}Service.ts` | Modified | Add error handling |
| `backend/src/__tests__/` | New/Modified | 10 controller test files + unskip push tests |
| Controllers + routes (59 `any` refs) | Modified | Type cleanup |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Mounting orphaned routes exposes untested endpoints | Med | Verify each route has Swagger docs + add smoke tests in Phase 5 |
| Console→pino replacement breaks log format parsing | Low | Pino already configured; use same log levels; test in dev first |
| Bot test infrastructure incompatible with BuilderBot ESM | Med | Research BuilderBot test patterns; use ts-jest with ESM support; fallback to vitest if Jest fails |
| 59 `any` removals cause cascade type errors | Med | Fix backend only in S9; use `unknown` + type guards, not complex generics |
| Push notification test fixes break model associations | Low | Test in isolation first; PushSubscription model fix is documented |

## Rollback Plan

Each phase is independently deployable. If issues arise:
1. **Routes**: Revert `routes/index.ts` — orphaned routes go back to dormant (no data loss)
2. **JWT/env**: Restore default value temporarily, add env var to deployment
3. **Console→pino**: Git revert on affected files; console still works (just unstructured)
4. **Bot tests**: No production impact (test-only changes)
5. **Type fixes**: Revert individual files; `any` is less safe but not broken

Branch strategy: `feature/sprint9-tech-debt` off `development`. PRs per phase for reviewability.

## Dependencies

- Pino logger already configured in backend (confirmed in exploration)
- Bot uses BuilderBot + Baileys — test approach must respect ESM/CJS boundary
- PR #105 (`feature/sprint7-testing`) still open — merge before starting Phase 5 to avoid conflicts

## Success Criteria

- [ ] All 6 orphaned route files mounted and reachable (curl/Swagger verification)
- [ ] Commission-config routes moved to `routes/index.ts`
- [ ] Backend startup throws error if `JWT_SECRET` env var missing
- [ ] Zero `console.log/error/warn` statements in backend production code
- [ ] Bot package has working `pnpm test` with 15+ passing tests
- [ ] Backend `any` count reduced from 59 to < 10
- [ ] R2, QR, MercadoPago, Leaderboard services have try/catch error handling
- [ ] 4 push notification tests unskipped and passing
- [ ] 10 controller test files created with basic coverage
- [ ] `nexoreal.xyz` hardcoded references replaced with `PLATFORM_DOMAIN` env var
- [ ] All routes mounted through `routes/index.ts` (none directly in `app.ts`)
- [ ] All existing 1,236 tests still passing (zero regressions)
