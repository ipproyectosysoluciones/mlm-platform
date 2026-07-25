# Design: Fix Service Error Handling

## Pattern

Follow the existing LeaderboardService pattern for consistency:

```ts
import { logger } from '../utils/logger';

async someMethod(params: Params): Promise<Result> {
  try {
    // existing implementation
    return result;
  } catch (error) {
    logger.error({ service: 'ServiceName', method: 'someMethod', error }, 'Operation failed');
    throw error;
  }
}
```

## Files to Modify

1. `backend/src/services/R2Service.ts` — wrap 3 methods
2. `backend/src/services/QRService.ts` — wrap 5 methods
3. `backend/src/services/MercadoPagoService.ts` — wrap 5 methods

## Error Context

Each log entry includes:
- `service`: class name (e.g., `R2Service`)
- `method`: method name (e.g., `uploadImage`)
- `error`: the caught error object

## No New Dependencies

- Uses existing `logger` from `../utils/logger`
- No new error types or utilities needed
- No changes to method signatures or return types

## Testing Strategy

- Existing tests already cover success paths — they must still pass
- Add 1-2 error path tests per service to verify logging and rethrowing
- Use `vi.mock` or `jest.mock` to force S3/QR/MP errors
