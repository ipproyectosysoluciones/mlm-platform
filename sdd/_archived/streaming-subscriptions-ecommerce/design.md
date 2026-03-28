# Design: Streaming Subscriptions E-Commerce

## Technical Approach

This change extends the MLM platform to support selling streaming platform subscriptions (Netflix, Disney+, Spotify, etc.) as products. The approach reuses existing `Purchase` and `CommissionService` systems by extending them with optional product linkage, while adding new `Product` and `Order` models to manage the e-commerce flow.

The key innovation is **minimal intrusion** on existing systems:

- `Purchase` model gains an optional `productId` foreign key
- `Order` model wraps purchase + product into a single transaction
- `CommissionService.calculateCommissions()` remains unchanged, called from new `OrderService`
- Frontend adds product catalog and checkout pages without breaking existing features

The high-level flow:

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                    │
│  User navigates to /products ──► Views ProductCatalogPage           │
│  User clicks "Buy" ──► OrderConfirmed ──► POST /orders              │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ Transaction: Order + Purchase + Commissions
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            BACKEND                                    │
│  OrderController.postOrder()                                        │
│  │                                                                    │
│  ├─ ValidationError check ──► 400 Bad Request                       │
│  ├─ Authentication check ──► 401 Unauthorized                       │
│  ├─ ProductService.findById(productId) ──► Product                  │
│  ├─ Transaction begin                                                 │
│  │    ├─ OrderService.createOrder() ──► Order                       │
│  │    ├─ PurchaseService.createPurchase() ──► Purchase              │
│  │    ├─ Purchase.update({ productId })                             │
│  │    └─ CommissionService.calculateCommissions(purchaseId)        │
│  │         └─ Loop upline: create Commission records               │
│  │                                                                    │
│  └─ Transaction commit ──► 201 Created                             │
│         └─ Return Order with embedded Product                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Architecture Decisions

### Decision: Single Transaction for Order + Purchase + Commissions

**Choice**: Wrap Order creation, Purchase creation, and commission calculation in a single database transaction using Sequelize's `sequelize.transaction()`.

**Alternatives considered**:

1. Separate transactions for each operation - Risk of partial failures (Order created but Purchase failed)
2. Event-driven approach - Overkill for MVP, adds complexity
3. Manual commit - More error-prone, harder to rollback

**Rationale**: The MVP scope requires reliability and simplicity. A single transaction ensures atomicity - if commission calculation fails, the entire order is rolled back. This is critical for financial operations. The transaction is short (3-4 sequential DB writes) so lock contention won't be an issue at MVP scale.

### Decision: Reuse CommissionService Without Modifications

**Choice**: Keep `CommissionService.calculateCommissions()` unchanged and call it from `OrderService` with the `purchaseId` of the newly created purchase.

**Alternatives considered**:

1. Add `productId` parameter to `calculateCommissions` - Would require updating all callers, risk of breaking existing manual purchases
2. Create `OrderCommissionService` - Duplication of logic, violates DRY
3. Modify existing service in-place - Could break CRM purchases created manually

**Rationale**: The existing `CommissionService` works correctly. By creating a new purchase via `OrderService` and passing its `purchaseId` to the existing method, we:

- Avoid touching critical production code
- Leverage well-tested commission distribution logic
- Keep the service generic (calculate commissions for ANY purchase, regardless of origin)
- Ensure backward compatibility for manual purchases via `/commissions` endpoint

### Decision: Hardcoded Products for MVP (No Admin UI)

**Choice**: Seed products via database migration, serve via read-only API endpoints. No admin CRUD interface for products.

**Alternatives considered**:

1. Full admin CRUD with WYSIWYG editor - Scope creep, adds weeks to timeline
2. Product management in database only - Too technical for non-devs
3. Headless CMS integration - Significant complexity

**Rationale**: The MVP goal is to validate the MLM model with digital products, not build a full product management system. Hardcoded products (defined in migration) are sufficient for:

- Testing purchase flow end-to-end
- Verifying commission distribution
- Validating frontend UI/UX
- Demonstrating proof of concept

The Product model is designed for easy extension: adding new fields, platforms, or images won't break existing code.

### Decision: Separate Order and Purchase Models

**Choice**: Create a new `Order` model that references `Product` and `Purchase`, rather than extending `Purchase` with product fields.

**Alternatives considered**:

1. Extend `Purchase` model with product fields - Would require migration, affects all purchase types
2. Single unified model - Loss of clarity, "purchase" has broader meaning than e-commerce
3. Order-only without Purchase link - Cannot reuse commission distribution logic

**Rationale**: The separation maintains domain clarity:

- `Purchase`: Financial transaction, commission record, billing
- `Order`: E-commerce abstraction, product selection, checkout flow

This allows:

- Future addition of non-product purchases (manual commissions, top-ups)
- Easier testing (test Order logic without affecting Purchase logic)
- Clearer api boundaries (product endpoints vs purchase endpoints)

