# ARCHITECTURE: Gift Cards (v1.0)

## Technical Design for Implementation — #23

---

## 1. Service Architecture & Boundaries

### GiftCardService — Core Service

**Responsibility**: Create, validate, and redeem digital gift cards. Single source of truth for gift card state.

```typescript
// GiftCardService — Clear boundaries
class GiftCardService {
  // Create: Generate UUID + QR code, save to DB
  async createGiftCard(amount: number, purchasedByUserId: string): Promise<GiftCard>;

  // Validate: Check existence, expiry, redemption status
  async validateGiftCard(code: string): Promise<GiftCardValidationResult>;

  // Redeem: Mark card as used (idempotent-like, one-time use)
  async redeemGiftCard(code: string, redeemedByUserId: string): Promise<GiftCardRedemption>;
}
```

**Service Interactions**:

```
┌─────────────────────┐
│ GiftCardService     │
├─────────────────────┤
│ Dependencies:       │
│ ├─ QRService (↓)    │ (calls: generateQR)
│ ├─ OrderService (←) │ (called by: applyGiftCard)
│ └─ DB (PostgreSQL)  │
└─────────────────────┘
```

**State Management**:

- **Mutable**: `giftCards` table (balance, status, redemption state)
- **Immutable**: `qrMappings` table (created once, never changed)
- **No external APIs**: Fully self-contained, zero external dependencies

**Failure Modes**:
| Failure | Impact | Mitigation |
|---------|--------|-----------|
| QRService down | Cannot generate new QR codes | Generate async, use placeholder QR |
| Database down | Cannot validate/redeem | Return 503, client retries |
| Concurrent redemption | Race condition (same card redeemed twice) | Pessimistic lock (SELECT ... FOR UPDATE) |

---

## 2. Data Flow Diagrams

### Happy Path: Create Gift Card

```
Admin Dashboard → POST /api/gift-cards
  ↓
GiftCardController.createGiftCard()
  ├─ Validate: amount > 0, purchasedByUserId is valid
  ├─ GiftCardService.createGiftCard()
  │   ├─ Generate UUID: `abc123-def456-...`
  │   ├─ QRService.generateQR(uuid)
  │   │   └─ Returns: data URL (base64 PNG)
  │   ├─ Generate shortCode: `abc123xyz` (10 chars, URL-safe)
  │   ├─ INSERT INTO giftCards (id, balance, expiresAt = NOW() + 30 days)
  │   ├─ INSERT INTO qrMappings (shortCode → giftCardId)
  │   └─ Return: { id, code, qrUrl, balance, expiresAt }
  ├─ Response 201
  │   {
  │     "id": "abc123-def456",
  │     "shortCode": "abc123xyz",
  │     "qrUrl": "https://app.com/q/abc123xyz",
  │     "balance": 100,
  │     "expiresAt": "2026-05-03T00:00:00Z"
  │   }
  └─ Admin can share/download code

Timeline: ✓ Immediate
```

### Happy Path: Redeem Gift Card

```
User → Scan QR or enter code
  ↓
GET https://app.com/q/{shortCode}
  ├─ QRMappingService.resolveShortCode(shortCode)
  │   ├─ SELECT giftCardId FROM qrMappings WHERE shortCode = ?
  │   └─ Redirect to /redeem?code={uuid}
  └─ Frontend shows: "Enter amount to redeem"

User → POST /api/gift-cards/{uuid}/redeem
  ├─ Validate: code format, amount > 0
  ├─ GiftCardService.redeemGiftCard(code, userId)
  │   ├─ SELECT * FROM giftCards WHERE id = ? FOR UPDATE (lock)
  │   ├─ Check: expiresAt > NOW() (lazy expiration)
  │   ├─ Check: redeemedAt IS NULL (not already used)
  │   ├─ Check: userId authorized (owner or admin)
  │   ├─ UPDATE giftCards SET
  │   │   redeemedAt = NOW(),
  │   │   redeemedByUserId = userId,
  │   │   is_active = false
  │   └─ INSERT INTO giftCardTransactions (log entry)
  ├─ Response 200
  │   {
  │     "success": true,
  │     "redeemedAmount": 100,
  │     "transactionId": "txn-uuid"
  │   }
  └─ OrderService deducts from order total

Timeline: <200ms (optimized with index on expiresAt, is_active)
```

