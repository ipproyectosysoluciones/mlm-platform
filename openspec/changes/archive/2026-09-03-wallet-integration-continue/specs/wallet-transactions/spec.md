# Delta Spec: Wallet Transactions (Type Mapping Implementation)

## Purpose

Implement transaction type mapping `commission` → `commission_earned` and `refund` → `adjustment` in `WalletService.getTransactions()`, as specified in `openspec/changes/wallet-integration/specs/wallet-transactions/spec.md`. Backend already has correct enum; fix is only in filter translation.

## Requirements (from original spec — implementation only)

### Requirement: Type Filter with Backend Enum Semantics

The system SHALL map frontend `type` filter values to backend enum before applying in `getTransactions()`: `commission` → `commission_earned`, `refund` → `adjustment`. Endpoint `GET /api/wallet/transactions?type=commission_earned|adjustment` MUST return corresponding transactions.

#### Scenario: Filter by commission_earned (backend value direct)
- GIVEN user has `commission_earned` and other transactions
- WHEN queries `GET /api/wallet/transactions?type=commission_earned`
- THEN response contains only `commission_earned` transactions

#### Scenario: Filter by adjustment (backend value direct)
- GIVEN user has `adjustment` and other transactions
- WHEN queries `GET /api/wallet/transactions?type=adjustment`
- THEN response contains only `adjustment` transactions

#### Scenario: Legacy commission value from frontend
- GIVEN frontend sends `type=commission` (legacy value)
- WHEN backend processes query
- THEN filter translates to `commission_earned` and returns correct results

#### Scenario: Legacy refund value from frontend
- GIVEN frontend sends `type=refund`
- WHEN backend processes query
- THEN filter translates to `adjustment` and returns correct results

#### Scenario: No type filter
- GIVEN user queries transactions
- WHEN calls `GET /api/wallet/transactions` without `type`
- THEN returns all user transactions, paginated, no type filter

### Requirement: Frontend Compatibility with Backend Enum

The frontend `TransactionHistory.tsx` uses legacy `commission`/`refund` values in UI. Backend SHALL translate them transparently. NO frontend change required for this spec (frontend sends legacy values; backend maps them).

## Key Behavior
- **Mapping**: `typeMap = { commission: 'commission_earned', refund: 'adjustment' }` — if value already backend enum, passes through; if legacy, maps
- **Service layer**: mapping occurs in `WalletService.getTransactions()`; controller passes `query.type` unchanged

## Testing

| Test | Description |
|------|-------------|
| Unit | getTransactions with type=commission → where.type = 'commission_earned' |
| Unit | getTransactions with type=refund → where.type = 'adjustment' |
| Unit | getTransactions with type=commission_earned → where.type = 'commission_earned' (pass-through) |
| Unit | getTransactions with type=adjustment → where.type = 'adjustment' (pass-through) |
| Unit | getTransactions without type → where without type filter |
| Integration | GET /wallet/transactions?type=commission returns actual commission_earned |

## References

- Original spec: `openspec/changes/wallet-integration/specs/wallet-transactions/spec.md`
- Related specs: `frontend` (TransactionHistory uses legacy values, backend maps)