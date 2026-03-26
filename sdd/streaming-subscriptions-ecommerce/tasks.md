# Tasks: Streaming Subscriptions E-Commerce

## Phase 1: Infrastructure & Database (Foundation)

- [x] 1.1 Create database migration: `20260325000001-create-products.js` - products table with platform ENUM, price DECIMAL(10,2), duration_days, is_active
- [x] 1.2 Create database migration: `20260325000002-create-orders.js` - orders table with order_number, user_id, product_id, purchase_id, status, payment_method
- [x] 1.3 Create database migration: `20260325000003-add-product-id-to-purchases.js` - add optional product_id column to purchases table
- [x] 1.4 Create database seeder: `20260325000000-streaming-products.js` - seed 8 initial streaming products (Netflix, Disney+, Spotify, HBO Max, Amazon Prime, YouTube Premium, Apple TV+)
- [x] 1.5 Run migrations on development database
- [x] 1.6 Run seeders to populate initial products

## Phase 2: Backend Types & Models

- [x] 2.1 Add Product and Order type interfaces to `backend/src/types/index.ts` - ProductAttributes, ProductCreationAttributes, OrderAttributes, OrderCreationAttributes, ApiResponse<T>
- [x] 2.2 Create `backend/src/models/Product.ts` - Sequelize model with platform ENUM, price DECIMAL, associations
- [x] 2.3 Create `backend/src/models/Order.ts` - Sequelize model with orderNumber generator, status ENUM, associations to User, Product, Purchase
- [x] 2.4 Modify `backend/src/models/Purchase.ts` - add optional productId foreign key
- [x] 2.5 Register new models in `backend/src/models/index.ts`

## Phase 3: Backend Services (Core Logic)

- [x] 3.1 Create `backend/src/services/ProductService.ts` - getProductList() with pagination/filtering, findById(), validateProduct()
- [x] 3.2 Create `backend/src/services/OrderService.ts` - createOrder() with transaction handling, getUserOrders(), findById(), Zod validation schema
- [x] 3.3 Integrate CommissionService.calculateCommissions() into OrderService.createOrder() transaction
- [x] 3.4 Ensure transaction rollback on commission calculation failure

## Phase 4: Backend Controllers & Routes

- [ ] 4.1 Create `backend/src/controllers/ProductController.ts` - GET /products (list), GET /products/:id (single), with pagination and platform filtering
- [ ] 4.2 Create `backend/src/routes/product.routes.ts` - route definitions with express-validator UUID validation
- [ ] 4.3 Create `backend/src/controllers/OrderController.ts` - POST /orders (create), GET /orders (list), GET /orders/:id (single), auth middleware required
- [ ] 4.4 Create `backend/src/routes/order.routes.ts` - route definitions with Zod validation
- [ ] 4.5 Register product and order routes in `backend/src/routes/index.ts`
- [ ] 4.6 Add error handling with proper error codes (VALIDATION_ERROR, UNAUTHORIZED, PRODUCT_NOT_FOUND, ORDER_NOT_FOUND, etc.)

## Phase 5: Frontend Types & API Services

- [x] 5.1 Add Product and Order TypeScript interfaces to `frontend/src/types/index.ts`
- [x] 5.2 Modify `frontend/src/services/api.ts` - add productService module (getProducts, getProduct) and orderService module (createOrder, getOrders, getOrder)
- [x] 5.3 Add i18n keys to `frontend/src/i18n/locales/en.json` - products, checkout, order sections
- [x] 5.4 Add i18n keys to `frontend/src/i18n/locales/es.json` - products, checkout, order sections

## Phase 6: Frontend Components

