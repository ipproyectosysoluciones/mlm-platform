# Design: Wallet Integration — Continue (Remaining Implementation)

## Technical Approach

Complete the remaining 29 tasks from the original `wallet-integration` change. Architecture, interfaces, and contracts are defined in `openspec/changes/wallet-integration/design.md` — **this document only covers implementation details for the remaining work**. Do not duplicate the original design; reference it for:

- Component architecture diagram
- Flows 1-6 (create withdrawal, admin approval, auto payout, webhook sync, poll sync, failure/retry)
- ADR-lite table (decisions 1-9)
- File changes table (original scope)
- Interfaces/contracts (PayoutGateway, API contracts)
- Config env table
- Testing strategy
- Migration/rollout

**MercadoPago gateway was discarded** (2026-08-02 product decision: no Developers API for money-out). Only PayPal Payouts remains. `destination` is now `{ email }` only (accountId removed). The `PayoutGateway` factory retains `mercadopago` type as a **placeholder** that throws `NotImplementedError` — it is NOT a no-op. This allows future enablement without factory changes.

### Spec Alignment

This design implements the following delta specs (each maps to a capability):
- `wallet-payouts`: createWithdrawal validation, processDailyPayouts auto+budget, syncFromGateway
- `wallet-admin`: AdminWalletController, list/approve/reject with SELECT FOR UPDATE
- `wallet-notifications`: WalletNotificationService, Brevo emails best-effort + retry sweep
- `wallet-sync`: PayoutWebhookController, webhook idempotency, poll sweep, syncFromGateway
- `wallet-config-api`: GET /wallet/config endpoint, env config, WalletConfig type
- `wallet-transactions`: type mapping commission→commission_earned, refund→adjustment
- `frontend`: WithdrawalForm, TransactionHistory, admin pages, walletStore, E2E fix #347
- `backend`: Combined backend services, controllers, routes, env, scheduler sweeps

## Remaining Implementation Details

### 1. WalletService Core (`backend/src/services/WalletService.ts`)

#### `createWithdrawal(userId, amount, destination)`
```typescript
async createWithdrawal(userId: string, amount: number, destination: WithdrawalDestination) {
  // 1. Validate destination shape: must have email (PayPal only)
  if (!destination?.email || !isValidEmail(destination.email)) {
    throw new AppError('INVALID_DESTINATION', 'Email de destino inválido para PayPal');
  }
  // 2. amount ≤ config.wallet.maxWithdrawal (WALLET_MAX_WITHDRAWAL)
  // 3. Daily UTC sum: requestedAmount of pending+approved+paid today + amount ≤ maxWithdrawalDailyPerUser
  // 4. Wallet balance ≥ amount + fee (fee = calculateFee(amount))
  // 5. amount ≥ WALLET_MIN_WITHDRAWAL (20)
  // 6. Transaction: create WithdrawalRequest{pending, destination, gateway: 'paypal'} + debit wallet + txs
}
```

#### `processDailyPayouts()`
```typescript
async processDailyPayouts() {
  if (config.wallet.payoutMode === 'manual') {
    // Current behavior: approved → paid flip (no gateway)
    return this.flipApprovedToPaid();
  }
  // AUTO MODE:
  const approved = await WithdrawalRequest.findAll({ where: { status: 'approved' }, order: [['createdAt', 'ASC']] });
  for (const w of approved) {
    const gateway = getPayoutGateway(w.gateway); // 'paypal' — throws if 'mercadopago' (placeholder)
    // Budget check: sum netAmount of paid + en-flight (gatewayPayoutId not null) today UTC per gateway
    const consumed = await this.getDailyConsumed(gateway.type);
    if (consumed + w.netAmount > config.wallet[`budget${capitalize(gateway.type)}`]) {
      continue; // stays approved, queued for next cycle
    }
    // Idempotency: transaction + SELECT FOR UPDATE re-read
    await sequelize.transaction(async (t) => {
      const fresh = await WithdrawalRequest.findByPk(w.id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!fresh || fresh.status !== 'approved' || fresh.gatewayPayoutId) return; // already taken
      const result = await gateway.createPayout({ withdrawalId: fresh.id, amount: fresh.netAmount, destination: fresh.destination });
      fresh.gatewayPayoutId = result.payoutId;
      fresh.gatewayStatus = 'SENT';
      await fresh.save({ transaction: t });
    });
  }
}
```

