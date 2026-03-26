### E2E Tests: Checkout Flow

**Suite ID:** `CHECKOUT-E2E`
**Feature:** Product purchase flow from product selection to order confirmation

---

## Test Case: `CHECKOUT-E2E-001` - User selects product and navigates to checkout

**Priority:** `critical`

**Tags:**

- type → @e2e
- feature → @checkout

**Description/Objective:** Verify that selecting a product from catalog navigates to checkout page with proper heading.

**Preconditions:**

- User is logged in
- At least one product exists

### Flow Steps:

1. Navigate to product catalog
2. Click first "Buy Now" button

### Expected Result:

- Navigation to `/checkout/:productId`
- Checkout page heading visible

### Key verification points:

- URL matches checkout pattern
- Heading with "checkout" or "pedido" is visible

### Notes:

- Uses ProductCatalogPage and CheckoutPage objects

---

## Test Case: `CHECKOUT-E2E-002` - Checkout displays order summary

**Priority:** `critical`

**Tags:**

- type → @e2e
- feature → @checkout

**Description/Objective:** Verify that order summary section is visible on checkout page.

**Preconditions:**

- User is on checkout page (after selecting product)

### Flow Steps:

1. Navigate to checkout via product selection

### Expected Result:

- Order summary section visible

### Key verification points:

- Text "order summary" or "resumen del pedido" is visible

### Notes:

- Uses CheckoutPage.verifyOrderSummaryVisible()

---

## Test Case: `CHECKOUT-E2E-003` - Checkout shows payment method selection

**Priority:** `critical`

**Tags:**

- type → @e2e
- feature → @checkout

**Description/Objective:** Verify that payment method section is visible on checkout page.

**Preconditions:**

- User is on checkout page

### Flow Steps:

1. Navigate to checkout via product selection

### Expected Result:

- Payment method section visible

### Key verification points:

- Text "payment method" or "método de pago" is visible

### Notes:

- Uses CheckoutPage.verifyPaymentMethodVisible()

---

## Test Case: `CHECKOUT-E2E-004` - Checkout requires terms agreement

**Priority:** `high`

**Tags:**

- type → @e2e
- feature → @checkout

**Description/Objective:** Verify that confirm purchase button is disabled until terms are accepted.

**Preconditions:**

- User is on checkout page

### Flow Steps:

1. Navigate to checkout via product selection
2. Do not check terms checkbox

### Expected Result:

- Confirm button is disabled

### Key verification points:

- Button has disabled attribute

### Notes:

- Uses CheckoutPage.verifyConfirmButtonDisabled()

---

## Test Case: `CHECKOUT-E2E-005` - User completes checkout flow

**Priority:** `critical\*\*

**Tags:**

- type → @e2e
- feature → @checkout

**Description/Objective:** Verify complete purchase flow: select product → checkout → accept terms → confirm → success page.

**Preconditions:**

- User is logged in
- At least one product exists

### Flow Steps:

1. Navigate to product catalog
2. Click first "Buy Now" button
3. Accept terms
4. Click confirm purchase
5. Wait for navigation to success page

### Expected Result:

- Navigation to `/orders/:orderId/success`
- Success page heading visible

### Key verification points:

- URL changes to success pattern
- Success heading visible

### Notes:

- Uses CheckoutPage.completePurchase() helper

---

## Test Case: `CHECKOUT-E2E-006` - Order success page displays order details

**Priority:** `critical\*\*

**Tags:**

- type → @e2e
- feature → @checkout

**Description/Objective:** Verify that order success page shows order number and status.

**Preconditions:**

- User has completed a purchase

### Flow Steps:

1. Complete checkout flow (as in CHECKOUT-E2E-005)

### Expected Result:

- Order number visible
- Status visible

### Key verification points:

- Text "order number" or "número de pedido" visible
- Text "status" or "estado" visible

### Notes:

- Uses OrderSuccessPage verification methods

---

## Test Case: `CHECKOUT-E2E-007` - User can continue shopping from success page

**Priority:** `medium\*\*

**Tags:**

- type → @e2e
- feature → @checkout

**Description/Objective:** Verify that "Continue Shopping" button navigates back to product catalog.

**Preconditions:**

- User is on order success page

### Flow Steps:

1. Complete checkout flow
2. Click "Continue Shopping" button

### Expected Result:

- Navigation to `/products`

### Key verification points:

- URL contains `/products`

### Notes:

- Uses OrderSuccessPage.continueShopping()