### Decision: Optional productId on Purchase Model

**Choice**: Add `productId` as optional foreign key to `purchases` table, with migration that adds the column without dropping existing data.

**Alternatives considered**:

1. Keep separate Order model only - Cannot link commissions to products for reporting
2. Make productId required - Breaks existing manual purchases
3. Store as JSON - Loses referential integrity, harder to query

**Rationale**: Optional linkage enables:

- Reports: "Which products generate most commissions?"
- Analytics: Product-level conversion metrics
- Backward compatibility: Existing `Purchase` records remain valid

## Data Flow

### Order Creation Flow

```
User Request                                     Database
     │                                                 │
     │ POST /api/orders { productId, paymentMethod }   │
     ├────────────────────────────────────────────────►│
     │                                                 │
     │ 1. Validate JWT (auth middleware)               │
     │ 2. Validate Zod schema                          │
     │ 3. ProductService.findById(productId)         │──► SELECT * FROM products WHERE id = ?
     │                                                 │
     │ 4. startTransaction()                           │
     │                                                 │
     │ 5. Order.create({                               │──► INSERT INTO orders ...
     │       userId,                                   │
     │       productId,                                │
     │       totalAmount,                             │
     │       status: 'pending'                        │
     │   })                                            │
     │                                                 │
     │ 6. Purchase.create({                           │──► INSERT INTO purchases ...
     │       userId,                                   │
     │       amount: totalAmount,                      │
     │       description: `Subscription: ${productName}`, │
     │       status: 'pending'                        │
     │   })                                            │
     │                                                 │
     │ 7. Purchase.update({                           │──► UPDATE purchases ...
     │       productId                                 │
     │   })                                            │
     │                                                 │
     │ 8. CommissionService.calculateCommissions()   │─┬─► SELECT * FROM user_closure ...
     │    ├─ Get upline with depth                    │ │
     │    ├─ For each ancestor:                       │ │
     │    │   ├─ Calculate rate                       │ │
     │    │   └─ Commission.create()                  │ ├─ INSERT INTO commissions
     │    └─ End loop                                 │ │
     │                                                 │ │
     │ 9. Order.update({ status: 'completed' })      │──► UPDATE orders ...
     │                                                 │
     │ 10. commitTransaction()                       │─┴─► COMMIT
     │                                                 │
     │ Return: { success, data: Order }               │◄───│
     │                                                 │
```

