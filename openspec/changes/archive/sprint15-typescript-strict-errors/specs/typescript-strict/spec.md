# TypeScript Strict Error Elimination — Specification

## Purpose

Eliminate all 979 `tsc --noEmit` errors in `backend/src/` to enable a blocking CI gate. Four phases: automated import extension codemod, manual broken path fixes, explicit any annotations, and surgical type corrections.

## Requirements

### Requirement: Import Path Extensions (Phase A)

All relative imports in `backend/src/` MUST use explicit `.js` file extensions per NodeNext module resolution.

The system SHALL resolve all TS2835 (484 errors) and TS2834 (165 errors) via automated codemod.

#### Scenario: Codemod fixes extensionless imports

- GIVEN a `.ts` file with `import { X } from './foo'`
- WHEN the codemod runs across `backend/src/`
- THEN the import becomes `import { X } from './foo.js'`
- AND `tsc --noEmit` reports zero TS2835/TS2834 errors

#### Scenario: Barrel re-exports retain extensions

- GIVEN a barrel file re-exporting from `'./services/Foo'`
- WHEN the codemod runs
- THEN the re-export becomes `'./services/Foo.js'`
- AND all downstream consumers resolve correctly

#### Scenario: Non-relative imports unchanged

- GIVEN an import like `import X from 'sequelize'`
- WHEN the codemod runs
- THEN third-party imports are NOT modified

### Requirement: Broken Import Resolution (Phase B)

All TS2307 "Cannot find module" errors (166) MUST resolve to existing `.ts` files after adding `.js` extensions.

#### Scenario: Middleware imports resolve

- GIVEN `import { AppError } from '../middleware/error.middleware'`
- WHEN the file `src/middleware/error.middleware.ts` exists
- THEN the import becomes `'../middleware/error.middleware.js'`
- AND `tsc --noEmit` resolves the module

#### Scenario: Route imports resolve

- GIVEN `import { adminRouter } from './routes/admin.routes'`
- WHEN the file `src/routes/admin.routes.ts` exists
- THEN the import becomes `'./routes/admin.routes.js'`
- AND `tsc --noEmit` resolves the module

#### Scenario: Non-existent modules flagged

- GIVEN a TS2307 error where NO `.ts` file exists at the target path
- WHEN Phase B runs
- THEN the import is flagged for manual investigation (not blindly extended)

### Requirement: Explicit Any Elimination (Phase C)

All TS7006 "implicitly has 'any' type" errors (91) MUST be resolved via explicit type annotations or typed catch blocks.

#### Scenario: Callback parameters typed

- GIVEN `.map((item) => ...)` where `item` is implicitly any
- WHEN the developer adds a type annotation
- THEN the parameter becomes `(item: SomeType) => ...`
- AND `tsc --noEmit` reports zero TS7006 for that line

#### Scenario: Catch blocks typed

- GIVEN `catch (error)` where `error` is implicitly any
- WHEN the developer annotates it
- THEN it becomes `catch (error: unknown)` with type narrowing
- AND no behavior change occurs at runtime

#### Scenario: No unjustified @ts-expect-error

- GIVEN a TS7006 error in a callback or catch block
- WHEN the developer cannot determine the type
- THEN `// @ts-expect-error TODO: {reason}` is added with justification
- AND the annotation is tracked in the PR description

### Requirement: Type Error Resolution (Phase D)

All remaining TS errors (73: TS2339, TS2304, TS2345, TS18047, TS7052, TS2322, TS2538, TS18046, TS2709, TS2731, TS2698, TS2351) MUST be resolved or suppressed with justification.

#### Scenario: PaymentPayPalController PayPal SDK types

- GIVEN `req.body` accessed as `ReadableStream<any>` instead of parsed webhook event
- WHEN the developer adds proper type assertion or body parsing
- THEN TS2339 and TS18047 errors in PaymentPayPalController resolve

#### Scenario: Redis client constructor

- GIVEN `new Redis()` fails with TS2351 (not constructable)
- WHEN the developer uses the correct import or constructor pattern for ioredis v5
- THEN the Redis client instantiates without type errors

#### Scenario: MercadoPago handler signatures

