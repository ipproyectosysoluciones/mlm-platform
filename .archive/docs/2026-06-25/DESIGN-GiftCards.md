# DESIGN: Gift Cards (v1.0)

## Comprehensive Reference Document — Feature #23

---

## Table of Contents

1. Feature Overview
2. User Stories & Acceptance Criteria
3. Data Model
4. API Specification
5. Frontend Components
6. Service Layer Architecture
7. State Management
8. Testing Strategy
9. Deployment & Monitoring
10. Appendices

---

## 1. Feature Overview

### Purpose

Enable merchants to create and distribute digital gift cards within the MLM platform. Customers can purchase gift cards for themselves or others, and redeem them as payment/discount on subsequent purchases.

### Scope

- **v1.0**: Basic gift card creation, redemption, expiration
- **Future**: Gift card resale marketplace, partial redemptions, gift card analytics

### Success Metrics

- Time to redeem: <200ms
- Redemption success rate: >99.5%
- Zero race conditions (no double-redemption)
- Audit trail: 100% of gift card lifecycle logged

---

## 2. User Stories & Acceptance Criteria

### Story 1: Admin Creates Gift Card

```gherkin
As an admin
I want to create digital gift cards with configurable amounts
So merchants can distribute them to customers

Scenario: Create $100 gift card
  Given I'm logged in as admin
  When I navigate to Gift Card Manager
  And I click "Create Gift Card"
  And I enter amount: 100
  And I select currency: USD
  Then the system generates:
    - Unique gift card ID (UUID)
    - QR code (data URL, PNG)
    - Short code (abc123xyz)
    - Expiration date (30 days from now)
  And I see download option for QR
  And I can share the code via email/messaging
  And response time is <200ms

Scenario: Invalid amount
  Given I'm creating a gift card
  When I enter amount: -50 or 0
  Then I see validation error: "Amount must be > 0"
  And form is not submitted

Scenario: Concurrent creation
  Given Admin A and Admin B create cards simultaneously
  Then both succeed with unique IDs
  And no conflicts or duplicates
```

### Story 2: Customer Redeems Gift Card

```gherkin
As a customer
I want to redeem a gift card toward my purchase
So I can use a gift my friend gave me

Scenario: Scan QR code
  Given I'm at checkout
  When I scan a gift card QR code
  Then short code resolves to gift card UUID
  And card details are displayed:
    - Balance: $100
    - Expires: 2026-05-03
    - Status: Active
  And I see "Apply to Purchase" button

Scenario: Enter code manually
  Given I'm at checkout
  When I manually enter gift card code: abc123xyz
  Then system validates code format
  And resolves to gift card UUID
  And displays card details

Scenario: Apply gift card to order
  Given I have a $120 order
  When I apply $100 gift card
  Then order total updates: $120 → $20
  And gift card marked as redeemed
  And transaction logged

Scenario: Expired card
  Given a gift card with expiresAt: 2026-04-01 (today is 2026-04-04)
  When I try to redeem
  Then I see error: "Gift card has expired"
  And card NOT marked as redeemed
  And transaction NOT created

Scenario: Already redeemed
  Given a gift card that was redeemed yesterday
  When I try to use it again
  Then I see error: "Gift card already redeemed"
  And no duplicate redemption
```

### Story 3: Audit & Admin Views

```gherkin
As an admin
I want to view gift card usage history
So I can track redemptions and troubleshoot

Scenario: View all gift cards
  Given I'm in Gift Card Dashboard
  When I view "All Cards" tab
  Then I see list with:
    - Card ID, balance, status (active/redeemed/expired)
    - Created by, Created date
    - Redeemed by, Redeemed date
    - Expiration date
  And I can filter by status, date range
  And export as CSV

Scenario: View card details
  Given I click on a gift card
  When the details panel opens
  Then I see:
    - Full UUID
    - Short code
    - QR code image
    - Creation timeline
    - Redemption timeline (if used)
    - Audit log (all state changes)
```

---

## 3. Data Model

### Core Tables

#### gift_cards

