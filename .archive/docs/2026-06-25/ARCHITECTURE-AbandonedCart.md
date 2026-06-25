# ARCHITECTURE: Abandoned Cart Recovery (v1.0)

## Technical Design for Implementation — #21

---

## 1. Service Architecture & Boundaries

### CartService — Core Service

**Responsibility**: Manage cart lifecycle (create, add items, abandon detection, recovery).

```typescript
class CartService {
  // Cart management
  async getCart(userId: string): Promise<Cart>;
  async addItem(userId: string, productId: string, quantity: number): Promise<Cart>;
  async removeItem(userId: string, cartItemId: string): Promise<Cart>;

  // Abandonment & recovery
  async findAbandoned(thresholdMinutes: number = 1000): Promise<Cart[]>;
  async createRecoveryToken(cartId: string, expiresInDays: number = 7): Promise<RecoveryToken>;
  async validateRecoveryToken(tokenPlain: string): Promise<boolean>;
  async recoverCart(cartId: string, tokenPlain: string): Promise<Cart>;
  async markCartRecovered(cartId: string): Promise<void>;
  async cleanupExpiredCarts(olderThanDays: number = 30): Promise<number>;
}
```

**State Management**:

- **Mutable**: `carts` table (status, lastActivityAt, items)
- **Immutable**: `cartRecoveryTokens` table (once used, done forever)
- **Soft Delete**: `carts.deletedAt` for GDPR compliance

**Failure Modes**:
| Failure | Impact | Mitigation |
|---------|--------|-----------|
| Token hash mismatch | Token validation fails | Retry with new token (7-day window) |
| Database lock timeout | Cart cannot be updated | Return 503, client retries with backoff |
| Email send failure | Recovery email never sent | Queue for retry with exponential backoff |
| Abandoned detection miss | Cart not flagged as abandoned | Polling fallback catches it within 15 min |

---

## 2. Data Flow Diagrams

### Happy Path: Add Item to Cart

```
User → POST /api/carts/me/items { productId, quantity }
  ↓
CartController.addItem()
  ├─ Validate: productId exists, quantity > 0
  ├─ CartService.getCart(userId) → Fetch or create
  ├─ Insert into cartItems
  ├─ UPDATE carts SET last_activity_at = NOW(), item_count = COUNT(*)
  └─ Response 201
      {
        "id": "cart-uuid",
        "items": [...],
        "totalAmount": 159.98,
        "lastActivityAt": "2026-04-04T10:30:00Z"
      }

Timeline: <100ms (indexed on userId, lastActivityAt)
```

### Happy Path: Detect Abandoned Cart (Hybrid Trigger)

#### Event-Based Detection

```
1. User closes browser at 10:00 AM
   ├─ lastActivityAt = 10:00 AM (frozen)
   ├─ Cart status = 'active' (remains)
   └─ No explicit "abandon" event

2. SchedulerService.abandonedCartJob() runs every 10–15 min
   ├─ Query: SELECT * FROM carts WHERE status = 'active'
   │          AND last_activity_at < NOW() - 1000 min
   ├─ Found: 1 cart (lastActivityAt = 10:00 AM, now = 4:50 PM ✓)
   ├─ Emit: CartAbandoned event
   └─ Check: Already emitted today? (prevent duplicates)

3. On CartAbandoned event
   ├─ Update: carts.status = 'abandoned', carts.abandoned_at = NOW()
   ├─ CartRecoveryService.sendRecoveryEmail(cartId)
   │   ├─ Generate token (UUID + bcrypt hash)
   │   ├─ INSERT into cartRecoveryTokens
   │   ├─ Compose email (Brevo template)
   │   └─ Queue email for dispatch
   └─ Mark: Email sent timestamp
```

### Error Path: Token Replay Prevention

```
User A clicks recovery link at Day 1
  ├─ GET /api/carts/recover/token-uuid
  ├─ Backend: Fetch token, bcrypt compare hash
  ├─ Validate: used_at IS NULL ✓
  ├─ Increment: click_count, last_clicked_at
  ├─ Response 200 (cart data sent)
  └─ User completes checkout

User B somehow obtains same token (leaked email? intercepted?)
  ├─ GET /api/carts/recover/token-uuid (same token)
  ├─ Backend: bcrypt compare succeeds (hash matches)
  ├─ Validate: used_at IS NOT NULL ✗ (already used)
  ├─ Response 410 Gone
  │   { "error": "Token already used", "code": "TOKEN_USED" }
  └─ User sees: "Link expired or already used"
```

### Cleanup Flow: Soft + Hard Delete