### Error Path: Expired Gift Card

```
User → POST /api/gift-cards/{uuid}/redeem
  ├─ Validate: code format ✓
  ├─ SELECT * FROM giftCards WHERE id = ? FOR UPDATE
  ├─ Check: expiresAt < NOW() (EXPIRED!)
  ├─ Rollback lock
  ├─ Response 400
  │   {
  │     "error": "Gift card has expired",
  │     "code": "GIFT_CARD_EXPIRED",
  │     "expiresAt": "2026-04-03T00:00:00Z"
  │   }
  └─ Frontend shows error toast

Timeline: <100ms
```

### Concurrent Scenario: Race Condition (Prevented)

```
User A (at 12:00:00)           User B (at 12:00:00)
     ↓                               ↓
POST /api/gift-cards/ABC/redeem
     ↓                               ↓
SELECT * FROM gift_cards WHERE id=ABC FOR UPDATE
     │                          (waits for lock...)
     │
Acquires lock ─────────────────────→ Waiting
     │
Check redeemedAt IS NULL ✓
     │
UPDATE giftCards SET redeemedAt = NOW()
     │
COMMIT (releases lock) ──────────→ Now acquires lock
     │                            │
     │                        SELECT redeemedAt
     │                            │
     │                        redeemedAt IS NOT NULL ✗
     │                            │
     │                        Response 400
     │                        "Already redeemed"
     └─ User A sees: ✓ Redeemed
       User B sees: ✗ Already redeemed (fair!)
```

---

## 3. State Machines

### Gift Card Lifecycle

```
        ┌──────────┐
        │ CREATED  │ (Just generated, ready)
        └────┬─────┘
             │
    ┌────────┴────────┐
    ↓                 ↓
┌──────────┐     ┌──────────┐
│ ACTIVE   │     │ EXPIRED  │ (>30 days old)
│ (0-30d)  │     │ (soft)   │
└────┬─────┘     └──────────┘
     │
     └──→ REDEEMED (used, immutable)
         └──→ INACTIVE (marked is_active = false)
```

**Transitions**:

- `CREATED` → `ACTIVE` (immediate)
- `ACTIVE` → `REDEEMED` (when user redeems) [atomic, one-time]
- `ACTIVE` → `EXPIRED` (when expiresAt <= NOW()) [lazy check at redeem]
- `EXPIRED` → `INACTIVE` (system marks at redeem time)

**Properties**:

- All-or-nothing: Once redeemed, cannot be used again
- No partial balance: Either redeemed fully or not at all
- Immutable once redeemed: Cannot change redeemedAt or redeemedByUserId

---

## 4. Database Schema & Indexing

### Tables

```sql
-- Primary gift card table
CREATE TABLE gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,           -- Human-readable code
  qr_code_data TEXT,                          -- Base64 PNG data URL
  initial_balance DECIMAL(10,2) NOT NULL,     -- Original amount
  expires_at TIMESTAMP NOT NULL,               -- 30 days from creation
  is_active BOOLEAN DEFAULT true,              -- Soft delete flag
  redeemed_at TIMESTAMP,                       -- NULL until redeemed
  redeemed_by_user_id UUID,                    -- Who redeemed it
  purchased_by_user_id UUID NOT NULL,          -- Who purchased it
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (redeemed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (purchased_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- URL shortening for QR codes
CREATE TABLE qr_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code VARCHAR(10) UNIQUE NOT NULL,     -- abc123xyz
  gift_card_id UUID NOT NULL UNIQUE,          -- FK to gift_cards
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (gift_card_id) REFERENCES gift_cards(id) ON DELETE CASCADE
);

-- Audit trail
CREATE TABLE gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL,                -- 'created', 'redeemed', 'expired'
  performed_by_user_id UUID,
  metadata JSONB,                             -- Extra context
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (gift_card_id) REFERENCES gift_cards(id) ON DELETE CASCADE
);
```

### Indexes (Performance Optimization)