```sql
CREATE TABLE gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  balance NUMERIC(10, 2) NOT NULL CHECK (balance > 0),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'active' -- active | redeemed | expired | inactive
  is_active BOOLEAN DEFAULT true,

  -- Lifecycle
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  redeemed_at TIMESTAMP NULL,
  redeemed_by_user_id UUID NULL REFERENCES users(id),
  expires_at TIMESTAMP NOT NULL, -- 30 days from creation

  -- Audit
  deleted_at TIMESTAMP NULL, -- soft delete (future: archive after 1 year)
  metadata JSONB DEFAULT '{}', -- custom fields, tags, notes

  CONSTRAINT balance_positive CHECK (balance > 0),
  CONSTRAINT redemption_consistency CHECK (
    (redeemed_at IS NULL AND redeemed_by_user_id IS NULL) OR
    (redeemed_at IS NOT NULL AND redeemed_by_user_id IS NOT NULL)
  )
);

CREATE INDEX idx_gift_cards_status_expires ON gift_cards(status, expires_at);
CREATE INDEX idx_gift_cards_created_by ON gift_cards(created_by_user_id, created_at);
CREATE INDEX idx_gift_cards_redeemed_by ON gift_cards(redeemed_by_user_id, redeemed_at);
```

#### qr_mappings

```sql
CREATE TABLE qr_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code VARCHAR(10) UNIQUE NOT NULL, -- abc123xyz
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Track scans (optional, for analytics)
  scan_count INT DEFAULT 0,
  last_scanned_at TIMESTAMP NULL
);

CREATE INDEX idx_qr_mappings_short_code ON qr_mappings(short_code);
CREATE INDEX idx_qr_mappings_gift_card ON qr_mappings(gift_card_id);
```

#### gift_card_transactions

```sql
CREATE TABLE gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  redeemed_by_user_id UUID NOT NULL REFERENCES users(id),
  amount_redeemed NUMERIC(10, 2) NOT NULL,

  transaction_type VARCHAR(20) DEFAULT 'redemption', -- redemption | refund | adjustment
  status VARCHAR(20) DEFAULT 'completed', -- pending | completed | failed | reversed

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_gift_card_transactions_gift_card ON gift_card_transactions(gift_card_id);
CREATE INDEX idx_gift_card_transactions_order ON gift_card_transactions(order_id);
```

### Relationships Diagram

```
gift_cards (1) ──→ (N) qr_mappings
    │
    └──→ (N) gift_card_transactions ──→ orders
    └──→ (1) users (created_by)
    └──→ (1) users (redeemed_by)
```

---

## 4. API Specification

### Base URL

```
/api/v1/gift-cards
```

### Endpoints

#### 1. Create Gift Card

```http
POST /api/v1/gift-cards
Content-Type: application/json
Authorization: Bearer {admin_token}

Request Body:
{
  "balance": 100,
  "currency": "USD",
  "createdByUserId": "user-uuid-123",
  "expiresIn": 2592000 // seconds (30 days default)
}

Response 201:
{
  "id": "gift-card-uuid-123",
  "shortCode": "abc123xyz",
  "balance": 100,
  "currency": "USD",
  "status": "active",
  "qrUrl": "https://app.com/q/abc123xyz",
  "qrDataUrl": "data:image/png;base64,...",
  "createdAt": "2026-04-04T10:00:00Z",
  "expiresAt": "2026-05-04T10:00:00Z",
  "createdBy": {
    "id": "user-uuid-123",
    "email": "admin@example.com"
  }
}

Errors:
- 400: Invalid amount (must be > 0)
- 401: Unauthorized (not admin)
- 500: QR generation failed (async retry recommended)
```

#### 2. Resolve Short Code (QR Redirect)

```http
GET /q/{shortCode}
Accept: application/json

Response 302 (Redirect):
Location: /redeem?code={giftCardUuid}&shortCode={shortCode}

OR

Response 200 (API):
{
  "giftCardId": "uuid",
  "shortCode": "abc123xyz",
  "status": "active",
  "expiresAt": "2026-05-04T10:00:00Z",
  "scanCount": 5,
  "lastScannedAt": "2026-04-04T09:55:00Z"
}

Errors:
- 404: Short code not found
- 410: Gift card deleted/archived
```

#### 3. Validate Gift Card

```http
GET /api/v1/gift-cards/{giftCardId}/validate
Authorization: Bearer {user_token}

Response 200:
{
  "id": "gift-card-uuid",
  "balance": 100,
  "status": "active",
  "expiresAt": "2026-05-04T10:00:00Z",
  "isRedeemable": true,
  "reason": null
}

Response 200 (Invalid):
{
  "id": "gift-card-uuid",
  "status": "expired",
  "isRedeemable": false,
  "reason": "Gift card expired on 2026-04-03"
}

Errors:
- 404: Gift card not found
```

