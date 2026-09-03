# Delta Spec: Frontend (Wallet UI, Admin Pages, E2E Fix)

## Purpose

Implement remaining frontend: WithdrawalForm with per-gateway destination and API config, TransactionHistory with correct enums, admin pages (WalletWithdrawalsPage + WithdrawalApprovalModal), extended walletStore, and E2E fix #347.

## ADDED Requirements

### Requirement: WithdrawalForm with Per-Gateway Destination and Config API

The system SHALL extend `WithdrawalForm` with:
1. **Gateway selector**: Radio/group (PayPal visible, MercadoPago disabled)
2. **Dynamic destination field**: Email input for PayPal (email validation); hidden for MP
3. **Config from API**: On mount, calls `walletStore.fetchWalletConfig()`; uses config for validation/display (REMOVES hardcodes)
4. **Submit with destination**: `walletStore.createWithdrawal(amount, destination)` where `destination = { email }`
5. **Backend errors displayed**: `INVALID_DESTINATION`, `LIMIT_EXCEEDED`, `INSUFFICIENT_BALANCE`, `MINIMUM_AMOUNT`

#### Scenario: User selects PayPal and enters email
- GIVEN user on WithdrawalForm with config loaded
- WHEN selects PayPal, enters valid email, amount within limits
- WHEN submits
- THEN calls createWithdrawal({ amount, destination: { email } })

#### Scenario: Client-side validation uses config
- GIVEN config: min=20, max=500, fee=5%
- WHEN user enters amount < 20 or > 500
- THEN form shows inline error without API call

#### Scenario: Backend error displayed
- GIVEN backend rejects with `LIMIT_EXCEEDED` (exceeds daily max)
- WHEN user submits
- THEN shows "Exceeds daily limit of $1000" (from backend)

### Requirement: Extended WalletStore

The system SHALL extend walletStore with:
- `config: WalletConfig | null` state
- `fetchWalletConfig(): Promise<WalletConfig>` — calls GET /wallet/config, updates store
- `createWithdrawal(amount, destination): Promise<WithdrawalResponse>` — calls API with destination
- Types: `WalletConfig` (minWithdrawal, feePercentage, maxWithdrawal, maxWithdrawalDailyPerUser, payoutMode, gateways), `WithdrawalDestination = { email: string }`

### Requirement: TransactionHistory with Correct Enums

The system SHALL align `TransactionHistory` filters with backend enum. Frontend MAY send legacy `commission`/`refund`; backend maps. UI option values match conceptually.

#### Scenario: Filter by commissions shows results
- GIVEN user has `commission_earned` transactions
- WHEN filters by "Commissions"
- THEN list shows commissions (not empty)

#### Scenario: Filter by adjustments shows results
- GIVEN user has `adjustment` transactions
- WHEN filters by "Adjustments"
- THEN list shows adjustments (not empty)

### Requirement: Admin Pages — WalletWithdrawalsPage + WithdrawalApprovalModal

**WalletWithdrawalsPage:** paginated table (User, Amount, Fee, Net, Status, Destination email, Gateway, Date, Actions), filters (Status, Gateway, User search), pagination (page, limit=20), "Approve" button opens modal.

**WithdrawalApprovalModal:** shows full details (user, amount, fee, net, **prominent destination email**, gateway, date), optional `approvalComment`, "Confirm"/"Cancel" buttons (Cancel sends NO request), confirm calls `walletApi.approveWithdrawal(id, { approvalComment })`.

### Requirement: Extended API Service

The system SHALL extend `walletApi` with: `getConfig()`, `withdraw({amount, destination})`, `getAdminWithdrawals({page,limit,status,gateway})`, `approveWithdrawal(id, {approvalComment?})`, `rejectWithdrawal(id, {rejectionReason})`.

### Requirement: Updated Wallet Types

- `WithdrawalStatus = 'pending' | 'approved' | 'paid' | 'rejected' | 'failed'`
- `TransactionType = 'commission_earned' | 'adjustment' | 'withdrawal' | 'fee' | 'deposit'`
- `WithdrawalRequest`: id, userId, requestedAmount, feeAmount, netAmount, status, destination, gateway, gatewayPayoutId, gatewayStatus, rejectionReason, createdAt, processedAt, approvedAt, rejectedAt
- `AdminWithdrawalsResponse`: data[], pagination
- `WalletConfig`: as above

### Requirement: E2E Fix #347

Fix `frontend/e2e/wallet.spec.ts` (GitHub #347):
1. **Flags ON in test env**: `VITE_FEATURE_CRYPTO_WALLET=true` (frontend), `FEATURE_CRYPTO_WALLET=true` + `WALLET_PAYOUT_MODE=manual` (backend)
2. **Real assertions**: each test validates full flow (create → admin list → approve → verify state)
3. **Remove `.catch(() => {})`**: no vacuous try-catch hiding failures
4. **Test destination flow**: create with email → verify in admin → approve → verify paid/failed

#### Scenario: E2E suite passes with flags ON
- GIVEN test env with flags enabled
- WHEN `pnpm test:e2e` runs wallet.spec.ts
- THEN all tests pass, no silent skips

#### Scenario: No empty tests
- GIVEN wallet.spec.ts code
- WHEN tests audited
- THEN no test uses empty `.catch` or non-validating assertions

## Modified Files

- `WithdrawalForm.tsx`: gateway selector, dynamic destination, config-driven fee/min/max, error display
- `TransactionHistory.tsx`: correct enum values for filters
- `WithdrawalModal.tsx`: confirmation with destination
- `walletStore.ts`: config state, fetchWalletConfig, createWithdrawal(amount, destination)
- `api/wallet.ts`: destination in withdraw, getConfig, admin methods
- `types/wallet.ts`: WalletConfig, WithdrawalStatus='paid', TransactionType backend enum, WithdrawalDestination
- `admin/WalletWithdrawalsPage.tsx` **New**: paginated table, filters, actions
- `admin/WithdrawalApprovalModal.tsx` **New**: modal with prominent destination, confirm/cancel
- `utils/featureFlags.ts`: doc enablement path
- `e2e/wallet.spec.ts`: fix #347: flags ON, real assertions, no vacuous .catch
- `.env.test` **New/Modify**: `VITE_FEATURE_CRYPTO_WALLET=true`
- Backend test env: `FEATURE_CRYPTO_WALLET=true`, `WALLET_PAYOUT_MODE=manual`

## Testing Focus

| Layer | Tests |
|-------|-------|
| Unit | WithdrawalForm: gateway selector, email validation, fee/min/max from MSW config, submit with destination |
| Unit | TransactionHistory: commission/adjustment filters return results (MSW backend map) |
| Unit | walletStore: fetchWalletConfig updates store; createWithdrawal calls API with destination |
| Unit | Admin pages: WalletWithdrawalsPage renders table; WithdrawalApprovalModal shows destination, cancel doesn't call API |
| E2E | wallet.spec.ts: full suite with flags ON; create→list→approve→state flow; destination visible |

## References

- Original design: `openspec/changes/wallet-integration/design.md` (File Changes frontend, Interfaces)
- Original frontend spec: `openspec/changes/wallet-integration/specs/frontend/spec.md`
- Related specs: `wallet-config-api`, `wallet-admin`, `wallet-payouts`