```sql
-- Query: Find gift cards by code (for redemption lookup)
CREATE INDEX idx_gift_cards_code
  ON gift_cards (code)
  WHERE is_active = true;

-- Query: Check expiration during redemption
CREATE INDEX idx_gift_cards_expires_active
  ON gift_cards (expires_at, is_active);

-- Query: Admin dashboard — view gift cards by purchaser
CREATE INDEX idx_gift_cards_purchased_by
  ON gift_cards (purchased_by_user_id, created_at DESC);

-- Query: Admin dashboard — view redeemed cards by user
CREATE INDEX idx_gift_cards_redeemed_by
  ON gift_cards (redeemed_by_user_id, redeemed_at DESC)
  WHERE redeemed_at IS NOT NULL;

-- Query: URL shortening resolution
CREATE INDEX idx_qr_mappings_short_code
  ON qr_mappings (short_code);

-- Query: Cleanup job — find expired cards
CREATE INDEX idx_gift_cards_expired_cleanup
  ON gift_cards (expires_at)
  WHERE is_active = true AND redeemed_at IS NULL;
```

### Relationships Diagram

```
users (1) ─────── (M) gift_cards (purchasedBy)
                            │
users (1) ─────── (M) gift_cards (redeemedBy, nullable)
                            │
                            M
                            │
                    gift_card_transactions

gift_cards (1) ──── (1) qr_mappings (unique mapping)
```

---

## 5. Concurrency & Locking Strategy

### Race Condition Analysis

**Operation**: Gift Card Redemption
**Risk**: Two concurrent requests redeem the same card simultaneously
**Impact**: HIGH — Money lost, duplicate redemption

### Solution: Pessimistic Locking

```typescript
// Correct implementation: LOCK the row before reading
async redeemGiftCard(code: string, userId: string) {
  // Transaction ensures atomicity
  const result = await sequelize.transaction(async (t) => {
    // CRITICAL: Lock the row BEFORE checking state
    const giftCard = await GiftCard.findOne({
      where: { code },
      lock: t.LOCK.UPDATE,  // SELECT ... FOR UPDATE
      transaction: t
    });

    if (!giftCard) {
      throw new NotFoundError('Gift card not found');
    }

    // Now we can safely check without race condition
    if (giftCard.redeemedAt !== null) {
      throw new ConflictError('Gift card already redeemed');
    }

    if (giftCard.expiresAt <= new Date()) {
      throw new ValidationError('Gift card expired');
    }

    // Safe to update
    await giftCard.update(
      {
        redeemedAt: new Date(),
        redeemedByUserId: userId,
        isActive: false
      },
      { transaction: t }
    );

    return giftCard;
  });

  return result;
}
```

**Why pessimistic?**

- Optimistic locking (version field) doesn't work for "check-then-act"
- Pessimistic (SELECT ... FOR UPDATE) guarantees serialization
- Gift card redemption is WRITE-HEAVY, race condition HIGH probability

**Lock Release**:

- Transaction commits → lock released automatically
- Transaction rolls back (exception) → lock released, state unchanged

---

## 6. API Layer Design

### Endpoint 1: Create Gift Card (Admin)

```
POST /api/gift-cards
Auth: authenticated (admin-only)

Request:
{
  "amount": 100.00,
  "description": "Q2 Promo Gift Card"  (optional)
}

Validation:
- amount: required, decimal, > 0, <= 10000

Response 201:
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "code": "ABC123DEF456",
  "shortCode": "abc123xyz",
  "qrUrl": "https://app.com/q/abc123xyz",
  "balance": 100.00,
  "expiresAt": "2026-05-03T23:59:59Z",
  "status": "active",
  "createdAt": "2026-04-03T10:00:00Z"
}

Response 400 Bad Request:
{
  "error": "Invalid amount",
  "code": "INVALID_AMOUNT",
  "details": "Amount must be > 0"
}

Response 401 Unauthorized:
{ "error": "Admin role required" }
```

### Endpoint 2: Validate Gift Card

```
GET /api/gift-cards/{code}/validate
Auth: public

Response 200:
{
  "valid": true,
  "balance": 100.00,
  "expiresAt": "2026-05-03T23:59:59Z",
  "message": "Gift card is valid and ready to redeem"
}

Response 400 Gift Card Invalid:
{
  "valid": false,
  "error": "Gift card expired",
  "code": "GIFT_CARD_EXPIRED",
  "expiresAt": "2026-04-03T00:00:00Z"
}

Response 404 Not Found:
{ "error": "Gift card not found", "code": "GIFT_CARD_NOT_FOUND" }
```