#### `approveWithdrawal(id, adminId)` / `rejectWithdrawal(id, adminId, reason)`
```typescript
async approveWithdrawal(id: string, adminId: string) {
  return sequelize.transaction(async (t) => {
    const w = await WithdrawalRequest.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!w) throw new NotFoundError();
    // Allow pending→approved OR failed→approved (manual retry)
    if (!['pending', 'failed'].includes(w.status)) throw new AppError('INVALID_TRANSITION', 409);
    w.status = 'approved';
    w.approvedBy = adminId;
    w.approvedAt = new Date();
    await w.save({ transaction: t });
    // Notification best-effort (non-blocking)
    this.notificationService.notifyWithdrawalStatus(w, 'approved').catch(() => {});
  });
}

async rejectWithdrawal(id: string, adminId: string, rejectionReason: string) {
  if (!rejectionReason) throw new AppError('REJECTION_REASON_REQUIRED', 400);
  return sequelize.transaction(async (t) => {
    const w = await WithdrawalRequest.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!w) throw new NotFoundError();
    if (w.status !== 'pending') throw new AppError('INVALID_TRANSITION', 409);
    w.status = 'rejected';
    w.rejectedBy = adminId;
    w.rejectedAt = new Date();
    w.rejectionReason = rejectionReason;
    await w.save({ transaction: t });
    this.notificationService.notifyWithdrawalStatus(w, 'rejected').catch(() => {});
  });
}
```

#### `syncFromGateway(payoutId, status)` / `syncPayoutStatuses()`
```typescript
async syncFromGateway(payoutId: string, status: PayoutStatus) {
  return sequelize.transaction(async (t) => {
    const w = await WithdrawalRequest.findOne({ where: { gatewayPayoutId: payoutId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!w || w.status !== 'approved') return; // only sync if still approved with matching payoutId
    if (status === 'paid') {
      w.status = 'paid';
      w.processedAt = new Date();
      w.gatewayStatus = 'PAID';
    } else if (['failed', 'reversed', 'cancelled'].includes(status)) {
      w.status = 'failed';
      w.gatewayStatus = status.toUpperCase();
    }
    w.lastGatewaySyncAt = new Date();
    await w.save({ transaction: t });
    // Notification best-effort
    this.notificationService.notifyWithdrawalStatus(w, w.status).catch(() => {});
  });
}

async syncPayoutStatuses() {
  const enFlight = await WithdrawalRequest.findAll({
    where: { status: 'approved', gatewayPayoutId: { [Op.ne]: null } }
  });
  for (const w of enFlight) {
    const gateway = getPayoutGateway(w.gateway);
    const status = await gateway.getStatus(w.gatewayPayoutId);
    await this.syncFromGateway(w.gatewayPayoutId, status);
  }
}
```

#### `getTransactions()` — Type Mapping
```typescript
async getTransactions(userId: string, query: { type?: string; page: number; limit: number }) {
  const typeMap = { commission: 'commission_earned', refund: 'adjustment' };
  const dbType = typeMap[query.type] || query.type; // if not in map, use as-is (commission_earned, adjustment pass through)
  where.type = dbType;
  // ... rest of query
}
```

### 2. WalletNotificationService (`backend/src/services/WalletNotificationService.ts`)

