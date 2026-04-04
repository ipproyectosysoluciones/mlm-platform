# Proposal: Backend Controller Refactoring

## Intent

The 7 main controllers (TwoFactor, User, Order, Wallet, Admin, CommissionConfig, CRM) range from 341–432 lines each, mixing multiple concerns (profile + tree + QR, balance + transactions + withdrawals, CRUD + analytics). This hurts maintainability and makes the codebase harder to navigate. We modularize each controller into domain-focused sub-controllers.

## Scope

### In Scope
- Split 7 controllers into sub-controllers based on domain concerns
- Update route files to import from new locations
- Keep existing export patterns (named exports re-exported from barrel files)
- Ensure all existing tests pass after each split

### Out of Scope
- Changing business logic or API behavior
- Changing public route paths (GET /api/users/tree stays the same)
- Modifying models, services, or middleware
- Adding new endpoints or features
- Changing the database schema

## Approach

Extract endpoints into sub-controllers per concern, then re-export from original controller files for backward compatibility. One controller per atomic commit.

### Split Map

| Original Controller | New Sub-Controllers | Key Methods Moved |
|---|---|---|
| `TwoFactorController.ts` (432) | `totp/TOTPController.ts` | setup2FA, verifySetup, verify2FA, get2FAStatus, disable2FA, pendingSetups, constants |
| `UserController.ts` (427) | `users/ProfileController.ts` | getMe, updateProfile, changePassword, deleteAccount |
| | `users/TreeController.ts` | getTree, searchUsers, getUserDetails |
| | `users/QRController.ts` | getQR, getQRUrl |
| `OrderController.ts` (426) | `orders/CheckoutController.ts` | createOrder |
| | `orders/OrderHistoryController.ts` | getOrders, getOrderById |
| `WalletController.ts` (423) | `wallet/BalanceController.ts` | getBalance, getCryptoPrices |
| | `wallet/TransactionController.ts` | getTransactions |
| | `wallet/WithdrawalController.ts` | createWithdrawal, getWithdrawalStatus, cancelWithdrawal |
| `AdminController.ts` (395) | `admin/StatsController.ts` | getGlobalStats, getCommissionsReport |
| | `admin/UsersAdminController.ts` | getAllUsers, getUserById, updateUserStatus, promoteToAdmin |
| `CommissionConfigController.ts` (351) | `commissions/ConfigController.ts` | getAllConfigs, getConfigById, createConfig, updateConfig, deleteConfig |
| | `commissions/RatesController.ts` | getActiveRates |
| `CRMController.ts` (341) | `crm/LeadController.ts` | getLeads, getLeadById, createLead, updateLead, deleteLead, importLeads, exportLeads, getCRMStats |
| | `crm/TaskController.ts` | createTask, completeTask, getLeadTasks, getUpcomingTasks |
| | `crm/AnalyticsController.ts` | getAnalyticsReport, exportAnalyticsReport, getCRMAlerts |
| | `crm/CommunicationController.ts` | addCommunication, getLeadCommunications |

### Strategy: Re-export Pattern

Each original controller file becomes a barrel that re-exports from sub-controllers. This means NO changes to route files are required — imports stay identical. Routes are updated separately in a cleanup pass only after all controllers are split.

```
// controllers/UserController.ts (becomes barrel)
export { getMe, updateProfile, changePassword, deleteAccount } from './users/ProfileController';
export { getTree, searchUsers, getUserDetails } from './users/TreeController';
export { getQR, getQRUrl } from './users/QRController';
export { updateProfileValidation, changePasswordValidation, deleteAccountValidation } from './users/ProfileController';
```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/controllers/*.ts` | Modified | Each becomes barrel file re-exporting sub-controllers |
| `backend/src/controllers/*/` | New | New sub-directories with split controllers |
| `backend/src/routes/*.ts` | None (Phase 2) | No changes in Phase 1; barrel re-exports keep imports valid |
| `backend/src/__tests__/` | Verified | Must pass unchanged after each split |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking imports when splitting | Low | Re-export pattern keeps original file paths functional |
| Duplicate imports or circular deps | Low | Each sub-controller imports only its own dependencies |
| Tests fail after split | Medium | Run tests after each controller split; fix before proceeding |

## Rollback Plan

Each controller split is an atomic commit. If any split breaks tests, `git revert` the single commit to restore the original controller file.

## Dependencies

- None external; all services, models, and middleware remain unchanged

## Success Criteria

- [ ] All 7 controllers split into sub-controllers
- [ ] All existing integration and unit tests pass green
- [ ] No changes to public API routes or response formats
- [ ] Each split is a separate atomic commit
- [ ] No new dependencies introduced
