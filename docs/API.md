# API Reference

> Complete API documentation for the Nexo Real Platform.

## Base URL

```
Production: https://api.nexoreal.xyz # TODO: domain pending
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
    "referralLink": "https://nexoreal.xyz/register?ref=NXR-ABCD-1234", // TODO: domain pending
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

## 🏆 Achievements / Logros

### Get All Achievements

```
GET /api/achievements
```

**Authentication Required:** Yes (Bearer Token)

**Description:** Returns all achievements (active and coming_soon) with unlock status and current progress for the authenticated user. / Retorna todos los logros (activos y próximos) con estado de desbloqueo y progreso actual del usuario autenticado.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "acc-login-1",
      "name": "First Login / Primer Login",
      "description": "Log in for the first time / Inicia sesión por primera vez",
      "icon": "🎯",
      "category": "engagement",
      "points": 10,
      "status": "active",
      "unlocked": true,
      "unlockedAt": "2026-03-30T10:15:00.000Z",
      "progress": 1,
      "requirement": 1,
      "badge": {
        "id": "badge-login-1",
        "name": "Newcomer / Novato",
        "color": "#4CAF50"
      }
    }
  ]
}
```

---

### Get User's Unlocked Achievements

```
GET /api/achievements/me
```

**Authentication Required:** Yes (Bearer Token)

**Description:** Returns only the achievements the authenticated user has unlocked with unlock dates. / Retorna solo los logros desbloqueados por el usuario autenticado con fechas.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "acc-login-1",
      "name": "First Login / Primer Login",
      "unlockedAt": "2026-03-30T10:15:00.000Z",
      "points": 10,
      "badge": {
        "id": "badge-login-1",
        "name": "Newcomer / Novato"
      }
    }
  ]
}
```

---

### Get Achievement Summary

```
GET /api/achievements/me/summary
```

**Authentication Required:** Yes (Bearer Token)

**Description:** Returns aggregate statistics — total unlocked, points earned, tier breakdown, and recent unlocks. / Retorna estadísticas agregadas — total desbloqueado, puntos ganados, desglose de niveles y desbloqueos recientes.

**Response:**

```json
{
  "success": true,
  "data": {
    "totalUnlocked": 5,
    "totalPoints": 150,
    "tier": "Silver",
    "tierProgress": 0.75,
    "nextTierUnlock": 200,
    "recentUnlocks": [
      {
        "id": "acc-first-order",
        "name": "First Order / Primer Pedido",
        "unlockedAt": "2026-04-03T14:30:00.000Z"
      }
    ]
  }
}
```

---

## 📊 Leaderboards / Tableros de Clasificación

### Get Top Sellers

```
GET /api/leaderboard/sellers?period=weekly&limit=10
```

**Authentication Required:** Yes (Bearer Token)

**Query Parameters:**

- `period` (optional): `weekly` | `monthly` | `all-time` (default: `weekly`)
- `limit` (optional): 1-50 (default: `10`)

**Description:** Returns top sellers ranked by revenue in the specified period. / Retorna los mejores vendedores clasificados por ingresos en el período especificado.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "userId": "user-abc123",
      "email": "seller@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "https://...",
      "revenue": 5000.0,
      "orderCount": 25,
      "period": "weekly"
    }
  ]
}
```

---

### Get Top Referrers

```
GET /api/leaderboard/referrers?period=weekly&limit=10
```

**Authentication Required:** Yes (Bearer Token)

**Query Parameters:**

- `period` (optional): `weekly` | `monthly` | `all-time` (default: `weekly`)
- `limit` (optional): 1-50 (default: `10`)

