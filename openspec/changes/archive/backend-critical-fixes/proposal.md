# Proposal: Backend Critical Fixes

## Intent

Fix 5 critical/high-severity backend issues discovered in pre-Phase 2 audit. These issues pose production risks: Docker sync can corrupt data, in-memory rate limiting leaks memory, scheduler is dead code, N+1 queries degrade performance, and debug endpoints expose unauthenticated admin access. Must be resolved before Phase 2-3 to prevent production incidents.

## Scope

### In Scope
- **F001**: Remove `--alter` sync from Docker ENTRYPOINT, use migrations
- **F002**: Add tests for email/payout tasks, activate `scheduler.start()`
- **F003**: Replace in-memory rate limiter with Redis-backed store
- **F004**: Fix N+1 queries in CommissionService (MLM levels, bonuses, caps)
- **F005**: Add auth middleware to debug endpoints or disable in production

### Out of Scope
- F006-F013 (medium/low severity findings)
- Full backend refactoring
- Performance optimization beyond N+1 fixes
- Infrastructure changes beyond Redis for rate limiting

## Capabilities

### New Capabilities
- `backend-fixes-docker`: Docker entrypoint migration runner
- `backend-fixes-scheduler`: Scheduler activation with tests
- `backend-fixes-security`: Redis rate limiter, debug endpoint auth

### Modified Capabilities
- `backend`: CommissionService eager loading for MLM queries

## Approach

Surgical fixes with feature-branch chain (5 PRs):
1. **F001**: Remove sync from Dockerfile, create migration runner script
2. **F002**: Write unit tests for SchedulerService tasks, then call `scheduler.start()` in server.ts
3. **F003**: Install `rate-limit-redis`, configure Redis store, update middleware
4. **F004**: Add `include` eager loading to CommissionService queries
5. **F005**: Wrap debug routes with auth middleware or add NODE_ENV guard

Each fix is isolated and independently deployable.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `Dockerfile` | Modified | Remove `--alter` from ENTRYPOINT |
| `scripts/` | New | Migration runner script |
| `src/server.ts` | Modified | Add `scheduler.start()` |
| `src/services/SchedulerService.ts` | Modified | Add tests, activate |
| `src/middleware/rateLimiter.ts` | Modified | Redis store integration |
| `src/services/CommissionService.ts` | Modified | Eager loading |
| `src/app.ts` | Modified | Debug endpoint auth |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Redis not available in dev | Medium | Fallback to memory store in dev mode |
| Migration runner fails | Low | Test with `--dry-run` before production |
| Scheduler causes email spam | Medium | Add rate limiting to email tasks |
| Eager loading increases memory | Low | Use `attributes` to select fields only |

## Rollback Plan

- **F001**: Revert Dockerfile, restore sync flag
- **F002**: Remove `scheduler.start()` call, keep tests
- **F003**: Revert to memory store, remove Redis dependency
- **F004**: Remove `include` clauses, revert to lazy loading
- **F005**: Remove auth middleware from debug routes

Each PR is independent — revert any single fix without affecting others.

## Dependencies

- Redis instance available for F003 (production)
- Jest test runner for F002

## Success Criteria

- [ ] F001: Docker starts without sync, migrations run cleanly
- [ ] F002: `scheduler.start()` called, email/payout tests pass
- [ ] F003: Rate limit state persists across restarts, no memory leaks
- [ ] F004: Commission queries execute in 1-2 DB calls (not N)
- [ ] F005: Debug endpoints return 401 without auth token

## Proposal Question Round

**Assumptions to verify:**
1. Redis is available in production environment?
2. Email/payout tasks have existing test coverage or need full rewrite?
3. Debug endpoints should be disabled in production vs. auth-protected?
4. N+1 fixes should use `findAll({ include })` or batch queries?

Ready for sdd-spec or sdd-design phase.
