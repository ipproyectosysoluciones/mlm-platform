# DESIGN: Abandoned Cart Recovery (v1.0)

## Comprehensive Reference Document — Feature #21

---

## Table of Contents

1. Feature Overview
2. User Stories & Acceptance Criteria
3. Data Model
4. API Specification
5. Email Automation Flow
6. Frontend Components
7. State Management
8. Testing Strategy
9. Deployment & Monitoring
10. Appendices

---

## 1. Feature Overview

### Purpose

Automatically detect when customers abandon their shopping carts and send personalized recovery emails with one-time links to resume their purchase. Recover lost sales and improve conversion rates.

### Scope

- **v1.0**: Hybrid trigger (event + polling), email recovery with token validation, cart restoration
- **Future**: Multi-reminder campaigns, progressive discounts, dynamic pricing

### Success Metrics

- Abandoned carts recovered: >5% of total
- Email open rate: >15%
- Click-through rate: >3%
- Cart recovery time: <2 hours from abandonment
- False positives: <1%

---

## 2. User Stories & Acceptance Criteria

### Story 1: Detect Abandoned Cart

```gherkin
As the system
I want to detect when customers abandon their carts
So we can send recovery emails

Scenario: Cart inactivity detection (event-based)
  Given a customer adds items to cart at 10:00 AM
  When the customer closes their browser without checkout
  And 30+ minutes pass without cart activity
  Then the system emits: CartAbandoned event
  And SchedulerService.abandonedCartJob() is triggered

Scenario: Cart inactivity detection (polling-based)
  Given multiple abandoned carts exist
  When the SchedulerService runs (every 10–15 minutes)
  And it queries carts where lastActivityAt > 1000 minutes ago
  Then it identifies all abandoned carts
  And processes them as batch

Scenario: Do not flag active carts
  Given a customer is browsing items
  When lastActivityAt is updated frequently (every page view)
  Then cart NOT flagged as abandoned
  And email NOT sent

Scenario: Do not flag checked-out carts
  Given a customer completes purchase
  When status = 'checked_out'
  Then cart NOT flagged as abandoned
  And email NOT sent
```

### Story 2: Send Recovery Email with One-Time Token

```gherkin
As the system
I want to email customers with a recovery link
So they can quickly resume their checkout

Scenario: Generate recovery token
  Given an abandoned cart detected
  When the system creates a cartRecoveryToken
  Then token is:
    - UUID (unique, non-guessable)
    - Hashed with bcrypt before storage
    - Valid for 7 days
    - One-time use only
  And token inserted into DB

Scenario: Send recovery email
  Given a cartRecoveryToken created for user@example.com
  When the email service composes recovery email
  Then email includes:
    - Personalized greeting: "Hi, {firstName}!"
    - Cart summary: item count, total price
    - Recovery link: https://app.com/recover-cart?token={token}
    - Expiration notice: "Link expires in 7 days"
    - Alternative: manual code entry
  And email sent within 5 minutes

Scenario: Token replay prevention
  Given a customer clicks recovery link
  When GET /api/carts/recover/{token}
  And token valid
  Then response includes cart data
  And token marked as 'used'
  And subsequent clicks with same token → 410 Gone (expired)

Scenario: Expired token
  Given a token created 8 days ago
  When customer tries to use it
  Then response: 400 Bad Request "Token expired"
  And customer prompted to request new recovery email
```

### Story 3: Cart Restoration

```gherkin
As a customer
I want to quickly resume my abandoned cart
So I can complete checkout without re-entering items

Scenario: Click recovery link
  Given I receive recovery email
  When I click "Resume Shopping"
  Then I'm redirected to checkout page
  And my cart items are auto-loaded
  And cart total displayed

Scenario: Manual token entry
  Given I have recovery code from email
  When I visit /recover-cart
  And enter code manually
  Then cart items restored
  And proceed to checkout

Scenario: Cart restoration after login
  Given I'm not logged in
  When I click recovery link
  And I log in
  Then my cart items are restored
  And I can complete purchase

Scenario: Timeout during recovery
  Given I click recovery link but don't complete checkout
  When 7 days pass
  And I try to use the same link again
  Then response: 410 Gone
  And prompt: "Link expired, request new recovery email"
```

