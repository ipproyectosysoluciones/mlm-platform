# Delta Spec: Wallet Payouts (Remaining Implementation)

## Purpose

Extend `wallet-payouts` with remaining core logic: full validation in `createWithdrawal`, auto mode in `processDailyPayouts` with per-gateway budget, and `syncFromGateway`/`syncPayoutStatuses` reconciliation. Base architecture in `openspec/changes/wallet-integration/specs/wallet-payouts/spec.md` and `design.md`.

## ADDED Requirements

### Requirement: Full Validation in createWithdrawal

The system SHALL validate in `createWithdrawal(userId, amount, destination)`:
1. **Destination required and valid**: `destination.email` required, valid email (PayPal). Error: `INVALID_DESTINATION` (400).
2. **Max per withdrawal**: `amount ≤ WALLET_MAX_WITHDRAWAL`. Error: `LIMIT_EXCEEDED` (400).
3. **Max daily per user UTC**: sum `requestedAmount` of `pending`+`approved`+`paid` today UTC + `amount ≤ WALLET_MAX_WITHDRAWAL_DAILY_PER_USER`. Error: `LIMIT_EXCEEDED` (400).
4. **Sufficient balance**: `wallet.balance ≥ amount + fee` (fee = `amount * feePercentage / 100`). Error: `INSUFFICIENT_BALANCE` (400).
5. **Minimum amount**: `amount ≥ WALLET_MIN_WITHDRAWAL` (20). Error: `MINIMUM_AMOUNT` (400).
6. **Immutable destination**: once created, `destination` cannot be modified.

#### Scenario: Invalid email rejected
- GIVEN user sends `destination: { email: "invalid" }`
- WHEN calling createWithdrawal
- THEN rejects with `INVALID_DESTINATION`

#### Scenario: Exceeds max per withdrawal
- GIVEN `WALLET_MAX_WITHDRAWAL=500`, user requests $600
- WHEN createWithdrawal
- THEN rejects with `LIMIT_EXCEEDED`

#### Scenario: Exceeds daily UTC limit
- GIVEN daily limit 1000, user has $800 today UTC, requests $300
- WHEN createWithdrawal
- THEN rejects with `LIMIT_EXCEEDED`

#### Scenario: Insufficient balance
- GIVEN user has $100 balance, requests $150 (fee 5% = $7.50, total $157.50)
- WHEN createWithdrawal
- THEN rejects with `INSUFFICIENT_BALANCE`

#### Scenario: Below minimum amount
- GIVEN user requests $10
- WHEN createWithdrawal
- THEN rejects with `MINIMUM_AMOUNT`

#### Scenario: Valid withdrawal created
- GIVEN user with $500 balance, requests $100 with valid email, within limits
- WHEN createWithdrawal
- THEN creates `pending` withdrawal with `destination`, `gateway='paypal'`, `feeAmount=5`, `netAmount=95`, debits wallet, creates transactions

### Requirement: processDailyPayouts Auto Mode with Budget

The system SHALL implement `processDailyPayouts()` in `auto` mode that:
1. Processes `approved` withdrawals FIFO by `createdAt`
2. Checks daily budget **per gateway**: sum `netAmount` of `paid` + en-flight (`gatewayPayoutId` set) today UTC
3. If `consumed + netAmount > budget(gateway)`: skips withdrawal (stays `approved`)
4. Idempotent: transaction + `SELECT FOR UPDATE` re-read; if status ≠ `approved` or has `gatewayPayoutId`, aborts
5. Calls `gateway.createPayout({ withdrawalId, amount: netAmount, destination })`
6. Persists `gatewayPayoutId`, `gatewayStatus='SENT'` (keeps `approved` = en-flight)
7. On gateway error: transitions to `failed`, notifies best-effort

#### Scenario: Within budget executes
- GIVEN `approved` withdrawal $100 netAmount, PayPal budget $500, consumed $200
- WHEN processDailyPayouts (auto)
- THEN calls gateway, persists gatewayPayoutId, gatewayStatus='SENT'

#### Scenario: Budget exhausted → queued
- GIVEN `approved` withdrawal $300, PayPal budget $500, consumed $500
- WHEN processDailyPayouts (auto)
- THEN does NOT call gateway, withdrawal stays `approved`

#### Scenario: Independent budgets per gateway
- GIVEN PayPal budget exhausted, MercadoPago budget available
- WHEN processDailyPayouts processes both
- THEN PayPal queued, MercadoPago execute (when enabled)

#### Scenario: Idempotent — no double send
- GIVEN withdrawal already sent (has gatewayPayoutId)
- WHEN processDailyPayouts runs again
- THEN lock re-read detects gatewayPayoutId, skips without resending

#### Scenario: Manual mode preserves flip
- GIVEN `WALLET_PAYOUT_MODE=manual`
- WHEN processDailyPayouts
- THEN approved → paid flip without gateway (current behavior)

### Requirement: SyncFromGateway / SyncPayoutStatuses Reconciliation

See `wallet-sync` spec. Summary:
- `syncFromGateway(payoutId, status)`: transaction + lock, only if `approved` with matching `gatewayPayoutId`; `paid` → `paid`+`processedAt`; `failed` → `failed`
- `syncPayoutStatuses()`: sweeps en-flight, calls `gateway.getStatus()` and `syncFromGateway`
- Primary webhook + poll reconciliation (every 4h configurable)

## MODIFIED Requirements

### Requirement: Withdrawal Destination — PayPal Only (MercadoPago Discarded)

> **Change per product decision 2026-08-02**: MercadoPago money-out lacks Developers API. `destination` now only supports `{ email }` for PayPal. `WithdrawalDestination` type simplified.
(Previously: destination supported PayPal email and MercadoPago CVU/CBUI)

#### Scenario: PayPal withdrawal with valid email (updated)
- GIVEN user creates withdrawal selecting PayPal
- WHEN submits valid email
- THEN withdrawal `pending` with `destination = { email }`, `gateway = 'paypal'`

#### Scenario: Invalid format rejected (updated)
- GIVEN user sends `destination` without email or invalid email
- WHEN createWithdrawal
- THEN 400 `INVALID_DESTINATION`

## Testing Additions

- Unit: createWithdrawal validation matrix
- Unit: processDailyPayouts auto: budget check, en-flight lock, idempotency, gateway error → failed
- Unit: processDailyPayouts manual: flip approved→paid without gateway
- Unit: syncFromGateway: paid/failed with lock; ignored if status≠approved or payoutId mismatch
- Unit: syncPayoutStatuses: iterates en-flight, getStatus, syncFromGateway
- Integration: Full flow: create→approve→auto job→gateway→webhook→paid

## References

- Original spec: `openspec/changes/wallet-integration/specs/wallet-payouts/spec.md`
- Original design: `openspec/changes/wallet-integration/design.md` (Flows 1,3,4,5; ADR #2, #8)
- Related specs: `wallet-admin`, `wallet-sync`, `wallet-notifications`, `wallet-config-api`