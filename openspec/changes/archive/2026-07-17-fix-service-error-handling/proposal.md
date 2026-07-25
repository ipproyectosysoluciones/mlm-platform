# Proposal: Fix Service Error Handling (SPEC-4.2)

## Intent

Three backend services (R2Service, QRService, MercadoPagoService) have async methods without try/catch error handling. In production, unhandled exceptions in these services leak stack traces to clients and return generic 500 errors. This was identified as a gap in Sprint 9 (task 5.4) — LeaderboardService was fixed but these three were missed.

## Scope

### In Scope
- Add try/catch to all async methods in R2Service (3 methods)
- Add try/catch to all async methods in QRService (5 methods)
- Add try/catch to all async methods in MercadoPagoService (5 methods)
- Log errors via centralized Pino logger
- Rethrow typed errors (not raw exceptions)

### Out of Scope
- LeaderboardService — already has try/catch (20 try blocks)
- Error handling in controllers — controllers already have their own error middleware
- New error types or error handling utilities — use existing patterns

## Approach

Wrap each async method body in try/catch. On catch:
1. Log via `logger.error` with service context and error details
2. Rethrow a typed error (or the original error with added context)

Follow the existing pattern in LeaderboardService for consistency.

## Success Criteria

- [ ] All 13 async methods across 3 services have try/catch
- [ ] Errors logged via Pino logger with service name context
- [ ] No stack traces leaked to clients
- [ ] All existing tests still pass
- [ ] New tests verify error handling behavior