### Story 4: Admin View & Analytics

```gherkin
As an admin
I want to view abandoned cart statistics
So I can optimize recovery campaigns

Scenario: View dashboard
  Given I'm in admin dashboard
  When I view "Abandoned Carts" section
  Then I see metrics:
    - Total abandoned: 1,250 (last 30 days)
    - Recovered: 75 (6% recovery rate)
    - Revenue recovered: $3,750
    - Avg cart value: $50
  And I can filter by date range, user segment

Scenario: View individual cart
  Given I click on an abandoned cart
  When details panel opens
  Then I see:
    - Items in cart
    - Cart value
    - Customer info
    - Abandonment time
    - Email sent status + timestamp
    - Recovery status (pending, recovered, expired)
```

---

## 3. Data Model

### Core Tables

#### carts

```sql
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'active', -- active | abandoned | recovered | expired | checked_out

  -- Lifecycle tracking
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  abandoned_at TIMESTAMP NULL, -- When marked as abandoned
  recovered_at TIMESTAMP NULL, -- When customer resumed
  checked_out_at TIMESTAMP NULL, -- When purchase completed

  -- Soft delete (GDPR compliance)
  deleted_at TIMESTAMP NULL,

  -- Metadata
  total_amount NUMERIC(10, 2) DEFAULT 0,
  item_count INT DEFAULT 0,
  metadata JSONB DEFAULT '{}', -- coupon code, notes, etc.

  CONSTRAINT valid_timestamps CHECK (
    (status = 'checked_out' AND checked_out_at IS NOT NULL) OR
    status != 'checked_out'
  )
);

CREATE INDEX idx_carts_user_active ON carts(user_id, status) WHERE status != 'checked_out';
CREATE INDEX idx_carts_last_activity ON carts(last_activity_at) WHERE status = 'active';
CREATE INDEX idx_carts_abandoned ON carts(abandoned_at) WHERE status = 'abandoned';
```

#### cart_items

```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price > 0),
  subtotal NUMERIC(10, 2) NOT NULL, -- quantity * unit_price

  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}', -- product snapshot, customizations

  CONSTRAINT subtotal_valid CHECK (subtotal = quantity * unit_price)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);
```

#### cart_recovery_tokens

```sql
CREATE TABLE cart_recovery_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash VARCHAR(255) NOT NULL UNIQUE, -- bcrypt hash of token
  token_plain TEXT NOT NULL, -- for first-time display only (not persisted long-term)

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL, -- created_at + 7 days
  used_at TIMESTAMP NULL, -- When token was used
  status VARCHAR(20) DEFAULT 'pending', -- pending | used | expired

  email_sent_at TIMESTAMP NULL,
  click_count INT DEFAULT 0,
  last_clicked_at TIMESTAMP NULL,

  metadata JSONB DEFAULT '{}', -- UTM params, email provider response, etc.

  CONSTRAINT token_validity CHECK (
    (used_at IS NULL AND status = 'pending') OR
    (used_at IS NOT NULL AND status = 'used')
  )
);

CREATE INDEX idx_recovery_tokens_cart ON cart_recovery_tokens(cart_id);
CREATE INDEX idx_recovery_tokens_user ON cart_recovery_tokens(user_id);
CREATE INDEX idx_recovery_tokens_hash ON cart_recovery_tokens(token_hash);
CREATE INDEX idx_recovery_tokens_expires ON cart_recovery_tokens(expires_at) WHERE status = 'pending';
```

### Relationships Diagram

```
users (1) ──→ (N) carts
              │
              ├─→ (N) cart_items ──→ products
              └─→ (N) cart_recovery_tokens

emails (1) ──→ (N) cart_recovery_tokens (sent_at, delivery status)
```

---

## 4. API Specification

### Base URL

```
/api/v1/carts
```

### Endpoints

#### 1. Get Current Cart

