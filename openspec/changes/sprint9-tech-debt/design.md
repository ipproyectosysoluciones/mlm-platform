# Design: Sprint 9 Tech Debt

## Technical Approach

Systematic 5-phase refactor touching backend routes, security config, logging, type safety, and bot test infra. Each phase is independently deployable. No API contracts, DB schemas, or runtime deps change. Backend uses existing pino (already installed v10.3.1). Bot tests use **Vitest** (native ESM, zero config friction with `"type": "module"`).

## Architecture Decisions

### AD-1: Orphaned Route Registration Strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Mount all 6 in `routes/index.ts` | Consistent single source of truth | **✅ Chosen** |
| Mount in `app.ts` alongside existing ad-hoc routes | Spreads route knowledge across files | ❌ |

**Rationale**: `routes/index.ts` already mounts 30+ routes. The 3 admin routes (`admin-reservation`, `admin-tour`, `admin-property`) mount under `/admin/*` prefix in `index.ts` — same pattern as existing `admin/categories`, `admin/products`, `admin/vendors`, `admin/contracts`. Public `property` and `tour` routes follow existing public pattern. `bot-leads` mounts under `/bot/leads` alongside existing `/bot` route.

**Exact pattern** (add to `routes/index.ts` after line 30, before `const router`):
```ts
import adminReservationRoutes from './admin-reservation.routes';
import adminTourRoutes from './admin-tour.routes';
import adminPropertyRoutes from './admin-property.routes';
import propertyRoutes from './property.routes';
import tourRoutes from './tour.routes';
import botLeadsRoutes from './bot-leads.routes';
```

Mount order (after existing admin blocks, ~line 69):
```ts
// Admin reservation routes
router.use('/admin/reservations', adminReservationRoutes);
// Admin tour routes
router.use('/admin/tours', adminTourRoutes);
// Admin property routes
router.use('/admin/properties', adminPropertyRoutes);
// Public property routes
router.use('/properties', propertyRoutes);
// Public tour routes
router.use('/tours', tourRoutes);
// Bot leads route (internal API, x-bot-secret auth)
router.use('/bot/leads', botLeadsRoutes);
```

### AD-2: Commission-Config Relocation

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Move from `app.ts:212` to `routes/index.ts` | Single mounting point | **✅ Chosen** |
| Keep in `app.ts` | Already works but inconsistent | ❌ |

**Action**: Remove line 16 (`import commissionConfigRoutes`) and line 212 (`app.use('/api/admin/commissions', commissionConfigRoutes)`) from `app.ts`. Add to `routes/index.ts`:
```ts
import commissionConfigRoutes from './commission-config.routes';
// ...
router.use('/admin/commissions', commissionConfigRoutes);
```

Note: `app.ts` mounts index at `/api` → final path stays `/api/admin/commissions` ✅.

### AD-3: JWT/2FA Secret Validation

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Fail-fast: throw at module load | Server won't start without secrets | **✅ Chosen** |
| Runtime check per request | Delayed failure, harder to diagnose | ❌ |
| Zod schema for all env | Over-engineering for 2 fields | ❌ |

**Pattern** (bottom of `config/env.ts`, after `export const config`):
```ts
// ── Fail-fast: critical secrets ──────────────────────────────────
if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET env var is required. Server cannot start without it.');
}
if (!process.env.TWO_FACTOR_SECRET_KEY) {
  throw new Error('FATAL: TWO_FACTOR_SECRET_KEY env var is required. Server cannot start without it.');
}
```

Remove default values: `jwt.secret` uses `process.env.JWT_SECRET` (no fallback). `twoFactor.secretKey` uses `process.env.TWO_FACTOR_SECRET_KEY` (no fallback). Test env sets both via `backend/src/__tests__/setup.ts` → `process.env.JWT_SECRET = 'test-secret'`.

### AD-4: Console → Pino Logger Strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Create `src/utils/logger.ts` re-exporting app.ts pino instance | Importable everywhere | **✅ Chosen** |
| Pass logger via DI / middleware | Major refactor, out of scope | ❌ |
| Bulk sed replace | Breaks structured logging | ❌ |