```typescript
class WalletNotificationService {
  constructor(private brevo: BrevoEmailService) {}

  async notifyWithdrawalStatus(withdrawal: WithdrawalRequest, newStatus: WithdrawalStatus) {
    const user = await User.findByPk(withdrawal.userId);
    if (!user?.email) return;
    
    const templateMap = {
      approved: 'withdrawal-approved',
      paid: 'withdrawal-paid',
      rejected: 'withdrawal-rejected',
      failed: 'withdrawal-failed'
    };
    
    try {
      await this.brevo.sendTransactionalEmail({
        to: user.email,
        templateId: templateMap[newStatus],
        params: { amount: withdrawal.netAmount, destination: withdrawal.destination.email, ... }
      });
      withdrawal.lastNotifiedStatus = newStatus;
      withdrawal.lastNotifiedAt = new Date();
      await withdrawal.save({ fields: ['lastNotifiedStatus', 'lastNotifiedAt'] });
    } catch (err) {
      // Log but don't throw — state already persisted
      logger.warn('Brevo notification failed', { withdrawalId: withdrawal.id, error: err.message });
    }
  }

  // Called by SchedulerService sweep (every 30 min)
  async retryPendingNotifications() {
    const pending = await WithdrawalRequest.findAll({
      where: { lastNotifiedStatus: { [Op.ne]: sequelize.col('status') } }
    });
    for (const w of pending) {
      await this.notifyWithdrawalStatus(w, w.status);
    }
  }
}
```

**Tracking columns** (from `wallet-integration` migration):
- `lastNotifiedStatus` — last successfully notified status
- `lastNotifiedAt` — timestamp of last successful send

### 3. PayoutWebhookController (`backend/src/controllers/PayoutWebhookController.ts`)

```typescript
class PayoutWebhookController {
  async paypalWebhook(req: Request, res: Response) {
    const isValid = await PayPalService.verifyWebhookSignature(req.headers, req.rawBody);
    if (!isValid) return res.status(403).json({ error: 'INVALID_SIGNATURE' });
    
    const eventId = req.headers['paypal-transmission-id'];
    if (await WebhookEvent.isProcessed(eventId, 'paypal')) {
      return res.json({ received: true, duplicate: true });
    }
    
    const event = JSON.parse(req.rawBody);
    if (event.event_type.startsWith('PAYOUTS.')) {
      const payoutId = event.resource.payout_batch_id || event.resource.payout_item_id;
      const status = mapPayPalPayoutStatus(event.resource.batch_status || event.resource.status);
      await WalletService.syncFromGateway(payoutId, status);
    }
    
    await WebhookEvent.markProcessed(eventId, 'paypal', event.event_type);
    res.json({ received: true });
  }
}
```

**WebhookEvent table** (existing pattern from `wallet-integration`):
- `event_id` + `provider` unique index — idempotency key
- Stores: `event_id`, `provider`, `event_type`, `processed_at`
- Reused from PayPalService webhook handling pattern

**MercadoPago placeholder**: Route `/payment/mercadopago/payout-webhook` exists but controller throws `NotImplementedError` — matches gateway factory placeholder.

### 4. SchedulerService Sweeps

```typescript
// In SchedulerService.init()
if (config.features.cryptoWallet) {
  // Daily payout job (existing cronTime) — runs in BOTH manual and auto modes
  cron.schedule(config.wallet.cronTime, () => WalletService.processDailyPayouts());
  
  if (config.wallet.payoutMode === 'auto') {
    // Poll reconciliation sweep (WALLET_PAYOUT_POLL_CRON, default '0 */4 * * *')
    cron.schedule(config.wallet.pollCron, () => WalletService.syncPayoutStatuses());
  }
  
  // Notification retry sweep (every 30 min) — runs regardless of payoutMode
  cron.schedule('*/30 * * * *', () => WalletNotificationService.retryPendingNotifications());
}
```

**Conditional execution**:
- Daily payout job: runs if `features.cryptoWallet` (both manual/auto)
- Poll sweep: runs ONLY if `payoutMode === 'auto'` AND `features.cryptoWallet`
- Notification retry: runs if `features.cryptoWallet` (independent of payoutMode)

### 5. Frontend Implementation

#### `walletStore.createWithdrawal(amount, destination)`
```typescript
createWithdrawal: async (amount: number, destination: WithdrawalDestination) => {
  const res = await walletApi.withdraw({ amount, destination });
  if (res.success) {
    set((state) => ({ withdrawals: [res.data, ...state.withdrawals] }));
    return res.data;
  }
  throw new Error(res.error?.message || 'Withdrawal failed');
}
```

#### `getWalletConfig()` API call
```typescript
getWalletConfig: async () => {
  const res = await walletApi.getConfig();
  if (res.success) set({ config: res.data });
  return res.data;
}
```

