# Streaming Subscriptions E-Commerce Specification

## Purpose

This specification defines the minimal e-commerce functionality for selling streaming platform subscriptions (Netflix, Disney+, Spotify, etc.) through the MLM platform. The system enables users to purchase subscription products, triggers automatic commission distribution to the MLM upline, and provides a basic product catalog interface.

> Esta especificación define la funcionalidad mínima de e-commerce para vender suscripciones a plataformas de streaming (Netflix, Disney+, Spotify, etc.) a través de la plataforma MLM. El sistema permite a los usuarios comprar productos de suscripción, activa la distribución automática de comisiones al upline del MLM, y provee una interfaz básica de catálogo de productos.

---

## 1. Functional Requirements

### 1.1 Product Management

#### Requirement: Product Catalog Display

The system SHALL display a catalog of streaming subscription products available for purchase.

- **Product List**: The system MUST display all active products with name, platform, price, duration, and image
- **Filtering**: The system MAY support filtering by platform category (video, music, gaming)
- **Sorting**: The system SHOULD support sorting by price (ascending/descending) and name

#### Requirement: Product Data Integrity

The system SHALL maintain accurate product data for all streaming subscriptions.

- **Unique Identification**: Each product MUST have a unique UUID identifier
- **Platform Association**: Each product MUST be associated with exactly one streaming platform
- **Pricing**: Each product MUST have a price in USD with 2 decimal precision
- **Duration**: Each product MUST specify the subscription duration in days (e.g., 30 for monthly)
- **Active Status**: Products MUST have an active/inactive status flag

### 1.2 Order Processing

#### Requirement: Order Creation

The system SHALL create orders when a user purchases a product.

- **One-Click Purchase**: The system SHALL support immediate purchase without cart persistence
- **Purchase Link**: Each purchase MUST create a linked Purchase record with the productId
- **Automatic Commissions**: Commission distribution MUST be triggered automatically upon order creation
- **Order Number**: Each order MUST generate a unique order number for tracking

#### Requirement: Order Status Management

The system SHALL track order status throughout the purchase lifecycle.

- **Initial Status**: New orders MUST start with status 'pending'
- **Completion**: Orders MUST transition to 'completed' after successful payment simulation
- **Failure Handling**: Orders MUST transition to 'failed' if payment simulation fails

### 1.3 Commission Distribution

#### Requirement: Automatic Commission Calculation

The system SHALL automatically calculate and distribute commissions when an order is created.

- **Direct Commission**: The sponsor MUST receive 10% (0.10) commission on each purchase
- **Level 1-4 Commissions**: Upline ancestors MUST receive commissions at 5%, 3%, 2%, 1% respectively
- **Rate Constants**: Commission rates MUST be defined as constants matching existing COMMISSION_RATES

#### Requirement: Commission Record Creation

The system SHALL create Commission records for each eligible upline member.

- **Purchase Link**: Each commission MUST reference the associated purchaseId
- **Amount Calculation**: Commission amount MUST be calculated as `purchase.amount * rate`
- **Pending Status**: New commissions MUST be created with 'pending' status

### 1.4 User Authentication

#### Requirement: Authenticated Purchases

The system SHALL require user authentication for all purchases.

- **Authentication Check**: All order creation endpoints MUST validate user authentication
- **User Context**: The system MUST use the authenticated user's ID for purchase records
- **Sponsor Chain**: The system MUST traverse the UserClosure table for commission distribution

---

## 2. Non-Functional Requirements

### 2.1 Performance

| Metric | Requirement | Notes |
|--------|-------------|-------|
| API Response Time | < 500ms for catalog listing | Measured at 95th percentile |
| Order Creation | < 2s including commission calculation | End-to-end flow |
| Page Load | < 3s for product catalog | Initial load with images |

### 2.2 Scalability

- **Database**: Product and Order tables MUST support horizontal scaling via proper indexing
- **Concurrent Users**: System MUST handle 100 concurrent catalog views
- **Commission Calculations**: Service MUST handle commission distribution in transaction

### 2.3 Security

- **Authentication**: All order endpoints MUST require valid JWT token
- **Authorization**: Users MUST only be able to create orders for themselves
- **Input Validation**: All API inputs MUST be validated with Zod schemas
- **SQL Injection**: All queries MUST use parameterized statements (Sequelize ORM)

### 2.4 Reliability