### Commission Distribution Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       CommissionService.calculateCommissions()             │
│                                                                            │
│  Given: purchaseId = 'abc123'                                             │
│                                                                            │
│  Step 1: Fetch purchase and buyer                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ SELECT * FROM purchases WHERE id = 'abc123'                        │ │
│  │ => { userId: 'userA', amount: 15.99, currency: 'USD' }             │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  Step 2: Get buyer's upline with depth                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ SELECT u.*, uc.depth                                                 │ │
│  │ FROM user_closure uc                                                   │ │
│  │ JOIN users u ON uc.ancestor_id = u.id                                  │ │
│  │ WHERE uc.descendant_id = 'userA'                                       │ │
│  │   AND uc.depth > 0                                                    │ │
│  │ ORDER BY uc.depth ASC                                                  │ │
│  │                                                                        │ │
│  │ => [                                                                   │ │
│  │     { id: 'sponsorB', depth: 1 },  // direct sponsor                  │ │
│  │     { id: 'level1C', depth: 2 },                                     │ │
│  │     { id: 'level2D', depth: 3 },                                     │ │
│  │     { id: 'level3E', depth: 4 },                                     │ │
│  │     { id: 'level4F', depth: 5 }                                      │ │
│  │   ]                                                                   │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  Step 3: Calculate and create commissions                                │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  // For sponsor (depth 1)                                                │ │
│  Commission.create({                                                     │ │
│    userId: 'sponsorB',                                                   │ │
│    fromUserId: 'userA',                                                  │ │
│    purchaseId: 'abc123',                                                 │ │
│    type: 'direct',                                                       │ │
│    amount: 15.99 * 0.10 = 1.60,                                          │ │
│    currency: 'USD',                                                      │ │
│    status: 'pending'                                                     │ │
│  })                                                                      │ │
│                                                                            │ │
│  // For level 1 (depth 2)                                                │ │
│  Commission.create({                                                     │ │
│    userId: 'level1C',                                                    │ │
│    fromUserId: 'userA',                                                  │ │
│    purchaseId: 'abc123',                                                 │ │
│    type: 'level_1',                                                      │ │
│    amount: 15.99 * 0.05 = 0.80,                                          │ │
│    currency: 'USD',                                                      │ │
│    status: 'pending'                                                     │ │
│  })                                                                      │ │
│                                                                            │ │
│  // For level 2 (depth 3)                                                │ │
│  Commission.create({                                                     │ │
│    userId: 'level2D',                                                    │ │
│    fromUserId: 'userA',                                                  │ │
│    purchaseId: 'abc123',                                                 │ │
│    type: 'level_2',                                                      │ │
│    amount: 15.99 * 0.03 = 0.48,                                          │ │
│    currency: 'USD',                                                      │ │
│    status: 'pending'                                                     │ │
│  })                                                                      │ │
│                                                                            │ │
│  // For level 3 (depth 4)                                                │ │
│  Commission.create({                                                     │ │
│    userId: 'level3E',                                                    │ │
│    fromUserId: 'userA',                                                  │ │
│    purchaseId: 'abc123',                                                 │ │
│    type: 'level_3',                                                      │ │
│    amount: 15.99 * 0.02 = 0.32,                                          │ │
│    currency: 'USD',                                                      │ │
│    status: 'pending'                                                     │ │
│  })                                                                      │ │
│                                                                            │ │
│  // For level 4 (depth 5) -depth > 4, skip                              │ │
│                                                                            │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### Product Catalog Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ProductService.getProductList()                  │
│                                                                      │
│  Query: { platform, page, limit }                                   │
│  Default: { page: 1, limit: 20 }                                    │
│                                                                      │
│  Building filter:                                                   │
│  WHERE isActive = true                                               │
│    AND platform = ?  [if platform provided]                         │
│                                                                      │
│  Pagination:                                                        │
│  LIMIT ? OFFSET ?                                                    │
│    limit = 20                                                        │
│    offset = (page - 1) * 20                                         │
│                                                                      │
│  Result set:                                                        │
│  [{                                                                 │
│    id, name, platform, price, description,                         │
│    durationDays, imageUrl, isActive, createdAt, updatedAt         │
│  }]                                                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ API response
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ProductController_GET /products                  │
│                                                                      │
│  Response:                                                          │
│  {                                                                   │
│    success: true,                                                   │
│    data: [...products],                                             │
│    pagination: {                                                    │
│      total: 8,                                                      │
│      page: 1,                                                       │
│      limit: 20,                                                     │
│      totalPages: 1                                                  │
│    }                                                                │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

## File Changes

| File                                           | Action | Description                                            |
| ---------------------------------------------- | ------ | ------------------------------------------------------ |
| `backend/src/models/Product.ts`                | Create | Product model with streaming platform support          |
| `backend/src/models/Order.ts`                  | Create | Order model linking product, user, and purchase        |
| `backend/src/models/Purchase.ts`               | Modify | Add optional `productId` foreign key                   |
| `backend/src/services/ProductService.ts`       | Create | CRUD operations for products                           |
| `backend/src/services/OrderService.ts`         | Create | Order creation with transaction handling               |
| `backend/src/controllers/ProductController.ts` | Create | Product API endpoints                                  |
| `backend/src/controllers/OrderController.ts`   | Create | Order API endpoints                                    |
| `backend/src/routes/product.routes.ts`         | Create | Product route definitions                              |
| `backend/src/routes/order.routes.ts`           | Create | Order route definitions                                |
| `backend/src/routes/index.ts`                  | Modify | Register product and order routes                      |
| `backend/src/types/index.ts`                   | Modify | Add Product and Order type interfaces                  |
| `backend/database/migrations/`                 | Create | Migration files for products, orders, purchase updates |
| `backend/database/seeders/`                    | Create | Initial streaming products seed data                   |
| `frontend/src/pages/ProductCatalog.tsx`        | Create | Product listing page with filters                      |
| `frontend/src/pages/Checkout.tsx`              | Create | Checkout confirmation page                             |
| `frontend/src/pages/OrderSuccess.tsx`          | Create | Purchase success page                                  |
| `frontend/src/components/ProductCard.tsx`      | Create | Product display component                              |
| `frontend/src/components/ProductModal.tsx`     | Create | Product details modal                                  |
| `frontend/src/components/CheckoutForm.tsx`     | Create | Payment form component                                 |
| `frontend/src/components/OrderSummary.tsx`     | Create | Order summary display                                  |
| `frontend/src/services/api.ts`                 | Modify | Add `productService`, `orderService` modules           |
| `frontend/src/types/index.ts`                  | Modify | Add Product, Order TypeScript interfaces               |
| `frontend/src/i18n/locales/en.json`            | Modify | Add i18n keys for e-commerce                           |
| `frontend/src/i18n/locales/es.json`            | Modify | Add i18n keys for e-commerce                           |

## Interfaces / Contracts

### Product Interface

```typescript
// backend/src/types/index.ts

export interface ProductAttributes {
  id: string;
  name: string;
  platform:
    | 'netflix'
    | 'disney_plus'
    | 'spotify'
    | 'hbo_max'
    | 'amazon_prime'
    | 'youtube_premium'
    | 'apple_tv'
    | 'other';
  description: string | null;
  price: number; // DECIMAL(10,2)
  currency: string;
  durationDays: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductCreationAttributes {
  name: string;
  platform: ProductAttributes['platform'];
  description?: string | null;
  price: number;
  currency?: string;
  durationDays: number;
  imageUrl?: string | null;
  isActive?: boolean;
}

// frontend/src/types/index.ts

export interface Product {
  id: string;
  name: string;
  platform:
    | 'netflix'
    | 'disney_plus'
    | 'spotify'
    | 'hbo_max'
    | 'amazon_prime'
    | 'youtube_premium'
    | 'apple_tv'
    | 'other';
  description: string | null;
  price: number;
  currency: string;
  durationDays: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

### Order Interface

```typescript
// backend/src/types/index.ts

export interface OrderAttributes {
  id: string;
  orderNumber: string;
  userId: string;
  productId: string;
  purchaseId: string;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: 'manual' | 'simulated';
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderCreationAttributes {
  userId: string;
  productId: string;
  totalAmount: number;
  currency?: string;
  paymentMethod?: 'manual' | 'simulated';
  notes?: string | null;
}

// frontend/src/types/index.ts

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  productId: string;
  purchaseId: string;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: 'manual' | 'simulated';
  notes: string | null;
  product?: Product; // Embedded in response
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

### API Response Contracts

```typescript
// backend/src/types/index.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

### Zod Validation Schemas

```typescript
// backend/src/services/OrderService.ts

import { z } from 'zod';

export const CreateOrderSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  paymentMethod: z.enum(['manual', 'simulated']).optional().default('simulated'),
  notes: z.string().optional(),
});