#### `WithdrawalForm` changes
- Gateway selector: radio/button group (PayPal visible, MercadoPago disabled with tooltip "Próximamente")
- Destination field: email input with validation (shows/hides based on gateway)
- Fee/min/max: fetched from `/wallet/config` on mount, displayed dynamically
- Submit sends `{ amount, destination: { email } }`
- Error mapping: `INVALID_DESTINATION`, `LIMIT_EXCEEDED`, `INSUFFICIENT_BALANCE`, `MINIMUM_AMOUNT`

#### Admin pages
- `WalletWithdrawalsPage`: paginated table with filters (status, gateway, user search), columns: user, amount, fee, net, status, destination, gateway, date, actions
- `WithdrawalApprovalModal`: shows withdrawal details + **destination email prominently**, optional `approvalComment`, confirm/cancel buttons (cancel sends NO request)

#### Frontend Types (`frontend/src/types/wallet.ts`)
```typescript
export interface WalletConfig {
  minWithdrawal: number;
  feePercentage: number;
  maxWithdrawal: number;
  maxWithdrawalDailyPerUser: number;
  payoutMode: 'manual' | 'auto';
  gateways: ('paypal' | 'mercadopago')[]; // mercadopago placeholder
}

export type WithdrawalDestination = { email: string }; // PayPal only

export type WithdrawalStatus = 'pending' | 'approved' | 'paid' | 'rejected' | 'failed'; // 'paid' NOT 'processed'

export type TransactionType = 'commission_earned' | 'adjustment' | 'withdrawal' | 'fee' | 'deposit';
```

### 6. Transaction Type Mapping

Backend (`WalletService.getTransactions()`):
```typescript
const typeMap = { commission: 'commission_earned', refund: 'adjustment' };
const dbType = typeMap[query.type] || query.type; // pass-through for backend enums
where.type = dbType;
```

Frontend (`TransactionHistory`): continues sending `commission`/`refund` (legacy compatible); backend maps transparently. No frontend enum change required for this spec — only backend mapping.

**Unit test cases**:
- `type=commission` → `where.type = 'commission_earned'`
- `type=refund` → `where.type = 'adjustment'`
- `type=commission_earned` → `where.type = 'commission_earned'` (pass-through)
- `type=adjustment` → `where.type = 'adjustment'` (pass-through)
- No type → no filter applied

### 7. E2E Fix (#347)

**Test env configuration:**
- `frontend/.env.test`: `VITE_FEATURE_CRYPTO_WALLET=true`
- Backend test env (CI): `FEATURE_CRYPTO_WALLET=true`, `WALLET_PAYOUT_MODE=manual`

**Code changes in `frontend/e2e/wallet.spec.ts`:**
1. Remove ALL `.catch(() => {})` / `try { } catch { }` vacuous patterns
2. Add real assertions on:
   - Withdrawal creation: verify 201 response, `destination` in response
   - Admin listing: verify destination email visible in table
   - Admin approval: verify status transitions to `approved`
   - Manual mode flip: verify `approved` → `paid` after job execution
   - Destination flow: create with email → verify in admin → approve → verify status
3. Ensure no empty tests — every test validates a specific behavior

**Playwright config**: `webServer` env must include test flags or load `.env.test`

## File Changes (Delta from Original Design)

