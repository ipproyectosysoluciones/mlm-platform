# API Reference

> Complete API documentation for the MLM Binary Affiliations Platform.

## Base URL

```
Production: https://api.mlm-platform.com
Development: http://localhost:3000
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Response Format

All responses follow this structure:

### Success

```json
{
  "success": true,
  "data": { ... }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

## Status Codes

| Code | Description  |
| ---- | ------------ |
| 200  | Success      |
| 201  | Created      |
| 400  | Bad Request  |
| 401  | Unauthorized |
| 403  | Forbidden    |
| 404  | Not Found    |
| 429  | Rate Limited |
| 500  | Server Error |

---

## 🔓 Public Endpoints

### Health Check

```
GET /api/health
```

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-03-30T12:00:00.000Z",
    "uptime": 3600
  }
}
```

---

### Register

```
POST /api/auth/register
```

**Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "referralCode": "MLM-XXXX-XXXX" // optional
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "referralCode": "MLM-ABCD-1234",
      "level": 1,
      "currency": "USD"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Login

```
POST /api/auth/login
```

**Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Get Products

```
GET /api/products
GET /api/products?page=1&limit=20&category=digital
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Streaming Plan Basic",
      "description": "Basic streaming subscription",
      "price": 9.99,
      "currency": "USD",
      "category": "streaming",
      "status": "active"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
}
```

---

### Public Profile

```
GET /api/public/profile/:referralCode
```

**Response:**

```json
{
  "success": true,
  "data": {
    "referralCode": "MLM-ABCD-1234",
    "level": 2,
    "status": "active"
  }
}
```

---

## 🔐 Authenticated Endpoints

### Get Current User

```
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "referralCode": "MLM-ABCD-1234",
    "level": 1,
    "levelName": "Starter",
    "currency": "USD",
    "role": "user",
    "sponsor": {
      "id": "uuid",
      "email": "sponsor@example.com"
    }
  }
}
```

---

### Get Dashboard

```
GET /api/dashboard
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": { ... },
    "stats": {
      "totalReferrals": 15,
      "leftCount": 8,
      "rightCount": 7,
      "totalEarnings": 1250.00,
      "pendingEarnings": 150.00
    },
    "referralLink": "https://mlm-platform.com/register?ref=MLM-ABCD-1234",
    "recentCommissions": [ ... ],
    "recentReferrals": [ ... ],
    "referralsChart": [
      { "month": "Jan", "count": 5 },
      { "month": "Feb", "count": 3 }
    ],
    "commissionsChart": [
      { "month": "Jan", "amount": 250 },
      { "month": "Feb", "amount": 180 }
    ]
  }
}
```

---

### Get Binary Tree

```
GET /api/users/:id/tree
Authorization: Bearer <token>
```

**Query Parameters:**

- `depth` (optional): Max depth to retrieve (default: 3)

**Response:**

```json
{
  "success": true,
  "data": {
    "root": {
      "id": "uuid",
      "email": "user@example.com",
      "position": null,
      "level": 1,
      "left": { ... },
      "right": { ... }
    }
  }
}
```

---

### Get QR Code

```
GET /api/users/:id/qr
Authorization: Bearer <token>
```

**Response:**
PNG image of QR code linking to registration page with referral code.

---

### Get Commissions

```
GET /api/commissions
GET /api/commissions?status=approved&page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**

- `status`: pending, approved, paid
- `type`: direct, level_1, level_2, level_3, level_4
- `page`: Page number
- `limit`: Items per page

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "direct",
      "amount": 25.00,
      "currency": "USD",
      "status": "approved",
      "fromUser": {
        "id": "uuid",
        "email": "referral@example.com"
      },
      "createdAt": "2026-03-30T12:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

---

### Get Commission Stats

```
GET /api/commissions/stats
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalEarnings": 1250.0,
    "pendingEarnings": 150.0,
    "paidEarnings": 1100.0,
    "byType": {
      "direct": 500.0,
      "level_1": 300.0,
      "level_2": 200.0,
      "level_3": 150.0,
      "level_4": 100.0
    }
  }
}
```

