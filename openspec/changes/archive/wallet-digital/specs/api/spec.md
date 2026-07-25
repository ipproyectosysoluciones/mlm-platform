# Delta for API/Backend

## Purpose

This spec defines the API endpoints and backend services required for the Wallet Digital feature, including wallet operations, transaction history, withdrawal requests, and the daily payout job.

## ADDED Requirements

### Requirement: Get Wallet Balance

The system MUST provide a GET endpoint to retrieve a user's wallet balance. The endpoint MUST return the current balance in USD, currency, and last updated timestamp.

#### Scenario: Retrieve wallet balance

- GIVEN a user with wallet ID "w-123" exists
- WHEN GET /api/wallets/:userId is called
- THEN the response MUST include balance, currency, and lastUpdated timestamp
- AND the balance MUST reflect all completed transactions

#### Scenario: User has no wallet

- GIVEN a user with ID "u-999" has no wallet record
- WHEN GET /api/wallets/:userId is called
- THEN the response MUST return status 404 with error "Wallet not found"

### Requirement: Get Wallet Transactions

The system MUST provide a GET endpoint to retrieve a user's wallet transaction history. The endpoint MUST support pagination, filtering by type, and date range.

#### Scenario: Retrieve transaction history

- GIVEN a user has 50 wallet transactions
- WHEN GET /api/wallets/:userId/transactions?page=1&limit=10 is called
- THEN the response MUST include 10 transactions
- AND pagination metadata MUST be included (total, page, limit, pages)

#### Scenario: Filter transactions by type

- GIVEN a user has transactions of types "commission_earned", "withdrawal", and "fee"
- WHEN GET /api/wallets/:userId/transactions?type=commission_earned is called
- THEN only transactions with type "commission_earned" MUST be returned

#### Scenario: Empty transaction history

- GIVEN a user has no wallet transactions
- WHEN GET /api/wallets/:userId/transactions is called
- THEN an empty array MUST be returned with total=0

### Requirement: Create Withdrawal Request

The system MUST provide a POST endpoint for users to request withdrawals. The endpoint MUST validate the minimum amount, calculate fees, and verify sufficient balance.

#### Scenario: Submit valid withdrawal request

- GIVEN a user wallet has balance of 100.00 USD
- WHEN POST /api/wallets/withdraw with body { amount: 50.00 } is called
- THEN a withdrawal request MUST be created with status "pending"
- AND the response MUST include withdrawal request details including fee

#### Scenario: Request exceeds balance

- GIVEN a user wallet has balance of 30.00 USD
- WHEN POST /api/wallets/withdraw with body { amount: 50.00 } is called
- THEN the request MUST be rejected with status 400 and error "Insufficient balance"

#### Scenario: Request below minimum

- GIVEN a user wallet has balance of 100.00 USD
- WHEN POST /api/wallets/withdraw with body { amount: 10.00 } is called
- THEN the request MUST be rejected with status 400 and error "Minimum withdrawal amount is 20.00 USD"

### Requirement: Get Withdrawal Request Status

The system MUST provide a GET endpoint for users to check their withdrawal request status.

#### Scenario: Check withdrawal status

- GIVEN a user has a withdrawal request with ID "wr-456"
- WHEN GET /api/wallets/withdrawals/:requestId is called
- THEN the response MUST include request details: amount, fee, netAmount, status, createdAt

### Requirement: Cancel Pending Withdrawal

The system MUST allow users to cancel their own pending withdrawal requests before they are processed.

#### Scenario: Cancel pending withdrawal

- GIVEN a user has a withdrawal request with status "pending"
- WHEN DELETE /api/wallets/withdrawals/:requestId is called
- THEN the status MUST be updated to "cancelled"
- AND wallet balance MUST be restored (if balance was held)

#### Scenario: Cancel already approved withdrawal

- GIVEN a user has a withdrawal request with status "approved"
- WHEN DELETE /api/wallets/withdrawals/:requestId is called
- THEN the request MUST be rejected with status 400 and error "Cannot cancel approved withdrawal"

### Requirement: Daily Payout Job

The system MUST run a scheduled job daily to process approved withdrawal requests. The job MUST process withdrawals in order, deduct fees, and update statuses.

#### Scenario: Daily job processes withdrawals

- GIVEN 5 withdrawal requests exist with status "approved" and sufficient wallet balance
- WHEN the daily payout job runs
- THEN each withdrawal MUST be processed
- AND status MUST be updated to "paid"
- AND wallet balance MUST be deducted (amount + fee)

#### Scenario: Daily job handles insufficient balance

- GIVEN a withdrawal request is approved but wallet balance is now 0.00 USD
- WHEN the daily payout job runs
- THEN the withdrawal status MUST be updated to "failed"
- AND an error notification SHOULD be sent

#### Scenario: Daily job skips already processed

- GIVEN a withdrawal request was already processed in a previous run
- WHEN the daily payout job runs
- THEN the request MUST be skipped (idempotent behavior)

### Requirement: Wallet Service Business Logic

The system MUST have a WalletService that encapsulates all wallet operations including balance calculations, fee calculations, and transaction creation.

#### Scenario: Calculate withdrawal fee

- GIVEN a withdrawal amount of 100.00 USD and fee percentage of 5%
- WHEN WalletService.calculateFee(amount) is called
- THEN the result MUST be 5.00 USD

#### Scenario: Validate sufficient balance

- GIVEN a wallet with balance of 50.00 USD
- WHEN WalletService.validateSufficientBalance(50.00) is called
- THEN the validation MUST pass

#### Scenario: Validate insufficient balance

- GIVEN a wallet with balance of 30.00 USD
- WHEN WalletService.validateSufficientBalance(50.00) is called
- THEN the validation MUST fail

### Requirement: Commission Auto-Credit Integration

The system MUST automatically create wallet transactions when commissions are approved. The integration MUST be triggered from the existing CommissionService.

#### Scenario: Commission approval creates wallet transaction

- GIVEN a commission of 100.00 USD for user U1 is being approved
- WHEN CommissionService.approve(commissionId) is called
- THEN a wallet transaction MUST be created for 100.00 USD
- AND wallet balance MUST be updated

### Requirement: Exchange Rate Conversion

The system MUST convert all commissions to USD before crediting to wallets. The system MUST store the exchange rate used for each transaction.

#### Scenario: Convert commission to USD

- GIVEN a commission of 500 MXN with exchange rate 0.055 (MXN to USD)
- WHEN the commission is credited to wallet
- THEN the wallet transaction MUST be for 27.50 USD
- AND exchange rate MUST be stored with the transaction

---

## MODIFIED Requirements

### Requirement: Scheduler Service Integration

The system MUST integrate the daily payout job into the existing SchedulerService.

(Previously: SchedulerService existed but no wallet job was scheduled)

#### Scenario: Daily job is scheduled

- GIVEN the SchedulerService is running
- WHEN the application starts
- THEN a daily cron job MUST be scheduled for processing withdrawals
- AND the job MUST run at the configured time (default: midnight UTC)

---

## REMOVED Requirements

None.

---

## Implementation Notes

- All endpoints MUST use JWT authentication
- API responses MUST follow consistent format: { success: boolean, data: any, error?: string }
- Pagination MUST use cursor-based or offset-based pagination
- Job logging MUST record all processed withdrawals
- Rate limiting SHOULD be applied to withdrawal endpoints to prevent abuse