export type CreateOrderInput = z.input typeof CreateOrderSchema;
export type CreateOrderOutput = z.output typeof CreateOrderSchema;
```

## Testing Strategy

### Unit Tests

| Module            | Coverage                             | Mock Dependencies                                        | Approach                                   |
| ----------------- | ------------------------------------ | -------------------------------------------------------- | ------------------------------------------ |
| ProductService    | Find all, find by ID, validation     | None                                                     | Direct function calls                      |
| OrderService      | Order creation, transaction handling | CommissionService, ProductRepository, PurchaseRepository | Mock services, verify transaction rollback |
| CommissionService | Already has comprehensive tests      | None                                                     | Reuse existing tests                       |

**Service Tests (Jest + sequelize-test-helpers):**

```typescript
// backend/src/services/__tests__/OrderService.test.ts

describe('OrderService.createOrder', () => {
  it('should create order with transaction rollback on commission failure', async () => {
    const validInput: CreateOrderInput = {
      productId: validProductId,
      paymentMethod: 'simulated',
    };

    // Mock commission service to throw error
    jest
      .spyOn(commissionService, 'calculateCommissions')
      .mockRejectedValueOnce(new Error('Commission calculation failed'));

    await expect(OrderService.createOrder(validInput, userId)).rejects.toThrow();

    // Verify no order was created (transaction rolled back)
    const orderCount = await Order.count();
    expect(orderCount).toBe(0);

    // Verify no purchase was created
    const purchaseCount = await Purchase.count();
    expect(purchaseCount).toBe(0);
  });

  it('should create order and commission records on success', async () => {
    const validInput: CreateOrderInput = {
      productId: validProductId,
      paymentMethod: 'simulated',
    };

    const result = await OrderService.createOrder(validInput, userId);

    expect(result.status).toBe('completed');
    expect(result.orderNumber).toMatch(/^ORD-\d{8}-\d{3}$/);

    // Verify associated records
    const order = await Order.findByPk(result.id);
    expect(order).toBeDefined();

    const purchase = await Purchase.findByPk(order.purchaseId);
    expect(purchase).toBeDefined();
    expect(purchase.productId).toBe(order.productId);

    // Verify commission was created
    const commissions = await Commission.findAll({ where: { purchaseId: purchase.id } });
    expect(commissions.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests

| Endpoint              | Tests                                                                | Auth Required | Approach             |
| --------------------- | -------------------------------------------------------------------- | ------------- | -------------------- |
| GET /api/products     | 200 OK list, 404 not found                                           | Optional      | Test server, real DB |
| GET /api/products/:id | 200 OK single, 404, 400 invalid UUID                                 | Optional      | Test server, real DB |
| POST /api/orders      | 201 Created, 400 validation, 401 unauthorized, 404 product not found | Required      | Test server, real DB |
| GET /api/orders       | 200 OK list user orders, 401 unauthorized                            | Required      | Test server, real DB |
| GET /api/orders/:id   | 200 OK, 403 forbidden, 404                                           | Required      | Test server, real DB |

**API Tests (Jest + supertest):**

```typescript
// backend/src/api/__tests__/orders.test.ts

describe('POST /api/orders', () => {
  describe('Authenticated user', () => {
    it('should create order successfully', async () => {
      const user = await createUser();
      const product = await createProduct();

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${user.token}`)
        .send({
          productId: product.id,
          paymentMethod: 'simulated',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orderNumber).toBeDefined();
      expect(response.body.data.status).toBe('completed');
    });

    it('should reject unauthenticated request', async () => {
      const product = await createProduct();

      const response = await request(app).post('/api/orders').send({
        productId: product.id,
      });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
```

### E2E Tests (Playwright)

| Flow            | Scenarios                                       | Approach           |
| --------------- | ----------------------------------------------- | ------------------ |
| Product Catalog | List products, filter by platform, view details | Browser automation |
| Checkout        | Select product, review order, confirm purchase  | Browser automation |
| Order History   | View orders, order details                      | Browser automation |
| Mixed flows     | Checkout with different products                | Browser automation |

**E2E Test (Playwright):**

```typescript
// frontend/src/e2e/ecommerce.spec.ts

test.describe('Streaming Subscriptions E-Commerce', () => {
  test('User can browse products and purchase one', async ({ page }) => {
    // Navigate to product catalog
    await page.goto('/products');

    // Verify products are listed
    const productCards = await page.locator('.product-card').count();
    expect(productCards).toBeGreaterThan(0);

    // Filter by platform (Netflix)
    await page.click('button:has-text("Netflix")');
    await page.waitForSelector('.product-card');

    // Click on first product
    await page.click('.product-card:first-child');
    await page.waitForSelector('.product-modal');

    // Verify modal shows product details
    await expect(page.locator('.product-modal .name')).toContainText('Netflix');

    // Click Buy Now
    await page.click('.product-modal .buy-button');
    await page.waitForURL(/\/checkout\/.*/);

    // Verify checkout page
    await expect(page.locator('.order-summary')).toBeVisible();

    // Confirm purchase
    await page.click('.checkout-form .confirm-button');

    // Should redirect to success page
    await page.waitForURL(/\/orders\/.*\/success/);

    // Verify success message
    await expect(page.locator('.success-message')).toContainText('Purchase Successful!');
  });
});
```

## Migration / Rollout

### Database Migration Strategy

**Migration 001: Create products table**

```javascript
// backend/database/migrations/20260325000001-create-products.js

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      platform: {
        type: Sequelize.ENUM(
          'netflix',
          'disney_plus',
          'spotify',
          'hbo_max',
          'amazon_prime',
          'youtube_premium',
          'apple_tv',
          'other'
        ),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD',
      },
      duration_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      image_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('products', ['platform']);
    await queryInterface.addIndex('products', ['is_active']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('products');
  },
};
```

**Migration 002: Create orders table**

```javascript
// backend/database/migrations/20260325000002-create-orders.js

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      order_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'products', key: 'id' },
      },
      purchase_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'purchases', key: 'id' },
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD',
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed'),
        defaultValue: 'pending',
      },
      payment_method: {
        type: Sequelize.ENUM('manual', 'simulated'),
        defaultValue: 'simulated',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('orders', ['user_id']);
    await queryInterface.addIndex('orders', ['product_id']);
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['order_number']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('orders');
  },
};
```

**Migration 003: Add productId to purchases**

```javascript
// backend/database/migrations/20260325000003-add-product-id-to-purchases.js

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('purchases', 'product_id', {
      type: Sequelize.UUID,
      references: { model: 'products', key: 'id' },
      allowNull: true,
    });

    await queryInterface.addIndex('purchases', ['product_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('purchases', 'product_id');
  },
};
```

### Seed Data

```javascript
// backend/database/seeders/20260325000000-streaming-products.js