#### 4. Redeem Gift Card

```http
POST /api/v1/gift-cards/{giftCardId}/redeem
Content-Type: application/json
Authorization: Bearer {user_token}

Request Body:
{
  "orderId": "order-uuid",
  "amount": 100
}

Response 200:
{
  "success": true,
  "transactionId": "txn-uuid",
  "redeemedAmount": 100,
  "redeemedAt": "2026-04-04T10:05:00Z",
  "giftCard": {
    "id": "gift-card-uuid",
    "status": "redeemed",
    "balance": 0,
    "redeemedBy": {
      "id": "user-uuid",
      "email": "customer@example.com"
    }
  }
}

Errors:
- 400: Amount invalid, card expired, already redeemed, or insufficient balance
- 404: Gift card or order not found
- 409: Race condition detected (concurrent redeem) — retry recommended
- 500: Database lock timeout
```

#### 5. List Gift Cards (Admin)

```http
GET /api/v1/gift-cards?status=active&limit=20&offset=0
Authorization: Bearer {admin_token}

Response 200:
{
  "data": [
    {
      "id": "uuid-1",
      "balance": 100,
      "status": "active",
      "createdAt": "2026-04-04T10:00:00Z",
      "createdBy": { "email": "admin@example.com" },
      "expiresAt": "2026-05-04T10:00:00Z"
    },
    // ...
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### 6. Get Gift Card Details

```http
GET /api/v1/gift-cards/{giftCardId}
Authorization: Bearer {user_token}

Response 200:
{
  "id": "gift-card-uuid",
  "balance": 100,
  "status": "active",
  "createdAt": "2026-04-04T10:00:00Z",
  "expiresAt": "2026-05-04T10:00:00Z",
  "transactions": [
    {
      "id": "txn-uuid",
      "type": "redemption",
      "amount": 100,
      "orderId": "order-uuid",
      "createdAt": "2026-04-04T10:05:00Z"
    }
  ],
  "auditLog": [
    {
      "event": "created",
      "timestamp": "2026-04-04T10:00:00Z",
      "actor": "admin-uuid"
    },
    {
      "event": "redeemed",
      "timestamp": "2026-04-04T10:05:00Z",
      "actor": "customer-uuid"
    }
  ]
}
```

---

## 5. Frontend Components

### Component Tree

```
GiftCardManager (Page)
├── GiftCardCreateForm
│   ├── AmountInput
│   ├── CurrencySelect
│   └── SubmitButton
├── GiftCardsList (Admin View)
│   ├── DataTable
│   ├── FilterBar
│   └── GiftCardRow
│       └── GiftCardDetailsModal
│           ├── QRCodeDisplay
│           ├── TransactionHistory
│           └── AuditLog
└── GiftCardRedeem (Checkout Flow)
    ├── CodeInput (manual or scanned)
    ├── GiftCardPreview
    ├── ApplyButton
    └── RedemptionConfirm
```

### GiftCardCreateForm

```typescript
interface GiftCardCreateFormProps {
  onSuccess: (card: GiftCard) => void;
  onError: (error: Error) => void;
}

// Validation: amount > 0
// Loading state during QR generation
// Success toast with download QR link
// Error toast with retry
```

### GiftCardRedeemFlow (Checkout)

```typescript
interface GiftCardRedeemFlowProps {
  orderId: string;
  orderTotal: number;
  onApply: (transaction: GiftCardTransaction) => void;
  onCancel: () => void;
}

// Code input (manual): validate format
// QR scan: resolve shortCode
// Display card details: balance, expiry
// Apply button: calls /redeem endpoint
// Error handling: expired, already used, insufficient balance
// Success: close modal, update order total
```

### QRCodeDisplay

```typescript
interface QRCodeDisplayProps {
  dataUrl: string; // base64 data URL
  shortCode: string;
  qrUrl: string;
  onDownload: () => void;
  onCopy: () => void;
}

