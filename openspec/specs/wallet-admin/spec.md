# Wallet Admin Specification

## Purpose

Admin endpoints for withdrawal management: paginated listing with filters, approval and rejection with state transition validation, and manual retry of failed withdrawals. Protected by `featureGuard('cryptoWallet')` + `authenticateToken` + `requireAdmin`.

## Requirements

### Requirement: Paginated Withdrawal Listing (Admin)

The system SHALL expose `GET /api/admin/wallet/withdrawals` with pagination (`page`, `limit`), filters (`status`, `gateway`), and response including withdrawal destination for visual confirmation.

#### Scenario: Admin lists withdrawals with pagination
- GIVEN authenticated admin and existing withdrawals
- WHEN calls GET /api/admin/wallet/withdrawals?page=1&limit=20
- THEN responds 200 with requested page, pagination metadata, each item includes `destination`, `gateway`, `user`

#### Scenario: Admin filters by status and gateway
- GIVEN withdrawals in multiple states and gateways
- WHEN calls with `status=pending` and `gateway=paypal`
- THEN returns only withdrawals matching both filters

### Requirement: Withdrawal Approval with Transition Validation

The system SHALL allow `POST /api/admin/wallet/withdrawals/:id/approve` only for `pending → approved` and `failed → approved` (manual retry). Any other transition MUST respond **409 INVALID_TRANSITION**. Approval uses `SELECT FOR UPDATE` to prevent race conditions.

#### Scenario: Admin approves pending withdrawal
- GIVEN a withdrawal in `pending` with valid destination
- WHEN admin calls approve
- THEN withdrawal transitions to `approved`, persists `approvedBy`/`approvedAt`, triggers Brevo notification (best-effort)

#### Scenario: Admin retries failed withdrawal
- GIVEN a withdrawal in `failed`
- WHEN admin calls approve (manual retry)
- THEN withdrawal returns to `approved` and can execute in next daily job cycle

#### Scenario: Double approval blocked
- GIVEN a withdrawal already in `approved`
- WHEN approve called again
- THEN responds 409 INVALID_TRANSITION, state unchanged

#### Scenario: Invalid transition from paid
- GIVEN a withdrawal in `paid`
- WHEN approve called
- THEN responds 409 INVALID_TRANSITION

### Requirement: Withdrawal Rejection with Required Reason

The system SHALL allow `POST /api/admin/wallet/withdrawals/:id/reject` only for `pending → rejected`. MUST require `rejectionReason` in body (400 if missing). Persists `rejectedBy`/`rejectedAt`/`rejectionReason`.

#### Scenario: Admin rejects with reason
- GIVEN a withdrawal in `pending`
- WHEN admin calls reject with `rejectionReason`
- THEN withdrawal transitions to `rejected`, reason persisted, Brevo notification sent

#### Scenario: Rejection without reason
- GIVEN a withdrawal in `pending`
- WHEN admin calls reject without `rejectionReason`
- THEN responds 400 REJECTION_REASON_REQUIRED

#### Scenario: Rejection of non-pending withdrawal
- GIVEN a withdrawal in `approved`
- WHEN reject called
- THEN responds 409 INVALID_TRANSITION

### Requirement: Admin Access Control

The system SHALL deny access to admin endpoints with **403** for authenticated users without `admin` role. Routes MUST be mounted under `featureGuard('cryptoWallet')`.

#### Scenario: Non-admin user attempts access
- GIVEN authenticated user without admin role
- WHEN calls any admin withdrawal endpoint
- THEN responds 403

## API Contracts

**GET /api/admin/wallet/withdrawals**
```
Query: page (default 1), limit (default 20, max 100), status?, gateway?
Response 200:
{
  "success": true,
  "data": [{
    "id": "uuid",
    "user": { "id": "uuid", "email": "string", "name": "string" },
    "requestedAmount": number,
    "feeAmount": number,
    "netAmount": number,
    "status": "pending|approved|paid|rejected|failed",
    "destination": { "email": "string" },
    "gateway": "paypal",
    "gatewayPayoutId": "string|null",
    "gatewayStatus": "string|null",
    "createdAt": "ISO8601",
    "approvedAt": "ISO8601|null",
    "rejectedAt": "ISO8601|null",
    "rejectionReason": "string|null"
  }],
  "pagination": { "total": number, "page": number, "limit": number, "totalPages": number }
}
```

**POST /api/admin/wallet/withdrawals/:id/approve**
```
Body: { "approvalComment"?: "string" }
Response 200: { "success": true, "data": { "status": "approved" } }
Response 409: { "success": false, "error": { "code": "INVALID_TRANSITION", "message": "..." } }
Response 403: { "success": false, "error": { "code": "FORBIDDEN" } }
Response 404: { "success": false, "error": { "code": "NOT_FOUND" } }
```

**POST /api/admin/wallet/withdrawals/:id/reject**
```
Body: { "rejectionReason": "string" }  // required
Response 200: { "success": true, "data": { "status": "rejected" } }
Response 400: { "success": false, "error": { "code": "REJECTION_REASON_REQUIRED" } }
Response 409: { "success": false, "error": { "code": "INVALID_TRANSITION" } }
Response 403/404: as above
```

## References

- Original design: `openspec/changes/wallet-integration/design.md` (flows 2, 6; admin-wallet.routes.ts; AdminWalletController.ts)
- Related specs: `wallet-payouts` (budget check in processDailyPayouts), `wallet-notifications` (email on transitions)