```http
GET /api/v1/carts/me
Authorization: Bearer {user_token}

Response 200:
{
  "id": "cart-uuid",
  "userId": "user-uuid",
  "status": "active",
  "items": [
    {
      "id": "cart-item-uuid",
      "product": {
        "id": "product-uuid",
        "name": "Wireless Headphones",
        "price": 79.99
      },
      "quantity": 2,
      "subtotal": 159.98,
      "addedAt": "2026-04-03T15:00:00Z"
    }
  ],
  "totalAmount": 159.98,
  "itemCount": 2,
  "lastActivityAt": "2026-04-04T10:30:00Z",
  "createdAt": "2026-04-03T15:00:00Z"
}

Errors:
- 404: No active cart found
- 401: Unauthorized
```

#### 2. Add Item to Cart

```http
POST /api/v1/carts/me/items
Authorization: Bearer {user_token}
Content-Type: application/json

Request Body:
{
  "productId": "product-uuid",
  "quantity": 2
}

Response 201:
{
  "id": "cart-uuid",
  "items": [ ... ],
  "totalAmount": 159.98,
  "itemCount": 2,
  "lastActivityAt": "2026-04-04T10:30:00Z" -- Updated
}

Errors:
- 400: Invalid quantity or product not found
- 401: Unauthorized
- 500: Cart operation failed
```

#### 3. Recover Cart (by Token)

```http
GET /api/v1/carts/recover/{token}

Response 200:
{
  "id": "cart-uuid",
  "items": [
    {
      "productId": "product-uuid",
      "name": "Wireless Headphones",
      "quantity": 2,
      "unitPrice": 79.99,
      "subtotal": 159.98
    }
  ],
  "totalAmount": 159.98,
  "recoveryToken": {
    "id": "token-uuid",
    "expiresAt": "2026-04-11T10:00:00Z",
    "status": "pending"
  }
}

Errors:
- 400: Invalid or expired token
- 410: Token already used
- 404: Cart or token not found
```

#### 4. Complete Recovery (Mark Token as Used)

```http
POST /api/v1/carts/recover/{token}
Content-Type: application/json

Request Body:
{
  "cartId": "cart-uuid"
}

Response 200:
{
  "success": true,
  "cart": { ... },
  "token": {
    "usedAt": "2026-04-04T10:35:00Z",
    "status": "used"
  }
}

Errors:
- 400: Invalid token, expired, or already used
- 404: Cart or token not found
```

#### 5. List Abandoned Carts (Admin)

```http
GET /api/v1/carts/abandoned?limit=50&offset=0&days=30
Authorization: Bearer {admin_token}

Response 200:
{
  "data": [
    {
      "id": "cart-uuid",
      "userId": "user-uuid",
      "userEmail": "customer@example.com",
      "userName": "John Doe",
      "totalAmount": 150.00,
      "itemCount": 3,
      "abandonedAt": "2026-04-03T18:00:00Z",
      "emailSentAt": "2026-04-03T18:05:00Z",
      "recoveryStatus": "pending", -- pending | recovered | expired
      "recoveryLink": "https://app.com/recover-cart?token=...",
      "lastActivityAt": "2026-04-03T18:00:00Z"
    }
  ],
  "pagination": {
    "total": 347,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  },
  "stats": {
    "totalAbandoned": 347,
    "totalRecovered": 21,
    "recoveryRate": "6.05%",
    "totalRecoveredAmount": "$1,050.00"
  }
}
```

---

## 5. Email Automation Flow

### Abandoned Cart Detection Pipeline