**New file**: `backend/src/utils/logger.ts`
```ts
import pino from 'pino';
const isProduction = process.env.NODE_ENV === 'production';
export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  ...(isProduction ? {} : { transport: { target: 'pino-pretty' } }),
});
```

Refactor `app.ts` to import from `utils/logger.ts` instead of inline pino creation.

**Mapping**: `console.log(msg)` → `logger.info(msg)` | `console.error(msg)` → `logger.error(msg)` | `console.warn(msg)` → `logger.warn(msg)` | `console.info(msg)` → `logger.info(msg)`.

**Migration**: File-by-file, prioritize controllers/services first (runtime code), then seed/migrations last. ~343 statements across ~40 files. **Exclude** `seed.ts` and `server.ts` seed-data console.log (decorative box output) — convert those too since spec says ZERO.

### AD-5: `nexoreal.xyz` → PLATFORM_DOMAIN

**New env var**: `PLATFORM_DOMAIN` (default: `nexoreal.xyz` for backward compat in dev).

**Pattern**: In `config/env.ts`:
```ts
platform: {
  domain: process.env.PLATFORM_DOMAIN || 'nexoreal.xyz',
},
```

Then replace hardcoded refs: `'billing@nexoreal.xyz'` → `` `billing@${config.platform.domain}` ``, etc. **Exclude** seed data email addresses (those are fixture data, not config). **Exclude** test files (mocks reference the URL directly). ~55 matches, ~20 are actionable after excluding seeds/tests/comments.

### AD-6: `any` Type Elimination

| Approach | Decision |
|----------|----------|
| `catch (error: any)` → `catch (error: unknown)` + type guard | **✅ Standard** |
| Express handlers `(req: any, res: any)` → `(req: Request, res: Response)` | **✅ Standard** |
| `as any` casts → proper generics or interface | **✅ Case by case** |

**Priority order**: (1) `app.ts` — 6 any (highest visibility), (2) Controllers with 5+ any: CartService(8), ReservationCtrl(6), AdminVendorCtrl(6), VendorCtrl(5), TourPkgCtrl(5), PropertyCtrl(5), MercadoPagoCtrl(5), NotificationCtrl(5), (3) Services: UserService(5), AchievementService(4), CRMService(4), (4) Middleware: auth.middleware(3), (5) Remaining scattered files.

**Error catch pattern**:
```ts
// BEFORE:
catch (error: any) { res.status(500).json({ message: error.message }); }
// AFTER:
catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  res.status(500).json({ message });
}
```

### AD-7: Bot Test Framework — **CRITICAL**

| Option | ESM compat | Config effort | Ecosystem | Decision |
|--------|-----------|---------------|-----------|----------|
| Jest + ts-jest (ESM) | Partial, experimental `--experimental-vm-modules` | High: transform config, `.mts` edge cases | Large but ESM pain | ❌ |
| Vitest | Native ESM, zero transform | Minimal: `vitest.config.ts` | Growing, Vite-native | **✅ Chosen** |
| Convert bot to CJS | Breaks BuilderBot ESM imports | Massive refactor | N/A | ❌ |

**Rationale**: Bot has `"type": "module"`, tsconfig `"module": "NodeNext"`, all imports use `.js` extensions (ESM convention). BuilderBot + Baileys are ESM. Jest ESM support requires `NODE_OPTIONS=--experimental-vm-modules` and fragile transform config. Vitest runs ESM natively with zero config. Bot already has no test runner — no migration cost.

**Config**: `bot/vitest.config.ts`
```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: { provider: 'v8', reporter: ['text', 'lcov'] },
  },
});
```

**Dev deps to add**: `vitest`, `@vitest/coverage-v8`.