- **Transaction Safety**: Order creation and commission distribution MUST be atomic
- **Rollback Support**: Failed transactions MUST rollback both Order and Purchase records
- **Error Logging**: All commission calculation errors MUST be logged

### 2.5 Maintainability

- **Code Documentation**: All new files MUST include JSDoc comments in English and Spanish
- **Type Safety**: All TypeScript files MUST use strict mode
- **API Documentation**: All endpoints MUST have Swagger/OpenAPI decorators

---

## 3. Data Model

### 3.1 Product Model

```typescript
// backend/src/models/Product.ts

interface ProductAttributes {
  id: string;                    // UUID v4, primary key
  name: string;                  // Product display name (e.g., "Netflix Premium")
  platform: 'netflix' | 'disney_plus' | 'spotify' | 'hbo_max' | 'amazon_prime' | 'youtube_premium' | 'apple_tv' | 'other';
  description: string | null;   // Optional product description
  price: number;                 // DECIMAL(10,2), USD cents
  currency: string;              // Default: 'USD'
  durationDays: number;          // Subscription duration in days
  imageUrl: string | null;      // Optional product image URL
  isActive: boolean;             // Whether product is available for purchase
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductCreationAttributes {
  name: string;
  platform: ProductAttributes['platform'];
  description?: string | null;
  price: number;
  currency?: string;
  durationDays: number;
  imageUrl?: string | null;
  isActive?: boolean;
}
```

**Database Schema**:
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  duration_days INTEGER NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_platform ON products(platform);
CREATE INDEX idx_products_is_active ON products(is_active);
```

### 3.2 Order Model

```typescript
// backend/src/models/Order.ts

interface OrderAttributes {
  id: string;                    // UUID v4, primary key
  orderNumber: string;          // Human-readable order number (e.g., "ORD-20260325-001")
  userId: string;                // FK to users table
  productId: string;             // FK to products table
  purchaseId: string;             // FK to purchases table (links to commissions)
  totalAmount: number;           // Order total (matches product price)
  currency: string;              // Default: 'USD'
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: 'manual' | 'simulated';  // MVP: only simulated
  notes: string | null;          // Optional internal notes
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderCreationAttributes {
  userId: string;
  productId: string;
  totalAmount: number;
  currency?: string;
  paymentMethod?: 'manual' | 'simulated';
  notes?: string | null;
}
```

**Database Schema**:
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  purchase_id UUID NOT NULL REFERENCES purchases(id),
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(20) DEFAULT 'simulated',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
```

### 3.3 Modified Purchase Model

The existing Purchase model MUST be extended with an optional `productId` field:

```typescript
// backend/src/models/Purchase.ts (MODIFIED)

interface PurchaseAttributes {
  // ... existing fields ...
  productId: string | null;     // NEW: Optional FK to products table
  // ... existing fields ...
}
```

```sql
-- Migration: Add productId to existing purchases table
ALTER TABLE purchases 
ADD COLUMN product_id UUID REFERENCES products(id);

CREATE INDEX idx_purchases_product_id ON purchases(product_id);
```

### 3.4 Relationships

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Product   │       │   Order    │       │  Purchase   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │──┐    │ id (PK)    │    ┌──│ id (PK)     │
│ name        │  │    │ orderNumber│    │  │ userId (FK) │
│ platform    │  │    │ userId(FK)│────┘  │ amount      │
│ price       │  │    │ productId │───────│ productId   │ (NEW)
│ durationDays│  │    │ purchaseId│───────│ status      │
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

---

## 4. API Endpoints

### 4.1 Product Endpoints

#### GET /api/products

List all active products.

**Authentication**: Optional (public endpoint)

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| platform | string | No | - | Filter by platform |
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Items per page (max: 100) |

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Netflix Premium",
      "platform": "netflix",
      "description": "4 screens, Ultra HD",
      "price": 15.99,
      "currency": "USD",
      "durationDays": 30,
      "imageUrl": "https://example.com/netflix.png"
    }
  ],
  "pagination": {
    "total": 8,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

#### GET /api/products/:id

Get single product by ID.

**Authentication**: Optional

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Netflix Premium",
    "platform": "netflix",
    "description": "4 screens, Ultra HD",
    "price": 15.99,
    "currency": "USD",
    "durationDays": 30,
    "imageUrl": "https://example.com/netflix.png",
    "isActive": true,
    "createdAt": "2026-03-25T00:00:00Z",
    "updatedAt": "2026-03-25T00:00:00Z"
  }
}
```

**Response** (404 Not Found):
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found"
  }
}
```

