# Tasks: Sprint 11 — Quick Wins

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~25 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Note: Item 1 (security merge) already completed

PR #173 (`chore/security-updates-v3.1`) is already merged into `development`. No action needed.

## Phase 1: Fix Push Notification Tests

- [ ] 1.1 Add `PushSubscription` to model imports in `backend/src/__tests__/setup.ts` — add import destructuring (line 62) and `void PushSubscription` (line 95)
- [ ] 1.2 Remove `.skip` from 4 tests in `backend/src/__tests__/integration/push.test.ts` (lines 29, 130, 150, 187)
- [ ] 1.3 Run `pnpm test:backend -- --testPathPattern=push` and confirm all previously skipped tests pass (expect ~11 tests, 0 skipped)

## Phase 2: Replace console.warn with Pino Logger

- [ ] 2.1 Add `import { logger } from '../utils/logger';` at top of `backend/src/config/env.ts` (after line 29)
- [ ] 2.2 Replace `console.warn(` with `logger.warn(` on line 240 of `env.ts`

## Phase 3: Documentation

- [ ] 3.1 Update `CHANGELOG.md` — add `[3.1.0]` section documenting the two fixes
