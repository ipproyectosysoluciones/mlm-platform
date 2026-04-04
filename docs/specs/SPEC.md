# MLM Platform - Technical Specification

## Feature Status / Estado de Funcionalidades

### ✅ DONE - Core MVP Features

| Feature                       | Description                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| Authentication                | JWT tokens, bcrypt password hashing, rate limiting (5 req/15min)                           |
| Binary Tree                   | Closure Table pattern, automatic left/right placement                                      |
| Commission System             | 5 niveles (direct 10%, level_1 5%, level_2 3%, level_3 2%, level_4 1%), configurable rates |
| Dashboard                     | Stats, charts, recent commissions, QR code link                                            |
| QR Code Generation            | Data URL for referral links                                                                |
| Admin Panel                   | User management, status control (active/inactive/suspended), promote to admin              |
| CRM                           | Leads CRUD, Tasks, Communications, Kanban board, CSV import/export                         |
| Tree Visualization            | React Flow with pan/zoom, minimap, search, details panel                                   |
| i18n Bilingual                | Spanish/English with auto-detection and localStorage persistence                           |
| Horizontal Navbar             | Responsive design with mobile hamburger menu                                               |
| Landing Pages                 | Visual builder, tracking (views/conversions), templates                                    |
| E-commerce Streaming          | Products catalog, orders, subscriptions (Netflix, Spotify, etc.)                           |
| Wallet                        | Balance tracking, deposits, withdrawals with fee calculation (5%, $20 min)                 |
| Currency Conversion           | Frankfurter API integration                                                                |
| CommissionConfig API          | Admin CRUD for configurable commission rates                                               |
| **2FA (TOTP)**                | **Two-Factor Authentication with TOTP, recovery codes, AES-256-GCM encryption** ⭐         |
| **Playwright Visual Testing** | **E2E tests with headed mode, video recording, UI mode**                                   |
| **Frontend 2FA UI**           | **React UI for 2FA setup, QR code display, enable/disable, recovery codes**                |
| **Security Hardening**        | **SSRF protection, XSS sanitization, pino-http logging, Docker hardening** ⭐ Sprint 3     |
| **Generic Products**          | **Category + Product + Inventory models, CRUD, SKU, stock tracking** ⭐ Sprint 3           |
| **Marketplace Multi-vendor**  | **Vendor model, 3-way commission split, vendor dashboard** ⭐ Sprint 3                     |
| **Delivery Integration**      | **ShippingAddress, DeliveryProvider, ShipmentTracking, webhooks** ⭐ Sprint 3              |
| **Affiliate Contracts MVP**   | **ContractTemplate + AffiliateContract, versioning, IP/hash audit trail** ⭐ Sprint 3      |
| Tests                         | 307 total (integration + E2E) — all passing                                                |

### ⏳ IN PROGRESS

| Feature   | Description |
| --------- | ----------- |
| (ninguno) | -           |

### 📋 TODO - Future Features

| Feature                                             | Status               |
| --------------------------------------------------- | -------------------- |
| Email/SMS Notifications                             | Not planned for v1.x |
| Push Notifications                                  | Not planned for v1.x |
| KYC (Identity Verification)                         | Not planned for v1.x |
| Audit Logs                                          | Not planned for v1.x |
| Multi-gateway Payments (Stripe/PayPal)              | Not planned for v1.x |
| Team Chat                                           | Not planned for v1.x |
| Delivery Provider Integrations (DiDi/Uber/InDriver) | Sprint 4             |
| Test Coverage Expansion (90%+)                      | Sprint 4             |

---

## Overview / Visión General

Binary MLM (Multi-Level Marketing) platform with automatic commission distribution, referral tracking, tree visualization, marketplace multi-vendor support, generic product catalog with inventory, delivery integration, and affiliate contracts.

**Current Version**: v1.11.0 (Sprint 3 completed — 2026-04-04)

## Tech Stack