### 4.2 Order Endpoints

#### POST /api/orders

Create a new order (purchase a product).

**Authentication**: Required (JWT Bearer token)

**Request Body**:
```json
{
  "productId": "550e8400-e29b-41d4-a716-446655440000",
  "paymentMethod": "simulated"
}
```

**Request Schema** (Zod):
```typescript
{
  productId: z.string().uuid(),
  paymentMethod: z.enum(['simulated']).default('simulated')
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "orderNumber": "ORD-20260325-001",
    "product": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Netflix Premium",
      "platform": "netflix"
    },
    "totalAmount": 15.99,
    "currency": "USD",
    "status": "completed",
    "paymentMethod": "simulated",
    "createdAt": "2026-03-25T12:30:00Z"
  }
}
```

**Response** (400 Bad Request):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "productId": ["Invalid UUID format"]
    }
  }
}
```

**Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Response** (404 Not Found):
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found or inactive"
  }
}
```

#### GET /api/orders

List current user's orders.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Items per page |
| status | string | No | - | Filter by status |

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "orderNumber": "ORD-20260325-001",
      "product": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Netflix Premium",
        "platform": "netflix",
        "imageUrl": "https://example.com/netflix.png"
      },
      "totalAmount": 15.99,
      "currency": "USD",
      "status": "completed",
      "createdAt": "2026-03-25T12:30:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

#### GET /api/orders/:id

Get single order by ID.

**Authentication**: Required (user must own the order)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "orderNumber": "ORD-20260325-001",
    "product": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Netflix Premium",
      "platform": "netflix",
      "description": "4 screens, Ultra HD",
      "price": 15.99,
      "durationDays": 30,
      "imageUrl": "https://example.com/netflix.png"
    },
    "totalAmount": 15.99,
    "currency": "USD",
    "status": "completed",
    "paymentMethod": "simulated",
    "createdAt": "2026-03-25T12:30:00Z"
  }
}
```

**Response** (403 Forbidden):
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to view this order"
  }
}
```

### 4.3 Error Response Format

All error responses MUST follow this format:

```typescript
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable message
    details?: Record<string, string[]>;  // Field-level validation errors
  };
}
```

**Standard Error Codes**:
| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| UNAUTHORIZED | 401 | Missing or invalid authentication |
| FORBIDDEN | 403 | User lacks permission |
| PRODUCT_NOT_FOUND | 404 | Product does not exist |
| ORDER_NOT_FOUND | 404 | Order does not exist |
| PRODUCT_INACTIVE | 400 | Product is not available for purchase |
| INTERNAL_ERROR | 500 | Unexpected server error |

---

## 5. UI/UX Requirements

### 5.1 User Flows

#### Flow 1: Browse Products
```
┌─────────────┐
│  Dashboard  │
└──────┬──────┘
       │ User clicks "Buy Subscription" or navigates to /products
       ▼
┌─────────────┐
│   Product   │ ◄─── User can filter by platform
│  Catalog    │
│   Page      │
└──────┬──────┘
       │ User clicks on a product
       ▼
┌─────────────┐
│  Product    │ ◄─── Shows details, price, "Buy Now" button
│   Detail    │
│   Modal     │
└──────┬──────┘
       │ User clicks "Buy Now"
       ▼
┌─────────────┐     ┌─────────────┐
│  Checkout   │────►│   Success   │
│   Page      │     │   Page      │
│  (confirm)  │     │  (receipt)  │
└─────────────┘     └─────────────┘
```

#### Flow 2: Purchase Product
```
┌─────────────┐
│  Checkout   │
│   Page      │
└──────┬──────┘
       │ User clicks "Confirm Purchase"
       ▼
┌─────────────┐     ┌─────────────┐
│   Loading   │────►│   Success   │
│   State     │     │   Page      │
└─────────────┘     └──────┬──────┘
                           │
                           │ Order created, commissions calculated
                           ▼
                    ┌─────────────┐
                    │  Dashboard  │
                    │  Updated    │
                    └─────────────┘
```

### 5.2 Page Specifications

#### ProductCatalog Page (`/products`)

**Layout**:
- Header with title "Streaming Subscriptions" and shopping cart icon
- Platform filter chips (horizontal scrollable): All, Netflix, Disney+, Spotify, HBO Max, Amazon Prime, etc.
- Grid of product cards (3 columns on desktop, 2 on tablet, 1 on mobile)

