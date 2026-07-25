# Proposal: TypeScript Strict Mode Error Elimination

## Intent

Backend has 979 TypeScript strict errors (`tsconfig.json: strict: true, moduleResolution: NodeNext`) that go undetected because Rollup/esbuild bypasses `tsc`. This means type errors ship to production silently. Fixing them enables a blocking CI gate (`tsc --noEmit`) so type correctness is enforced before merge.

**Linked issues**: #243 (979 errors), #244 (CI gate), #245 (UserService/VendorService error middleware), #246 (WalletService unique symbol index), #247 (types/index.ts missing ProductListOptions)

## Scope

### In Scope
- Eliminate all 979 `tsc --noEmit` errors in `backend/src/`
- Add `tsc --noEmit` as blocking CI step (Issue #244)
- Fix WalletService unique symbol index (Issue #246)
- Fix types/index.ts missing ProductListOptions (Issue #247)
- Add error.middleware to UserService/VendorService (Issue #245)

### Out of Scope
- Frontend or bot TypeScript errors
- Migrating build from Rollup/esbuild to tsc
- Adding new type features beyond error elimination
- Strict mode for non-backend packages

## Capabilities

### New Capabilities
None — this is a pure type-safety refactor with no new runtime behavior.

### Modified Capabilities
None — no spec-level behavior changes. Existing backend API contracts remain identical.

## Approach

Four-phase strategy: automated codemod first, surgical fixes after. Each phase = separate PR (≤400 lines, feature-branch-chain).

### Phase A: .js Extension Codemod (~650 errors)
Automated codemod replacing `.js` extension imports with correct `.ts` extensions under `moduleResolution: NodeNext`. ~650 of 979 errors are this category. Run across all `backend/src/` files.

### Phase B: Broken Import Paths (~166 errors)
Manual fix of import paths that the codemod cannot resolve — circular references, missing barrel exports, wrong directory traversals. Each fix verified by running `tsc --noEmit` on affected files.

### Phase C: Explicit `any` Annotations (~91 errors)
Surgical `// @ts-expect-error` or typed catch blocks for remaining `any` usage. Priority order:
1. Issue #245: UserService/VendorService error middleware
2. Issue #246: WalletService unique symbol index
3. Issue #247: types/index.ts ProductListOptions
4. Remaining `catch (error: any)` → typed error handling

### Phase D: Type Fixes (~34 errors)
Final surgical type corrections — wrong generics, missing properties, incorrect return types. Verified file-by-file.

### CI Gate (Issue #244)
Add `tsc --noEmit` as blocking GitHub Actions step. PRs cannot merge if tsc fails. Depends on all 979 errors being resolved.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/**/*.ts` | Modified | Import paths, type annotations, error handling |
| `backend/tsconfig.json` | Modified | May need `skipLibCheck` adjustments |
| `.github/workflows/*.yml` | New | tsc --noEmit CI gate |
| `backend/src/services/user.service.ts` | Modified | Error middleware (Issue #245) |
| `backend/src/services/vendor.service.ts` | Modified | Error middleware (Issue #245) |
| `backend/src/services/wallet.service.ts` | Modified | Unique symbol index (Issue #246) |
| `backend/src/types/index.ts` | Modified | ProductListOptions (Issue #247) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Codemod introduces runtime import breakage | Medium | Run full test suite (887 tests) after Phase A |
| Phase B manual fixes introduce type regressions | Low | `tsc --noEmit` catches all; per-file verification |
| CI gate blocks legitimate PRs during transition | Low | Phased rollout: merge fixes first, enable gate last |
| `@ts-expect-error` masks real bugs (Phase C) | Low | Audit each annotation; prefer typed catch over suppression |

## Rollback Plan

- Each phase is a separate PR — revert individual PRs if issues arise
- CI gate (#244) is last merge — remove the workflow file to disable
- Codemod (Phase A) is fully reversible via git revert
- All 887 backend tests serve as regression safety net

## Dependencies

- **Issue #243**: Parent issue tracking all 979 errors
- **Issue #244**: CI gate (depends on #243 completion — must merge after all errors resolved)
- **Issue #245**: UserService/VendorService error middleware (Phase C priority)
- **Issue #246**: WalletService unique symbol index (Phase C priority)
- **Issue #247**: types/index.ts ProductListOptions (Phase C priority)
- **887 existing backend tests**: Must remain green after every phase

## Success Criteria

- [ ] `tsc --noEmit` exits 0 for `backend/src/`
- [ ] All 887 backend tests pass after each phase
- [ ] CI gate blocks PRs with tsc failures (Issue #244)
- [ ] Issues #245, #246, #247 resolved
- [ ] Zero `@ts-expect-error` annotations added without justification
- [ ] No runtime behavior changes (pure type-safety improvement)