```
Cron Job: Runs weekly
  ├─ Soft Delete (30 days)
  │   ├─ SELECT * FROM carts WHERE abandoned_at < NOW() - 30 days
  │   ├─ UPDATE carts SET status = 'expired', deleted_at = NOW()
  │   └─ Keep rows but hide from queries
  ├─ Hard Delete (7 days after soft delete)
  │   ├─ SELECT * FROM carts WHERE deleted_at < NOW() - 7 days
  │   ├─ DELETE from cartItems (cascade)
  │   ├─ DELETE from cartRecoveryTokens (cascade)
  │   ├─ DELETE from carts
  │   └─ Audit: Log hard delete for compliance
  └─ GDPR: 30 + 7 = 37-day retention minimum
```

---

## 3. State Machines

### Cart Lifecycle

```
        ┌──────────┐
        │ CREATED  │ (Just initialized)
        └────┬─────┘
             │
             ↓
        ┌──────────┐
        │ ACTIVE   │ (Items being added)
        │          │
        │ ↓ (user adds/removes items)
        │ lastActivityAt updated
        └────┬─────┘
             │
      ┌──────┴──────┐
      ↓             ↓
┌──────────┐   ┌──────────┐
│ABANDONED │   │CHECKED   │
│(>1000min │   │_OUT      │
│ inactive)│   │(purchase │
│          │   │ complete)│
└─┬────────┘   └──────────┘
  │
  └──→ RECOVERED (user clicked recovery link)
       └──→ CHECKED_OUT (completed purchase from recovered cart)

  OR

  └──→ EXPIRED (30 days passed)
       └──→ DELETED (7 more days → hard delete)
```

**Transitions**:

- `CREATED` → `ACTIVE` (immediate, on first item add)
- `ACTIVE` → `ABANDONED` (when lastActivityAt > 1000 min)
- `ABANDONED` → `RECOVERED` (when recovery link clicked)
- `ACTIVE` → `CHECKED_OUT` (when user completes purchase)
- `ABANDONED` → `EXPIRED` (after 30 days inactivity)
- `EXPIRED` → `DELETED` (after hard delete window)

**Properties**:

- Immutable once checked out (NO recovery after purchase)
- Recovery tokens one-time use only
- Audit trail: Every state change logged with timestamp

---

## 4. Database Schema & Indexing

### Tables

```sql
-- Main cart table
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'abandoned', 'recovered', 'checked_out', 'expired')),

  -- Lifecycle tracking
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  abandoned_at TIMESTAMP NULL,
  recovered_at TIMESTAMP NULL,
  checked_out_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL, -- GDPR soft delete

  -- Summary (denormalized for perf)
  item_count INT DEFAULT 0,
  total_amount NUMERIC(10, 2) DEFAULT 0,

  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_carts_user_active ON carts(user_id, status)
  WHERE status IN ('active', 'abandoned');
CREATE INDEX idx_carts_last_activity ON carts(last_activity_at)
  WHERE status = 'active';
CREATE INDEX idx_carts_abandoned ON carts(abandoned_at)
  WHERE status = 'abandoned';

-- Cart items
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price > 0),
  subtotal NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

-- Recovery tokens (one-time use)
CREATE TABLE cart_recovery_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),

  -- Token stored hashed
  token_hash VARCHAR(255) NOT NULL UNIQUE, -- bcrypt($2b$12$...)

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL, -- 7 days
  used_at TIMESTAMP NULL,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'used', 'expired')),

  click_count INT DEFAULT 0,
  last_clicked_at TIMESTAMP NULL,

  email_sent_at TIMESTAMP NULL,

  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_recovery_tokens_cart ON cart_recovery_tokens(cart_id);
CREATE INDEX idx_recovery_tokens_user ON cart_recovery_tokens(user_id);
CREATE INDEX idx_recovery_tokens_expires ON cart_recovery_tokens(expires_at)
  WHERE status = 'pending';
```

---

## 5. API Layer & Middleware

### CartController Routes

```typescript
// GET /api/carts/me
router.get(
  '/me',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const cart = await cartService.getCart(req.user.id);
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    res.json(cart);
  })
);

// POST /api/carts/me/items
router.post(
  '/me/items',
  authMiddleware,
  validateRequest({
    body: z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const cart = await cartService.addItem(req.user.id, req.body.productId, req.body.quantity);
    res.status(201).json(cart);
  })
);

// GET /api/carts/recover/:token
router.get(
  '/recover/:token',
  asyncHandler(async (req, res) => {
    const cart = await cartService.getCartByRecoveryToken(req.params.token);
    if (!cart) return res.status(410).json({ error: 'Token expired or invalid' });
    res.json(cart);
  })
);

// POST /api/carts/recover/:token (mark as used)
router.post(
  '/recover/:token',
  asyncHandler(async (req, res) => {
    const cart = await cartService.recoverCart(req.params.token);
    res.json({ success: true, cart });
  })
);
```