**Description:** Returns top referrers ranked by number of referred users. / Retorna los mejores referidores clasificados por cantidad de usuarios referidos.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "userId": "user-xyz789",
      "email": "referrer@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "avatar": "https://...",
      "referralCount": 50,
      "period": "weekly"
    }
  ]
}
```

---

### Get User Rank

```
GET /api/leaderboard/me?period=weekly&category=sellers
```

**Authentication Required:** Yes (Bearer Token)

**Query Parameters:**

- `period` (optional): `weekly` | `monthly` | `all-time` (default: `weekly`)
- `category` (optional): `sellers` | `referrers` (default: `sellers`)

**Description:** Returns the authenticated user's rank and stats in the specified leaderboard category. / Retorna la posición y estadísticas del usuario autenticado en la categoría de tabla de clasificación especificada.

**Response:**

```json
{
  "success": true,
  "data": {
    "rank": 3,
    "userId": "user-abc123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "revenue": 2500.0,
    "orderCount": 12,
    "percentile": 85,
    "totalUsers": 1200,
    "period": "weekly",
    "category": "sellers"
  }
}
```

---

## ⚙️ Commission Configuration (Admin)

> Admin endpoints for managing commission rate configurations by business type and MLM level. All endpoints require admin authentication and are mounted at `/api/admin/commissions`.

### Get All Commission Configurations

```
GET /api/admin/commissions/config
Authorization: Bearer <token> (admin only)
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "businessType": "suscripcion",
      "customBusinessName": null,
      "level": "direct",
      "percentage": 0.1,
      "isActive": true,
      "createdAt": "2026-04-01T00:00:00.000Z",
      "updatedAt": "2026-04-01T00:00:00.000Z"
    }
  ]
}
```

---

### Get Commission Config by ID

```
GET /api/admin/commissions/config/:id
Authorization: Bearer <token> (admin only)
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "businessType": "producto",
    "level": "level_1",
    "percentage": 0.05,
    "isActive": true
  }
}
```

---

### Create Commission Configuration

```
POST /api/admin/commissions/config
Authorization: Bearer <token> (admin only)
```

**Body:**

```json
{
  "businessType": "suscripcion",
  "level": "direct",
  "percentage": 0.1
}
```

| Field                | Type   | Required | Description                                                   |
| -------------------- | ------ | -------- | ------------------------------------------------------------- |
| `businessType`       | string | ✅       | `suscripcion`, `producto`, `membresia`, `servicio`, or `otro` |
| `customBusinessName` | string | —        | Custom name (only when `businessType` is `otro`)              |
| `level`              | string | ✅       | `direct`, `level_1`, `level_2`, `level_3`, or `level_4`       |
| `percentage`         | number | ✅       | Commission rate between 0 and 1 (e.g., 0.10 = 10%)            |

> Returns `409 Conflict` if a configuration already exists for the given `businessType` + `level` combination.

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "businessType": "suscripcion",
    "level": "direct",
    "percentage": 0.1,
    "isActive": true,
    "createdAt": "2026-04-08T00:00:00.000Z"
  }
}
```

---

### Update Commission Configuration

```
PUT /api/admin/commissions/config/:id
Authorization: Bearer <token> (admin only)
```

**Body:**

```json
{
  "percentage": 0.12,
  "isActive": false
}
```