### Endpoint 3: Redeem Gift Card

```
POST /api/gift-cards/{code}/redeem
Auth: authenticated

Request:
{
  "orderId": "order-uuid-here"  (optional: link to order)
}

Response 200 Success:
{
  "success": true,
  "redeemedAmount": 100.00,
  "transactionId": "txn-uuid",
  "message": "Gift card successfully redeemed"
}

Response 400 Expired:
{
  "error": "Gift card has expired",
  "code": "GIFT_CARD_EXPIRED",
  "expiresAt": "2026-04-03T00:00:00Z"
}

Response 400 Already Redeemed:
{
  "error": "Gift card already redeemed",
  "code": "GIFT_CARD_ALREADY_REDEEMED",
  "redeemedAt": "2026-03-20T15:30:00Z",
  "redeemedByUser": "user-name"
}

Response 404 Not Found:
{ "error": "Gift card not found", "code": "GIFT_CARD_NOT_FOUND" }
```

### Endpoint 4: Get Gift Card Details (Admin)

```
GET /api/gift-cards/{code}
Auth: authenticated (admin)

Response 200:
{
  "id": "gift-card-uuid",
  "code": "ABC123",
  "balance": 100.00,
  "status": "redeemed",
  "expiresAt": "2026-05-03T23:59:59Z",
  "purchasedBy": { "id": "user-uuid", "name": "John Doe" },
  "redeemedBy": { "id": "user-uuid", "name": "Jane Smith" },
  "redeemedAt": "2026-03-25T10:00:00Z",
  "createdAt": "2026-02-03T09:00:00Z",
  "transactions": [
    { "action": "created", "performedAt": "2026-02-03T09:00:00Z" },
    { "action": "redeemed", "performedAt": "2026-03-25T10:00:00Z" }
  ]
}
```

---

## 7. Middleware & Error Handling Stack

### Express Middleware Order (Critical)

```typescript
app.use(cors()); // 1. CORS check
app.use(express.json()); // 2. Body parser
app.use(morgan('dev')); // 3. HTTP logging
app.use(
  rateLimit({
    // 4. Rate limiting
    windowMs: 15 * 60 * 1000, //    15 min window
    max: 100, //    100 req per window
  })
);
app.use(authenticateToken); // 5. JWT validation
app.use(validate); // 6. Request validation
app.use(asyncHandler(routes)); // 7. Route handlers
app.use(errorHandler); // 8. Error formatting
```

### Request Flow for Redemption

```
POST /api/gift-cards/ABC123/redeem
  ↓
1. CORS middleware → checks origin ✓
  ↓
2. Body parser → parses JSON ✓
  ↓
3. Morgan → logs HTTP request
  ↓
4. Rate limiter → checks 100 req/15min ✓
  ↓
5. authenticateToken → extracts JWT, req.user = { userId, role } ✓
  ↓
6. validate → express-validator rules
     ├─ param('code'): isLength({ min: 3, max: 50 })
     └─ All checks pass ✓
  ↓
7. asyncHandler wrapper calls controller
     ├─ GiftCardController.redeem()
     │   ├─ GiftCardService.redeemGiftCard(code, userId)
     │   │   ├─ Pessimistic lock
     │   │   ├─ Validation checks
     │   │   ├─ UPDATE database
     │   │   └─ Success ✓
     │   └─ res.status(200).json(result)
     └─ If error thrown → asyncHandler catches
  ↓
8. errorHandler → formats error response
     ├─ If ValidationError → 400
     ├─ If NotFoundError → 404
     ├─ If ConflictError → 409
     └─ res.status(error.statusCode).json({ error, code })
```

### Error Handling Strategy

```typescript
// Hierarchy of custom errors
class GiftCardError extends Error {
  statusCode: number;
  code: string;
}

class ValidationError extends GiftCardError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
}

class NotFoundError extends GiftCardError {
  statusCode = 404;
  code = 'NOT_FOUND';
}

class ConflictError extends GiftCardError {
  statusCode = 409;
  code = 'CONFLICT';
}

// All errors caught by asyncHandler, passed to errorHandler
const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const response = {
    error: err.message,
    code: err.code || 'INTERNAL_ERROR',
  };

  // Log to Sentry for production
  if (status === 500) {
    Sentry.captureException(err);
  }

  res.status(status).json(response);
};
```