### Middleware Stack

```
authMiddleware
  ↓ (verify JWT)
validateRequest
  ↓ (Zod validation)
asyncHandler
  ↓ (catch errors, 500)
errorHandler
  ↓ (format response)
```

---

## 6. Email Integration Flow

### Recovery Email Trigger

```typescript
// In SchedulerService
async abandonedCartJob() {
  const abandoned = await cartService.findAbandoned(1000); // minutes

  for (const cart of abandoned) {
    // Generate token
    const token = await cartService.createRecoveryToken(cart.id, 7);

    // Compose email
    const email = {
      to: cart.user.email,
      subject: `Hi ${cart.user.firstName}, your cart is waiting!`,
      template: 'cart-recovery',
      variables: {
        firstName: cart.user.firstName,
        itemCount: cart.items.length,
        totalAmount: cart.totalAmount.toFixed(2),
        recoveryLink: `https://app.com/recover-cart?token=${token.tokenPlain}`,
        expiresAt: token.expiresAt.toISOString()
      }
    };

    // Queue for dispatch
    await emailQueueService.queue(email);

    // Mark cart as abandoned
    await cartService.markAbandoned(cart.id);
  }
}
```

---

## 7. Frontend State Management (Zustand)

### Cart Store

```typescript
interface CartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface CartState {
  // State
  items: CartItem[];
  totalAmount: number;
  lastActivityAt: Date;
  isLoading: boolean;
  error: Error | null;

