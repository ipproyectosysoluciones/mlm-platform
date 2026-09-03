# Proposal: Wallet Integration — Continue (Remaining Implementation)

## Intent

Complete the wallet money-out implementation started in `wallet-integration`. The original change delivered schema, PayPal gateway, and infrastructure (12 tasks done). **29 tasks remain** across phases 3–9: WalletService core logic, admin approval + notifications, gateway sync (webhook/poll), frontend destination + config, and E2E fix #347. This change captures ONLY the remaining work — it references the existing `wallet-integration` proposal/design/specs as the source of truth for architecture.

## Scope

### In Scope
- **WalletService core**: `createWithdrawal` validation (INVALID_DESTINATION, LIMIT_EXCEEDED, saldo, mínimo, destino inmutable), `processDailyPayouts` auto mode (budget check, en-flight + lock, per-gateway independence)
- **Config/Env**: `payoutMode`, budgets (`budgetPaypal`/`budgetMercadopago`), maxWithdrawal, maxWithdrawalDailyPerUser, pollCron; `GET /wallet/config` endpoint
- **Admin approval + notifications**: `approveWithdrawal`/`rejectWithdrawal`/`listWithdrawals` (SELECT FOR UPDATE, 409 on double approve), `WalletNotificationService` (Brevo emails for approved/paid/rejected/failed), admin-wallet routes
- **Gateway sync**: `syncFromGateway` (webhook-driven with lock), `syncPayoutStatuses` (poll reconciliation), `PayoutWebhookController` (verify signature, idempotency), webhook routes (no featureGuard), SchedulerService sweep
- **Transaction type mapping**: `getTransactions` commission→commission_earned, refund→adjustment; frontend TransactionHistory enum update
- **Frontend**: `walletStore.createWithdrawal(amount, destination)`, `getWalletConfig()` API, WithdrawalForm gateway selector + destination + fee/min/max from API, WalletConfig type, admin pages (WalletWithdrawalsPage + WithdrawalApprovalModal)
- **E2E fix #347**: Enable flags in test env, real assertions, destination flow, remove `.catch` vacuous

### Out of Scope
- Schema/migration (done in wallet-integration PR 1)
- PayPalPayoutsGateway + factory (done in wallet-integration PR 2a)
- MercadoPago gateway (discarded per product decision 2026-08-02)
- Production flag enablement (decision at merge)
- Crypto exchange, deposits, multi-currency, real-time payouts

## Capabilities

### New Capabilities
- `wallet-admin`: admin approval/rejection/listing with budget awareness and SELECT FOR UPDATE
- `wallet-notifications`: Brevo email notifications for withdrawal state transitions (best-effort, retry on next job)
- `wallet-sync`: webhook/poll synchronization of payout status with idempotency and lock protection
- `wallet-config-api`: GET /wallet/config exposing fee, min, max, payoutMode, gateways

### Modified Capabilities
- `wallet-payouts`: extend with `createWithdrawal` validation, `processDailyPayouts` auto mode, `syncFromGateway`, `syncPayoutStatuses`
- `wallet-transactions`: add type mapping (frontend legacy → backend enum) — already specified, needs implementation
- `backend`: add admin endpoints, config endpoint, notification service, webhook routes, scheduler sweeps
- `frontend`: add destination field, gateway selector, config consumption, admin pages, E2E fix

## Approach