| Layer     | Technology                 |
| --------- | -------------------------- |
| Runtime   | Node.js 24+ (ESM)          |
| Framework | Express.js                 |
| Language  | TypeScript (ESM)           |
| ORM       | Sequelize 6                |
| Database  | PostgreSQL 16 (Docker)     |
| Auth      | JWT                        |
| Testing   | Jest + Supertest + ts-jest |
| Build     | esbuild (~1.2MB)           |

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  referral_code VARCHAR(15) UNIQUE NOT NULL,
  sponsor_id VARCHAR(36) NULL,
  position ENUM('left', 'right') NULL,
  level INT DEFAULT 1,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  role ENUM('user', 'admin') DEFAULT 'user',
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### User Closure Table (Tree Structure)

```sql
CREATE TABLE user_closure (
  ancestor_id VARCHAR(36) NOT NULL,
  descendant_id VARCHAR(36) NOT NULL,
  depth INT NOT NULL,
  PRIMARY KEY (ancestor_id, descendant_id),
  FOREIGN KEY (ancestor_id) REFERENCES users(id),
  FOREIGN KEY (descendant_id) REFERENCES users(id)
);
```

### Commissions Table

```sql
CREATE TABLE commissions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  from_user_id VARCHAR(36) NOT NULL,
  purchase_id VARCHAR(36) NULL,
  type ENUM('direct', 'level_1', 'level_2', 'level_3', 'level_4') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status ENUM('pending', 'approved', 'paid', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (from_user_id) REFERENCES users(id),
  FOREIGN KEY (purchase_id) REFERENCES purchases(id)
);
```

### Purchases Table

```sql
CREATE TABLE purchases (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  description TEXT NULL,
  status ENUM('pending', 'completed', 'cancelled') DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Sprint 3 Models (New)

```sql
-- Categories
CREATE TABLE categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id VARCHAR(36) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- Products
CREATE TABLE products (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(15,2) NOT NULL,
  type ENUM('digital','physical','service','membership') NOT NULL,
  category_id VARCHAR(36) NULL,
  metadata JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Inventory
CREATE TABLE inventories (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) UNIQUE NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Vendors
CREATE TABLE vendors (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) UNIQUE NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.15,
  status ENUM('pending','approved','rejected','suspended') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Shipping Addresses
CREATE TABLE shipping_addresses (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  street VARCHAR(500) NOT NULL,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(255),
  country VARCHAR(10) NOT NULL,
  postal_code VARCHAR(20),
  phone VARCHAR(50),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Contract Templates
CREATE TABLE contract_templates (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Affiliate Contracts (acceptances)
CREATE TABLE affiliate_contracts (
  id VARCHAR(36) PRIMARY KEY,
  contract_template_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  status ENUM('accepted','declined','revoked') NOT NULL,
  ip VARCHAR(50),
  user_agent TEXT,
  hash VARCHAR(64),
  accepted_at TIMESTAMP,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_template_id) REFERENCES contract_templates(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## API Endpoints

### Authentication / Autenticación

#### POST /api/auth/register

Register a new user with optional sponsor code.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "sponsor_code": "REF123ABC"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "referralCode": "REFABC123",
      "role": "user",
      "level": 1
    },
    "token": "jwt_token_here"
  }
}
```

**Errors:**

- `400 INVALID_EMAIL` - Invalid email format
- `400 EMAIL_EXISTS` - Email already registered
- `400 INVALID_REFERRAL_CODE` - Sponsor code not found
- `400 WEAK_PASSWORD` - Password doesn't meet requirements

---

#### POST /api/auth/login

Authenticate user and receive JWT token.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "referralCode": "REFABC123",
      "role": "user"
    },
    "token": "jwt_token_here"
  }
}
```

**Errors:**

- `401 INVALID_CREDENTIALS` - Email or password incorrect
- `400 MISSING_FIELDS` - Required fields missing

---

#### GET /api/auth/me

Get current authenticated user profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "referralCode": "REFABC123",
    "role": "user",
    "level": 1,
    "status": "active",
    "currency": "USD"
  }
}
```

**Errors:**

- `401 UNAUTHORIZED` - No token or invalid token

---

### User Endpoints

#### GET /api/users/me/tree

Get binary tree structure for current user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "stats": {
      "leftCount": 5,
      "rightCount": 3,
      "leftVolume": 1500.0,
      "rightVolume": 800.0
    },
    "tree": {
      "id": "user-uuid",
      "email": "user@example.com",
      "referralCode": "REFABC123",
      "position": "left",
      "level": 1,
      "stats": {
        "leftCount": 5,
        "rightCount": 3
      },
      "children": [
        {
          "id": "child-uuid",
          "email": "child@example.com",
          "position": "left",
          "level": 2,
          "children": []
        }
      ]
    }
  }
}
```