```
1. Event-Based Trigger
   ├─ User adds/removes item → CartItemAdded event
   ├─ lastActivityAt updated
   ├─ Timeout check: if no activity > 1000 minutes (16.6 hrs)
   └─ Emit: CartAbandoned event → SchedulerService

2. Polling-Based Fallback
   ├─ SchedulerService runs every 10–15 minutes
   ├─ Query: SELECT * FROM carts WHERE status = 'active' AND last_activity_at < NOW() - 1000 min
   ├─ For each cart not already processed
   └─ Emit: CartAbandoned event

3. Token Generation
   ├─ Generate random UUID token
   ├─ Hash with bcrypt (cost factor 12)
   ├─ INSERT into cart_recovery_tokens (token_hash, expires_at = NOW() + 7 days)
   └─ Keep token_plain only for immediate display (not persisted)

4. Email Composition
   ├─ Fetch user: firstName, email, phone
   ├─ Fetch cart items: product names, quantities, prices
   ├─ Calculate total
   ├─ Compose HTML email with:
   │   ├─ Personalization: "Hi {{firstName}}, your cart is waiting!"
   │   ├─ Item summary: "3 items • $150 total"
   │   ├─ Recovery button: https://app.com/recover-cart?token={token}
   │   ├─ Countdown timer: "Expires in 7 days"
   │   └─ Alternative: manual code entry
   └─ Add tracking pixels (Brevo, Mixpanel)

5. Email Dispatch
   ├─ Queue entry created in emailQueue table
   ├─ Status: pending, retryCount: 0
   ├─ SchedulerService picks up and sends via Brevo
   ├─ On success: mark emailSentAt, decrement retry
   ├─ On failure: exponential backoff + retry (max 5)
   └─ On final failure: mark status = 'failed', alert admin

6. Recovery Flow
   ├─ Customer clicks link
   ├─ GET /api/carts/recover/{token} → Backend verifies token_hash (bcrypt compare)
   ├─ Increment click_count, last_clicked_at
   ├─ Return cart items to frontend
   ├─ Frontend loads items into Zustand store
   ├─ Customer reviews & proceeds to checkout
   ├─ On checkout: POST /api/carts/recover/{token} → mark token.status = 'used'
   ├─ Cart status → recovered, recovered_at = NOW()
   └─ Success!
```

### Brevo Email Template

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Your Cart is Waiting!</title>
  </head>
  <body>
    <h1>Hi {{firstName}},</h1>
    <p>You left {{itemCount}} items in your cart worth <strong>{{totalAmount}}</strong>.</p>

    <h2>Your Items:</h2>
    <ul>
      {{#each items}}
      <li>{{productName}} × {{quantity}} — {{subtotal}}</li>
      {{/each}}
    </ul>

    <p>
      <a
        href="https://app.com/recover-cart?token={{recoveryToken}}"
        style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none;"
      >
        Resume Shopping
      </a>
    </p>

    <p style="font-size: 12px; color: #666;">
      This link expires in <strong>7 days</strong> ({{expiresAt}}).
    </p>

    <p style="font-size: 12px; color: #999;">
      Can't click? Enter this code: <code>{{recoveryCode}}</code>
    </p>
  </body>
</html>
```

---

## 6. Frontend Components

### Component Tree

```
CartPage
├── CartItemsList
│   ├── CartItemRow (with remove/quantity controls)
│   └── CartSummary (total, taxes, shipping)
└── CheckoutButton

AbandonedCartNotification (Toast)
├── Icon + Message
├── "Resume Cart" link
└── Dismiss button

RecoverCartPage
├── TokenValidator
│   ├─ Parse token from URL
│   ├─ Fetch cart data via GET /api/carts/recover/{token}
│   └─ Display recovery summary
├── CartPreview (read-only items)
└── ProceedToCheckout button
    └─ POST /api/carts/recover/{token} → mark used
```

### CartStore (Zustand)

```typescript
interface CartState {
  items: CartItem[];
  totalAmount: number;
  lastActivityAt: Date;

  addItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, newQuantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  recoverCart: (token: string) => Promise<void>;

  // Persistence
  syncToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalAmount: 0,
  lastActivityAt: new Date(),

  addItem: async (productId, quantity) => {
    // Call API
    // Update Zustand state
    // Sync to localStorage every 30s
    get().syncToLocalStorage();
  },

  recoverCart: async (token) => {
    const response = await fetch(`/api/carts/recover/${token}`);
    const { cart } = await response.json();
    set({ items: cart.items, totalAmount: cart.totalAmount });
    get().syncToLocalStorage();
  },

  syncToLocalStorage: () => {
    localStorage.setItem('mlm_cart', JSON.stringify(get()));
  },

  loadFromLocalStorage: () => {
    const stored = localStorage.getItem('mlm_cart');
    if (stored) {
      const data = JSON.parse(stored);
      set(data);
    }
  },
}));
```

---

## 7. State Management & Persistence

### localStorage Key

```javascript
const CART_STORAGE_KEY = `mlm_cart_${userId}`;