const products = [
  {
    name: 'Netflix Basic',
    platform: 'netflix',
    description: '1 screen, HD',
    price: 9.99,
    durationDays: 30,
    imageUrl: '/images/products/netflix_basic.png',
    isActive: true,
  },
  {
    name: 'Netflix Standard',
    platform: 'netflix',
    description: '2 screens, HD',
    price: 12.99,
    durationDays: 30,
    imageUrl: '/images/products/netflix_standard.png',
    isActive: true,
  },
  {
    name: 'Netflix Premium',
    platform: 'netflix',
    description: '4 screens, Ultra HD',
    price: 15.99,
    durationDays: 30,
    imageUrl: '/images/products/netflix_premium.png',
    isActive: true,
  },
  {
    name: 'Disney+',
    platform: 'disney_plus',
    description: 'Disney, Pixar, Marvel, Star Wars',
    price: 7.99,
    durationDays: 30,
    imageUrl: '/images/products/disney_plus.png',
    isActive: true,
  },
  {
    name: 'Spotify Premium',
    platform: 'spotify',
    description: 'Ad-free music streaming',
    price: 9.99,
    durationDays: 30,
    imageUrl: '/images/products/spotify.png',
    isActive: true,
  },
  {
    name: 'HBO Max',
    platform: 'hbo_max',
    description: 'HBO content + Max Originals',
    price: 9.99,
    durationDays: 30,
    imageUrl: '/images/products/hbo_max.png',
    isActive: true,
  },
  {
    name: 'Amazon Prime Video',
    platform: 'amazon_prime',
    description: 'Prime Video + bonus content',
    price: 8.99,
    durationDays: 30,
    imageUrl: '/images/products/amazon_prime.png',
    isActive: true,
  },
  {
    name: 'YouTube Premium',
    platform: 'youtube_premium',
    description: 'Ad-free YouTube, Background play',
    price: 11.99,
    durationDays: 30,
    imageUrl: '/images/products/youtube_premium.png',
    isActive: true,
  },
  {
    name: 'Apple TV+',
    platform: 'apple_tv',
    description: 'Apple Originals',
    price: 6.99,
    durationDays: 30,
    imageUrl: '/images/products/apple_tv.png',
    isActive: true,
  },
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('products', products, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('products', {});
  },
};
```

### Rollout Plan

1. **Pre-deployment (staging)**:
   - Run migrations on staging database
   - Seed products
   - Verify OrderService and CommissionService integration
   - Run API integration tests

2. **Deployment (production)**:
   - Deploy backend changes
   - Run migrations with minimal downtime (alter table add column)
   - Seed products (idempotent - check if products exist first)
   - Deploy frontend changes

3. **Post-deployment verification**:
   - Smoke test product catalog page
   - Test checkout flow
   - Verify commission distribution for test purchase
   - Check database records

4. **Monitoring**:
   - Track order creation success rate
   - Monitor commission calculation errors
   - Alert on failed orders

## Security Considerations

### Authentication & Authorization

| Endpoint              | Authentication    | Authorization              | Notes                       |
| --------------------- | ----------------- | -------------------------- | --------------------------- |
| GET /api/products     | Optional (public) | None                       | Category listing            |
| GET /api/products/:id | Optional (public) | None                       | Product details             |
| POST /api/orders      | Required (JWT)    | User must be authenticated | Only user can create orders |
| GET /api/orders       | Required (JWT)    | User owns orders           | Only current user orders    |
| GET /api/orders/:id   | Required (JWT)    | User owns order            | Only current user order     |

### Input Validation

| Layer            | Validation        | Framework           |
| ---------------- | ----------------- | ------------------- |
| Request body     | Zod schemas       | OrderService schema |
| Route parameters | UUID format       | express-validator   |
| Query parameters | Pagination limits | express-validator   |

**Order Creation Schema:**

```typescript
// backend/src/services/OrderService.ts

const CreateOrderSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  paymentMethod: z.enum(['manual', 'simulated']).optional().default('simulated'),
  notes: z.string().optional().max(500, 'Notes cannot exceed 500 characters'),
});
```

### SQL Injection Prevention

- All queries use Sequelize ORM with parameterized statements
- Raw SQL in CommissionService uses `replacements` object
- No user input in SQL string concatenation

### XSS Prevention

- React renders all content escaped by default
- No `dangerouslySetInnerHTML` usage
- Product details rendered as `<p>`, `<span>` without HTML parsing

### Rate Limiting

Apply rate limiting to order creation:

- 5 orders per minute per user
- Prevents abuse of simulated payments

### CORS Configuration

- Validate `Origin` header against allowed origins
- Reject requests from unlisted domains
- Set `Access-Control-Allow-Origin` only for trusted origins

### Session Management

- JWT tokens expire after configured duration (default: 7 days)
- Backend validates token expiration on each authenticated request
- No server-side session storage needed

## Performance Considerations

### Database Performance

| Operation              | Index Used                                      | Expected Time          |
| ---------------------- | ----------------------------------------------- | ---------------------- |
| Product listing        | `idx_products_platform, idx_products_is_active` | < 50ms                 |
| Order creation         | `idx_orders_user_id, idx_orders_product_id`     | ~ 200ms (3-4 tables)   |
| Commission calculation | `idx_user_closure_descendant_id`                | ~ 100ms (up to 5 rows) |

**Query Optimization Strategy:**

1. Product listing query:

```sql
-- Uses idx_products_platform, idx_products_is_active
SELECT * FROM products
WHERE is_active = true
  AND platform = ?
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

2. Commission calculation query:

```sql
-- Uses idx_user_closure_descendant_id
SELECT u.*, uc.depth
FROM user_closure uc
JOIN users u ON uc.ancestor_id = u.id
WHERE uc.descendant_id = ? AND uc.depth > 0
ORDER BY uc.depth ASC;
```

### Caching Strategy

| Data           | Cache TTL  | Strategy                     |
| -------------- | ---------- | ---------------------------- |
| Product list   | 5 minutes  | Client-side + CDN            |
| Single product | 10 minutes | Client-side + ETags          |
| Commissions    | No cache   | Always fresh, financial data |

**API Response Cache Headers:**

```typescript
// backend/src/controllers/ProductController.ts

// List response (5 min cache)
res.set('Cache-Control', 'public, max-age=300');
res.set('ETag', crypto.createHash('md5').update(JSON.stringify(products)).digest('hex'));

// Single product response (10 min cache)
res.set('Cache-Control', 'public, max-age=600');
res.set('ETag', crypto.createHash('md5').update(JSON.stringify(product)).digest('hex'));
```

### Frontend Performance