**Product Card Component**:
```
┌─────────────────────────────┐
│  [Platform Logo/Image]     │
│                             │
│  Netflix Premium           │
│  4 screens, Ultra HD        │
│                             │
│  ─────────────────────────  │
│  $15.99 / month            │
│                             │
│  [Buy Now]                  │
└─────────────────────────────┘
```

**States**:
- Loading: Skeleton cards with pulse animation
- Empty: "No products available" message with icon
- Error: "Failed to load products" with retry button
- Filtered Empty: "No products for this platform" message

#### Checkout Page (`/checkout/:productId`)

**Layout**:
- Two-column layout (desktop): Order summary left, payment form right
- Single column (mobile): Order summary top, form bottom

**Components**:
1. **Order Summary Card**:
   - Product image and name
   - Platform badge
   - Price breakdown (subtotal, total)
   - Duration

2. **Payment Form**:
   - "Payment Method" section (MVP: only "Simulated Payment" option)
   - Terms acceptance checkbox
   - "Confirm Purchase" button

3. **Confirmation Modal**:
   - Warning: "This is a simulated payment for MVP testing"
   - "Confirm" and "Cancel" buttons

**States**:
- Loading: Disabled form with spinner
- Processing: Full-page overlay with progress
- Success: Redirect to order confirmation
- Error: Toast notification with error message

#### Order Success Page (`/orders/:orderId/success`)

**Layout**:
- Centered content with success animation
- Order summary card
- Commission distribution info
- CTA buttons: "View All Orders", "Back to Dashboard"

**Components**:
1. **Success Header**: Checkmark animation, "Purchase Successful!" title
2. **Order Details**:
   - Order number
   - Product purchased
   - Total amount
   - Date/time
3. **Commission Info**:
   - "Commission earned will be credited to your account"
   - Breakdown of upline commissions
4. **Action Buttons**: Primary (View Orders), Secondary (Continue Shopping)

### 5.3 Component Library

| Component | Description | States |
|-----------|-------------|--------|
| `ProductCard` | Displays product in grid | default, hover, loading |
| `ProductModal` | Full product details | open, closed |
| `PlatformBadge` | Shows platform icon + name | active, inactive |
| `PriceDisplay` | Formatted price with currency | default |
| `CheckoutForm` | Payment form | idle, loading, error |
| `OrderSummary` | Order details card | default, compact |
| `OrderStatus` | Status badge | pending, completed, failed |
| `LoadingSpinner` | Loading indicator | default |
| `EmptyState` | No data placeholder | default |
| `ErrorToast` | Error notification | visible, hidden |

### 5.4 Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, stacked cards |
| Tablet | 640px - 1024px | 2-column grid |
| Desktop | > 1024px | 3-column grid, 2-column checkout |

### 5.5 i18n Keys

Required translation keys for Spanish/English:

```json
// en.json & es.json
{
  "products": {
    "title": "Streaming Subscriptions",
    "catalog": "Product Catalog",
    "filterAll": "All Platforms",
    "buyNow": "Buy Now",
    "pricePerMonth": "{{price}} / month",
    "emptyState": "No products available",
    "loadingError": "Failed to load products"
  },
  "checkout": {
    "title": "Checkout",
    "orderSummary": "Order Summary",
    "paymentMethod": "Payment Method",
    "simulatedPayment": "Simulated Payment (MVP)",
    "simulatedWarning": "This is a simulated payment for testing purposes",
    "termsLabel": "I accept the terms and conditions",
    "confirmPurchase": "Confirm Purchase",
    "processing": "Processing your order...",
    "success": "Purchase Successful!",
    "error": "Failed to process order"
  },
  "order": {
    "orderNumber": "Order #{{number}}",
    "product": "Product",
    "total": "Total",
    "status": "Status",
    "date": "Date",
    "viewAll": "View All Orders",
    "backToDashboard": "Back to Dashboard",
    "commissionNote": "Commission earned will be credited to your account"
  }
}
```

---

## 6. Acceptance Criteria & Test Scenarios

### 6.1 Product Management

#### Scenario: List all active products

- **GIVEN** the user is on the Product Catalog page
- **WHEN** the page loads
- **THEN** the system SHALL display all products where `isActive = true`
- **AND** each product card SHALL show name, platform, price, and image

