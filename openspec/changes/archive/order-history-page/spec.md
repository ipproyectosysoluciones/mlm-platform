# Order History Specification

## Purpose

Enable authenticated users and admins to browse past orders with status filtering, pagination, and per-order detail including product info and commission breakdown. The backend list endpoint (GET /api/orders) currently omits product/purchase data — this fix is part of the change.

## Requirements

### R1: Backend list endpoint includes product data

The system MUST return product objects (id, name, platform, price, durationDays, description) inside each order in the GET /api/orders response.

#### Scenarios
- List response includes product per order
- Admin sees all orders
- Regular user sees only own orders

### R2: Order list page (/orders)

The system MUST provide a paginated, filterable order list page accessible to authenticated users and admins.

#### Scenarios
- Loads and displays orders in a table (Order #, Product, Amount, Status, Date)
- Status filter via search params (?status=completed)
- Pagination with page/limit
- Empty state for users with no orders
- Loading skeleton during fetch
- Error state on API failure with retry

### R3: Order detail page (/orders/:id)

The system MUST provide a read-only detail page for a single order, separate from the checkout success page (no celebration animation).

#### Scenarios
- Displays full order details (order number, status badge, OrderSummary, payment method, commission breakdown)
- Order not found / access denied
- Loading skeleton

### R4: Navigation links

The system MUST include "Orders" navigation entries for both regular users and admin users.

#### Scenarios
- User nav includes Orders link
- Admin nav includes Orders link
- Admin dashboard has Orders quick-access card

### R5: Pagination shared component

The system MUST provide a reusable Pagination component built on shadcn/ui primitives.

#### Scenarios
- Renders page buttons with prev/next
- Edge cases: hidden when totalPages <= 1, disabled prev/next at boundaries

### R6: Mock API for E2E tests

The system MUST add a GET /api/orders handler in mock-api.ts before the :orderId regex.

#### Scenarios
- Returns paginated order list with product data
- List handler precedes ID regex

## Data Contracts

### GET /api/orders?page=1&limit=20&status=completed

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orderNumber": "ORD-...",
      "userId": "uuid",
      "productId": "uuid",
      "totalAmount": 15.99,
      "currency": "USD",
      "status": "completed",
      "paymentMethod": "simulated",
      "createdAt": "...",
      "product": {
        "id": "uuid",
        "name": "Netflix Premium",
        "platform": "netflix",
        "price": 15.99,
        "durationDays": 30,
        "description": "4K UHD"
      }
    }
  ],
  "pagination": { "total": 42, "page": 1, "limit": 20, "totalPages": 3 }
}
```

## Non-Functional Requirements
- Table uses proper th scope attributes
- Filter is a select with label
- Empty/error states use aria-live region
- /orders/:id placed BEFORE /orders/:orderId/success in routes
- Filter and page use URL search params (useSearchParams)
- Pages use React.lazy code splitting