// Persisted data
{
  items: [
    { productId, quantity, unitPrice, productName, productImage }
  ],
  totalAmount: 150.00,
  lastActivityAt: "2026-04-04T10:30:00Z"
}
```

### Sync Strategy

- **Frequency**: Every 30 seconds (debounced)
- **Trigger**: On any cart mutation (add, remove, update quantity)
- **Recovery**: On app load, restore cart from localStorage if within 24 hours
- **Cleanup**: Clear localStorage on successful checkout

---

## 8. Testing Strategy

### Unit Tests (CartService)

```typescript
describe('CartService', () => {
  describe('findAbandoned', () => {
    it('should find carts inactive >1000 minutes', async () => {
      const carts = await service.findAbandoned();
      expect(carts).toHaveLength(5);
      carts.forEach((cart) => {
        expect(cart.lastActivityAt).toBeLessThan(Date.now() - 1000 * 60 * 1000);
      });
    });
  });

  describe('createRecoveryToken', () => {
    it('should create bcrypt-hashed token', async () => {
      const token = await service.createRecoveryToken(cartId);
      expect(token.tokenHash).toMatch(/^\$2[aby]\$/); // bcrypt format
      expect(token.expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe('recoverCart', () => {
    it('should mark token as used and cart as recovered', async () => {
      const token = await service.createRecoveryToken(cartId);
      const recovered = await service.recoverCart(cartId, token.tokenPlain);
      expect(recovered.status).toBe('recovered');
      expect(recovered.recoveredAt).toBeDefined();
    });

    it('should prevent token replay', async () => {
      const token = await service.createRecoveryToken(cartId);
      await service.recoverCart(cartId, token.tokenPlain);

      await expect(service.recoverCart(cartId, token.tokenPlain)).rejects.toThrow(
        'Token already used'
      );
    });
  });
});
```

### Integration Tests

```typescript
describe('Abandoned Cart Flow (Integration)', () => {
  it('should detect, email, and recover cart', async () => {
    // 1. Create cart and add items
    const cart = await createCart(userId, [{ productId: 'p1', quantity: 2 }]);

    // 2. Wait past abandonment threshold (mock time)
    jest.useFakeTimers();
    jest.advanceTimersByTime(1001 * 60 * 1000); // 1001 minutes

    // 3. Trigger scheduler
    await schedulerService.abandonedCartJob();

    // 4. Verify email queued
    const queuedEmail = await emailQueue.findOne({ cartId: cart.id });
    expect(queuedEmail).toBeDefined();
    expect(queuedEmail.status).toBe('pending');

    // 5. Process email
    await emailService.processBatch();

    // 6. Verify email sent
    const sentEmail = await emailLog.findOne({ cartId: cart.id });
    expect(sentEmail.status).toBe('sent');
    expect(sentEmail.recipientEmail).toBe(user.email);

    // 7. Simulate customer clicking link
    const token = queuedEmail.metadata.recoveryToken;
    const recoveredCart = await cartService.recoverCart(cart.id, token);

    // 8. Verify cart recovered
    expect(recoveredCart.status).toBe('recovered');
    expect(recoveredCart.recoveredAt).toBeDefined();
  });
});
```

### E2E Tests (Playwright)

```typescript
describe('Abandoned Cart Recovery Flow (E2E)', () => {
  it('should complete recovery from email to checkout', async () => {
    // 1. Add items to cart
    await page.goto('/products');
    await page.click('button:has-text("Add to Cart")', { position: { x: 100, y: 100 } });
    await page.goto('/checkout');
    await expect(page).toHaveText('$150.00');

    // 2. Simulate abandonment (close browser, wait)
    await page.close();
    await new Promise((r) => setTimeout(r, 61 * 60 * 1000)); // Wait 61 min

    // 3. Check email (mock)
    const email = await getLastEmail(customer.email);
    expect(email.subject).toContain('Your cart is waiting');
    const recoveryLink = extractLink(email.body);

    // 4. Click recovery link
    const newPage = await browser.newPage();
    await newPage.goto(recoveryLink);

    // 5. Verify cart restored
    await expect(newPage).toHaveText('$150.00');
    await expect(newPage).toHaveText('3 items');

    // 6. Complete checkout
    await newPage.click('button:has-text("Proceed to Checkout")');
    await newPage.click('button:has-text("Confirm Purchase")');

    // 7. Verify success
    await expect(newPage).toHaveURL(/\/order-confirmation/);
  });
});
```

---

## 9. Deployment & Monitoring

### Environment Variables

```env
ABANDONED_CART_THRESHOLD_MINUTES=1000
RECOVERY_TOKEN_EXPIRY_DAYS=7
RECOVERY_EMAIL_DELAY_MINUTES=5
SCHEDULER_INTERVAL_MINUTES=10
BCRYPT_COST_FACTOR=12
```

### Monitoring Metrics

```yaml
Key Metrics:
  - Abandoned carts detected (daily, weekly)
  - Recovery email open rate (target: >15%)
  - Click-through rate (target: >3%)
  - Cart recovery rate (target: >5%)
  - Token replay attempts (target: 0)
  - Email delivery rate (target: >98%)

Alerts:
  - Abandoned cart detection drops to 0 (scheduler failure)
  - Email open rate drops below 10%
  - Token replay attempts detected
  - Recovery tokens expiring without use (investigate design)
  - Email delivery failures >2%
```

### Deployment Checklist

- [ ] Database migrations applied (carts, cartItems, cartRecoveryTokens)
- [ ] Indexes created and validated
- [ ] CartService implemented & tested
- [ ] SchedulerService extended with abandonedCartJob()
- [ ] Brevo integration configured (API key, templates)
- [ ] Email queue table created
- [ ] Frontend components built (CartPage, RecoverCart, Zustand store)
- [ ] localStorage persistence tested
- [ ] E2E tests passing
- [ ] Monitoring configured (abandoned carts, recovery rate, email metrics)
- [ ] Documentation deployed

---

## 10. Appendices

### A. Error Codes

| Code               | HTTP | Message (EN)           | Message (ES)                   | Retryable |
| ------------------ | ---- | ---------------------- | ------------------------------ | --------- |
| CART_NOT_FOUND     | 404  | Cart not found         | Carrito no encontrado          | No        |
| TOKEN_EXPIRED      | 400  | Recovery token expired | Token de recuperación expirado | No        |
| TOKEN_INVALID      | 400  | Invalid token          | Token inválido                 | No        |
| TOKEN_ALREADY_USED | 410  | Token already used     | Token ya utilizado             | No        |
| PRODUCT_NOT_FOUND  | 404  | Product not found      | Producto no encontrado         | No        |
| EMAIL_SEND_FAILED  | 500  | Email send failed      | Error al enviar email          | Yes       |

### B. Security Considerations

- **Token Hashing**: bcrypt with cost factor 12 prevents token enumeration
- **One-Time Tokens**: Prevents replay attacks
- **HTTPS Only**: All recovery links use HTTPS
- **Expiration**: 7-day window limits brute force window
- **Rate Limiting**: Prevent abuse of recovery endpoint

### C. Performance Optimization

- **Indexes on lastActivityAt**: Fast detection of abandoned carts
- **Batch Processing**: Email queue processed in batches (not per-cart)
- **localStorage Sync**: Debounced (30s) to reduce API calls
- **Lazy Loading**: Cart items fetched on-demand in recovery flow

### D. Database Migration

See migrations directory for full DDL with indexes, constraints, foreign keys.

### E. Glossary

- **Abandoned Cart**: Active cart with >1000 minutes of no activity
- **Recovery Token**: One-time, bcrypt-hashed link sent via email
- **lastActivityAt**: Timestamp updated on any cart modification
- **Soft Delete**: deletedAt timestamp for GDPR compliance
- **Hybrid Trigger**: Event-based + polling for reliability

---

**Document Version**: 1.0  
**Last Updated**: 2026-04-04  
**Status**: Draft for Implementation  
**Next Review**: Post-v1.0 release