---

#### GET /api/users/:id/tree

Get binary tree for specific user (any authenticated user).

**Headers:** `Authorization: Bearer <token>`

**Response (200):** Same structure as `/api/users/me/tree`

---

#### GET /api/users/me/qr-url

Get QR code data URL for user's referral link.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "qrDataUrl": "data:image/png;base64,...",
    "referralLink": "https://app.mlm.com/register?ref=REFABC123"
  }
}
```

---

### Dashboard

#### GET /api/dashboard

Get comprehensive dashboard with stats and commissions.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com" },
    "treeStats": {
      "totalReferrals": 10,
      "leftCount": 6,
      "rightCount": 4,
      "leftVolume": 2000.0,
      "rightVolume": 1500.0
    },
    "commissionStats": {
      "totalEarned": 350.0,
      "pendingCommission": 50.0
    },
    "recentCommissions": []
  }
}
```

---

### Commissions

#### GET /api/commissions

List user's commissions with pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 10)
- `type` (optional): direct, level_1, level_2, level_3, level_4
- `status` (optional): pending, approved, paid, rejected

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "commission-uuid",
      "type": "direct",
      "amount": 10.0,
      "status": "pending",
      "fromUserEmail": "referrer@example.com",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

#### GET /api/commissions/stats

Get commission statistics summary.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalEarned": 350.0,
    "pending": 50.0,
    "byType": {
      "direct": 100.0,
      "level_1": 150.0,
      "level_2": 75.0,
      "level_3": 25.0
    }
  }
}
```

---

#### POST /api/commissions

Create a purchase and trigger commission distribution. (For testing)

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "amount": 100.0,
  "currency": "USD",
  "description": "Product purchase"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "purchase-uuid",
    "amount": 100.0,
    "currency": "USD",
    "description": "Product purchase",
    "status": "completed",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Errors:**

- `400 INVALID_AMOUNT` - Amount must be positive

---

### Admin Endpoints

All admin endpoints require `role: "admin"`.

#### GET /api/admin/stats

Get global platform statistics.

**Headers:** `Authorization: Bearer <token>` (admin only)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalUsers": 1500,
    "activeUsers": 1200,
    "totalCommissions": 50000.0,
    "totalPurchases": 3000,
    "totalVolume": 150000.0
  }
}
```

---

#### GET /api/admin/users

List all users with pagination and filters.

**Headers:** `Authorization: Bearer <token>` (admin only)

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 20)
- `status` (optional): active, inactive, suspended
- `search` (optional): email search

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "referralCode": "REFABC123",
      "level": 2,
      "status": "active",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 75
  }
}
```

---

#### GET /api/admin/users/:userId

Get specific user details with stats.

**Headers:** `Authorization: Bearer <token>` (admin only)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "referralCode": "REFABC123",
      "level": 2,
      "status": "active",
      "role": "user",
      "position": "left",
      "sponsorId": "sponsor-uuid",
      "currency": "USD",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "stats": {
      "referrals": 15,
      "leftLeg": 8,
      "rightLeg": 7,
      "totalCommissions": 250.0
    }
  }
}
```