---

### Get Wallet Balance

```
GET /api/wallet
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "balance": 1250.0,
    "currency": "USD",
    "cryptoAddresses": {
      "BTC": "bc1q...",
      "ETH": "0x..."
    }
  }
}
```

---

### Get Wallet Transactions

```
GET /api/wallet/transactions
GET /api/wallet/transactions?type=deposit&page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**

- `type`: deposit, withdrawal, commission, purchase
- `page`: Page number
- `limit`: Items per page

---

### Request Withdrawal

```
POST /api/wallet/withdraw
Authorization: Bearer <token>
```

**Body:**

```json
{
  "amount": 100.0,
  "currency": "USD",
  "method": "bank_transfer",
  "bankAccount": {
    "accountNumber": "1234567890",
    "routingNumber": "021000021",
    "accountHolder": "John Doe"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "amount": 100.0,
    "status": "pending",
    "createdAt": "2026-03-30T12:00:00.000Z"
  }
}
```

---

### Get Crypto Prices

```
GET /api/wallet/prices
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "BTC": { "USD": 65000.0 },
    "ETH": { "USD": 3500.0 },
    "USDT": { "USD": 1.0 }
  }
}
```

---

### Create Order

```
POST /api/orders
Authorization: Bearer <token>
```

**Body:**

```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 1
    }
  ],
  "paymentMethod": "wallet"
}
```

---

### Get Orders

```
GET /api/orders
GET /api/orders?status=completed&page=1&limit=20
Authorization: Bearer <token>
```

---

### CRM - Get Leads

```
GET /api/crm
GET /api/crm?status=active&page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**

- `status`: new, contacted, qualified, proposal, won, lost
- `assignedTo`: Filter by assigned user

---

### CRM - Create Lead

```
POST /api/crm
Authorization: Bearer <token>
```

**Body:**

```json
{
  "name": "John Prospect",
  "email": "prospect@example.com",
  "phone": "+1234567890",
  "source": "website",
  "notes": "Interested in premium plan"
}
```

---

## 👑 Admin Endpoints

### Get Global Stats

```
GET /api/admin/stats
Authorization: Bearer <token> (admin only)
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalUsers": 1500,
    "activeUsers": 1200,
    "totalCommissions": 50000.0,
    "pendingWithdrawals": 2500.0,
    "treeStats": {
      "totalNodes": 1500,
      "maxDepth": 8,
      "avgDepth": 3.5
    }
  }
}
```

---

### Get All Users

```
GET /api/admin/users
Authorization: Bearer <token> (admin only)
```

**Query Parameters:**

- `status`: active, inactive
- `role`: user, admin
- `page`: Page number

---

### Update User Status

```
PATCH /api/admin/users/:userId/status
Authorization: Bearer <token> (admin only)
```

**Body:**

```json
{
  "status": "inactive"
}
```

---

### Promote to Admin

```
PATCH /api/admin/users/:userId/promote
Authorization: Bearer <token> (admin only)
```

---

## 💳 Payments

> All payment endpoints live under `/api/payment/`. Webhook endpoints do **not** require a Bearer token — they are verified via provider signature.

---

### PayPal

#### Create PayPal Order

```
POST /api/payment/paypal/create-order
Authorization: Bearer <token>
```

**Body:**

```json
{
  "amount": "10.00",
  "currency": "USD",
  "orderReference": "ORDER-123"
}
```

**Response:**

```json
{
  "id": "PAYPAL_ORDER_ID",
  "status": "CREATED",
  "approveUrl": "https://www.sandbox.paypal.com/checkoutnow?token=PAYPAL_ORDER_ID"
}
```

---

#### Capture PayPal Order

```
POST /api/payment/paypal/capture-order
Authorization: Bearer <token>
```

**Body:**