- [ ] 6.1 Create `frontend/src/components/ProductCard.tsx` - product display with name, platform, price, image, Buy Now button, loading/hover states
- [ ] 6.2 Create `frontend/src/components/ProductModal.tsx` - full product details with description, duration, open/close states
- [ ] 6.3 Create `frontend/src/components/PlatformBadge.tsx` - platform icon and name display
- [ ] 6.4 Create `frontend/src/components/PriceDisplay.tsx` - formatted price with currency
- [ ] 6.5 Create `frontend/src/components/OrderSummary.tsx` - order details card (product, price breakdown, total)
- [ ] 6.6 Create `frontend/src/components/CheckoutForm.tsx` - payment form with simulated payment option, terms checkbox, confirm button, loading/error states
- [ ] 6.7 Create `frontend/src/components/OrderStatus.tsx` - status badge (pending, completed, failed)
- [ ] 6.8 Create `frontend/src/components/EmptyState.tsx` - no data placeholder
- [ ] 6.9 Create `frontend/src/components/ErrorToast.tsx` - error notification component

## Phase 7: Frontend Pages

- [x] 7.1 Create `frontend/src/pages/ProductCatalog.tsx` - product listing page with platform filter chips, grid layout (3/2/1 columns responsive), loading skeletons, empty state, error handling
- [x] 7.2 Create `frontend/src/pages/Checkout.tsx` - checkout page with order summary, payment form, confirmation modal with simulated payment warning
- [x] 7.3 Create `frontend/src/pages/OrderSuccess.tsx` - purchase success page with checkmark animation, order details, commission info, CTA buttons
- [x] 7.4 Add React Router routes in `frontend/src/App.tsx` - /products, /checkout/:productId, /orders/:orderId/success
- [x] 7.5 Implement lazy loading with React.lazy() for new pages

## Phase 8: Integration & Commission Flow

- [ ] 8.1 Verify OrderService creates Purchase record and links productId
- [ ] 8.2 Verify CommissionService.calculateCommissions() is called with purchaseId
- [ ] 8.3 Verify transaction rollback on commission calculation failure
- [ ] 8.4 Verify order status transitions: pending → completed (success) or failed (payment failure)
- [ ] 8.5 Test commission distribution: sponsor 10%, level 1: 5%, level 2: 3%, level 3: 2%, level 4: 1%

## Phase 9: Unit Tests

- [ ] 9.1 Write unit tests for ProductService.findAll() - pagination, platform filter, isActive filter
- [ ] 9.2 Write unit tests for ProductService.findById() - success, not found
- [ ] 9.3 Write unit tests for OrderService.createOrder() - success, validation, product inactive
- [ ] 9.4 Write unit tests for OrderService.createOrder() transaction rollback - commission failure should rollback Order and Purchase
- [ ] 9.5 Write unit tests for OrderService.createOrder() success - verify Order, Purchase, and Commission records created

## Phase 10: Integration Tests

- [ ] 10.1 Write integration test: GET /api/products returns 200 with active products list
- [ ] 10.2 Write integration test: GET /api/products/:id returns 200 for valid UUID, 404 for not found
- [ ] 10.3 Write integration test: POST /api/orders with valid JWT creates order with status 'completed'
- [ ] 10.4 Write integration test: POST /api/orders without JWT returns 401 Unauthorized
- [ ] 10.5 Write integration test: POST /api/orders with invalid productId returns 400 Validation Error
- [ ] 10.6 Write integration test: GET /api/orders returns only current user's orders
- [ ] 10.7 Write integration test: GET /api/orders/:id with wrong user returns 403 Forbidden

## Phase 11: E2E Tests (Playwright)

- [x] 11.1 Write E2E test: User browses product catalog, filters by platform, views product details
- [x] 11.2 Write E2E test: User purchases product - select product → checkout → confirm → success page
- [x] 11.3 Write E2E test: User views order history and order details

## Phase 12: Cleanup & Verification

- [ ] 12.1 Add JSDoc comments (English/Spanish) to all new backend files
- [ ] 12.2 Verify Swagger/OpenAPI decorators on all new endpoints
- [ ] 12.3 Verify TypeScript strict mode compliance
- [ ] 12.4 Add database indexes verification (products platform, is_active; orders user_id, status)
- [ ] 12.5 Verify rate limiting on POST /api/orders (5 orders per minute per user)
- [ ] 12.6 Test CORS configuration for frontend domain
- [ ] 12.7 Final smoke test: Full purchase flow end-to-end in development environment