**Test structure**:
```
bot/src/
├── services/
│   ├── ai.service.ts
│   ├── ai.service.test.ts        ← unit test co-located
│   ├── mlm-api.service.ts
│   └── mlm-api.service.test.ts
├── flows/
│   ├── welcome.flow.ts
│   └── welcome.flow.test.ts
├── config/
│   └── keywords.test.ts
└── __mocks__/                    ← manual mocks
    ├── @builderbot/bot.ts
    ├── @builderbot/provider-baileys.ts
    └── openai.ts
```

**Priority test targets**: (1) `ai.service.ts` — mock OpenAI, test prompt building + session mgmt, (2) `mlm-api.service.ts` — mock axios, test all API calls, (3) `welcome.flow.ts` — mock state/flowDynamic, test conversation state machine, (4) `keywords.ts` — pure data, trivial tests, (5) `balance.flow.ts`, `network.flow.ts`, `reservations.flow.ts`.

**Mocking strategy**:
```ts
// OpenAI mock:
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create: vi.fn() } },
  })),
}));

// BuilderBot mock:
vi.mock('@builderbot/bot', () => ({
  addKeyword: vi.fn(() => ({ addAction: vi.fn() })),
  EVENTS: { WELCOME: 'welcome', ACTION: 'action' },
}));
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/src/routes/index.ts` | Modify | Add 7 route imports + mounts (6 orphaned + commission-config) |
| `backend/src/app.ts` | Modify | Remove commission-config import/mount, remove inline pino (use logger.ts), fix `as any` on line 219 |
| `backend/src/config/env.ts` | Modify | Remove JWT default, remove 2FA default, add fail-fast throws, add `platform.domain` |
| `backend/src/utils/logger.ts` | Create | Pino logger singleton, exported for all backend modules |
| `backend/src/**/*.ts` (~40 files) | Modify | Replace ~343 console.* → logger.* |
| `backend/src/**/*.ts` (~20 files) | Modify | Replace ~95 `any` → proper types |
| `bot/vitest.config.ts` | Create | Vitest config for ESM bot tests |
| `bot/package.json` | Modify | Add "test" script, add vitest + @vitest/coverage-v8 devDeps |
| `bot/tsconfig.json` | Modify | Add `"types": ["vitest/globals"]` to compilerOptions |
| `bot/src/__mocks__/*.ts` | Create | Manual mocks for BuilderBot, Baileys, OpenAI |
| `bot/src/**/*.test.ts` (~8 files) | Create | Unit tests for services, flows, config |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Smoke | 6 new routes return non-404 | Existing supertest infra in backend integration tests |
| Unit | Bot services (ai, mlm-api) | Vitest + mocked OpenAI/axios |
| Unit | Bot flows (welcome, balance, network) | Vitest + mocked state/flowDynamic |
| Grep | Zero console.*, zero `any`, zero `nexoreal.xyz` | CI grep assertions (spec verification) |
| Regression | All 1236 existing tests pass | `pnpm test` from monorepo root |

## Migration / Rollout

No migration required. All changes are internal refactors:
- No DB schema changes
- No API contract changes
- No new runtime dependencies (pino already installed, vitest is devDep)
- Each phase independently deployable via atomic commits

**Commit strategy** (1 commit per phase area):
1. `fix(routes): mount 6 orphaned routes + relocate commission-config`
2. `fix(security): remove JWT/2FA default secrets, fail-fast on missing`
3. `refactor(logging): replace console.* with pino logger across backend`
4. `refactor(env): introduce PLATFORM_DOMAIN, remove hardcoded nexoreal.xyz`
5. `refactor(types): eliminate any types in backend src`
6. `feat(bot): add vitest infrastructure + initial test suite`
7. `test(backend): add controller test files + unskip push tests`

## Open Questions

- [x] Bot ESM/CJS decision → **Vitest, keep ESM** (resolved in AD-7)
- [ ] `seed.ts` has 44 console.log for decorative box output — convert ALL to logger per spec (ZERO console.*), but these are one-time seed scripts. Confirm intent with team if questioned.
- [ ] `backend/src/__tests__/setup.ts` must set `JWT_SECRET` and `TWO_FACTOR_SECRET_KEY` env vars before importing config — verify test bootstrap order doesn't break.
