# Wallet Notifications Specification

## Purpose

Brevo email notifications for withdrawal state transitions. Best-effort: state persists BEFORE email send; email failures do NOT block transitions. Automatic retry on next job via sweep of `lastNotifiedStatus ≠ status`.

## Requirements

### Requirement: Email on Every State Transition

The system SHALL send Brevo email to user when withdrawal transitions to: `approved`, `paid`, `rejected`, `failed`. Uses transactional templates configured in Brevo.

#### Scenario: Email on approval
- GIVEN a withdrawal transitions to `approved`
- WHEN transition persists
- THEN sends `withdrawal-approved` email with net amount, destination, estimated date

#### Scenario: Email on payment
- GIVEN a withdrawal transitions to `paid` (via webhook or poll)
- WHEN transition persists
- THEN sends `withdrawal-paid` email with payment confirmation, `processedAt`, gateway reference

#### Scenario: Email on rejection
- GIVEN a withdrawal transitions to `rejected`
- WHEN transition persists
- THEN sends `withdrawal-rejected` email with `rejectionReason`

#### Scenario: Email on failure
- GIVEN a withdrawal transitions to `failed` (gateway error, webhook failed, poll failed)
- WHEN transition persists
- THEN sends `withdrawal-failed` email with gateway status and manual retry notice

### Requirement: Email Failure Does Not Block Transition

The system SHALL persist state change BEFORE attempting email send. If Brevo fails (network, rate limit, missing template), error is logged and transition continues. Withdrawal retains outdated `lastNotifiedStatus` for retry sweep.

#### Scenario: Brevo fails on approval transition
- GIVEN a withdrawal is approved
- WHEN Brevo returns error
- THEN withdrawal stays `approved` in DB, `lastNotifiedStatus` ≠ `status`, error logged

### Requirement: Automatic Retry Sweep

The system SHALL include a sweep in `SchedulerService` (every 30 min) that resends pending notifications: withdrawals where `lastNotifiedStatus ≠ status`.

#### Scenario: Sweep retries failed notification
- GIVEN an `approved` withdrawal with `lastNotifiedStatus = null` (email failed previously)
- WHEN notification sweep runs
- THEN retries `withdrawal-approved` email; on success, `lastNotifiedStatus` = `approved`

## Tracking Columns (in WithdrawalRequest — from wallet-integration migration)
- `lastNotifiedStatus`: last successfully notified status
- `lastNotifiedAt`: timestamp of last successful send

## Integration Points
- **WalletService.approveWithdrawal / rejectWithdrawal / syncFromGateway**: after persisting state, calls `notificationService.notifyWithdrawalStatus(withdrawal, newStatus).catch(() => {})` — fire-and-forget, sweep retries
- **SchedulerService**: runs `walletNotificationService.retryPendingNotifications()` every 30 minutes

## Testing

| Test | Description |
|------|-------------|
| Unit | notifyWithdrawalStatus: each status calls correct template with correct params |
| Unit | Brevo failure: does not throw, state persists, lastNotifiedStatus not updated |
| Unit | retryPendingNotifications: finds mismatched withdrawals, retries, updates tracking on success |
| Integration | Full transition: approve → email sent → tracking updated; Brevo failure → sweep recovers |

## References

- Original design: `openspec/changes/wallet-integration/design.md` (Requirement: Brevo Notifications, Flow 6, ADR #9)
- Related specs: `wallet-admin` (triggers notification on approve/reject), `wallet-payouts` (triggers on paid/failed), `wallet-sync` (triggers on webhook/poll paid/failed)