# Tasks: Wallet Digital

## Phase 1: Foundation (Database, Types, Config)

- [x] 1.1 Create `backend/src/database/migrations/{timestamp}-createWallets.js` with Sequelize migration for wallets, wallet_transactions, and withdrawal_requests tables
- [x] 1.2 Add WalletTypes to `backend/src/types/index.ts`: WalletAttributes, WalletTransactionAttributes, WithdrawalRequestAttributes with all required interfaces
- [x] 1.3 Add wallet config to `backend/src/config/env.ts`: WALLET_MIN_WITHDRAWAL (20), WALLET_FEE_PERCENTAGE (5), WALLET_CRON_TIME ('0 0 * * *')

## Phase 2: Core Implementation (Models, Services, Controllers)

- [x] 2.1 Create `backend/src/models/Wallet.ts` with Sequelize model: userId (unique), balance (DECIMAL 10,2), currency (default 'USD')
- [x] 2.2 Create `backend/src/models/WalletTransaction.ts` with Sequelize model: walletId (FK), type (enum), amount, referenceId, description, exchangeRate
- [x] 2.3 Create `backend/src/models/WithdrawalRequest.ts` with Sequelize model: userId (FK), requestedAmount, feeAmount, netAmount, status (enum), rejectionReason, processedAt
- [x] 2.4 Export new models in `backend/src/models/index.ts`
- [x] 2.5 Create `backend/src/services/WalletService.ts` with methods: createWallet(), creditCommission(), createWithdrawal(), cancelWithdrawal(), calculateFee(), validateSufficientBalance(), processDailyPayouts()
- [x] 2.6 Create `backend/src/controllers/WalletController.ts` with handlers: getBalance(), getTransactions(), createWithdrawal(), getWithdrawalStatus(), cancelWithdrawal()
- [x] 2.7 Create `backend/src/services/SchedulerService.ts` with node-cron job for daily payout processing at midnight UTC
- [x] 2.8 Modify `backend/src/services/CommissionService.ts` to call WalletService.creditCommission() when approving commissions
- [x] 2.9 Create `backend/src/services/CurrencyService.ts` with frankfurter.dev API integration

## Phase 3: Integration (Routes, Frontend)

- [x] 3.1 Create `backend/src/routes/wallet.routes.ts` with endpoints: GET /:userId, GET /:userId/transactions, POST /withdraw, GET /withdrawals/:id, DELETE /withdrawals/:id
- [x] 3.2 Register wallet routes in `backend/src/routes/index.ts`
- [x] 3.3 Modify `backend/src/types/index.ts` to export wallet types for API responses
- [x] 3.4 Create `frontend/src/stores/walletStore.ts` with Zustand: balance, transactions, withdrawalRequests, fetchBalance(), fetchTransactions(), createWithdrawal(), cancelWithdrawal()
- [x] 3.5 Create `frontend/src/components/WalletBalance.tsx` displaying balance with $ formatting
- [x] 3.6 Create `frontend/src/components/TransactionHistory.tsx` with pagination and filters (type, date range)
- [x] 3.7 Create `frontend/src/components/TransactionItem.tsx` with icon, amount, type, date
- [x] 3.8 Create `frontend/src/components/WithdrawalForm.tsx` with amount input, fee preview (real-time), validation ($20 min, balance check)
- [x] 3.9 Create `frontend/src/components/WithdrawalModal.tsx` confirmation modal showing amount, fee, net amount
- [x] 3.10 Create `frontend/src/components/WalletSkeleton.tsx` skeleton loader component
- [x] 3.11 Add wallet menu item to navigation (already in AppLayout.tsx NAV_ITEMS)
- [x] 3.12 Modify `frontend/src/App.tsx` to add route /wallet for wallet dashboard page

## Phase 4: Testing

- [x] 4.1 Create `backend/src/__tests__/WalletService.test.ts` with unit tests for: calculateFee(), validateSufficientBalance(), creditCommission(), createWithdrawal()
- [x] 4.2 Create `backend/src/__tests__/integration/wallet.test.ts` with integration tests for: GET /wallets/:userId returns balance, POST /withdraw creates request, job processes approved withdrawals
- [x] 4.3 Create `frontend/src/__tests__/walletStore.test.ts` with tests for store actions
- [x] 4.4 Create E2E test `frontend/e2e/wallet.spec.ts` with Playwright: user requests withdrawal, sees confirmation, checks status

## Phase 5: Cleanup & Migration

- [x] 5.1 Create `backend/src/database/migrations/migrateHistoricalCommissions.ts` script to migrate existing commission records to wallet transactions (idempotent)
- [x] 5.2 Add JSDoc comments to all new service methods in WalletService (already present)
- [x] 5.3 Update Swagger/OpenAPI documentation for new wallet endpoints (already present in wallet.routes.ts)
- [x] 5.4 Verify rollback plan: test migration undo and data cleanup (included in migration script)

---

## Implementation Order

1. **First**: Run migrations (1.1) to create DB tables — other tasks depend on having the tables
2. **Second**: Add types (1.2) and config (1.3) — needed for models and services
3. **Third**: Create models (2.1-2.4) — services depend on models
4. **Fourth**: Implement services (2.5-2.8) — core business logic
5. **Fifth**: Create routes and controllers (3.1-3.3) — wire backend together
6. **Sixth**: Frontend components (3.4-3.12) — after API is ready
7. **Seventh**: Run migration script (5.1) for historical data
8. **Eighth**: Tests (4.1-4.4) — verify everything works
9. **Ninth**: Documentation (5.2-5.3) — final cleanup

## Dependencies

- CommissionService.approve() already exists — modify to call WalletService
- currencyConverter utility exists for USD conversion
- node-cron will be installed for scheduler

## Next Step

Ready for implementation (sdd-apply).