| Area | Change Type | Notes |
|------|-------------|-------|
| `WalletService.ts` | Major Modify | Core logic: createWithdrawal validation, processDailyPayouts auto, syncFromGateway, syncPayoutStatuses, approve/reject, getTransactions typeMap |
| `WalletNotificationService.ts` | New | Brevo emails best-effort + retry sweep |
| `SchedulerService.ts` | Modify | Add poll sweep (auto only) + notification retry sweep |
| `env.ts` | Modify | Add payoutMode, budgets, maxWithdrawal, maxDaily, pollCron, minWithdrawal, feePercentage, payoutWebhookIds |
| `WalletController.ts` | Modify | Add GET /wallet/config |
| `AdminWalletController.ts` | New | list/approve/reject with SELECT FOR UPDATE |
| `PayoutWebhookController.ts` | New | PayPal webhook (MP placeholder throws NotImplementedError) |
| `wallet.routes.ts` | Modify | Add GET /config |
| `admin-wallet.routes.ts` | New | featureGuard + auth + requireAdmin + adminLimiter |
| `webhook-payout.routes.ts` | New | /payment/paypal/payout-webhook (no featureGuard, raw body) |
| `routes/index.ts` | Modify | Mount new routes |
| `walletStore.ts` | Modify | createWithdrawal(amount, destination), fetchWalletConfig |
| `api/wallet.ts` | Modify | Destination in request, getWalletConfig, admin methods |
| `WithdrawalForm.tsx` | Modify | Gateway selector, destination, config-driven fee/min/max |
| `TransactionHistory.tsx` | Modify | Correct enum values (backend enum mapping) |
| `WalletWithdrawalsPage.tsx` | New | Admin listing with filters, pagination |
| `WithdrawalApprovalModal.tsx` | New | Admin modal with destination prominently displayed |
| `types/wallet.ts` | Modify | WalletConfig, WithdrawalStatus='paid', TransactionType backend enum, WithdrawalDestination |
| `wallet.spec.ts` | Modify | Fix #347: flags ON, real assertions, no vacuous .catch |
| `.env.test` / backend test env | Modify | Flags ON for test/CI |

**Reference**: Original file changes table in `openspec/changes/wallet-integration/design.md` (covers schema, migrations, PayoutGateway abstraction, PayPalPayoutsGateway, MercadoPagoMoneyOutGateway placeholder).

## Idempotency Guarantees (Recap from Original Design)

**Four concatenated layers — double payout requires ALL to fail:**

1. **Atomic selection**: Job re-reads with `SELECT FOR UPDATE`; skips if status ≠ `approved` or `gatewayPayoutId` set
2. **Gateway idempotency key**: `sender_batch_id` = `withdrawalId` (PayPal); duplicate call returns existing batch
3. **State verification before `paid`**: Only `syncFromGateway` writes `paid`, inside transaction with lock, only if gateway confirms success and `gatewayPayoutId` matches
4. **Webhook idempotency**: `WebhookEvent` table (unique event_id+provider) — pattern reused from PayPalService

**Manual mode**: No real money movement (flip `approved` → `paid`), budget limits exposure per cycle per gateway.

**Reference**: Full idempotency analysis in `openspec/changes/wallet-integration/design.md` (section "Idempotencia y doble pago (garantía)").

## Testing Focus (Remaining)

| Layer | Priority Tests |
|-------|----------------|
| Unit (Jest) | createWithdrawal validation matrix; processDailyPayouts manual/auto/budget/idempotent; approve/reject transitions (409); syncFromGateway paid/failed/lock; notification retry |
| Integration | Admin endpoints (Supertest: 403, 409, pagination); webhook signature + idempotency; poll sweep |
| Frontend (Vitest) | WithdrawalForm gateway selector + validation + MSW config; TransactionHistory enum; Admin pages |
| E2E (Playwright) | Full wallet flow with flags ON: create→list→approve→status, destination visible |

**Test coverage target**: ≥65% (backend + frontend)

---

**Reference**: `openspec/changes/wallet-integration/design.md` for complete architecture, flows, ADRs, and original file change table.

**Delta specs** (this change):
- `wallet-payouts`: `openspec/changes/wallet-integration-continue/specs/wallet-payouts/spec.md`
- `wallet-admin`: `openspec/changes/wallet-integration-continue/specs/wallet-admin/spec.md`
- `wallet-notifications`: `openspec/changes/wallet-integration-continue/specs/wallet-notifications/spec.md`
- `wallet-sync`: `openspec/changes/wallet-integration-continue/specs/wallet-sync/spec.md`
- `wallet-config-api`: `openspec/changes/wallet-integration-continue/specs/wallet-config-api/spec.md`
- `wallet-transactions`: `openspec/changes/wallet-integration-continue/specs/wallet-transactions/spec.md`
- `frontend`: `openspec/changes/wallet-integration-continue/specs/frontend/spec.md`
- `backend`: `openspec/changes/wallet-integration-continue/specs/backend/spec.md`

**Change**: wallet-integration-continue
**Branch**: feature/wallet-integration-continue