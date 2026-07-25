# Design: TypeScript Strict Error Elimination

## Technical Approach

Eliminate all 1011 `tsc --noEmit` errors across 4 phases using automated codemods first, surgical fixes after. The error count increased from 979 (proposal) to 1011 due to previously masked errors surfacing. Each phase = separate PR (≤400 lines, feature-branch-chain). Phase D is split into D1 (payment controllers, 36 errors), D2 (req.user + response types, 11 errors), D3 (infrastructure types, 26 errors).

```
Phase A (649) ──→ Phase B (166) ──→ Phase C (91) ──→ Phase D (73) ──→ CI Gate
  codemod            manual path       typed any         surgical types     tsc --noEmit
  .js extensions     fixes             annotations       + ioredis fix      blocking
```

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Codemod tool | Node.js script with `ts-morph` or regex | `jscodeshift`, `ts-fix`, manual | ts-morph preserves AST; regex is faster for simple extension adds. Use regex for Phase A (pattern is trivial: add `.js` to extensionless relative imports). |
| Phase D split | D1/PayPal(36) + D2/req.user(11) + D3/rest(26) | Single Phase D PR | PayPal alone is 29 errors with complex type rewrites. Splitting keeps each PR reviewable. |
| ProductListOptions location | Move to `types/index.ts` | Import from ProductService | Interface is pure type, no runtime dependency. types/ is the canonical location. Moving breaks no runtime code. |
| ioredis import fix | `import { Redis } from 'ioredis'` (named) | `@ts-expect-error`, type assertion | ioredis v5 exports both default and named `Redis`. Named import resolves correctly under NodeNext. Fallback: `@ts-expect-error` with TODO. |
| asyncHandler return type | `Promise<Response \| void>` | Remove `return res.json()`, void all handlers | Changing 30+ handler return statements is high-risk. Widening the type is safe and non-breaking. |
| req.user typing | Import `AuthenticatedRequest` from auth middleware | Add `user` to Express Request globally | Scoped import is safer; no global type pollution. Already used by AdminContractController. |
| CI gate | New workflow `.github/workflows/typecheck.yml` | Add step to existing CI | Isolation: typecheck doesn't depend on tests/deploy. Can be enabled after all errors fixed without touching existing CI. |

## Error Distribution (verified via `tsc --noEmit`)

| Phase | Error Codes | Count | Files Affected |
|-------|------------|-------|----------------|
| A | TS2835, TS2834 | 649 | ~120 files (all .ts with relative imports) |
| B | TS2307 | 166 | ~30 files (missing modules) |
| C | TS7006 | 91 | ~25 files (implicit any in callbacks/catches) |
| D1 | TS2339, TS18047, TS7052, TS2345, TS2322 | 36 | PaymentPayPalController (29) + PaymentMercadoPagoController (7) |
| D2 | TS2339, TS2698 | 11 | ShippingAddressController (6), ShipmentTrackingController (4), response.util.ts (1) |
| D3 | TS2304, TS2345, TS2538, TS2709, TS2351, TS18046, TS2731, TS2322, TS18047 | 26 | ProductService (8), Redis (3), WalletService (2), CurrencyService (2), setup.ts (2), featureGuard (1), N8nWebhook (1), CommissionConfig (1), types/index (1), response (5 remaining) |

## Data Flow — Codemod Pipeline

```
backend/src/**/*.ts
        │
        ▼
┌─────────────────────┐
│  Phase A: Codemod    │  Regex: /from ['"](\.[^'"]+)['"]/ → add .js
│  (ts-morph or sed)   │  Skip: node_modules, dist, *.d.ts
│  Safety: git diff    │  Verify: tsc --noEmit TS2835/2834 = 0
│  before/after        │
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│  Phase B: Manual     │  TS2307 errors: check if .ts file exists at path
│  Path Fixes          │  Create missing barrel exports
│  Verify: tsc per     │  Fix circular references
│  file                │
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│  Phase C: Type       │  TS7006: annotate callback params
│  Annotations         │  catch(error) → catch(error: unknown)
│  Priority:           │  @ts-expect-error only with justification
│  #245→#246→#247→rest │
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│  Phase D: Surgical   │  D1: PaymentPayPal (Request body types, null checks)
│  Type Fixes          │  D2: AuthenticatedRequest imports
│  D1→D2→D3            │  D3: ioredis, ProductModel, unique symbol
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│  CI Gate             │  .github/workflows/typecheck.yml
│  tsc --noEmit        │  blocks: development + main PRs
│  blocking            │
└─────────────────────┘
```