- GIVEN handler functions with incompatible `AsyncRequestHandler` signatures
- WHEN the developer aligns return types (e.g., `void` instead of `Response`)
- THEN TS2345 errors resolve in PaymentMercadoPagoController

#### Scenario: ProductService ProductModel reference

- GIVEN `ProductModel` used but never imported (TS2304, 12 occurrences)
- WHEN the developer adds the correct import
- THEN ProductService compiles without TS2304 errors

#### Scenario: types/index.ts ProductListOptions

- GIVEN `GenericProductListOptions extends ProductListOptions` where `ProductListOptions` is undefined (TS2304)
- WHEN the interface is moved to `types/index.ts` or properly imported
- THEN the type relationship compiles correctly

### Requirement: CI Gate Enforcement (Issue #244)

A `tsc --noEmit` step MUST run as a blocking GitHub Actions check on all PRs targeting `development` and `main`.

#### Scenario: CI blocks merge on tsc failure

- GIVEN a PR introduces a new TypeScript error
- WHEN the CI pipeline runs `tsc --noEmit`
- THEN the check fails and the PR cannot be merged

#### Scenario: CI passes on clean codebase

- GIVEN the post-fix codebase with zero tsc errors
- WHEN CI runs `tsc --noEmit`
- THEN the check exits 0 and the PR can merge

### Requirement: Test Suite Integrity

All 887+ backend tests MUST pass after each phase.

#### Scenario: Tests green after Phase A

- GIVEN the codemod has modified import extensions
- WHEN `pnpm test` runs in `backend/`
- THEN all tests pass with zero regressions

#### Scenario: Tests green after Phase B

- GIVEN manual import path fixes
- WHEN `pnpm test` runs in `backend/`
- THEN all tests pass

#### Scenario: Tests green after Phase C

- GIVEN explicit type annotations added
- WHEN `pnpm test` runs in `backend/`
- THEN all tests pass (type annotations are compile-time only)

#### Scenario: Tests green after Phase D

- GIVEN type fixes in payment controllers, Redis, etc.
- WHEN `pnpm test` runs in `backend/`
- THEN all tests pass

### Requirement: Error Pattern Categories

The 979 errors break down into these categories, each addressed by a specific phase.

| Error Code | Count | Phase | Description |
|-----------|-------|-------|-------------|
| TS2835 | 484 | A | Missing `.js` extension (tsc suggests fix) |
| TS2834 | 165 | A | Missing extension (tsc can't suggest) |
| TS2307 | 166 | B | Module not found (extension + path) |
| TS7006 | 91 | C | Implicit `any` type |
| TS2339 | 21 | D | Property doesn't exist on type |
| TS2304 | 13 | D | Cannot find name |
| TS2345 | 10 | D | Argument type mismatch |
| TS18047 | 9 | D | Possibly null |
| TS7052 | 5 | D | Element implicitly has any (index signature) |
| TS2322 | 4 | D | Type assignment mismatch |
| TS2538 | 3 | D | Type undefined cannot be used |
| TS18046 | 3 | D | Type is unknown |
| TS2709 | 2 | D | Cannot use namespace as type |
| TS2351 | 1 | D | Expression not constructable |
| TS2731 | 1 | D | Cannot read properties of undefined |
| TS2698 | 1 | D | Spread types only from objects |

### Requirement: No Runtime Behavior Changes

The fix MUST be purely compile-time. No runtime behavior, API contracts, or database interactions change.

#### Scenario: API responses unchanged

- GIVEN an endpoint returning `{ success: true, data: [...] }`
- WHEN type fixes are applied
- THEN the response shape is identical

#### Scenario: Error handling behavior preserved

- GIVEN a `throw new AppError(400, 'CODE', 'message')`
- WHEN type annotations are added to catch blocks
- THEN the thrown error and caught error are the same object

## Acceptance Criteria

1. `tsc --noEmit` exits 0 in `backend/`
2. All 887+ backend tests pass after each phase
3. CI gate blocks PRs with tsc failures
4. Zero unjustified `@ts-expect-error` annotations
5. Each phase delivered as a separate PR (≤400 lines per PR)
6. No runtime behavior changes
