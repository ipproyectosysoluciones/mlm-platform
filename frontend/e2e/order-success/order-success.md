### E2E Tests: Order Success & Details

**Suite ID:** `ORDERS-E2E`
**Feature:** Order success page and order details verification

---

## Test Case: `ORDERS-E2E-001` - LIMITATION: No /orders route exists

**Priority:** `medium`

**Tags:**

- type → @e2e
- feature → @orders

**Description/Objective:** Verify that /orders route does not exist (returns 404).

**Preconditions:**

- User is logged in

### Flow Steps:

1. Navigate to `/orders`

### Expected Result:

- HTTP 404 status

### Key verification points:

- Response status is 404

### Notes:

- Documents current limitation

---

## Test Case: `ORDERS-E2E-002` - Order success page displays order number

**Priority:** `critical`

**Tags:**

- type → @e2e
- feature → @orders

**Description/Objective:** Verify that order success page shows order number.

**Preconditions:**

- User has completed a purchase

### Flow Steps:

1. Complete purchase flow
2. Verify order number visible

### Expected Result:

- Text "order number" or "número de pedido" visible

### Key verification points:

- Order number element is visible

### Notes:

- Uses OrderSuccessPage.verifyOrderNumberVisible()

---

## Test Case: `ORDERS-E2E-003` - Order success page displays order status

**Priority:** `critical`

**Tags:**

- type → @e2e
- feature → @orders

**Description/Objective:** Verify that order success page shows order status.

**Preconditions:**

- User has completed a purchase

### Flow Steps:

1. Complete purchase flow
2. Verify status visible

### Expected Result:

- Text "status" or "estado" visible

### Key verification points:

- Status element is visible

### Notes:

- Uses OrderSuccessPage.verifyStatusVisible()

---

## Test Case: `ORDERS-E2E-004` - Order success page displays product details

**Priority:** `high`

**Tags:**

- type → @e2e
- feature → @orders

**Description/Objective:** Verify that order success page shows product details section.

**Preconditions:**

- User has completed a purchase

### Flow Steps:

1. Complete purchase flow
2. Verify product details visible

### Expected Result:

- Product details section (`.grid > div`) visible

### Key verification points:

- First element of grid is visible

### Notes:

- Uses OrderSuccessPage.verifyProductDetailsVisible()

---

## Test Case: `ORDERS-E2E-005` - User can access specific order details via URL

**Priority:** `high`

**Tags:**

- type → @e2e
- feature → @orders

**Description/Objective:** Verify that user can navigate directly to an order success page using order ID.

**Preconditions:**

- User has completed a purchase

### Flow Steps:

1. Complete purchase flow
2. Extract order ID from URL
3. Navigate to `/orders/:orderId/success`
4. Verify order number visible

### Expected Result:

- Navigation successful
- Order number visible

### Key verification points:

- URL contains order ID
- Order number element visible

### Notes:

- Uses OrderSuccessPage.goto() and verifyOrderNumberVisible()

---

## Test Case: `ORDERS-E2E-006` - Order success page displays commission breakdown

**Priority:** `medium\*\*

**Tags:**

- type → @e2e
- feature → @orders

**Description/Objective:** Verify that order success page shows commission information.

**Preconditions:**

- User has completed a purchase

### Flow Steps:

1. Complete purchase flow
2. Verify commission section visible

### Expected Result:

- Text "commission" or "comisión" visible

### Key verification points:

- Commission section is visible

### Notes:

- Uses OrderSuccessPage.verifyCommissionVisible()