Reference architecture from `openspec/changes/wallet-integration/design.md` — do not duplicate. Key patterns to follow:
- `PayoutGateway` abstraction already exists; WalletService delegates to it
- Budget check in `processDailyPayouts` auto mode: sum netAmount of paid + en-flight (gatewayPayoutId set) per gateway today UTC
- Idempotency: SELECT FOR UPDATE re-read before gateway call; `sender_batch_id`/`external_reference` = withdrawalId
- Webhook primary + poll reconciliation sweep every 4h (configurable); both call `syncFromGateway` with lock
- Brevo emails best-effort: state persists first, `lastNotifiedStatus`/`lastNotifiedAt` columns drive retry sweep
- Frontend consumes `/wallet/config` for fee/min/max (no hardcodes); destination validated per gateway

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/services/WalletService.ts` | Modified | Core: createWithdrawal validation, processDailyPayouts auto, syncFromGateway, syncPayoutStatuses, approve/reject |
| `backend/src/services/WalletNotificationService.ts` | New | Brevo emails for state transitions (best-effort) |
| `backend/src/services/SchedulerService.ts` | Modified | Sweep poll (WALLET_PAYOUT_POLL_CRON) + notification retry |
| `backend/src/config/env.ts` | Modified | payoutMode, budgets, maxWithdrawal, maxDaily, pollCron |
| `backend/src/controllers/WalletController.ts` | Modified | GET /wallet/config handler |
| `backend/src/controllers/AdminWalletController.ts` | New | list/approve/reject with SELECT FOR UPDATE |
| `backend/src/controllers/PayoutWebhookController.ts` | New | verify signature + idempotency + syncFromGateway |
| `backend/src/routes/wallet.routes.ts` | Modified | GET /config |
| `backend/src/routes/admin-wallet.routes.ts` | New | featureGuard + authenticate + requireAdmin |
| `backend/src/routes/webhook-payout.routes.ts` | New | /payment/paypal/payout-webhook (no featureGuard) |
| `backend/src/routes/index.ts` | Modified | mount admin + webhook routes |
| `frontend/src/services/api/wallet.ts` | Modified | createWithdrawal with destination, getWalletConfig, admin methods |
| `frontend/src/stores/walletStore.ts` | Modified | createWithdrawal(amount, destination), fetchWalletConfig |
| `frontend/src/components/WithdrawalForm.tsx` | Modified | gateway selector, destination field, fee/min/max from API |
| `frontend/src/components/TransactionHistory.tsx` | Modified | correct enum values |
| `frontend/src/pages/admin/WalletWithdrawalsPage.tsx` | New | admin listing |
| `frontend/src/components/admin/WithdrawalApprovalModal.tsx` | New | admin modal with destination confirmation |
| `frontend/src/types/wallet.ts` | Modified | WalletConfig type, correct enums |
| `frontend/e2e/wallet.spec.ts` | Modified | fix #347: flags ON, real assertions |
| `frontend/.env.test` / backend test env | Modified | flags ON for test/CI |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Double payout on job retry / race | High | SELECT FOR UPDATE re-read; gateway idempotency key = withdrawalId; state check before `paid` |
| Webhook signature verification bypass | Med | Reuse PayPalService/MercadoPagoService verifyWebhookSignature; 403 on invalid |
| Email failure masks state transition | Low | State persists first; `lastNotifiedStatus` drives retry sweep; email never blocks |
| Budget exhaustion silent skip | Med | Log skipped withdrawals; admin sees `approved` pending in list |
| E2E flakiness from env flags | Med | Dedicated test env files; CI sets both backend + frontend flags explicitly |
| Transaction type mapping regression | Low | Unit tests for commission→commission_earned, refund→adjustment mapping |

## Rollback Plan

1. **Feature**: disable flags (`FEATURE_CRYPTO_WALLET=false`, `VITE_FEATURE_CRYPTO_WALLET` unset) → 503/hidden behavior restored
2. **DB**: no new migrations (schema done in wallet-integration); if needed, new columns are nullable
3. **Code**: revert chained PRs in reverse order (frontend → admin → sync → walletService core → config)
4. **Verify**: suite passes with flags OFF (7 expected feature-disabled failures, no new errors)

## Dependencies

- Existing artifacts: `openspec/changes/wallet-integration/` (proposal.md, design.md, specs/, tasks.md) — **source of truth for architecture**
- PayPalPayoutsGateway + factory already implemented (wallet-integration PR 2a)
- BrevoEmailService operational
- CoinGecko (prices only, no key) — not a payout dependency

## Delivery & Review

- **Delivery strategy**: ask-on-risk (from session preflight)
- **Chain strategy**: feature-branch-chain (matching existing wallet-integration)
- **PR budget**: ~200-300 lines per work unit for clean chained PRs
- **All PRs assigned to user for review before merge** (project rule)
- Work units align with phases 3-9 from original tasks.md

## Success Criteria

- [ ] `createWithdrawal` validates destination, limits, saldo, mínimo; destino inmutable
- [ ] `processDailyPayouts` auto mode executes via gateway, respects per-gateway budget, idempotent
- [ ] Admin approve/reject with SELECT FOR UPDATE, 409 on double approve, rejectionReason required
- [ ] Brevo emails sent on approved/paid/rejected/failed; retry on next job if failed
- [ ] Webhook verifies signature, idempotent (WebhookEvent), calls syncFromGateway with lock
- [ ] Poll sweep (WALLET_PAYOUT_POLL_CRON) reconciles en-flight payouts
- [ ] `getTransactions` maps commission→commission_earned, refund→adjustment
- [ ] Frontend: WithdrawalForm uses API config, gateway selector, destination validation
- [ ] Admin pages: WalletWithdrawalsPage + WithdrawalApprovalModal with destination
- [ ] E2E wallet.spec.ts passes with flags ON in test env, no vacuous `.catch`
- [ ] Flags OFF in production verified post-merge
- [ ] Test coverage ≥65% (backend + frontend)

---

**Change**: wallet-integration-continue
**Branch**: feature/wallet-integration-continue
**Mode**: HYBRID (engram + openspec)
**Reference Change**: wallet-integration (openspec/changes/wallet-integration/)

(End of proposal)