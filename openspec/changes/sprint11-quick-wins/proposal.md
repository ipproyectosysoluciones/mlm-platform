# Proposal: Sprint 11 — Quick Wins

## Intent

Resolve 3 quick-win items identified in the post-v3.0.0 MVP exploration and technical debt audit (openspec/specs/technical-debt.md): finish a pending security merge, fix 4 skipped push notification tests, and replace a `console.warn` with Pino logger in env configuration.

## Scope

### In Scope
1. **Merge `chore/security-updates-v3.1` into `development`** — dep bumps for lodash, nodemailer, axios
2. **Fix 4 skipped push notification integration tests** — identify root cause, fix model/associations, unskip tests
3. **Replace `console.warn` with Pino logger in `env.ts:240`** — align with existing Pino infrastructure

### Out of Scope
- Moving all remaining `console.*` calls to Pino project-wide (tracked as technical-debt priority item)
- Full PushSubscription feature rework or UI push notification implementation

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `backend` — REQ-BACK-* (push notification subscribe/unsubscribe endpoint behavior): Fix existing subscription tests; no spec-level behavior changes needed

## Approach

### Item 1: Merge security branch
**Status**: ALREADY COMPLETED. PR #173 already merged `chore/security-updates-v3.1` into `development`. Close as done.

### Item 2: Fix 4 skipped push tests
**Root cause**: `PushSubscription` model is NOT imported in `backend/src/__tests__/setup.ts` lines 32-63. The `beforeAll` block calls `sequelize.sync({ force: true })` but only the imported models get their tables created. Without the table, the POST `/api/push/subscribe` controller returns 500.

**Fix**:
1. Add `PushSubscription` to the model import list in `setup.ts`
2. Run the tests, verify they pass
3. Remove `.skip` from the 4 tests (lines 29, 130, 150, 187)

### Item 3: Replace console.warn with Pino
1. Add `import { logger } from '../utils/logger'` at top of `env.ts`
2. Replace `console.warn(...)` with `logger.warn(...)` on line 240

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/__tests__/setup.ts` | Modified | Add PushSubscription model import |
| `backend/src/__tests__/integration/push.test.ts` | Modified | Remove `.skip` from 4 tests |
| `backend/src/config/env.ts` | Modified | Add logger import, replace console.warn |
| `backend/package.json` | Already merged | Security dep bumps (done via PR #173) |
| `package.json` | Already merged | Security dep bumps (done via PR #173) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Push test fix reveals deeper model issue (e.g., JSONB handling) | Low | Fix iteratively; test isolation via existing truncation pattern |
| Pino logger import causes circular dependency | Low | logger.ts has no env.ts dependency; safe to import |
| Merge already done — no-op risk (wasted effort) | None confirmed | Verify with `git log` — PR #173 is already merged |

## Rollback Plan

- **Item 1**: Already merged; revert via `git revert` of the merge commit if needed
- **Item 2**: Re-add `.skip` on the 4 tests; undo import in `setup.ts`
- **Item 3**: Revert the `env.ts` changes to restore `console.warn`

## Dependencies

- PostgreSQL test database running (existing setup)
- `chore/security-updates-v3.1` branch already merged (no action needed)

## Success Criteria

- [ ] `git log development` confirms PR #173 is merged and security deps are updated
- [ ] 4 previously skipped push tests pass in CI (`pnpm test:backend` includes push.test.ts)
- [ ] `env.ts` uses `logger.warn` instead of `console.warn`; no Pino import errors
