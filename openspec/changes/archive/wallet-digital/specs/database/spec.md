# Delta for Database

## Purpose

This spec defines the database schema requirements for the Wallet Digital feature, including new tables for wallets, transactions, and withdrawal requests.

## ADDED Requirements

### Requirement: Wallets Table

The system MUST create a `wallets` table to store user wallet balances. The table MUST store the user ID reference, current balance in USD, currency (always USD), and timestamps for creation and updates.

The system MUST ensure each user has exactly one wallet record.

#### Scenario: Create wallet for new user

- GIVEN a new user registers in the system
- WHEN the user is created
- THEN a wallet record MUST be created with balance equal to 0.00 USD
- AND currency MUST be set to "USD"

#### Scenario: Wallet balance is updated

- GIVEN a user has an existing wallet with balance of 100.00 USD
- WHEN a commission of 50.00 USD is credited to the wallet
- THEN the wallet balance MUST be updated to 150.00 USD

### Requirement: Wallet Transactions Table

The system MUST create a `wallet_transactions` table to record all changes to wallet balances. The table MUST store: wallet ID, transaction type (commission_earned, withdrawal, fee, adjustment), amount in USD, reference to source (commission ID, withdrawal request ID), description, and timestamps.

The system MUST ensure all wallet balance changes are recorded as transactions.

#### Scenario: Record commission earned

- GIVEN a user wallet with balance of 100.00 USD
- WHEN a commission of 25.00 USD is approved
- THEN a wallet transaction MUST be created with type "commission_earned" for 25.00 USD
- AND wallet balance MUST be updated to 125.00 USD

#### Scenario: Record withdrawal with fee

- GIVEN a user requests a withdrawal of 50.00 USD
- WHEN the withdrawal is processed with a 5% fee (2.50 USD)
- THEN two transactions MUST be created:
  - One with type "withdrawal" for 50.00 USD (negative)
  - One with type "fee" for 2.50 USD (negative)

#### Scenario: Historical commission migration

- GIVEN historical commission records exist in the Commission table
- WHEN the migration script is executed
- THEN each historical commission MUST create a wallet transaction with type "commission_earned"
- AND each transaction MUST include reference to the original commission ID

### Requirement: Withdrawal Requests Table

The system MUST create a `withdrawal_requests` table to track user withdrawal requests. The table MUST store: user ID, requested amount in USD, fee applied, net amount to be paid, status (pending, approved, rejected, paid, failed), rejection reason (nullable), processed date, and timestamps.

The system MUST ensure withdrawal requests maintain a complete audit trail.

#### Scenario: User submits withdrawal request

- GIVEN a user wallet has balance of 50.00 USD and minimum withdrawal is 20.00 USD
- WHEN the user submits a withdrawal request for 30.00 USD
- THEN a withdrawal request record MUST be created with status "pending"
- AND requested amount MUST be 30.00 USD

#### Scenario: Withdrawal request is approved

- GIVEN a withdrawal request exists with status "pending"
- WHEN an admin approves the request
- THEN the status MUST be updated to "approved"
- AND processed date MUST be set

#### Scenario: Withdrawal request is rejected

- GIVEN a withdrawal request exists with status "pending"
- WHEN an admin rejects the request with reason "Invalid bank details"
- THEN the status MUST be updated to "rejected"
- AND rejection_reason MUST be populated

### Requirement: Migration of Historical Commissions

The system MUST migrate all existing commission records to wallet transactions. The migration MUST be idempotent and MUST preserve the original commission dates.

#### Scenario: Run migration script

- GIVEN the database contains 100 historical commission records
- WHEN the migration script is executed
- THEN 100 wallet transactions MUST be created
- AND each transaction MUST reference the original commission ID
- AND running the script again MUST NOT create duplicates

### Requirement: Minimum Withdrawal Amount

The system MUST enforce a minimum withdrawal amount of 20.00 USD. Withdrawal requests below this amount MUST be rejected.

#### Scenario: Request below minimum threshold

- GIVEN a user wallet has balance of 50.00 USD
- WHEN the user attempts to request a withdrawal of 15.00 USD
- THEN the request MUST be rejected with error "Minimum withdrawal amount is 20.00 USD"
- AND no withdrawal request record MUST be created

### Requirement: Withdrawal Fee Deduction

The system MUST deduct withdrawal fees from the user's wallet balance. The fee percentage MUST be configurable and MUST be deducted before the net amount is processed.

#### Scenario: Fee is deducted from user balance

- GIVEN a user requests withdrawal of 100.00 USD with 5% fee
- WHEN the withdrawal is processed
- THEN the wallet balance MUST be reduced by 105.00 USD (100 + 5)
- AND the withdrawal request MUST store fee as 5.00 USD

---

## MODIFIED Requirements

### Requirement: Commission Approval Flow

The system MUST create wallet transactions when commissions are approved. Commission approval now triggers automatic wallet credit.

(Previously: Commissions were approved but no wallet balance was updated)

#### Scenario: Commission approval triggers wallet credit

- GIVEN a pending commission of 100.00 USD exists
- WHEN the commission is approved
- THEN a wallet transaction MUST be created for 100.00 USD
- AND the wallet balance MUST reflect the new amount

---

## REMOVED Requirements

None.

---

## Implementation Notes

- All balance fields MUST use DECIMAL(10,2) for precision
- All USD amounts MUST be stored in USD (no multi-currency in records)
- Timestamps MUST use UTC timezone
- Foreign key constraints MUST reference existing user records
- Unique constraints MUST prevent duplicate withdrawal requests from same user for same amount within 1 minute
