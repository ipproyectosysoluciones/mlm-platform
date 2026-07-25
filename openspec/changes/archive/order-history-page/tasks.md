# Tasks: Order History Page

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~730 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (foundation) → PR 2 (pages) → PR 3 (wiring + tests) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend fix + Pagination component + Mock API handler | PR 1 | Base = main; independent foundation work |
| 2 | OrdersPage + OrderDetailPage (core UI) | PR 2 | Base = main; depends on Pagination existing |
| 3 | Route wiring + Nav links + E2E specs | PR 3 | Base = main; depends on pages existing |

## Phase 1: Backend Fix

- [x] 1.1 **Fix `OrderReadController.getOrders` response mapping** — add `product` field (id, name, platform, price, durationDays, description) inside each order's `.map()` callback, matching the existing pattern in `getOrderById`. Backend: `backend/src/controllers/orders/OrderReadController.ts` (~12 lines)

## Phase 2: Foundation UI

- [x] 2.1 **Create `Pagination.tsx`** — shadcn/ui-style component with props `{ page, totalPages, onPageChange }`. Renders page buttons (outline variant), prev/next with disabled states at boundaries; returns `null` when `totalPages <= 1`. Frontend: `frontend/src/components/ui/Pagination.tsx` (~65 lines)

## Phase 3: Core Pages

- [x] 3.1 **Create `OrdersPage.tsx`** — paginated order list with status filter via `useSearchParams`. States: loading (TableSkeleton), empty (EmptyState with CTA to /products), error (card + retry), data (table with Order #, Product, Amount, Status, Date + Pagination). Uses `orderService.getOrders(params)` and `OrderStatus` badge. Frontend: `frontend/src/pages/orders/OrdersPage.tsx` (~200 lines)
- [x] 3.2 **Create `OrderDetailPage.tsx`** — read-only detail via `useParams` + `orderService.getOrder(id)`. States: loading (CardSkeleton), not-found (message + /orders link), data (order number copyable, OrderStatus badge, OrderSummary, payment method, commission info). No celebration animation. Frontend: `frontend/src/pages/orders/OrderDetailPage.tsx` (~140 lines)

## Phase 4: Wiring

- [x] 4.1 **Add lazy routes in `App.tsx`** — add `React.lazy` imports for `OrdersPage` and `OrderDetailPage`, add protected routes at `/orders` and `/orders/:id` (placed **before** `/orders/:orderId/success`). Frontend: `frontend/src/App.tsx` (~30 lines)
- [x] 4.2 **Add "Orders" nav links in `Navbar.tsx`** — add `/orders` entry to `NAV_ITEMS` and an "Orders" link to `ADMIN_DROPDOWN_ITEMS`. Frontend: `frontend/src/components/layout/Navbar.tsx` (~12 lines)
- [x] 4.3 **Add "Orders" quick-access card in `AdminDashboard.tsx`** — add navigation card linking to `/orders` in the admin dashboard grid. Frontend: `frontend/src/components/layout/AdminDashboard.tsx` (~10 lines)

## Phase 5: Mock API + E2E Tests

- [x] 5.1 **Add `GET /api/orders` handler to `mock-api.ts`** — return paginated order list with 3 sample orders including product objects. Place handler **before** the `:orderId` regex to avoid false matches. Frontend: `frontend/e2e/mock-api.ts` (~55 lines)
- [x] 5.2 **Create `OrdersListPage` POM** — extends `BasePage`. Selectors: table, pagination, status filter select, empty/error states, skeleton. Methods: `goto`, `filterByStatus`, `goToPage`, `clickOrderRow`. Frontend: `frontend/e2e/orders/orders-list-page.ts` (~50 lines)
- [x] 5.3 **Create `OrderDetailPage` POM** — extends `BasePage`. Selectors: order number, status badge, OrderSummary, commission card, back link. Methods: `goto(id)`, `verifyLoaded`. Frontend: `frontend/e2e/orders/order-detail-page.ts` (~40 lines)
- [x] 5.4 **Create `orders.spec.ts`** — E2E tests covering: load order list; filter by status; paginate; empty state; error state with retry; navigate to detail from list; verify detail fields; handle 404 on invalid ID. Frontend: `frontend/e2e/orders/orders.spec.ts` (~120 lines)
