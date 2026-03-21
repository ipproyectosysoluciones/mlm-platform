# MLM Platform - Technical Specification

## Overview / Visión General

Binary MLM (Multi-Level Marketing) platform with automatic commission distribution, referral tracking, and tree visualization.

## Tech Stack

| Layer     | Technology       |
| --------- | ---------------- |
| Runtime   | Node.js 18+      |
| Framework | Express.js       |
| Language  | TypeScript       |
| ORM       | Sequelize 6      |
| Database  | MySQL 8          |
| Auth      | JWT              |
| Testing   | Jest + Supertest |

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

---

## Testing

### Integration Tests (TIER 1 & 2)

| Module          | Tests   | Status      |
| --------------- | ------- | ----------- |
| Auth            | 15      | ✅ PASS     |
| Tree            | 10      | ✅ PASS     |
| Commissions     | 15      | ✅ PASS     |
| RBAC            | 20      | ✅ PASS     |
| CRM             | 17      | ✅ PASS     |
| Pagination      | 6       | ✅ PASS     |
| Validation      | 24      | ✅ PASS     |
| **Integration** | **107** | **✅ PASS** |

### E2E Tests (Playwright)

| Module    | Tests  | Status      |
| --------- | ------ | ----------- |
| Auth      | 6      | ✅ PASS     |
| Admin     | 10     | ✅ PASS     |
| Dashboard | 8      | ✅ PASS     |
| **E2E**   | **24** | **✅ PASS** |

### Total Coverage

| Category  | Tests   | Status             |
| --------- | ------- | ------------------ |
| **TOTAL** | **131** | **✅ ALL PASSING** |

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

| Variable          | Description        | Default     |
| ----------------- | ------------------ | ----------- |
| `NODE_ENV`        | Environment        | development |
| `PORT`            | Server port        | 3000        |
| `DB_HOST`         | MySQL host         | localhost   |
| `DB_PORT`         | MySQL port         | 3306        |
| `DB_NAME`         | Database name      | mlm_db      |
| `DB_USER`         | Database user      | root        |
| `DB_PASSWORD`     | Database password  | -           |
| `JWT_SECRET`      | JWT signing secret | -           |
| `JWT_EXPIRES_IN`  | Token expiry       | 7d          |
| `ALLOWED_ORIGINS` | CORS origins       | localhost   |

---

## Version History

- **v1.0.0** - Initial release with core MLM features
- **v1.1.0** - Added integration test suite (60 tests)
- **v1.2.0** - Added TIER 2 tests (CRM, Pagination, Validation) + E2E tests
  - Total: 131 tests (107 integration + 24 E2E)
  - Added bilingual documentation structure (ES/EN)
  - Created comprehensive PRD