---

## 8. Caching Strategy

**Decision: NO CACHING for #23**

**Why?**

- Gift cards are transactional data (one-time use)
- Cache invalidation complexity > value
- Redemption MUST be consistent (cannot have stale cache)
- All queries already fast (<100ms with indexes)

**If caching becomes necessary** (at >1M gift cards):

- Cache: `giftCard:${code}` with TTL 5 minutes
- Invalidate: On redemption, DELETE key immediately
- Backend: Use Redis with cache-aside pattern

---

## 9. Testing Infrastructure

### Unit Tests (Mock everything)

```typescript
describe('GiftCardService', () => {
  let service: GiftCardService;
  let mockQRService: jest.Mocked<QRService>;
  let mockGiftCardModel: jest.Mocked<typeof GiftCard>;

  beforeEach(() => {
    mockQRService = {
      generateQR: jest.fn().mockResolvedValue('data:image/png;base64,...'),
    };
    mockGiftCardModel = {
      create: jest.fn(),
      findOne: jest.fn(),
    };
    service = new GiftCardService(mockQRService, mockGiftCardModel);
  });

  describe('createGiftCard', () => {
    it('should generate QR code and save to DB', async () => {
      const result = await service.createGiftCard(100, 'user-uuid');

      expect(mockQRService.generateQR).toHaveBeenCalled();
      expect(mockGiftCardModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ balance: 100 })
      );
      expect(result.qrUrl).toBeDefined();
    });
  });

  describe('redeemGiftCard', () => {
    it('should fail if card already redeemed', async () => {
      mockGiftCardModel.findOne.mockResolvedValue({
        code: 'ABC123',
        redeemedAt: new Date(), // Already redeemed
      });

      await expect(service.redeemGiftCard('ABC123', 'user-uuid')).rejects.toThrow(
        'Already redeemed'
      );
    });
  });
});
```

### Integration Tests (Real DB, real services)

```typescript
describe('Gift Card Redemption (Integration)', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTables(['gift_cards', 'qr_mappings', 'gift_card_transactions']);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should redeem a valid gift card', async () => {
    // Setup
    const giftCard = await GiftCard.create({
      code: 'TEST123',
      balance: 100,
      expiresAt: addDays(new Date(), 10),
      purchasedByUserId: 'admin-uuid'
    });

    // Execute
    const result = await service.redeemGiftCard('TEST123', 'user-uuid');

    // Verify
    expect(result.redeemedAt).toBeDefined();
    expect(result.redeemedByUserId).toBe('user-uuid');

    const updated = await GiftCard.findByPk(giftCard.id);
    expect(updated.isActive).toBe(false);
  });

  it('should prevent concurrent redemptions', async () => {
    // Setup
    const giftCard = await GiftCard.create({...});

    // Execute: Two concurrent redemptions
    const [result1, result2] = await Promise.allSettled([
      service.redeemGiftCard('TEST123', 'user1-uuid'),
      service.redeemGiftCard('TEST123', 'user2-uuid')
    ]);

    // Verify: One succeeds, one fails
    expect(result1.status).toBe('fulfilled');
    expect(result2.status).toBe('rejected');
    expect((result2 as any).reason.message).toContain('Already redeemed');
  });
});
```

### E2E Tests (Full flow, real server)

```typescript
describe('Gift Card E2E', () => {
  let server: Server;
  let token: string;

  beforeAll(async () => {
    server = await startServer();
    token = await loginAsAdmin();
  });

  afterAll(async () => {
    await stopServer();
  });

  it('should create and redeem a gift card', async () => {
    // Create
    const createRes = await request(server)
      .post('/api/gift-cards')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 100 });

    expect(createRes.status).toBe(201);
    const { code, qrUrl } = createRes.body;

    // Validate
    const validateRes = await request(server).get(`/api/gift-cards/${code}/validate`).expect(200);

    expect(validateRes.body.valid).toBe(true);
    expect(validateRes.body.balance).toBe(100);

    // Redeem
    const redeemRes = await request(server)
      .post(`/api/gift-cards/${code}/redeem`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(redeemRes.body.success).toBe(true);

    // Try to redeem again (should fail)
    await request(server)
      .post(`/api/gift-cards/${code}/redeem`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)
      .expect((res) => {
        expect(res.body.code).toBe('GIFT_CARD_ALREADY_REDEEMED');
      });
  });
});
```