// Display QR as image
// Buttons: Download, Copy link, Share
```

---

## 6. Service Layer Architecture

### GiftCardService

```typescript
class GiftCardService {
  /**
   * Crea una nueva tarjeta de regalo (ES)
   * Creates a new gift card (EN)
   */
  async createGiftCard(
    amount: number,
    createdByUserId: string,
    expiresIn: number = 2592000 // 30 days
  ): Promise<GiftCard> {
    const id = generateUuid();
    const shortCode = generateShortCode(10);
    const expiresAt = addSeconds(now(), expiresIn);

    // Generate QR
    const qrDataUrl = await this.qrService.generateQR(id);

    // Insert gift card
    await db.query(
      `
      INSERT INTO gift_cards (id, balance, created_by_user_id, expires_at, status)
      VALUES ($1, $2, $3, $4, 'active')
    `,
      [id, amount, createdByUserId, expiresAt]
    );

    // Insert QR mapping
    await db.query(
      `
      INSERT INTO qr_mappings (short_code, gift_card_id)
      VALUES ($1, $2)
    `,
      [shortCode, id]
    );

    return { id, shortCode, balance: amount, status: 'active', expiresAt, qrDataUrl };
  }

  /**
   * Valida una tarjeta de regalo (ES)
   * Validates a gift card (EN)
   */
  async validateGiftCard(giftCardId: string): Promise<ValidationResult> {
    const card = await db.query(
      `
      SELECT * FROM gift_cards WHERE id = $1
    `,
      [giftCardId]
    );

    if (!card) return { isValid: false, reason: 'NOT_FOUND' };
    if (card.status === 'redeemed') return { isValid: false, reason: 'ALREADY_REDEEMED' };
    if (card.expires_at < now()) return { isValid: false, reason: 'EXPIRED' };

    return { isValid: true, card };
  }

