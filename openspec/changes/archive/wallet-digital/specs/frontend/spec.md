# Delta for Frontend

## Purpose

This spec defines the frontend requirements for the Wallet Digital feature, including the wallet dashboard, transaction history display, and withdrawal request form.

## ADDED Requirements

### Requirement: Wallet Dashboard Display

The system MUST display a wallet dashboard section showing the user's current balance, currency, and summary information. The dashboard MUST be accessible from the main navigation.

#### Scenario: Display wallet balance

- GIVEN a user is logged in and has a wallet with balance of 150.00 USD
- WHEN the user navigates to the Dashboard page
- THEN the wallet balance MUST be displayed prominently
- AND currency MUST show as "USD"
- AND balance MUST be formatted with 2 decimal places (e.g., "$150.00")

#### Scenario: Display empty wallet

- GIVEN a user is logged in and has a wallet with balance of 0.00 USD
- WHEN the user navigates to the Dashboard page
- THEN the balance MUST display as "$0.00"
- AND a message encouraging the user to earn commissions SHOULD be shown

### Requirement: Transaction History List

The system MUST display a list of wallet transactions with filtering and pagination capabilities. Users MUST be able to see their complete transaction history.

#### Scenario: Display transaction list

- GIVEN a user has 15 wallet transactions
- WHEN the user views the transaction history
- THEN the first 10 transactions MUST be displayed
- AND pagination controls MUST be visible

#### Scenario: Filter transactions by type

- GIVEN a user views the transaction history
- WHEN the user selects filter "Commissions" (commission_earned)
- THEN only commission transactions MUST be displayed

#### Scenario: Filter transactions by date range

- GIVEN a user views the transaction history
- WHEN the user selects date range "Last 30 days"
- THEN only transactions from the last 30 days MUST be displayed

#### Scenario: Empty transaction history

- GIVEN a user has no transactions
- WHEN the user views the transaction history
- THEN an empty state message MUST be displayed
- AND the message SHOULD explain how to earn commissions

### Requirement: Transaction Details

The system MUST allow users to view detailed information about any transaction. Details MUST include amount, type, date, and related reference information.

#### Scenario: View transaction details

- GIVEN a user clicks on a transaction in the list
- WHEN the transaction detail modal/page opens
- THEN the following information MUST be displayed: ID, Type, Amount, Date, Reference ID, Description

### Requirement: Withdrawal Request Form

The system MUST provide a form for users to request withdrawals. The form MUST validate the amount, display the fee, and show the net amount to be received.

#### Scenario: Display withdrawal form

- GIVEN a user has wallet balance of 100.00 USD
- WHEN the user opens the withdrawal request form
- THEN the form MUST display: Amount input, Current balance, Minimum withdrawal ($20), Fee percentage, Net amount preview

#### Scenario: Calculate fee in real-time

- GIVEN a user enters withdrawal amount of 100.00 USD with 5% fee
- WHEN the amount field changes
- THEN the net amount MUST update in real-time to show $95.00
- AND fee MUST show as $5.00

#### Scenario: Show error for invalid amount

- GIVEN a user enters withdrawal amount of 10.00 USD
- WHEN the user attempts to submit
- THEN an error message MUST appear: "Minimum withdrawal amount is $20.00 USD"
- AND the submit button MUST be disabled

#### Scenario: Show error for insufficient balance

- GIVEN a user has balance of 30.00 USD and enters amount of 50.00 USD
- WHEN the user attempts to submit
- THEN an error message MUST appear: "Insufficient balance"
- AND the submit button MUST be disabled

### Requirement: Withdrawal Request Confirmation

The system MUST confirm withdrawal requests before submission. The confirmation MUST show the full amount, fee, net amount, and require explicit user action.

#### Scenario: Confirm withdrawal request

- GIVEN a user has filled the withdrawal form with amount 50.00 USD
- WHEN the user clicks "Request Withdrawal"
- THEN a confirmation modal MUST appear showing:
  - Amount: $50.00 USD
  - Fee (5%): $2.50 USD
  - Net Amount: $47.50 USD
- AND buttons for "Confirm" and "Cancel" MUST be present

### Requirement: Withdrawal Status Display

The system MUST display the status of withdrawal requests. Users MUST be able to see pending, approved, paid, rejected, and failed requests.

#### Scenario: Display withdrawal status

- GIVEN a user has submitted a withdrawal request
- WHEN the user views their withdrawal history
- THEN the request MUST show status: pending, approved, paid, rejected, or failed
- AND each status MUST have a visual indicator (color-coded)

#### Scenario: Display rejection reason

- GIVEN a user's withdrawal request was rejected
- WHEN the user views the withdrawal details
- THEN the rejection reason MUST be displayed

### Requirement: Wallet Store (Zustand)

The system MUST use a Zustand store to manage wallet state. The store MUST handle balance, transactions, withdrawal requests, loading states, and error states.

#### Scenario: Wallet store updates on new transaction

- GIVEN a user initiates a withdrawal
- WHEN the withdrawal is confirmed
- THEN the wallet store balance MUST be updated immediately
- AND the new transaction MUST appear in the transaction list

### Requirement: Wallet Navigation

The system MUST provide easy access to wallet features from the main navigation. A wallet icon or link MUST be visible in the navigation bar.

#### Scenario: Access wallet from navigation

- GIVEN a user is on any page
- WHEN the user clicks the wallet icon in navigation
- THEN the user MUST be redirected to the wallet dashboard

---

## MODIFIED Requirements

### Requirement: Main Dashboard Integration

The system MUST integrate wallet information into the main Dashboard page. The wallet section MUST be visible alongside existing commission information.

(Previously: Dashboard showed commission summary but no wallet balance)

#### Scenario: Dashboard shows wallet section

- GIVEN a user logs in
- WHEN the user sees the main Dashboard
- THEN a wallet summary card MUST be visible
- AND it MUST show balance, pending withdrawals, and quick actions

---

## REMOVED Requirements

None.

---

## Implementation Notes

- All monetary values MUST be formatted with 2 decimal places
- Currency MUST always display as USD with $ symbol
- Loading states MUST show skeleton loaders
- Error states MUST display user-friendly messages
- Mobile-responsive design MUST be supported
- Zustand store MUST persist wallet balance in memory only (not localStorage for security)
