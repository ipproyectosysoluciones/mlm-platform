# Wallet Sync Specification

## Purpose

Payout state synchronization between gateway and DB: **webhook (primary, low latency)** + **poll (reconciliation, every 4h configurable)**. Both converge on idempotent `syncFromGateway` with lock/transaction. Webhook idempotency via `WebhookEvent` table (existing pattern in PayPalService).

## Requirements

### Requirement: PayPal Payout Webhook (Primary)

The system SHALL expose `POST /api/payment/paypal/payout-webhook` (NO featureGuard: external callback) that verifies signature, enforces idempotency, and delegates to `syncFromGateway`.

#### Scenario: Valid webhook confirms paid payout
- GIVEN PayPal sends `PAYOUTS.ITEM.SUCCEEDED` webhook with valid signature
- WHEN controller processes event
- THEN `syncFromGateway(payoutId, 'paid')` transitions withdrawal to `paid` with `processedAt`

#### Scenario: Invalid webhook rejected
- GIVEN webhook with invalid signature or malformed payload
- WHEN controller verifies
- THEN responds 403 INVALID_SIGNATURE, does NOT touch DB

#### Scenario: Duplicate event ignored
- GIVEN same `eventId` already processed (WebhookEvent table)
- WHEN duplicate webhook arrives
- THEN responds 200 `{ received: true, duplicate: true }`, does NOT reprocess

#### Scenario: Non-payout event ignored
- GIVEN webhook of other type (e.g., `PAYMENT.CAPTURE.COMPLETED`)
- WHEN controller receives it
- THEN responds 200 `{ received: true }` without calling `syncFromGateway`

### Requirement: Poll Reconciliation Sweep

The system SHALL execute `syncPayoutStatuses()` on configurable cron (`WALLET_PAYOUT_POLL_CRON`, default `0 */4 * * *`) only in `auto` mode. Queries `getStatus` for each `approved` withdrawal with `gatewayPayoutId` and syncs.

#### Scenario: Poll detects paid payout
- GIVEN `approved` withdrawal with `gatewayPayoutId` en-flight
- WHEN sweep runs and `getStatus` returns `paid`
- THEN `syncFromGateway` transitions to `paid` with `processedAt`

#### Scenario: Poll detects failed payout
- GIVEN `approved` withdrawal with `gatewayPayoutId`
- WHEN sweep runs and `getStatus` returns `failed`
- THEN `syncFromGateway` transitions to `failed`

#### Scenario: Poll no change for pending/processing
- GIVEN en-flight withdrawal with `pending` status at gateway
- WHEN sweep runs
- THEN NO state transition (next cycle)

### Requirement: syncFromGateway Idempotent with Lock

The system SHALL implement `syncFromGateway(payoutId, status)` that ONLY transitions if: (1) withdrawal exists with that `gatewayPayoutId`, (2) current status is `approved`, (3) transaction + `SELECT FOR UPDATE` protects against races.

#### Scenario: Successful sync to paid
- GIVEN `approved` withdrawal with matching `gatewayPayoutId`
- WHEN `syncFromGateway(payoutId, 'paid')`
- THEN withdrawal → `paid`, `processedAt` = now, `gatewayStatus` = 'PAID', `lastGatewaySyncAt` = now

#### Scenario: Sync to failed
- GIVEN `approved` withdrawal with matching `gatewayPayoutId`
- WHEN `syncFromGateway(payoutId, 'failed')`
- THEN withdrawal → `failed`, `gatewayStatus` = 'FAILED'

#### Scenario: Sync ignored if status not approved
- GIVEN withdrawal already `paid` or `failed`
- WHEN `syncFromGateway` with same payoutId
- THEN NO changes (idempotency)

#### Scenario: Sync ignored if gatewayPayoutId mismatch
- GIVEN `approved` withdrawal with `gatewayPayoutId` = 'A'
- WHEN `syncFromGateway('B', 'paid')`
- THEN NO changes (protection against malicious/erroneous webhook)

## Key Behaviors
- **Webhook**: signature verification (reuse PayPalService), idempotency via WebhookEvent, raw body parsing, PAYOUTS.* event routing, PayPal status mapping (SUCCESS→paid, else→failed)
- **Poll sweep**: runs in SchedulerService when `payoutMode === 'auto'`, iterates en-flight withdrawals, calls gateway `getStatus()`, delegates to `syncFromGateway`
- **syncFromGateway**: transaction + SELECT FOR UPDATE, validates withdrawal exists + status=approved + payoutId match, updates status/processedAt/gatewayStatus/lastGatewaySyncAt, fires best-effort notification

## Testing

| Test | Description |
|------|-------------|
| Unit | syncFromGateway: paid only with approved+lock+matching payoutId; failed; ignored if status≠approved; ignored if payoutId mismatch |
| Unit | syncPayoutStatuses: iterates en-flight, calls getStatus, calls syncFromGateway |
| Unit | paypalWebhook: invalid signature→403; duplicate→200 duplicate; payout event→syncFromGateway; non-payout→200 no-sync |
| Integration | Webhook E2E: valid signature + payout event → withdrawal paid; duplicate webhook ignored |
| Integration | Poll sweep: en-flight withdrawal → getStatus paid → syncFromGateway → paid |

## References

- Original design: `openspec/changes/wallet-integration/design.md` (Flow 4, Flow 5, ADR #5, interfaces)
- Related specs: `wallet-payouts` (gateway getStatus), `wallet-notifications` (email on paid/failed), `wallet-admin` (manual retry failed→approved)