| Metric        | Target  | Approach                           |
| ------------- | ------- | ---------------------------------- |
| Page load     | < 3s    | Code splitting, lazy loading       |
| Interactions  | < 200ms | Debounce, optimistic UI            |
| Data fetching | < 1s    | Request caching, parallel requests |

**Dynamic Imports:**

```typescript
// frontend/src/App.tsx

const ProductCatalog = lazy(() => import('./pages/ProductCatalog'));
const Checkout = lazy(() => import('./pages/Checkout'));

// In routes
<Route path="/products" element={
  <Suspense fallback={<Loading />}>
    <ProductCatalog />
  </Suspense>
} />
```

### Transaction Optimization

Order creation updates:

1. `Order.create()` - INSERT
2. `Purchase.create()` - INSERT
3. `Purchase.update({ productId })` - UPDATE (single row)
4. Commission calculation - Multiple INSERTs (variable count)

Total: 1-2ms for Order/Purchase + 100ms for commissions (serialized)

## Database Design

### Tables

#### products

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL CHECK (platform IN (
    'netflix', 'disney_plus', 'spotify', 'hbo_max',
    'amazon_prime', 'youtube_premium', 'apple_tv', 'other'
  )),
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  currency VARCHAR(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'COP', 'MXN')),
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_platform ON products(platform);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_platform_is_active ON products(platform, is_active);
```

#### orders

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount > 0),
  currency VARCHAR(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'COP', 'MXN')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  payment_method VARCHAR(20) DEFAULT 'simulated' CHECK (payment_method IN ('manual', 'simulated')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_user_id_status ON orders(user_id, status);
```

#### Modified: purchases

```sql
-- Migration: Add productId to existing purchases table
ALTER TABLE purchases
ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE SET NULL;

CREATE INDEX idx_purchases_product_id ON purchases(product_id);
```

### Relationships

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Product   │       │   Order     │       │  Purchase   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │──┐    │ id (PK)    │    ┌──│ id (PK)     │
│ name        │  │    │ orderNumber│    │  │ userId (FK) │
│ platform    │  │    │ userId(FK) │────┘  │ amount      │
│ price       │  │    │ productId  │───────│ productId   │ (NEW)
│ durationDays│  │    │ purchaseId │───────│ status      │
└─────────────┘  │    │ totalAmount│       └─────────────┘
                 │    │ status     │
                 │    └─────────────┘
                 │
                 └──────────────────────────────────┐
                                                   │
                                                   ▼
                 ┌─────────────┐       ┌─────────────────────┐
                 │ Commission  │       │    UserClosure      │
                 ├─────────────┤       ├─────────────────────┤
                 │ id (PK)     │       │ ancestorId (FK)     │
                 │ userId (FK) │◄──────│ descendantId (FK)   │
                 │ fromUserId  │       │ depth               │
                 │ purchaseId  │───────┤                     │
                 │ type        │       └─────────────────────┘
                 │ amount      │
                 └─────────────┘
```

### Index Strategy

| Table        | Index                | Purpose                      |
| ------------ | -------------------- | ---------------------------- |
| products     | platform             | Filter by streaming platform |
| products     | is_active            | Filter available products    |
| products     | platform + is_active | Combined filter (catalog)    |
| orders       | user_id              | List user orders             |
| orders       | status               | Filter by order status       |
| orders       | order_number         | Lookup by order number       |
| orders       | user_id + status     | Query by user + status       |
| purchases    | product_id           | Find purchases for product   |
| user_closure | descendant_id        | Find upline for commission   |

### Data Types

| Column     | Type          | Rationale                                    |
| ---------- | ------------- | -------------------------------------------- |
| id         | UUID          | Distributed ID generation, no collision risk |
| price      | DECIMAL(10,2) | Exact decimal for financial data             |
| status     | ENUM          | Type-safe state machine                      |
| platform   | ENUM          | Type-safe platform selection                 |
| updated_at | TIMESTAMP     | Automatic timestamp with trigger             |

## Integration Points with Existing Systems

### Purchase Model (Extension)

**Current:**

```typescript
interface PurchaseAttributes {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  description: string | null;
  status: 'pending' | 'completed' | 'refunded';
  createdAt?: Date;
  updatedAt?: Date;
}
```

**Extended:**

```typescript
interface PurchaseAttributes {
  // ... existing fields ...
  productId: string | null; // NEW: Optional FK to products
  // ... existing fields ...
}
```

**Usage:**

- Existing manual purchases: `productId = null` (valid)
- New e-commerce purchases: `productId = <uuid>` (linked)

### CommissionService (Reusing Logic)

**No Changes Required**

The existing `CommissionService.calculateCommissions()` takes `purchaseId` and:

1. Fetches purchase to get `userId` and `amount`
2. Traverses `UserClosure` for upline
3. Creates `Commission` records

The service doesn't need to know about Products - it only cares about Purchases.

**Flow:**

```
OrderService.createOrder() {
  1. Purchase.create({ userId, amount }) → purchaseId = 'x'
  2. Purchase.update({ productId }) →.links to product
  3. CommissionService.calculateCommissions(purchaseId)
  4. Order.update({ status: 'completed' })
}
```

### User Model (No Changes)

The `User` model requires no modifications:

- Existing `sponsorId`, `referralCode`, `level` fields sufficient
- `UserClosure` table handles tree traversal

### Auth Middleware (Reused)

All order endpoints use `authenticateToken` middleware:

```typescript
// backend/src/middleware/auth.middleware.ts
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    referralCode: string;
  };
}
```

### Commission Model (No Changes)

The `Commission` model already supports `purchaseId`:

```typescript
interface CommissionAttributes {
  // ... existing fields ...
  purchaseId: string | null; // Already exists
  // ... existing fields ...
}
```

### Commission Route (No Changes)

Existing `/commissions` endpoint remains unchanged:

```typescript
// POST /commissions - Manual purchase (no productId)
// POST /orders - E-commerce purchase (with productId)
```

### User Routes (No Changes)

Existing user traversal endpoints continue to work:

```typescript
// GET /users/:id/tree - Tree structure (no changes)
// GET /users/search - Search users (no changes)
```

## Deployment Considerations

### Pre-deployment Checklist

| Task                  | Environment | Status |
| --------------------- | ----------- | ------ |
| Database migrations   | Staging     | [ ] ✓  |
| Seed products         | Staging     | [ ] ✓  |
| API integration tests | Staging     | [ ] ✓  |
| Frontend E2E tests    | Staging     | [ ] ✓  |
| Security audit        | Staging     | [ ] ✓  |
| Performance load test | Staging     | [ ] ✓  |
| Rollback plan tested  | Staging     | [ ] ✓  |

### Deployment Steps

**Production deployment (CI/CD):**

```bash
# 1. Deploy backend
docker-compose -f docker-compose.prod.yml up -d --build backend