> Both `percentage` and `isActive` are optional. Only provided fields are updated.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "businessType": "suscripcion",
    "level": "direct",
    "percentage": 0.12,
    "isActive": false,
    "updatedAt": "2026-04-08T12:00:00.000Z"
  }
}
```

---

### Delete Commission Configuration

```
DELETE /api/admin/commissions/config/:id
Authorization: Bearer <token> (admin only)
```

**Response:**

```json
{
  "success": true,
  "data": null
}
```

---

### Get Active Rates by Business Type

```
GET /api/admin/commissions/rates/:businessType
Authorization: Bearer <token> (admin only)
```

**Path Parameter:** `businessType` — one of `suscripcion`, `producto`, `membresia`, `servicio`, `otro`

**Description:** Returns active commission rates for a specific business type, filling in default rates for any unconfigured levels.

**Response:**

```json
{
  "success": true,
  "data": {
    "direct": 0.1,
    "level_1": 0.05,
    "level_2": 0.03,
    "level_3": 0.02,
    "level_4": 0.01
  }
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

---

## 🏪 Products & Categories (Sprint 3)

### Public: List Active Products

```
GET /api/products
GET /api/products?page=1&limit=20&category=<slug>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "sku": "SKU-001",
      "price": 29.99,
      "type": "physical",
      "category": { "id": "uuid", "name": "Electronics", "slug": "electronics" },
      "status": "active"
    }
  ],
  "pagination": { "total": 50, "page": 1, "limit": 20, "totalPages": 3 }
}
```

---

### Public: Get Product Detail

```
GET /api/products/:id
```

---

### Public: List Active Categories

```
GET /api/categories
```

---

### Admin: List All Products

```
GET /api/admin/products
Authorization: Bearer <token> (admin only)
```

---

### Admin: Create Product

```
POST /api/admin/products
Authorization: Bearer <token> (admin only)
```

**Body:**

```json
{
  "name": "New Product",
  "sku": "SKU-002",
  "price": 49.99,
  "type": "digital",
  "categoryId": "uuid",
  "description": "Product description",
  "metadata": {}
}
```

---

### Admin: Update Product

```
PUT /api/admin/products/:id
Authorization: Bearer <token> (admin only)
```

---

### Admin: Delete Product

```
DELETE /api/admin/products/:id
Authorization: Bearer <token> (admin only)
```

---

### Admin: Get Inventory

```
GET /api/admin/products/:id/inventory
Authorization: Bearer <token> (admin only)
```

**Response:**

```json
{
  "success": true,
  "data": {
    "productId": "uuid",
    "stock": 150,
    "minStock": 10,
    "updatedAt": "2026-04-04T00:00:00.000Z"
  }
}
```

---

### Admin: Update Inventory Stock

```
POST /api/admin/products/:id/inventory
Authorization: Bearer <token> (admin only)
```

**Body:**

```json
{
  "stock": 200,
  "minStock": 10
}
```

---

### Admin: Get Inventory Movements

```
GET /api/admin/products/:id/inventory/movements
Authorization: Bearer <token> (admin only)
```

---

### Admin: Record Inventory Movement

```
POST /api/admin/products/:id/inventory/movements
Authorization: Bearer <token> (admin only)
```

**Body:**

```json
{
  "type": "in",
  "quantity": 50,
  "reason": "Restocking",
  "reference": "PO-2026-001"
}
```

---

### Admin: Reserve Stock

```
POST /api/admin/products/:id/inventory/reserve
Authorization: Bearer <token> (admin only)
```

**Description:** Reserves stock for an order. Returns error if insufficient stock is available.

**Body:**

```json
{
  "quantity": 5,
  "referenceId": "order-uuid"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "productId": "uuid",
    "reserved": 5,
    "availableStock": 145
  }
}
```

---

### Admin: Release Reserved Stock

```
POST /api/admin/products/:id/inventory/release
Authorization: Bearer <token> (admin only)
```

**Description:** Releases previously reserved stock (e.g., when an order is cancelled).

**Body:**

```json
{
  "quantity": 5,
  "referenceId": "order-uuid"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "productId": "uuid",
    "released": 5,
    "availableStock": 150
  }
}
```

---

### Admin: Adjust Stock Manually

```
POST /api/admin/products/:id/inventory/adjust
Authorization: Bearer <token> (admin only)
```

**Description:** Manually adjusts stock quantity with a reason for audit trail. Quantity can be positive (add) or negative (remove).

**Body:**

```json
{
  "quantity": -3,
  "reason": "Damaged items removed from inventory"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "productId": "uuid",
    "adjusted": -3,
    "newStock": 147
  }
}
```

---

### Admin: Set Initial Stock

```
POST /api/admin/products/:id/inventory/initial
Authorization: Bearer <token> (admin only)
```

**Description:** Sets the initial stock quantity for a product. Typically used when first setting up inventory.

**Body:**

```json
{
  "quantity": 200
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "productId": "uuid",
    "stock": 200
  }
}
```

---

### Admin: Record Return

```
POST /api/admin/products/:id/inventory/return
Authorization: Bearer <token> (admin only)
```

**Description:** Records returned items back into inventory.

**Body:**

```json
{
  "quantity": 2,
  "reason": "Customer return — defective item",
  "referenceId": "order-uuid"
}
```

> `referenceId` is optional — links the return to a specific order.

**Response:**

```json
{
  "success": true,
  "data": {
    "productId": "uuid",
    "returned": 2,
    "newStock": 152
  }
}
```

---

### Admin: List All Categories

```
GET /api/admin/categories
Authorization: Bearer <token> (admin only)
```

---

### Admin: Create Category

```
POST /api/admin/categories
Authorization: Bearer <token> (admin only)
```

**Body:**

```json
{
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic products",
  "parentId": null
}
```

---

### Admin: Update Category

```
PUT /api/admin/categories/:id
Authorization: Bearer <token> (admin only)
```

---

### Admin: Delete Category

```
DELETE /api/admin/categories/:id
Authorization: Bearer <token> (admin only)
```

---

## 🏬 Marketplace / Vendors (Sprint 3)

### Vendor: Dashboard

```
GET /api/vendor/dashboard
Authorization: Bearer <token> (vendor role)
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalProducts": 12,
    "totalOrders": 45,
    "totalRevenue": 2500.0,
    "pendingOrders": 3,
    "commissionRate": 0.15
  }
}
```

---

### Vendor: My Products

```
GET /api/vendor/products
Authorization: Bearer <token> (vendor role)
```

---

### Admin: List Vendors

```
GET /api/admin/vendors
Authorization: Bearer <token> (admin only)
```

---

### Admin: Get Vendor Detail

```
GET /api/admin/vendors/:id
Authorization: Bearer <token> (admin only)
```

---

### Admin: Update Vendor Commission Rate

```
PATCH /api/admin/vendors/:id/commission-rate
Authorization: Bearer <token> (admin only)
```

**Body:**

```json
{
  "commissionRate": 0.2
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "commissionRate": 0.2,
    "updatedAt": "2026-04-04T00:00:00.000Z"
  }
}
```

---

### Admin: Approve Vendor

```
POST /api/admin/vendors/:id/approve
Authorization: Bearer <token> (admin only)
```

**Description:** Approves a pending vendor application. Only vendors in `pending` status can be approved.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "approved",
    "updatedAt": "2026-04-04T00:00:00.000Z"
  },
  "message": "Vendor approved successfully"
}
```

---

### Admin: Reject Vendor

```
POST /api/admin/vendors/:id/reject
Authorization: Bearer <token> (admin only)
```

**Body:**

```json
{
  "reason": "Incomplete documentation"
}
```

> `reason` is required (max 500 characters).

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "rejected",
    "updatedAt": "2026-04-04T00:00:00.000Z"
  },
  "message": "Vendor rejected"
}
```

