# Delta Spec: Backend (Remaining Wallet Endpoints & Services)

## Purpose

Implement remaining backend endpoints and services from `wallet-integration`: config endpoint, admin endpoints, webhook endpoints, notification service, scheduler sweeps, and env config. Base architecture in `openspec/changes/wallet-integration/design.md` and `specs/backend/spec.md`.

## ADDED Requirements

### Requirement: GET /api/wallet/config

See `wallet-config-api` spec. Summary: authenticated + featureGuard endpoint returning `minWithdrawal`, `feePercentage`, `maxWithdrawal`, `maxWithdrawalDailyPerUser`, `payoutMode`, `gateways` from env with safe defaults.

### Requirement: Admin Withdrawal Endpoints

See `wallet-admin` spec. Summary:
- `GET /api/admin/wallet/withdrawals` — paginated, status/gateway filters, includes destination
- `POST /api/admin/wallet/withdrawals/:id/approve` — pending→approved, failed→approved (retry), 409 on invalid transitions, SELECT FOR UPDATE
- `POST /api/admin/wallet/withdrawals/:id/reject` — pending→rejected, rejectionReason required, 409 on invalid
- Protected: featureGuard + authenticateToken + requireAdmin

### Requirement: PayPal Payout Webhook

See `wallet-sync` spec. Summary:
- `POST /api/payment/paypal/payout-webhook` — NO featureGuard
- Signature verification (PayPalService.verifyWebhookSignature)
- Idempotency via WebhookEvent (event_id + provider unique)
- Delegates to WalletService.syncFromGateway
- MercadoPago placeholder for future

### Requirement: WalletNotificationService

See `wallet-notifications` spec. Summary:
- `notifyWithdrawalStatus(withdrawal, status)` — approved/paid/rejected/failed
- Best-effort: state persists first, email doesn't block
- Tracking via `lastNotifiedStatus`/`lastNotifiedAt` on WithdrawalRequest
- `retryPendingNotifications()` — sweep to retry failed

### Requirement: SchedulerService Sweeps

The system SHALL extend `SchedulerService` with three conditional jobs (only if `features.cryptoWallet` and `payoutMode === 'auto'`):
1. **Daily Payout Job** (existing `cronTime`): `WalletService.processDailyPayouts()`
2. **Poll Reconciliation Sweep** (`WALLET_PAYOUT_POLL_CRON`, default `0 */4 * * *`): `WalletService.syncPayoutStatuses()`
3. **Notification Retry Sweep** (every 30 min `*/30 * * * *`): `WalletNotificationService.retryPendingNotifications()`

### Requirement: Extended Env Config

The system SHALL read at runtime (no rebuild) the new variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `WALLET_PAYOUT_MODE` | `manual` | `manual` \| `auto` |
| `WALLET_PAYOUT_BUDGET_PAYPAL` | `1000` | Daily USD budget PayPal |
| `WALLET_PAYOUT_BUDGET_MERCADOPAGO` | `1000` | Daily USD budget MP (placeholder) |
| `WALLET_MAX_WITHDRAWAL` | `500` | Max per withdrawal |
| `WALLET_MAX_WITHDRAWAL_DAILY_PER_USER` | `1000` | Max daily per user UTC |
| `WALLET_PAYOUT_POLL_CRON` | `0 */4 * * *` | Poll sweep cron |
| `WALLET_MIN_WITHDRAWAL` | `20` | Min per withdrawal (existing) |
| `WALLET_FEE_PERCENTAGE` | `5` | Fee % (existing) |
| `PAYPAL_PAYOUT_WEBHOOK_ID` | `''` | Webhook ID for payout signature |
| `MERCADOPAGO_PAYOUT_WEBHOOK_ID` | `''` | Webhook ID MP (placeholder) |

Payout credentials: reuse `PAYPAL_CLIENT_ID/SECRET` + `PAYPAL_MODE` and `MERCADOPAGO_ACCESS_TOKEN` (extend permissions in provider dashboard).

## Modified Files (Implementation Focus)

| File | Change |
|------|--------|
| `backend/src/services/WalletService.ts` | **Major**: createWithdrawal validations, processDailyPayouts auto+budget+lock, syncFromGateway, syncPayoutStatuses, approveWithdrawal, rejectWithdrawal, listWithdrawals |
| `backend/src/services/WalletNotificationService.ts` | **New**: Brevo emails best-effort + retry |
| `backend/src/services/SchedulerService.ts` | **Modify**: add poll sweep + notification retry sweep |
| `backend/src/config/env.ts` | **Modify**: add payoutMode, budgets, maxWithdrawal, maxDaily, pollCron, minWithdrawal, feePercentage, payoutWebhookIds |
| `backend/src/controllers/WalletController.ts` | **Modify**: add getConfig handler |
| `backend/src/controllers/AdminWalletController.ts` | **New**: list, approve, reject (SELECT FOR UPDATE, 409, rejectionReason) |
| `backend/src/controllers/PayoutWebhookController.ts` | **New**: paypalWebhook (verify signature, idempotency, syncFromGateway) |
| `backend/src/routes/wallet.routes.ts` | **Modify**: add GET /config |
| `backend/src/routes/admin-wallet.routes.ts` | **New**: featureGuard + auth + requireAdmin + adminLimiter |
| `backend/src/routes/webhook-payout.routes.ts` | **New**: /payment/paypal/payout-webhook (raw body, no featureGuard) |
| `backend/src/routes/index.ts` | **Modify**: mount /admin/wallet + /payment/*/payout-webhook |

## Testing Focus

| Layer | Tests |
|-------|-------|
| Unit (Jest) | WalletService: createWithdrawal validation matrix; processDailyPayouts manual/auto/budget/idempotent; approve/reject transitions (409); syncFromGateway paid/failed/lock; notification retry |
| Unit | WalletNotificationService: each status correct template; Brevo failure doesn't throw; retry finds mismatch |
| Unit | AdminWalletController: 403 no-admin, 409 double approve, reject without reason 400, failed→approved retry, pagination |
| Unit | PayoutWebhookController: invalid signature→403; duplicate→200 duplicate; payout event→syncFromGateway |
| Integration | Admin endpoints Supertest; webhook E2E; poll sweep |

## References

- Original design: `openspec/changes/wallet-integration/design.md` (Component Architecture, Flows 2,3,4,5,6, File Changes table, Config Env table)
- Original backend spec: `openspec/changes/wallet-integration/specs/backend/spec.md`
- Related specs: `wallet-payouts`, `wallet-admin`, `wallet-sync`, `wallet-notifications`, `wallet-config-api`