---

#### PATCH /api/admin/users/:userId/status

Update user status.

**Headers:** `Authorization: Bearer <token>` (admin only)

**Request:**

```json
{
  "status": "suspended"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "status": "suspended"
  }
}
```

**Errors:**

- `400 INVALID_STATUS` - Status must be active, inactive, or suspended

---

#### PATCH /api/admin/users/:userId/promote

Promote user to admin role.

**Headers:** `Authorization: Bearer <token>` (admin only)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "role": "admin"
  }
}
```

---

#### GET /api/admin/reports/commissions

Get commissions report with breakdown by type.

**Headers:** `Authorization: Bearer <token>` (admin only)

**Query Parameters:**

- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `type` (optional): direct, level_1, level_2, level_3, level_4

**Response (200):**

```json
{
  "success": true,
  "data": {
    "commissions": [
      {
        "id": "commission-uuid",
        "type": "direct",
        "amount": 10.0,
        "status": "pending",
        "userEmail": "user@example.com",
        "fromUserEmail": "referrer@example.com",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "byType": [
      { "type": "direct", "total": 5000.0 },
      { "type": "level_1", "total": 2500.0 }
    ]
  }
}
```

---

## Commission Distribution

### Rates by Level

| Level   | Percentage | Description       |
| ------- | ---------- | ----------------- |
| Direct  | 10%        | Immediate sponsor |
| Level 1 | 5%         | Direct referrals  |
| Level 2 | 3%         | Second level      |
| Level 3 | 2%         | Third level       |
| Level 4 | 1%         | Fourth level      |

### Binary Tree Placement

1. New users are placed automatically in the binary tree
2. Placement follows "first available position" algorithm
3. Left position filled first, then right
4. Sponsor relationship tracked in `user_closure` table

### Example Calculation

User A purchases $100:

- Direct sponsor (10%): $10.00
- Sponsor's sponsor (5%): $5.00
- Level 2 (3%): $3.00
- Level 3 (2%): $2.00
- Level 4 (1%): $1.00

**Total distributed:** $21.00

---

## Error Codes

### Error Response Format

All error responses follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Error Codes Reference

| Code                    | HTTP Status | Description                        |
| ----------------------- | ----------- | ---------------------------------- |
| `UNAUTHORIZED`          | 401         | Missing or invalid JWT             |
| `FORBIDDEN`             | 403         | Insufficient permissions           |
| `NOT_FOUND`             | 404         | Resource not found                 |
| `INVALID_EMAIL`         | 400         | Email format invalid               |
| `EMAIL_EXISTS`          | 400         | Email already registered           |
| `INVALID_REFERRAL_CODE` | 400         | Sponsor code not found             |
| `INVALID_CREDENTIALS`   | 401         | Wrong email or password            |
| `MISSING_FIELDS`        | 400         | Required fields missing            |
| `WEAK_PASSWORD`         | 400         | Password doesn't meet requirements |
| `INVALID_AMOUNT`        | 400         | Amount must be positive            |
| `INVALID_CURRENCY`      | 400         | Currency not supported             |
| `INVALID_STATUS`        | 400         | Invalid status value               |
| `VALIDATION_ERROR`      | 400         | General validation error           |
| `SERVER_ERROR`          | 500         | Internal server error              |

---

## Testing

### Test Infrastructure

The test suite uses:

- **ts-jest**: For TypeScript support in Jest (via `tsconfig.test.json`)
- **Fresh Sequelize**: Each test run creates a new Sequelize instance
- **PostgreSQL Test DB**: Separate container on port 5435

```bash
# Run integration tests
pnpm test:integration
```

### Docker Containers for Testing

| Container         | Puerto | Usuario  | Base de datos |
| ----------------- | ------ | -------- | ------------- |
| mlm_postgres      | 5434   | mlm      | mlm_db        |
| mlm_postgres_test | 5435   | mlm_test | mlm_test      |

### Integration Tests (TIER 1 & 2)

| Module           | Tests   | Status      |
| ---------------- | ------- | ----------- |
| Auth             | 15      | ✅ PASS     |
| Tree             | 10      | ✅ PASS     |
| Commissions      | 17      | ✅ PASS     |
| RBAC             | 20      | ✅ PASS     |
| CRM              | 17      | ✅ PASS     |
| Pagination       | 6       | ✅ PASS     |
| Validation       | 24      | ✅ PASS     |
| Wallet           | 13      | ✅ PASS     |
| Tree Visual      | 17      | ✅ PASS     |
| Performance      | 3       | ✅ PASS     |
| Products/Orders  | 16      | ✅ PASS     |
| Two-Factor (2FA) | 20      | ✅ PASS     |
| **Integration**  | **178** | **✅ PASS** |

### E2E Tests (Playwright)

| Module    | Tests  | Status      |
| --------- | ------ | ----------- |
| Auth      | 6      | ✅ PASS     |
| Admin     | 10     | ✅ PASS     |
| Dashboard | 8      | ✅ PASS     |
| **E2E**   | **37** | **✅ PASS** |

### Total Coverage

| Category    | Tests   | Status             |
| ----------- | ------- | ------------------ |
| Unit        | 93      | ✅ ALL PASSING     |
| Integration | 178     | ✅ ALL PASSING     |
| E2E         | 37      | ✅ ALL PASSING     |
| **TOTAL**   | **308** | **✅ ALL PASSING** |

### Run Tests

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests (requires servers running)
cd frontend && npx playwright test

# All tests
pnpm test:all
```

---

## Environment Variables

### Main Database

| Variable          | Description        | Default     |
| ----------------- | ------------------ | ----------- |
| `NODE_ENV`        | Environment        | development |
| `PORT`            | Server port        | 3000        |
| `DB_DIALECT`      | Database dialect   | postgres    |
| `DB_HOST`         | PostgreSQL host    | localhost   |
| `DB_PORT`         | PostgreSQL port    | 5434        |
| `DB_NAME`         | Database name      | mlm_db      |
| `DB_USER`         | Database user      | mlm         |
| `DB_PASSWORD`     | Database password  | mlm123      |
| `JWT_SECRET`      | JWT signing secret | -           |
| `JWT_EXPIRES_IN`  | Token expiry       | 7d          |
| `ALLOWED_ORIGINS` | CORS origins       | localhost   |

### Test Database (for integration tests)

| Variable           | Description            | Default   |
| ------------------ | ---------------------- | --------- |
| `TEST_DB_HOST`     | Test PostgreSQL host   | 127.0.0.1 |
| `TEST_DB_PORT`     | Test PostgreSQL port   | 5435      |
| `TEST_DB_NAME`     | Test database name     | mlm_test  |
| `TEST_DB_USER`     | Test database user     | mlm_test  |
| `TEST_DB_PASSWORD` | Test database password | mlm_test  |
| `TEST_DB_DIALECT`  | Test database dialect  | postgres  |

---

## Version History

- **v1.0.0** - Initial release with core MLM features
- **v1.1.0** - Added integration test suite (60 tests)
- **v1.2.0** - Added TIER 2 tests (CRM, Pagination, Validation) + E2E tests
  - Total: 131 tests (107 integration + 24 E2E)
  - Added bilingual documentation structure (ES/EN)
  - Created comprehensive PRD
- **v1.3.0** - Complete platform with all MVP features
  - Total: 308 tests (93 unit + 178 integration + 37 E2E)
  - CRM complete (Kanban, CSV import/export, analytics)
  - E-commerce streaming (products, orders, subscriptions)
  - Wallet system (balance, withdrawals, currency conversion)
  - CommissionConfig API for admin rate management
  - Landing Pages builder with tracking
  - Two-Factor Authentication (2FA) with TOTP