# 2. Run migrations (one-time)
docker-compose -f docker-compose.prod.yml run --rm backend sequelize db:migrate

# 3. Seed products (idempotent)
docker-compose -f docker-compose.prod.yml run --rm backend sequelize db:seed:all

# 4. Deploy frontend
docker-compose -f docker-compose.prod.yml up -d --build frontend

# 5. Verify deployment
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Rollback Plan

**If backend deployment fails:**

```bash
# 1. Stop new backend
docker-compose -f docker-compose.prod.yml stop backend

# 2. Restart previous version
docker-compose -f docker-compose.prod.yml up -d backend

# 3. Verify health
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:3000/api/admin/stats
```

**If database migration fails:**

```bash
# 1. Rollback migration
docker-compose -f docker-compose.prod.yml run --rm backend \
  sequelize db:migrate:undo --name create-orders

docker-compose -f docker-compose.prod.yml run --rm backend \
  sequelize db:migrate:undo --name create-products

# 2. Restart backend
docker-compose -f docker-compose.prod.yml restart backend
```

### Monitoring

| Metric                      | Alert Threshold   | Notes                   |
| --------------------------- | ----------------- | ----------------------- |
| Order creation rate         | < 5/min for 5 min | Could indicate outage   |
| Commission calculation time | > 2s              | Performance degradation |
| Failed orders rate          | > 5%              | Logic or data issue     |
| DB connection pool          | > 80%             | Capacity issue          |
| API response time (orders)  | > 1s              | Performance issue       |

### Health Check

```typescript
// backend/src/controllers/AdminController.ts

export async function getHealth(req: AuthenticatedRequest, res: Response): Promise<void> {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    buildVersion: process.env.BUILD_VERSION || 'unknown',
    uptime: process.uptime(),
    database: await getDatabaseHealth(),
    redis: await getRedisHealth(),
  };

  res.json(health);
}

async function getDatabaseHealth() {
  try {
    await sequelize.authenticate();
    return { status: 'ok' };
  } catch {
    return { status: 'error' };
  }
}
```

### Database Backup Strategy

**Pre-deployment (critical):**

```bash
# Backup production database before migration
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" \
  > /backups/mlm_backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

**Schedule:**

- Daily at 02:00 UTC
- Retain for 30 days
- Store in S3 bucket with versioning

## Open Questions

- [ ] **Order cancellation policy**: Should orders be cancelable before status changes to 'completed'? If yes, how should commissions be handled?
- [ ] **Payment gateway integration**: When adding Stripe/PayPal, should orders be 'pending' until payment confirmation, or 'completed' with rollback on failure?
- [ ] **Product image management**: Should images be stored locally, in S3, or CDN? Current design assumes fixed paths but should be configurable.
- [ ] **Currency support**: Current design uses 'USD' and 'order.currency' field. Should we support multi-currencyCheckout or convert everything to user's currency?
- [ ] **Refund process**: How should refunds work? Should they be supported at all in MVP?
- [ ] **Order history retention**: Should old orders be archived or should they remain in the active table forever?
