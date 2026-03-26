### E2E Tests: Product Catalog

**Suite ID:** `PRODUCTS-E2E`
**Feature:** Product listing with platform filters and product details

---

## Test Case: `PRODUCTS-E2E-001` - User browses product catalog

**Priority:** `critical`

**Tags:**

- type → @e2e
- feature → @products

**Description/Objective:** Verify that the product catalog page loads correctly with product grid.

**Preconditions:**

- User is logged in
- At least one product exists in the system

### Flow Steps:

1. Navigate to `/products`
2. Wait for page to load

### Expected Result:

- Page heading containing "product" is visible
- Product grid (`.grid`) is visible

### Key verification points:

- Heading is present
- Grid container is visible

### Notes:

- Uses role-based selector for heading

---

## Test Case: `PRODUCTS-E2E-002` - User filters products by Netflix platform

**Priority:** `critical`

**Tags:**

- type → @e2e
- feature → @products

**Description/Objective:** Verify that clicking the Netflix filter button filters products and shows active state.

**Preconditions:**

- User is on product catalog page
- Netflix platform exists

### Flow Steps:

1. Click Netflix filter button
2. Wait for filter to apply

### Expected Result:

- Netflix button shows active state (purple background)
- Product grid updates to show only Netflix products

### Key verification points:

- Button has `bg-purple-600` class

### Notes:

- Uses role-based selector for button

---

## Test Case: `PRODUCTS-E2E-003` - User filters products by Spotify platform

**Priority:** `high`

**Tags:**

- type → @e2e
- feature → @products

**Description/Objective:** Verify that clicking the Spotify filter button filters products and shows active state.

**Preconditions:**

- User is on product catalog page
- Spotify platform exists

### Flow Steps:

1. Click Spotify filter button
2. Wait for filter to apply

### Expected Result:

- Spotify button shows active state (purple background)
- Product grid updates to show only Spotify products

### Key verification points:

- Button has `bg-purple-600` class

### Notes:

- Uses role-based selector for button

---

## Test Case: `PRODUCTS-E2E-004` - User clears platform filter

**Priority:** `medium`

**Tags:**

- type → @e2e
- feature → @products

**Description/Objective:** Verify that user can clear platform filter and see all products again.

**Preconditions:**

- User is on product catalog page with a filter active

### Flow Steps:

1. Click Netflix filter button
2. Click "All" filter button

### Expected Result:

- All filter button is clicked
- Product grid shows all products

### Key verification points:

- Filter is cleared

### Notes:

- Uses role-based selector for "All" button

---

## Test Case: `PRODUCTS-E2E-005` - User views product details via Buy Now button

**Priority:** `critical`

**Tags:**

- type → @e2e
- feature → @products

**Description/User:** Verify that clicking "Buy Now" navigates to checkout page.

**Preconditions:**

- User is on product catalog page
- At least one product exists

### Flow Steps:

1. Click first "Buy Now" button

### Expected Result:

- Navigation to `/checkout/:productId`

### Key verification points:

- URL changes to match checkout pattern

### Notes:

- Uses role-based selector for button with multilingual support

---

## Test Case: `PRODUCTS-E2E-006` - User views product details via View Details button

**Priority:** `high\*\*

**Tags:**

- type → @e2e
- feature → @products

**Description/Objective:** Verify that clicking "View Details" navigates to checkout page.

**Preconditions:**

- User is on product catalog page
- At least one product exists

### Flow Steps:

1. Click first "View Details" button

### Expected Result:

- Navigation to `/checkout/:productId`

### Key verification points:

- URL changes to match checkout pattern

### Notes:

- Uses role-based selector for button with multilingual support
