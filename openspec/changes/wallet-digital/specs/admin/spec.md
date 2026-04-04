# Delta for Admin

## Purpose

This spec defines the admin requirements for the Wallet Digital feature, including withdrawal approval, manual adjustments, and wallet management capabilities.

## ADDED Requirements

### Requirement: View All Withdrawal Requests

The system MUST provide an admin interface to view all withdrawal requests across all users. The view MUST support filtering by status, date range, and user.

#### Scenario: Admin views withdrawal requests list

- GIVEN an admin user is logged in
- WHEN the admin navigates to the Withdrawal Requests page
- THEN all withdrawal requests MUST be displayed in a table
- AND columns MUST include: User, Amount, Fee, Net Amount, Status, Date Requested, Date Processed

#### Scenario: Filter withdrawal requests by status

- GIVEN an admin views withdrawal requests
- WHEN the admin filters by status "pending"
- THEN only pending withdrawal requests MUST be displayed

#### Scenario: Filter withdrawal requests by date

- GIVEN an admin views withdrawal requests
- WHEN the admin filters by date range "Today"
- THEN only withdrawal requests from today MUST be displayed

### Requirement: Approve Withdrawal Request

The system MUST allow admins to approve pending withdrawal requests. The approval MUST update the status and trigger the payout process.

#### Scenario: Admin approves withdrawal

- GIVEN a withdrawal request exists with status "pending"
- WHEN an admin clicks "Approve"
- THEN the status MUST be updated to "approved"
- AND processed date MUST be set
- AND the request MUST be queued for daily payout job

#### Scenario: Admin approves withdrawal with comments

- GIVEN a withdrawal request exists with status "pending"
- WHEN an admin approves with comment "Verified bank details"
- THEN the status MUST be updated to "approved"
- AND approval comment MUST be stored

### Requirement: Reject Withdrawal Request

The system MUST allow admins to reject pending withdrawal requests. The rejection MUST require a reason and MUST restore the user's wallet balance (if balance was held).

#### Scenario: Admin rejects withdrawal

- GIVEN a withdrawal request exists with status "pending"
- WHEN an admin clicks "Reject" and provides reason "Invalid bank account"
- THEN the status MUST be updated to "rejected"
- AND rejection_reason MUST be populated
- AND if balance was held, it MUST be restored

#### Scenario: Admin rejects already paid withdrawal

- GIVEN a withdrawal request exists with status "paid"
- WHEN an admin attempts to reject
- THEN the action MUST be rejected with error "Cannot reject paid withdrawal"

### Requirement: Manual Wallet Adjustment

The system MUST allow admins to manually adjust user wallet balances. Adjustments MUST require a reason and create an audit trail.

#### Scenario: Admin adds funds to wallet

- GIVEN a user wallet has balance of 50.00 USD
- WHEN an admin adds 100.00 USD with reason "Bonus payment"
- THEN the wallet balance MUST be updated to 150.00 USD
- AND a wallet transaction of type "adjustment" MUST be created for +100.00 USD
- AND adjustment reason MUST be stored in the transaction

#### Scenario: Admin deducts funds from wallet

- GIVEN a user wallet has balance of 100.00 USD
- WHEN an admin deducts 25.00 USD with reason "Refund"
- THEN the wallet balance MUST be updated to 75.00 USD
- AND a wallet transaction of type "adjustment" MUST be created for -25.00 USD

### Requirement: View User Wallet Details

The system MUST allow admins to view any user's wallet details including balance, transaction history, and withdrawal requests.

#### Scenario: Admin views user wallet

- GIVEN an admin is viewing user management
- WHEN the admin clicks "View Wallet" for a specific user
- THEN the wallet details MUST be displayed including:
  - Current balance
  - Transaction count
  - Recent transactions (last 10)
  - Withdrawal request history

#### Scenario: Admin searches for user wallet

- GIVEN an admin is on the wallet management page
- WHEN the admin searches by user email "user@example.com"
- THEN the user's wallet MUST be displayed if it exists

### Requirement: View Transaction Audit Trail

The system MUST provide a complete audit trail for all wallet transactions. Admins MUST be able to see who created each transaction and when.

#### Scenario: Admin views transaction details

- GIVEN an admin views a transaction
- WHEN the admin clicks to see full details
- THEN the following MUST be displayed:
  - Transaction ID
  - Wallet ID
  - Type
  - Amount
  - Reference ID
  - Description
  - Created at
  - Created by (if applicable)

### Requirement: Bulk Process Withdrawals

The system MUST allow admins to manually trigger the payout process for approved withdrawals outside of the daily job schedule.

#### Scenario: Admin manually processes withdrawals

- GIVEN 10 withdrawal requests exist with status "approved"
- WHEN an admin clicks "Process Now"
- THEN all 10 withdrawals MUST be processed immediately
- AND status MUST be updated to "paid"
- AND wallet balances MUST be deducted

#### Scenario: Bulk process handles partial failures

- GIVEN 5 withdrawal requests are approved, but 2 users have insufficient balance
- WHEN admin clicks "Process Now"
- THEN 3 withdrawals MUST be processed successfully
- AND 2 MUST be marked as "failed"
- AND a summary MUST show success/failure counts

### Requirement: Wallet Settings Configuration

The system MUST allow admins to configure wallet settings including minimum withdrawal amount and fee percentage.

#### Scenario: Admin updates minimum withdrawal

- GIVEN an admin is on wallet settings
- WHEN the admin changes minimum withdrawal from $20 to $25
- THEN new withdrawal requests MUST require minimum $25
- AND existing requests MUST NOT be affected

#### Scenario: Admin updates withdrawal fee

- GIVEN an admin is on wallet settings
- WHEN the admin changes fee from 5% to 3%
- THEN new withdrawal requests MUST use 3% fee
- AND existing requests MUST NOT be affected

---

## MODIFIED Requirements

### Requirement: Commission Management Integration

The system MUST integrate wallet visibility into the existing commission management interface.

(Previously: Admins could view and approve commissions but saw no wallet impact)

#### Scenario: Admin sees wallet impact when approving commission

- GIVEN an admin views a pending commission
- WHEN the admin approves the commission
- THEN the admin SHOULD see a notification showing "Wallet will be credited: $XX.XX USD"

---

## REMOVED Requirements

None.

---

## Implementation Notes

- All admin actions MUST be logged with user ID, timestamp, and action type
- Manual adjustments MUST require at least one admin approval (configurable)
- Bulk operations MUST show progress indicators and completion summaries
- Pagination MUST support large datasets (1000+ withdrawal requests)
- Export functionality SHOULD be available (CSV/Excel)
- Two-factor authentication SHOULD be required for manual adjustments
