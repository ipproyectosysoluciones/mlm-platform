# Order History Page — Technical Design

## Approach

Fix backend response mapping to include product data, build 2 new protected lazy routes (`/orders`, `/orders/:id`), add reusable Pagination component, add nav links for user + admin.

## Key Decisions

1. **Backend response shape**: Keep existing `{ success, data: { orders, total, page, limit, totalPages } }` wrapper. Only fix the product/purchase mapping in `getOrders()`.
2. **Status filter**: Use URL search params (`?status=completed`) rather than component state, for shareable/bookmarkable URLs.
3. **Pagination**: Build as a shadcn/ui-style component reusing `Button` primitives — no external library needed.
4. **OrderDetailPage**: Reuses `OrderSummary` + `OrderStatus` from existing components. No celebration animation (distinct from OrderSuccess).

## Files Affected

### New Files
| File | Purpose |
|------|---------|
| `frontend/src/pages/orders/OrdersPage.tsx` | Paginated order list with status filter |
| `frontend/src/pages/orders/OrderDetailPage.tsx` | Single order detail (read-only) |
| `frontend/src/components/ui/Pagination.tsx` | Reusable pagination component |

### Modified Files
| File | Change |
|------|--------|
| `backend/src/controllers/orders/OrderReadController.ts` | Fix `getOrders` to include product/purchase in response |
| `frontend/src/App.tsx` | Add `/orders` and `/orders/:id` lazy routes with `ProtectedRoute` |
| `frontend/src/components/layout/Navbar.tsx` | Add "Orders" to `NAV_ITEMS` and `ADMIN_DROPDOWN_ITEMS` |
| `frontend/src/components/layout/AdminDashboard.tsx` | Add "Orders" quick-access card |
| `frontend/e2e/mock-api.ts` | Add `GET /api/orders` handler before `:orderId` regex |

### New E2E Files
| File | Purpose |
|------|---------|
| `frontend/e2e/orders/orders-list-page.ts` | POM for /orders list |
| `frontend/e2e/orders/order-detail-page.ts` | POM for /orders/:id |
| `frontend/e2e/orders/orders.spec.ts` | E2E tests for list + detail |

## Component Designs

### OrdersPage
- **Loading state**: TableSkeleton with 5 rows
- **Error state**: Error card with retry button
- **Empty state**: EmptyState with type "order" and CTA to /products
- **Data state**: Table with columns (Order #, Product, Amount, Status, Date) + Pagination
- **Filter**: Select dropdown for status, syncs with URL search params

### OrderDetailPage
- **Loading state**: CardSkeleton
- **Error state**: "Order not found" with link back to /orders
- **Data state**: Order number (copyable), Status badge, OrderSummary, payment method, commission breakdown card

### Pagination Component
- **Props**: `{ page, totalPages, onPageChange }`
- **States**: disabled prev on first page, disabled next on last page, renders null when totalPages <= 1
- **Uses**: shadcn/ui Button variant="outline" for page buttons

## Data Flow
- `useEffect` + `useSearchParams` in OrdersPage → `orderService.getOrders(params)` → render table
- `useEffect` + `useParams` in OrderDetailPage → `orderService.getOrder(id)` → render detail
- Both pages use `useNavigate` for navigation and `useCallback` for retry

## Mock API
- New handler for `GET /api/orders` **before** the `:orderId` regex
- Returns paginated mock data with 3 sample orders including product info