  // Actions
  addItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, newQuantity: number) => Promise<void>;
  clearCart: () => Promise<void>;

  // Recovery
  recoverCart: (token: string) => Promise<void>;

  // Persistence
  syncToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalAmount: 0,
  lastActivityAt: new Date(),
  isLoading: false,
  error: null,

  addItem: async (productId, quantity) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/carts/me/items', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
      });
      const cart = await response.json();
      set({
        items: cart.items,
        totalAmount: cart.totalAmount,
        lastActivityAt: new Date(cart.lastActivityAt),
      });
      get().syncToLocalStorage(); // Persist every 30s (debounced)
    } catch (error) {
      set({ error: error as Error });
    } finally {
      set({ isLoading: false });
    }
  },

  recoverCart: async (token) => {
    const response = await fetch(`/api/carts/recover/${token}`);
    const cart = await response.json();
    set({
      items: cart.items,
      totalAmount: cart.totalAmount,
      lastActivityAt: new Date(cart.lastActivityAt),
    });
    get().syncToLocalStorage();
  },

  syncToLocalStorage: debounce(() => {
    const state = get();
    localStorage.setItem(`mlm_cart_${userId}`, JSON.stringify(state));
  }, 30000), // 30 seconds

  loadFromLocalStorage: () => {
    const stored = localStorage.getItem(`mlm_cart_${userId}`);
    if (stored) {
      const cart = JSON.parse(stored);
      set(cart);
    }
  },
}));
```

---

## 8. Testing Strategy

### Unit Tests (CartService)

```typescript
describe('CartService', () => {
  describe('findAbandoned', () => {
    it('should find carts inactive > threshold', async () => {
      // Freeze time
      jest.useFakeTimers();

      // Create cart
      const cart = await cartService.getCart(userId);
      expect(cart.lastActivityAt).toBe(now());

      // Advance time 1001 minutes
      jest.advanceTimersByTime(1001 * 60 * 1000);

      // Find abandoned
      const abandoned = await cartService.findAbandoned(1000);
      expect(abandoned).toContainEqual(expect.objectContaining({ id: cart.id }));
    });
  });

  describe('createRecoveryToken', () => {
    it('should create bcrypt-hashed token', async () => {
      const token = await cartService.createRecoveryToken(cartId);

      expect(token.tokenHash).toMatch(/^\$2[aby]\$/); // bcrypt format
      expect(token.expiresAt).toBeGreaterThan(now());
      expect(token.status).toBe('pending');
    });
  });

  describe('recoverCart (one-time use)', () => {
    it('should prevent token replay', async () => {
      const token = await cartService.createRecoveryToken(cartId);

      // First use: success
      const recovered1 = await cartService.recoverCart(cartId, token.tokenPlain);
      expect(recovered1.status).toBe('recovered');

      // Second use with same token: fail
      await expect(cartService.recoverCart(cartId, token.tokenPlain)).rejects.toThrow(
        'Token already used'
      );
    });
  });
});
```

### Integration Tests (Full Flow)

```typescript
describe('Abandoned Cart Recovery (Integration)', () => {
  it('should detect, email, and recover cart', async () => {
    // 1. Create cart with items
    const cart = await cartService.getCart(userId);
    await cartService.addItem(userId, productId, 2);

    // 2. Simulate abandonment (freeze time)
    jest.useFakeTimers();
    jest.advanceTimersByTime(1001 * 60 * 1000);

    // 3. Run scheduler
    await schedulerService.abandonedCartJob();

    // 4. Verify email queued
    const email = await emailQueue.findOne({ cartId: cart.id });
    expect(email).toBeDefined();
    expect(email.status).toBe('pending');

    // 5. Process email
    await emailService.send(email);

    // 6. Extract token from email
    const tokenMatch = email.htmlContent.match(/token=([^&"]+)/);
    const token = tokenMatch[1];

    // 7. User clicks recovery link
    const recovered = await cartService.recoverCart(cartId, token);
    expect(recovered.status).toBe('recovered');
    expect(recovered.recoveredAt).toBeDefined();
  });
});
```

### E2E Tests (Playwright)

```typescript
describe('Cart Recovery E2E', () => {
  it('should recover cart from email link', async () => {
    // 1. Add items to cart
    await page.goto('/products');
    await page.click('[data-testid=add-to-cart]');

    // 2. Verify cart has items
    await page.goto('/checkout');
    await expect(page).toHaveText('2 items');

    // 3. Close browser (simulate abandonment)
    await page.close();

    // 4. Wait & get recovery email (mock)
    await new Promise((r) => setTimeout(r, 61 * 60 * 1000));
    const email = await getLastEmail(customer.email);
    const recoveryLink = extractLink(email.body);

    // 5. Click recovery link
    const newPage = await browser.newPage();
    await newPage.goto(recoveryLink);

    // 6. Verify cart restored
    await expect(newPage).toHaveText('2 items');
    await expect(newPage).toHaveText('$159.98');

    // 7. Complete checkout
    await newPage.click('[data-testid=proceed-checkout]');
    await newPage.click('[data-testid=confirm-purchase]');

    // 8. Verify success
    await expect(newPage).toHaveURL(/order-confirmation/);
  });
});
```

---

## 9. Concurrency & Performance Optimization

### Optimistic Locking Strategy

```sql
-- lastActivityAt acts as version control
-- If concurrent updates happen:

User A (12:00:00): lastActivityAt = 12:00:00
User B (12:00:00): lastActivityAt = 12:00:00

Both try to update at same time:
- Database handles via transaction isolation
- Last writer wins (UPDATE uses WHERE clause)
- Frontend: No conflict detection needed (eventual consistency OK for carts)
```

### Indexes for Performance

```sql
-- Critical paths (P99 < 100ms):
CREATE INDEX idx_carts_user_active ON carts(user_id, status) WHERE status IN ('active', 'abandoned');
-- ↑ Fast lookup for "get current cart"

CREATE INDEX idx_carts_last_activity ON carts(last_activity_at) WHERE status = 'active';
-- ↑ Fast detection of abandoned carts

CREATE INDEX idx_recovery_tokens_expires ON cart_recovery_tokens(expires_at) WHERE status = 'pending';
-- ↑ Cleanup of expired tokens
```

---

## 10. Deployment & Monitoring

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
  - Abandoned carts detected (per day, per week)
  - Recovery email open rate (target: >15%)
  - Recovery link CTR (target: >3%)
  - Cart recovery rate (target: >5% of abandoned)
  - Token replay attempts (target: 0)
  - Email delivery success rate (target: >98%)

Alerts:
  - Abandoned cart detection drops to 0 (scheduler down?)
  - Recovery email open rate < 10% (subject line bad?)
  - Token replay attempts detected (security issue)
  - Email delivery failures > 2%
```

### Deployment Checklist

- [ ] Database migrations applied (carts, cartItems, cartRecoveryTokens)
- [ ] Indexes created on userId, lastActivityAt, expiresAt
- [ ] CartService implemented & tested
- [ ] SchedulerService extended with abandonedCartJob()
- [ ] Email integration (Brevo) configured
- [ ] Frontend Zustand store + localStorage persistence
- [ ] Soft/hard delete cleanup job scheduled
- [ ] Monitoring configured (Datadog, Sentry)
- [ ] Documentation deployed

---

**Document Version**: 1.0  
**Last Updated**: 2026-04-04  
**Status**: Draft for Implementation  
**Next Review**: Post-v1.0 release