  /**
   * Redime una tarjeta de regalo (ES)
   * Redeems a gift card (EN)
   *
   * Pessimistic lock prevents race conditions
   */
  async redeemGiftCard(
    giftCardId: string,
    redeemedByUserId: string,
    orderId: string,
    amount: number
  ): Promise<Transaction> {
    // Lock the row
    const card = await db.query(
      `
      SELECT * FROM gift_cards WHERE id = $1 FOR UPDATE
    `,
      [giftCardId]
    );

    if (!card) throw new NotFoundError('Gift card not found');
    if (card.redeemed_at) throw new ConflictError('Already redeemed');
    if (card.expires_at < now()) throw new BadRequestError('Expired');
    if (amount > card.balance) throw new BadRequestError('Insufficient balance');

    // Mark as redeemed
    await db.query(
      `
      UPDATE gift_cards 
      SET redeemed_at = CURRENT_TIMESTAMP, redeemed_by_user_id = $1, status = 'redeemed'
      WHERE id = $2
    `,
      [redeemedByUserId, giftCardId]
    );

    // Log transaction
    const txn = await db.query(
      `
      INSERT INTO gift_card_transactions 
      (gift_card_id, order_id, redeemed_by_user_id, amount_redeemed)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
      [giftCardId, orderId, redeemedByUserId, amount]
    );

    return txn;
  }
}
```

### QRService

```typescript
class QRService {
  /**
   * Genera código QR (ES)
   * Generates QR code (EN)
   */
  async generateQR(uuid: string): Promise<string> {
    const qrCode = await QRCode.toDataURL(uuid, {
      width: 300,
      margin: 10,
      color: { dark: '#000', light: '#fff' },
    });
    return qrCode; // data:image/png;base64,...
  }
}
```

### QRMappingService

```typescript
class QRMappingService {
  /**
   * Resuelve un código corto a UUID (ES)
   * Resolves short code to UUID (EN)
   */
  async resolveShortCode(shortCode: string): Promise<string> {
    const mapping = await db.query(
      `
      SELECT gift_card_id FROM qr_mappings WHERE short_code = $1
    `,
      [shortCode]
    );

    if (!mapping) throw new NotFoundError('Short code not found');

    // Update scan count (analytics)
    await db.query(
      `
      UPDATE qr_mappings SET scan_count = scan_count + 1, last_scanned_at = CURRENT_TIMESTAMP
      WHERE short_code = $1
    `,
      [shortCode]
    );

    return mapping.gift_card_id;
  }
}
```

---

## 7. State Management (Frontend)

### Zustand Store

```typescript
interface GiftCardState {
  // Data
  giftCards: GiftCard[];
  selectedCard: GiftCard | null;

  // UI
  isLoading: boolean;
  error: Error | null;

  // Actions
  fetchGiftCards: (filters?: Filters) => Promise<void>;
  selectCard: (id: string) => void;
  createCard: (amount: number) => Promise<GiftCard>;
  redeemCard: (id: string, orderId: string) => Promise<Transaction>;

  // Helpers
  setError: (error: Error | null) => void;
  clearSelection: () => void;
}

export const useGiftCardStore = create<GiftCardState>((set, get) => ({
  giftCards: [],
  selectedCard: null,
  isLoading: false,
  error: null,

  fetchGiftCards: async (filters) => {
    set({ isLoading: true });
    try {
      const data = await giftCardAPI.list(filters);
      set({ giftCards: data });
    } catch (error) {
      set({ error });
    } finally {
      set({ isLoading: false });
    }
  },

  // ... other actions
}));
```

---

## 8. Testing Strategy

### Unit Tests (GiftCardService)

```typescript
describe('GiftCardService', () => {
  describe('createGiftCard', () => {
    it('should create a gift card with valid amount', async () => {
      const card = await service.createGiftCard(100, 'user-1');
      expect(card.id).toBeDefined();
      expect(card.balance).toBe(100);
      expect(card.status).toBe('active');
    });

    it('should generate QR code', async () => {
      const card = await service.createGiftCard(100, 'user-1');
      expect(card.qrDataUrl).toMatch(/^data:image\/png;base64/);
    });
  });

  describe('redeemGiftCard', () => {
    it('should redeem gift card successfully', async () => {
      const card = await service.createGiftCard(100, 'user-1');
      const txn = await service.redeemGiftCard(card.id, 'user-2', 'order-1', 100);
      expect(txn.id).toBeDefined();
      expect(txn.amount_redeemed).toBe(100);
    });

    it('should prevent double redemption', async () => {
      const card = await service.createGiftCard(100, 'user-1');
      await service.redeemGiftCard(card.id, 'user-2', 'order-1', 100);

      await expect(service.redeemGiftCard(card.id, 'user-3', 'order-2', 50)).rejects.toThrow(
        'Already redeemed'
      );
    });

    it('should reject expired cards', async () => {
      const card = await service.createGiftCard(100, 'user-1', -1); // already expired
      await expect(service.redeemGiftCard(card.id, 'user-2', 'order-1', 100)).rejects.toThrow(
        'Expired'
      );
    });
  });
});
```

### Integration Tests

```typescript
describe('GiftCardController (Integration)', () => {
  it('should create and redeem a gift card', async () => {
    // 1. Create
    const createRes = await request(app)
      .post('/api/v1/gift-cards')
      .send({ balance: 100, createdByUserId: 'admin-1' });
    expect(createRes.status).toBe(201);

    // 2. Validate
    const validateRes = await request(app).get(`/api/v1/gift-cards/${createRes.body.id}/validate`);
    expect(validateRes.status).toBe(200);
    expect(validateRes.body.isRedeemable).toBe(true);

    // 3. Redeem
    const redeemRes = await request(app)
      .post(`/api/v1/gift-cards/${createRes.body.id}/redeem`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId: 'order-1', amount: 100 });
    expect(redeemRes.status).toBe(200);
    expect(redeemRes.body.success).toBe(true);

    // 4. Verify double-redeem fails
    const secondRedeemRes = await request(app)
      .post(`/api/v1/gift-cards/${createRes.body.id}/redeem`)
      .set('Authorization', `Bearer ${anotherCustomerToken}`)
      .send({ orderId: 'order-2', amount: 50 });
    expect(secondRedeemRes.status).toBe(400);
  });
});
```

### E2E Tests (Playwright)

```typescript
describe('Gift Card Redemption Flow (E2E)', () => {
  it('should complete redemption from QR scan to order', async () => {
    // 1. Login as customer
    await page.goto('/login');
    await page.fill('input[name=email]', 'customer@example.com');
    await fillAuthForm(page, 'customer-password');

    // 2. Go to checkout
    await page.goto('/checkout');

    // 3. Apply gift card
    await page.click('button[data-testid=apply-gift-card]');
    await page.fill('input[name=gift-code]', 'abc123xyz');
    await page.click('button:has-text("Apply")');

    // 4. Verify order updated
    await expect(page).toHaveText('Order Total: $20'); // $120 - $100

    // 5. Complete purchase
    await page.click('button:has-text("Complete Purchase")');
    await expect(page).toHaveURL(/\/order-confirmation/);
  });
});
```

---

## 9. Deployment & Monitoring

### Environment Variables

```env
# .env.production
GIFT_CARD_EXPIRY_DAYS=30
GIFT_CARD_SHORT_CODE_LENGTH=10
QR_CODE_SIZE=300
QR_CODE_MARGIN=10

# Monitoring
DATADOG_ENABLED=true
SENTRY_ENABLED=true
```

### Monitoring & Alerts

```yaml
Metrics to Track:
  - Redemption success rate (target: >99.5%)
  - Avg redemption time (target: <200ms)
  - QR generation latency
  - Double-redemption attempts (target: 0)
  - Expired card redemption attempts (normal: low baseline)

Alerts:
  - Redemption success rate drops below 98%
  - P99 redemption latency exceeds 500ms
  - Double-redemption detected (investigate)
  - Database lock timeouts (>5 per minute)
```

### Deployment Checklist

- [ ] Database migrations applied (gift_cards, qr_mappings, gift_card_transactions)
- [ ] Indexes created and validated
- [ ] GiftCardService deployed to backend
- [ ] API endpoints tested (unit + integration)
- [ ] Frontend components built and tested
- [ ] Zustand store integrated
- [ ] E2E tests passing
- [ ] Monitoring configured (Datadog, Sentry)
- [ ] Documentation deployed
- [ ] Feature flag enabled for gradual rollout

---

## 10. Appendices

### A. Error Codes & Messages

| Code                           | HTTP | Message (EN)                   | Message (ES)                     | Retryable |
| ------------------------------ | ---- | ------------------------------ | -------------------------------- | --------- |
| GIFT_CARD_NOT_FOUND            | 404  | Gift card not found            | Tarjeta de regalo no encontrada  | No        |
| GIFT_CARD_EXPIRED              | 400  | Gift card has expired          | La tarjeta de regalo ha expirado | No        |
| GIFT_CARD_ALREADY_REDEEMED     | 400  | Gift card already redeemed     | Tarjeta de regalo ya redimida    | No        |
| GIFT_CARD_INSUFFICIENT_BALANCE | 400  | Insufficient balance           | Balance insuficiente             | No        |
| QR_GENERATION_FAILED           | 500  | QR generation failed           | Error al generar código QR       | Yes       |
| DATABASE_LOCK_TIMEOUT          | 500  | Database lock timeout          | Timeout de bloqueo de BD         | Yes       |
| RACE_CONDITION                 | 409  | Concurrent redemption detected | Redención concurrente detectada  | Yes       |

### B. Security Considerations

- **QR Exposure**: Short code layer prevents UUID exposure in QR (security through obscurity)
- **Token Replay**: All-or-nothing model prevents partial reuse
- **Race Conditions**: Pessimistic locking (SELECT ... FOR UPDATE) ensures atomicity
- **Audit Trail**: All transactions logged for compliance & debugging
- **HTTPS Only**: All QR URLs use HTTPS; redirect only on secure connections

### C. Database Migration (Raw SQL)

See ARCHITECTURE-GiftCards.md Section 4 for full DDL with indexes and constraints.

### D. Glossary

- **Gift Card UUID**: Unique identifier (e.g., 550e8400-e29b-41d4-a716-446655440000)
- **Short Code**: URL-safe alias (e.g., abc123xyz)
- **QR Mapping**: Indirection layer (shortCode → giftCardId)
- **Pessimistic Locking**: SELECT ... FOR UPDATE prevents concurrent modifications
- **Lazy Expiration**: Expiry checked at redemption time, not via cron job
- **All-or-Nothing**: Entire card amount redeemed or not at all; no partial redemptions

### E. Future Enhancements (Post-v1.0)

1. Partial redemptions (split gift card across multiple orders)
2. Gift card resale marketplace
3. Wallet integration (hold multiple cards)
4. Gift card campaigns (buy 3 get 10% bonus)
5. Analytics dashboard (redemption rates, popular amounts, geography)
6. B2B bulk gift card distribution

---

**Document Version**: 1.0  
**Last Updated**: 2026-04-04  
**Status**: Draft for Implementation  
**Next Review**: Post-v1.0 release