---

### Admin: Suspend Vendor

```
POST /api/admin/vendors/:id/suspend
Authorization: Bearer <token> (admin only)
```

**Body:**

```json
{
  "reason": "Policy violation"
}
```

> `reason` is required (max 500 characters).

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "suspended",
    "updatedAt": "2026-04-04T00:00:00.000Z"
  },
  "message": "Vendor suspended"
}
```

---

## 🚚 Shipping & Delivery (Sprint 3)

### Get Shipping Addresses

```
GET /api/addresses
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fullName": "John Doe",
      "street": "123 Main St",
      "city": "Buenos Aires",
      "state": "CABA",
      "country": "AR",
      "postalCode": "1000",
      "phone": "+54911...",
      "isDefault": true
    }
  ]
}
```

---

### Create Shipping Address

```
POST /api/addresses
Authorization: Bearer <token>
```

**Body:**

```json
{
  "fullName": "John Doe",
  "street": "123 Main St",
  "city": "Buenos Aires",
  "state": "CABA",
  "country": "AR",
  "postalCode": "1000",
  "phone": "+54911...",
  "isDefault": false
}
```

---

### Get Address Detail

```
GET /api/addresses/:id
Authorization: Bearer <token>
```

---

### Update Address

```
PUT /api/addresses/:id
Authorization: Bearer <token>
```

---

### Delete Address

```
DELETE /api/addresses/:id
Authorization: Bearer <token>
```

---

### Set Default Address

```
PATCH /api/addresses/:id/default
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": { "id": "uuid", "isDefault": true }
}
```

---

### Assign Shipping to Order

```
PUT /api/orders/:id/shipping
Authorization: Bearer <token>
```

**Body:**

```json
{
  "providerId": "uuid",
  "shippingAddressId": "uuid",
  "trackingNumber": "TRACK-123456"
}
```

---

### Get Order Tracking

```
GET /api/orders/:id/tracking
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "trackingNumber": "TRACK-123456",
    "provider": "DiDi Envíos",
    "status": "in_transit",
    "estimatedDelivery": "2026-04-06T18:00:00.000Z",
    "events": [
      { "timestamp": "2026-04-04T10:00:00Z", "status": "picked_up", "location": "Buenos Aires" }
    ]
  }
}
```

---

### Delivery Provider Webhook

```
POST /api/webhooks/shipping/:providerId
```

**Body:** Provider-specific payload (status update, tracking events).

**Note:** This endpoint does NOT require authentication — it uses a provider secret for validation.

---

## 📄 Affiliate Contracts (Sprint 3)

### List Active Contracts with Acceptance Status

```
GET /api/contracts
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Terms of Service",
      "version": "1.2.0",
      "userStatus": "accepted",
      "acceptedAt": "2026-04-01T12:00:00.000Z"
    }
  ]
}
```

---

### Get Contract Template

```
GET /api/contracts/:id
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Terms of Service",
    "version": "1.2.0",
    "content": "# Terms of Service\n\nFull markdown content...",
    "isActive": true
  }
}
```

---

### Accept Contract

```
POST /api/contracts/:id/accept
Authorization: Bearer <token>
```

Records acceptance with IP address, user agent, and SHA-256 hash of the contract content.

**Response:**

```json
{
  "success": true,
  "data": {
    "contractId": "uuid",
    "userId": "uuid",
    "status": "accepted",
    "hash": "sha256-hash-of-content",
    "acceptedAt": "2026-04-04T00:00:00.000Z"
  }
}
```

---

### Decline Contract

```
POST /api/contracts/:id/decline
Authorization: Bearer <token>
```

---

### Admin: List All Contract Templates

```
GET /api/admin/contracts
Authorization: Bearer <token> (admin only)
```

---

### Admin: Create Contract Template

```
POST /api/admin/contracts
Authorization: Bearer <token> (admin only)
```

**Body:**

```json
{
  "title": "Affiliate Agreement",
  "content": "# Affiliate Agreement\n\n...",
  "version": "1.0.0",
  "isActive": true
}
```

---

### Admin: Update Contract Template (creates new version)

```
PUT /api/admin/contracts/:id
Authorization: Bearer <token> (admin only)
```

**Note:** Updating a contract creates a new version automatically. Existing acceptances remain valid under the old version.

---

### Admin: Get User Contract Acceptances

```
GET /api/admin/contracts/users/:userId
Authorization: Bearer <token> (admin only)
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "contractId": "uuid",
      "title": "Terms of Service",
      "version": "1.2.0",
      "status": "accepted",
      "acceptedAt": "2026-04-01T12:00:00.000Z",
      "ip": "192.168.1.1",
      "hash": "sha256-hash"
    }
  ]
}
```

---

### Admin: Revoke User Contract Acceptance

```
POST /api/admin/contracts/:id/revoke/:userId
Authorization: Bearer <token> (admin only)
```

**Response:**

```json
{
  "success": true,
  "data": {
    "contractId": "uuid",
    "userId": "uuid",
    "status": "revoked",
    "revokedAt": "2026-04-04T00:00:00.000Z"
  }
}
```

---

## 🤖 Bot Endpoints (Sprint 7 — v2.3.0)

> Todos los endpoints `/api/bot/*` requieren el header `x-bot-secret` en lugar de Bearer token. La autenticación es manejada por el middleware `authenticateBot`.

### Bot Health Check

```
GET /api/bot/health
x-bot-secret: <bot-secret>
```

**Auth:** Header `x-bot-secret` — validado por middleware `authenticateBot`.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-04-08T00:00:00.000Z",
    "service": "nexo-bot-backend",
    "config": {
      "openai": true,
      "botSecret": true
    }
  }
}
```

**Response 401** — header ausente o inválido:

```json
{
  "error": "Unauthorized"
}
```

---

### Bot: Get Properties

```
GET /api/bot/properties
x-bot-secret: <bot-secret>
```

**Query Parameters:**

- `city`: Filtrar por ciudad
- `type`: Tipo de propiedad (`apartment`, `house`, `commercial`)
- `page`: Número de página (default: 1)
- `limit`: Items por página (max: 10, default: 5)

---

### Bot: Get Tour Packages

```
GET /api/bot/tours
x-bot-secret: <bot-secret>
```

**Query Parameters:**

- `destination`: Filtrar por destino
- `page`: Número de página (default: 1)
- `limit`: Items por página (max: 10, default: 5)

---

## Sprint 5 — Real Estate & Tourism Endpoints (v2.1.0)

### Properties

| Método | Ruta                               | Auth  | Descripción                                                                                  |
| ------ | ---------------------------------- | ----- | -------------------------------------------------------------------------------------------- |
| GET    | `/api/properties`                  | —     | Listado paginado. Query: `type`, `city`, `minPrice`, `maxPrice`, `bedrooms`, `page`, `limit` |
| GET    | `/api/properties/:id`              | —     | Detalle de propiedad                                                                         |
| GET    | `/api/properties/:id/availability` | —     | Disponibilidad. Query: `startDate`, `endDate`                                                |
| POST   | `/api/admin/properties`            | Admin | Crear propiedad                                                                              |
| PUT    | `/api/admin/properties/:id`        | Admin | Actualizar propiedad                                                                         |
| DELETE | `/api/admin/properties/:id`        | Admin | Soft-delete propiedad                                                                        |

### Tour Packages

| Método | Ruta                          | Auth  | Descripción                                                                                                        |
| ------ | ----------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------ |
| GET    | `/api/tours`                  | —     | Listado paginado. Query: `type`, `category`, `minDuration`, `maxDuration`, `minPrice`, `maxPrice`, `page`, `limit` |
| GET    | `/api/tours/:id`              | —     | Detalle del tour                                                                                                   |
| GET    | `/api/tours/:id/availability` | —     | Disponibilidad de fechas                                                                                           |
| POST   | `/api/admin/tours`            | Admin | Crear tour                                                                                                         |
| PUT    | `/api/admin/tours/:id`        | Admin | Actualizar tour                                                                                                    |
| DELETE | `/api/admin/tours/:id`        | Admin | Soft-delete tour                                                                                                   |

### Reservations

| Método | Ruta                                  | Auth  | Descripción                             |
| ------ | ------------------------------------- | ----- | --------------------------------------- |
| POST   | `/api/reservations`                   | JWT   | Crear reserva (property o tour)         |
| GET    | `/api/reservations`                   | JWT   | Listar reservas del usuario autenticado |
| GET    | `/api/reservations/:id`               | JWT   | Detalle de reserva                      |
| PATCH  | `/api/reservations/:id/cancel`        | JWT   | Cancelar reserva                        |
| GET    | `/api/admin/reservations`             | Admin | Listar todas las reservas               |
| GET    | `/api/admin/reservations/:id`         | Admin | Detalle de reserva (admin)              |
| POST   | `/api/admin/reservations`             | Admin | Crear reserva (admin)                   |
| PUT    | `/api/admin/reservations/:id`         | Admin | Actualizar reserva                      |
| POST   | `/api/admin/reservations/:id/cancel`  | Admin | Cancelar reserva                        |
| POST   | `/api/admin/reservations/:id/confirm` | Admin | Confirmar reserva                       |

---

## 🗓️ Admin Reservation Management

> Admin-level endpoints for full reservation lifecycle management. All endpoints require admin role authentication.

### Admin: List All Reservations

```
GET /api/admin/reservations
Authorization: Bearer <token> (admin only)
```

**Query Parameters:**

- `type`: `property` | `tour` — filter by reservation type
- `status`: `pending` | `confirmed` | `cancelled` | `completed` | `no_show`
- `userId`: UUID — filter by user
- `vendorId`: UUID — filter by vendor
- `paymentStatus`: `pending` | `paid` | `refunded` | `failed`
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "property",
      "status": "pending",
      "guestName": "John Doe",
      "guestEmail": "john@example.com",
      "totalPrice": 500.0,
      "paymentStatus": "pending",
      "createdAt": "2026-04-08T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "totalPages": 3
  }
}
```

---

### Admin: Get Reservation by ID

```
GET /api/admin/reservations/:id
Authorization: Bearer <token> (admin only)
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "property",
    "status": "pending",
    "userId": "uuid",
    "propertyId": "uuid",
    "checkIn": "2026-07-01",
    "checkOut": "2026-07-07",
    "guestName": "John Doe",
    "guestEmail": "john@example.com",
    "guestPhone": "+1234567890",
    "totalPrice": 500.0,
    "currency": "USD",
    "paymentStatus": "pending",
    "notes": "Late check-in requested",
    "createdAt": "2026-04-08T00:00:00.000Z"
  }
}
```

---

### Admin: Create Reservation

```
POST /api/admin/reservations
Authorization: Bearer <token> (admin only)
```

**Body:**

```json
{
  "type": "property",
  "userId": "uuid",
  "propertyId": "uuid",
  "checkIn": "2026-07-01",
  "checkOut": "2026-07-07",
  "guestName": "John Doe",
  "guestEmail": "john@example.com",
  "totalPrice": 500.0,
  "currency": "USD"
}
```

> For tour reservations, use `tourPackageId`, `tourDate`, and `groupSize` instead of `propertyId`, `checkIn`, and `checkOut`.

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "property",
    "status": "pending",
    "totalPrice": 500.0,
    "createdAt": "2026-04-08T00:00:00.000Z"
  }
}
```

---

### Admin: Update Reservation

```
PUT /api/admin/reservations/:id
Authorization: Bearer <token> (admin only)
```

**Body:**

```json
{
  "status": "confirmed",
  "adminNotes": "Payment verified manually",
  "paymentStatus": "paid",
  "paymentId": "PAY-12345"
}
```

> All fields are optional. Supports updating status, admin notes, payment status, and payment reference.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "confirmed",
    "paymentStatus": "paid",
    "adminNotes": "Payment verified manually",
    "updatedAt": "2026-04-08T12:00:00.000Z"
  }
}
```

---

### Admin: Cancel Reservation

```
POST /api/admin/reservations/:id/cancel
Authorization: Bearer <token> (admin only)
```

**Description:** Cancels a reservation and restores tour availability if applicable.

**Body:**

```json
{
  "reason": "Guest requested cancellation"
}
```

> `reason` is optional but recommended for audit trail.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "cancelled",
    "updatedAt": "2026-04-08T12:00:00.000Z"
  }
}
```

---

### Admin: Confirm Reservation

```
POST /api/admin/reservations/:id/confirm
Authorization: Bearer <token> (admin only)
```

**Description:** Confirms a pending reservation.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "confirmed",
    "updatedAt": "2026-04-08T12:00:00.000Z"
  }
}
```