```json
{
  "orderId": "PAYPAL_ORDER_ID"
}
```

**Response:**

```json
{
  "id": "CAPTURE_ID",
  "status": "COMPLETED",
  "amount": {
    "value": "10.00",
    "currencyCode": "USD"
  }
}
```

---

#### Get PayPal Order

```
GET /api/payment/paypal/order/:orderId
Authorization: Bearer <token>
```

**Response:** PayPal order details object as returned by the PayPal Orders API.

---

#### Refund PayPal Capture

```
POST /api/payment/paypal/refund/:captureId
Authorization: Bearer <token>
```

**Body:**

```json
{
  "amount": "10.00",
  "currency": "USD",
  "note": "Customer refund"
}
```

**Response:**

```json
{
  "id": "REFUND_ID",
  "status": "COMPLETED"
}
```

---

#### PayPal Webhook

```
POST /api/payment/paypal/webhook
```

> No Bearer token required. PayPal signature is verified server-side (SSRF-safe certificate URL validation).

**Body:** PayPal webhook event payload (as sent by PayPal).

**Response:**

```json
{
  "received": true
}
```

---

### MercadoPago

#### Create Preference

```
POST /api/payment/mercadopago/create-preference
Authorization: Bearer <token>
```

**Body:**

```json
{
  "items": [
    {
      "title": "Product",
      "quantity": 1,
      "unit_price": 50000
    }
  ],
  "payer": {
    "email": "customer@example.com"
  }
}
```

**Response:**

```json
{
  "id": "PREFERENCE_ID",
  "init_point": "https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=PREFERENCE_ID",
  "sandbox_init_point": "https://sandbox.mercadopago.com.co/checkout/v1/redirect?pref_id=PREFERENCE_ID"
}
```

---

#### Process Payment

```
POST /api/payment/mercadopago/process
Authorization: Bearer <token>
```

**Body:**

```json
{
  "token": "CARD_TOKEN",
  "payment_method_id": "visa",
  "installments": 1,
  "transaction_amount": 50000,
  "payer": {
    "email": "customer@example.com"
  }
}
```

**Response:**

```json
{
  "id": 123456,
  "status": "approved",
  "status_detail": "accredited"
}
```

---

#### Get Payment

```
GET /api/payment/mercadopago/payment/:paymentId
Authorization: Bearer <token>
```

**Response:** MercadoPago payment object as returned by the MercadoPago Payments API.

---

#### Get Payment Methods

```
GET /api/payment/mercadopago/payment-methods
Authorization: Bearer <token>
```

**Response:**

```json
{
  "payment_methods": [
    {
      "id": "visa",
      "name": "Visa",
      "payment_type_id": "credit_card"
    },
    {
      "id": "mastercard",
      "name": "Mastercard",
      "payment_type_id": "credit_card"
    }
  ]
}
```

---

#### MercadoPago Webhook

```
POST /api/payment/mercadopago/webhook
```

> No Bearer token required. MercadoPago signature is verified server-side.

**Body:** MercadoPago webhook event payload (as sent by MercadoPago).

**Response:**

```json
{
  "received": true
}
```

---

## ⚠️ Error Codes

| Code               | Description              |
| ------------------ | ------------------------ |
| `VALIDATION_ERROR` | Invalid input data       |
| `UNAUTHORIZED`     | Missing or invalid token |
| `FORBIDDEN`        | Insufficient permissions |
| `NOT_FOUND`        | Resource not found       |
| `CONFLICT`         | Resource already exists  |
| `RATE_LIMITED`     | Too many requests        |
| `SERVER_ERROR`     | Internal server error    |

---

## � Rate Limits

- **Authenticated**: 50 requests/minute
- **Public**: 20 requests/minute
- **Login/Register**: 5 requests/minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1709204400
```

---

## 📄 Swagger Documentation

Interactive API documentation available at:

```
http://localhost:3000/api/docs
```

Or via ReDoc:

```
http://localhost:3000/api/docs/redoc
```