---

## 10. Deployment & Environment

### Environment Variables

```bash
# .env.production

# Gift Card Configuration
GIFT_CARD_EXPIRY_DAYS=30
QR_MAPPING_URL_BASE=https://app.com/q/
QR_CODE_SIZE=200                          # pixels
QR_CODE_ERROR_CORRECTION=H                # High

# Database
DATABASE_URL=postgres://...production...
TEST_DATABASE_URL=postgres://...test...
```

### Database Migrations

```sql
-- Migration: 2026-04-05_001_create_gift_cards_tables.sql
-- UP (apply)
CREATE TABLE gift_cards (...);
CREATE TABLE qr_mappings (...);
CREATE TABLE gift_card_transactions (...);
CREATE INDEX idx_gift_cards_code ON ...;

-- DOWN (rollback)
DROP TABLE IF EXISTS gift_card_transactions;
DROP TABLE IF EXISTS qr_mappings;
DROP TABLE IF EXISTS gift_cards;
```

### Health Check

```typescript
app.get('/health/gift-cards', async (req, res) => {
  try {
    // Check database connectivity
    const count = await GiftCard.count();

    // Check QR service
    const testQR = await qrService.generateQR('test');

    res.status(200).json({
      status: 'healthy',
      giftCardsCount: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});
```

---

## Appendix A: Service Dependency Graph

```
┌──────────────────────────────────────────────────┐
│              External Systems                    │
├──────────────────────────────────────────────────┤
│  QRService (stateless)                           │
│  OrderService (read-only: discount application)  │
│  Users (reference: purchasedBy, redeemedBy)      │
└──────────────────────────────────────────────────┘
                     ↑
                     │ (depends on)
                     │
┌──────────────────────────────────────────────────┐
│           GiftCardService                        │
├──────────────────────────────────────────────────┤
│  Responsibilities:                               │
│  ✓ Create gift cards (UUID + QR)                │
│  ✓ Validate existence & expiration              │
│  ✓ Redeem (one-time, atomic)                    │
│  ✓ Audit logging                                │
└──────────────────────────────────────────────────┘
                     ↑
                     │ (CRUD, transactions)
                     │
┌──────────────────────────────────────────────────┐
│        PostgreSQL Database                       │
├──────────────────────────────────────────────────┤
│  Tables:                                         │
│  • gift_cards (primary)                         │
│  • qr_mappings (URL shortening)                 │
│  • gift_card_transactions (audit trail)         │
│  Indexes: code, expires_at, purchased_by        │
└──────────────────────────────────────────────────┘
```

---

## Appendix B: Redemption Sequence Diagram

```
User          Frontend           Backend            Database
 │                 │                 │                  │
 ├─ Scan QR Code ─→│                 │                  │
 │                 │                 │                  │
 │                 ├─ GET /q/abc123 ─→                  │
 │                 │                 ├─ Resolve code ──→│
 │                 │                 │   (qrMappings)   │
 │                 │                 │                  │
 │                 │                 │← UUID ─────────  │
 │                 │← Redirect ─────  │                  │
 │                 │   /redeem?uuid   │                  │
 │                 │                  │                  │
 ├─ POST redeem ──→│                  │                  │
 │                 ├─ POST /redeem ──→│                  │
 │                 │                  ├─ SELECT FOR ────→│
 │                 │                  │   UPDATE        │
 │                 │                  │                  │
 │                 │                  │← Lock acquired ──
 │                 │                  │                  │
 │                 │                  ├─ Validate ──────→│
 │                 │                  │   expiresAt     │
 │                 │                  │   redeemedAt    │
 │                 │                  │                  │
 │                 │                  │← Valid ────────  │
 │                 │                  │                  │
 │                 │                  ├─ UPDATE ───────→│
 │                 │                  │   redeemedAt    │
 │                 │                  │                  │
 │                 │                  │← Success ─────  │
 │                 │                  │                  │
 │                 │← 200 OK ────────  │                  │
 │← Success ──────→│                   │                  │
```

---

**Status**: Ready for Implementation  
**Estimated Dev Time**: 6 days  
**Test Coverage Target**: >85%  
**Performance Target**: <200ms for all endpoints