## File Changes

### Phase A — Codemod

| File | Action | Description |
|------|--------|-------------|
| `scripts/codemod-extensions.mjs` | Create | Node.js script: scan all .ts files, regex-replace extensionless relative imports with `.js` suffix |
| `backend/src/**/*.ts` (~120 files) | Modify | Add `.js` to all relative import paths |

**Codemod script strategy:**
1. Glob all `backend/src/**/*.ts` (exclude `*.d.ts`, `node_modules`, `dist`)
2. For each file, match: `from '(\.\.[^']+|\.\/[^']+)'` where path doesn't end with `.js` or `.json`
3. Append `.js` to matched paths
4. Also handle `import('...')` dynamic imports
5. Write changes, run `tsc --noEmit 2>&1 | grep -c TS2835` to verify 0
6. Run `pnpm test` to verify no runtime breakage

### Phase B — Path Fixes

| File | Action | Description |
|------|--------|-------------|
| `backend/src/routes/admin.routes.ts` | Verify/Create | Confirm file exists; add `.js` extension import if barrel is missing |
| `backend/src/routes/crm.routes.ts` | Verify/Create | Same as above |
| `backend/src/routes/public.routes.ts` | Verify/Create | Same as above |
| `backend/src/routes/landing.routes.ts` | Verify/Create | Same as above |
| `backend/src/routes/payment.routes.ts` | Verify/Create | Same as above |
| `backend/src/middleware/error.middleware.ts` | Verify | Confirm file exists (it does — TS2307 errors are from missing `.js` extension) |

### Phase C — Type Annotations

| File | Action | Description |
|------|--------|-------------|
| `backend/src/services/TreeService.ts` | Modify | Lines 363, 433: add parameter types to reduce callbacks |
| `backend/src/services/UserService.ts` | Modify | Lines 9-15: verify error.middleware import resolves after Phase A/B |
| `backend/src/services/VendorService.ts` | Modify | Lines 14-15, 220, 234, 276: type reduce callbacks |
| `backend/src/services/WalletService.ts` | Modify | Lines 294, 297: fix unique symbol index (TS2538) — cast Op.gte/Op.lte to string |

### Phase D — Surgical Type Fixes

**D1: Payment Controllers (36 errors)**

| File | Action | Description |
|------|--------|-------------|
| `backend/src/middleware/asyncHandler.ts` | Modify | Widen return type: `Promise<void>` → `Promise<Response \| void>` |
| `backend/src/controllers/PaymentPayPalController.ts` | Modify | (1) Import `Request` from express, (2) Cast `req.body` as parsed event type, (3) Add null guards for webhook event, (5) Fix `req.headers` access with `.get()`, (6) Type `req.params` |
| `backend/src/controllers/PaymentMercadoPagoController.ts` | Modify | (1) Fix nullable `string \| undefined` → `string` with defaults, (2) Return type alignment |

**D2: Request/Response Types (11 errors)**

| File | Action | Description |
|------|--------|-------------|
| `backend/src/controllers/ShippingAddressController.ts` | Modify | Import `AuthenticatedRequest` from auth middleware, replace `Request` with `AuthenticatedRequest` in handler signatures |
| `backend/src/controllers/ShipmentTrackingController.ts` | Modify | Same pattern as ShippingAddress |
| `backend/src/utils/response.util.ts` | Modify | Line 42: spread `details` — use conditional spread with type assertion or explicit `Record<string, unknown>` |

**D3: Infrastructure Types (26 errors)**

