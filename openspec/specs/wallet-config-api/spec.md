# Wallet Config API Specification

## Purpose

Endpoint `GET /api/wallet/config` exposes withdrawal configuration to frontend: fee, minimum, maximums, payout mode, and available gateways. Eliminates frontend hardcodes (`MIN_WITHDRAWAL=20`, `FEE_PERCENTAGE=5`).

## Requirements

### Requirement: GET /api/wallet/config

The system SHALL expose `GET /api/wallet/config` (authenticated, featureGuard) returning runtime config from env.

#### Scenario: Frontend fetches config on wallet load
- GIVEN authenticated user accesses wallet
- WHEN frontend calls GET /api/wallet/config
- THEN responds 200 with fee, min, max, maxDaily, payoutMode, gateways

#### Scenario: Config reflects env values
- GIVEN env: `WALLET_MIN_WITHDRAWAL=20`, `WALLET_FEE_PERCENTAGE=5`, `WALLET_MAX_WITHDRAWAL=500`, `WALLET_MAX_WITHDRAWAL_DAILY_PER_USER=1000`, `WALLET_PAYOUT_MODE=manual`
- WHEN endpoint called
- THEN response matches those values

#### Scenario: Safe defaults without env
- GIVEN environment without new variables
- WHEN endpoint called
- THEN uses defaults: min=20, fee=5%, max=500, maxDaily=1000, mode=manual, gateways=['paypal']

## API Contract

**GET /api/wallet/config**
```
Headers: Authorization: Bearer <token>
Response 200:
{
  "success": true,
  "data": {
    "minWithdrawal": 20,
    "feePercentage": 5,
    "maxWithdrawal": 500,
    "maxWithdrawalDailyPerUser": 1000,
    "payoutMode": "manual",
    "gateways": ["paypal"]
  }
}
Response 503: { "success": false, "error": { "code": "FEATURE_DISABLED" } }  // if featureGuard OFF
Response 401: { "success": false, "error": { "code": "UNAUTHORIZED" } }
```

## Frontend Type

```typescript
// frontend/src/types/wallet.ts
export interface WalletConfig {
  minWithdrawal: number;
  feePercentage: number;
  maxWithdrawal: number;
  maxWithdrawalDailyPerUser: number;
  payoutMode: 'manual' | 'auto';
  gateways: ('paypal' | 'mercadopago')[];
}
```

## Frontend Consumption
- On mount: calls `walletStore.fetchWalletConfig()`
- Displays fee/min/max dynamically (no hardcodes)
- Client-side validation using `config.minWithdrawal`, `config.maxWithdrawal`
- Sends request with validated `amount`

## Key Behaviors
- **Controller**: reads from env config object with safe defaults
- **Env config**: adds `payoutMode`, `budgetPaypal`, `budgetMercadopago`, `maxWithdrawal`, `maxWithdrawalDailyPerUser`, `pollCron`, `minWithdrawal`, `feePercentage`
- **Route**: `GET /config` with `authenticateToken` + `featureGuard('cryptoWallet')`
- **Payout credentials**: reuse existing `PAYPAL_CLIENT_ID/SECRET` + `PAYPAL_MODE` and `MERCADOPAGO_ACCESS_TOKEN` (extend permissions in provider dashboard)

## Testing

| Test | Description |
|------|-------------|
| Unit | getConfig returns correct structure with env values |
| Unit | Defaults applied when env not set |
| Integration | GET /wallet/config with valid auth → 200 config; no auth → 401; feature OFF → 503 |
| Frontend (Vitest) | walletStore.fetchWalletConfig calls API, updates store; WithdrawalForm uses config for validation/display |

## References

- Original design: `openspec/changes/wallet-integration/design.md` (File Changes: WalletController.ts GET /wallet/config, env.ts, wallet.routes.ts)
- Related specs: `wallet-payouts` (fee/min/max used in createWithdrawal validation), frontend specs (WithdrawalForm consumes config)