#### Scenario: Filter products by platform

- **GIVEN** the user is on the Product Catalog page
- **WHEN** the user clicks on "Netflix" filter chip
- **THEN** the system SHALL display only products where `platform = 'netflix'`

#### Scenario: View product details

- **GIVEN** the user clicks on a product card
- **WHEN** the product detail modal opens
- **THEN** the system SHALL display full product information including description and duration

### 6.2 Order Creation

#### Scenario: Successful purchase flow

- **GIVEN** the user is authenticated and views a product
- **WHEN** the user clicks "Buy Now" and confirms the purchase
- **THEN** the system SHALL create an Order record with status 'completed'
- **AND** the system SHALL create a Purchase record linked to the order
- **AND** the system SHALL trigger commission distribution
- **AND** the user SHALL be redirected to the success page

#### Scenario: Purchase without authentication

- **GIVEN** the user is NOT authenticated
- **WHEN** the user attempts to create an order via API
- **THEN** the system SHALL return 401 Unauthorized
- **AND** the system SHALL NOT create any records

#### Scenario: Purchase inactive product

- **GIVEN** the user attempts to purchase a product where `isActive = false`
- **WHEN** the order creation is attempted
- **THEN** the system SHALL return 400 Bad Request with error code 'PRODUCT_INACTIVE'
- **AND** the system SHALL NOT create any records

### 6.3 Commission Distribution

#### Scenario: Direct commission to sponsor

- **GIVEN** User A (buyer) has Sponsor B
- **WHEN** User A creates an order for $100
- **THEN** the system SHALL create a Commission record for Sponsor B
- **AND** the commission amount SHALL be $10 (100 * 0.10)

#### Scenario: Multi-level commissions

- **GIVEN** Buyer has upline: Sponsor (direct) → Level 1 → Level 2 → Level 3 → Level 4
- **WHEN** Buyer creates an order for $100
- **THEN** the system SHALL create commissions:
  - Direct: $10 (10%)
  - Level 1: $5 (5%)
  - Level 2: $3 (3%)
  - Level 3: $2 (2%)
  - Level 4: $1 (1%)

#### Scenario: No sponsor, no commissions

- **GIVEN** User A (buyer) has NO sponsor (`sponsorId = null`)
- **WHEN** User A creates an order
- **THEN** the system SHALL NOT create any Commission records
- **AND** the order SHALL still be created successfully

### 6.4 Error Handling

#### Scenario: Database transaction rollback

- **GIVEN** commission calculation fails mid-transaction
- **WHEN** the order creation is attempted
- **THEN** the system SHALL rollback the Order and Purchase records
- **AND** the system SHALL return 500 Internal Server Error

#### Scenario: Invalid product ID format

- **GIVEN** the user sends a request with invalid UUID format
- **WHEN** the order creation is attempted
- **THEN** the system SHALL return 400 Bad Request
- **AND** the error details SHALL specify the validation failure

### 6.5 API Integration Tests

```typescript
// Example integration tests
describe('Product API', () => {
  it('should list all active products', async () => {
    const response = await request(app).get('/api/products');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});

describe('Order API', () => {
  it('should create order with valid JWT', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ productId: validProductId });
    expect(response.status).toBe(201);
    expect(response.body.data.orderNumber).toMatch(/^ORD-\d{8}-\d{3}$/);
  });

  it('should reject unauthenticated requests', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({ productId: validProductId });
    expect(response.status).toBe(401);
  });
});
```

---

## 7. Dependencies & Assumptions

### 7.1 Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Node.js | >= 18.x | Runtime |
| Express | ^4.18.x | HTTP server |
| Sequelize | ^6.x | ORM |
| React | ^18.x | Frontend |
| React Router | ^6.x | Routing |
| Axios | ^1.x | HTTP client |
| Zod | ^3.x | Validation |
| UUID | ^9.x | ID generation |

### 7.2 Existing Systems (Reused)

| System | Description |
|--------|-------------|
| `User` model | User authentication and MLM structure |
| `UserClosure` model | Binary tree traversal for upline |
| `Purchase` model | Extended with optional productId |
| `Commission` model | Commission records (already exists) |
| `CommissionService` | Commission calculation logic (reused) |
| `auth.middleware` | JWT authentication (reused) |

### 7.3 Assumptions