| File | Action | Description |
|------|--------|-------------|
| `backend/src/config/redis.ts` | Modify | Change `import Redis from 'ioredis'` → `import { Redis } from 'ioredis'` (named export). If that fails under NodeNext CJS interop, fallback to `@ts-expect-error` with TODO. Fix type annotation: `Redis \| null` should resolve with named import. |
| `backend/src/services/ProductService.ts` | Modify | Add `import { Product } from '../models'` aliased as `ProductModel`, OR rename all `ProductModel` references to `Product`. Fix unique symbol index (line 142) with `as string` cast. |
| `backend/src/services/WalletService.ts` | Modify | Lines 294, 297: Cast `Op.gte`/`Op.lte` keys: `(where.created_at as Record<string, unknown>)[Op.gte as string]` |
| `backend/src/services/CurrencyService.ts` | Modify | Lines 52, 58: type `data` from API response as `{ rates: Record<string, number> }` |
| `backend/src/types/index.ts` | Modify | Add `import type { ProductListOptions } from '../services/ProductService'` OR move interface definition to types/index.ts |
| `backend/src/middleware/featureGuard.ts` | Modify | Line 31: wrap symbol in `String()` |
| `backend/src/controllers/N8nWebhookController.ts` | Modify | Line 113: type catch block `catch (error: unknown)` with narrowing |
| `backend/src/controllers/commissions/CommissionConfigReadController.ts` | Modify | Line 121: type `unknown` → `number` with assertion |
| `backend/src/__tests__/setup.ts` | Modify | Line 104: null guard for `sequelizeInstance`, Line 149: fix supertest type |

## Interfaces / Contracts

### asyncHandler signature update

```typescript
// BEFORE (asyncHandler.ts line 4)
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// AFTER
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
```

### AuthenticatedRequest pattern (for Shipping/Shipment controllers)

```typescript
// Add to each controller that accesses req.user:
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

// Replace handler signature:
static methodName = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;  // now type-safe
});
```

### ioredis fix pattern

```typescript
// BEFORE (redis.ts)
import Redis from 'ioredis';
let redis: Redis | null = null;

// AFTER — try named import first
import { Redis } from 'ioredis';
let redis: Redis | null = null;

// Fallback if CJS interop breaks named import:
// import Redis from 'ioredis';
// // @ts-expect-error ioredis v5 CJS types — fix when upgrading to native ESM
// let redis: InstanceType<typeof Redis> | null = null;
```

### ProductListOptions move

```typescript
// Move from ProductService.ts to types/index.ts:
export interface ProductListOptions {
  page?: number;
  limit?: number;
  platform?: 'netflix' | 'disney_plus' | 'spotify' | 'hbo_max' | 'amazon_prime' | 'youtube_premium' | 'apple_tv' | 'other';
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  type?: ProductType;
  categoryId?: string;
  minStock?: number;
  maxStock?: number;
  search?: string;
}

// In ProductService.ts: import from types instead of defining locally
import type { ProductListOptions } from '../types';
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Phase A | Import extensions don't break runtime | `pnpm test` (887+ tests) after codemod. Verify zero TS2835/TS2834. |
| Phase B | Module resolution correct | `tsc --noEmit` on each fixed file individually, then full. `pnpm test`. |
| Phase C | Type annotations don't change runtime | `pnpm test` (annotations are compile-time only). Verify zero TS7006. |
| Phase D1 | PayPal/MercadoPago handlers compile | `tsc --noEmit` on each controller. `pnpm test` for payment-related tests. |
| Phase D2 | req.user access compiles | `tsc --noEmit` on Shipping/Shipment controllers. `pnpm test`. |
| Phase D3 | Redis, ProductService, Wallet compile | `tsc --noEmit` on each file. `pnpm test` for affected services. |
| CI Gate | `tsc --noEmit` exits 0 | Run full `tsc --noEmit` in CI workflow. Verify zero errors. |

**Verification command per phase:**
```bash
cd backend && npx tsc --noEmit 2>&1 | grep -c "error TS"
# Expected: 0 after all phases complete
```

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. This is a compile-time type-safety refactor with no runtime behavior changes.

## Migration / Rollout

1. Each phase = separate PR targeting `development`
2. PR order: A → B → C → D1 → D2 → D3 → CI Gate
3. CI gate is last merge — enables after all errors resolved
4. All 887+ backend tests serve as regression safety net per phase
5. No data migration required — pure compile-time changes
6. Rollback: revert individual PRs if issues arise

## Open Questions

- [ ] Does `import { Redis } from 'ioredis'` resolve correctly under `module: NodeNext`? Test in Phase D3 before committing to approach. Fallback: `@ts-expect-error`.
- [ ] Should `ProductListOptions` move to `types/index.ts` or should `GenericProductListOptions` import from `ProductService`? Moving is cleaner but creates a service→types dependency. Recommend: move to types/ since it's a pure interface.
- [ ] Is Express 5 `Request.body` typed as `any` by default, or does PaymentPayPalController have a global type conflict causing `ReadableStream<any>`? Investigate in D1 — the `ReadableStream` type suggests Fetch API Request is leaking into scope.