1. **MVP Scope**: Only simulated/manual payment processing (no Stripe/PayPal)
2. **Single Currency**: All prices in USD only
3. **No Inventory**: Unlimited stock for digital subscriptions
4. **Hardcoded Products**: Initial products seeded via migration/factory (no admin UI)
5. **No Refunds**: MVP does not include refund functionality
6. **No Renewal**: No automatic subscription renewal
7. **Sequelize CLI**: Available for database migrations
8. **Database**: PostgreSQL with UUID extension enabled

### 7.4 File Structure

```
backend/src/
├── models/
│   ├── Product.ts              # NEW
│   ├── Order.ts                # NEW
│   ├── Purchase.ts             # MODIFIED (add productId)
│   └── index.ts                # MODIFIED (register new models)
├── controllers/
│   ├── ProductController.ts    # NEW
│   └── OrderController.ts      # NEW
├── services/
│   ├── ProductService.ts       # NEW
│   └── OrderService.ts         # NEW
├── routes/
│   ├── product.routes.ts       # NEW
│   ├── order.routes.ts        # NEW
│   └── index.ts                # MODIFIED (register routes)
├── types/
│   └── index.ts                # MODIFIED (add interfaces)
└── middleware/
    └── auth.middleware.ts      # REUSED

frontend/src/
├── pages/
│   ├── ProductCatalog.tsx      # NEW
│   ├── Checkout.tsx           # NEW
│   └── OrderSuccess.tsx       # NEW
├── components/
│   ├── ProductCard.tsx         # NEW
│   ├── ProductModal.tsx        # NEW
│   ├── CheckoutForm.tsx        # NEW
│   ├── OrderSummary.tsx        # NEW
│   └── ...
├── services/
│   └── api.ts                 # MODIFIED (add product/order services)
├── types/
│   └── index.ts               # MODIFIED (add product/order types)
└── i18n/
    └── locales/
        ├── en.json            # MODIFIED (add e-commerce keys)
        └── es.json            # MODIFIED (add e-commerce keys)
```

---

## 8. Testing Requirements

### 8.1 Unit Tests

| Module | Coverage | Priority |
|--------|----------|----------|
| ProductService | CRUD operations | High |
| OrderService | Order creation, transaction handling | Critical |
| Commission distribution | Rate calculations, upline traversal | Critical |

### 8.2 Integration Tests

| Endpoint | Tests | Priority |
|----------|-------|----------|
| GET /api/products | List, filter, pagination | High |
| GET /api/products/:id | Get single, 404 handling | High |
| POST /api/orders | Create, auth check, validation | Critical |
| GET /api/orders | List user's orders | Medium |
| GET /api/orders/:id | Get single, ownership check | Medium |

### 8.3 E2E Tests (Playwright)

| Flow | Scenarios | Priority |
|------|-----------|----------|
| Browse Products | List, filter, view details | High |
| Purchase Flow | Select product, checkout, success | Critical |
| Order History | View orders, order details | Medium |

---

## 9. Migration Plan

### Migration 001: Create products table
```bash
npx sequelize-cli migration:generate --name create-products
```

### Migration 002: Create orders table
```bash
npx sequelize-cli migration:generate --name create-orders
```

### Migration 003: Add productId to purchases
```bash
npx sequelize-cli migration:generate --name add-product-id-to-purchases
```

### Seed Data: Initial streaming products
```typescript
// backend/src/seeders/20260325000000-streaming-products.js
const products = [
  { name: 'Netflix Basic', platform: 'netflix', price: 9.99, durationDays: 30 },
  { name: 'Netflix Premium', platform: 'netflix', price: 15.99, durationDays: 30 },
  { name: 'Disney+', platform: 'disney_plus', price: 7.99, durationDays: 30 },
  { name: 'Spotify Premium', platform: 'spotify', price: 9.99, durationDays: 30 },
  { name: 'HBO Max', platform: 'hbo_max', price: 9.99, durationDays: 30 },
  { name: 'Amazon Prime Video', platform: 'amazon_prime', price: 8.99, durationDays: 30 },
  { name: 'YouTube Premium', platform: 'youtube_premium', price: 11.99, durationDays: 30 },
  { name: 'Apple TV+', platform: 'apple_tv', price: 6.99, durationDays: 30 },
];
```

---

**Spec Version**: 1.0.0  
**Created**: 2026-03-25  
**Change**: streaming-subscriptions-ecommerce  
**Status**: Ready for Design Phase
