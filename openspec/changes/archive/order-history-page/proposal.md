# Proposal: Order History Page

## Intent

Users cannot review past orders or commissions after checkout. Admins lack order management. This drives support tickets and erodes trust.

## Scope

### In Scope
- Backend: fix GET /api/orders response mapping to include product/purchase data
- Frontend: /orders — paginated list with status filter (user + admin views)
- Frontend: /orders/:id — detail with product, status, commission breakdown
- Navigation: "Orders" in user and admin menus/dashboard
- Mock API: add GET /api/orders handler for E2E
- Empty/null states for both pages

### Out of Scope
- Cancel/refund actions from list or detail
- Invoice download or email resend
- Advanced filtering (date range, amount range)
- Sorting or column reordering
- Real-time status updates

## Approach
1. Backend: Fix getOrders() to pass through included Product/Purchase
2. List page: Lazy route, status filter via search params, paginated Table
3. Detail page: Lazy route reusing OrderSummary, OrderStatus, PriceDisplay
4. Navigation: Add "Orders" to user nav and admin dropdown + quick-access cards
5. Mock API: Add GET /api/orders handler before :orderId regex
6. Pagination: Build reusable shadcn/ui component

## Risk Level: Low

## Success Criteria
- [ ] GET /api/orders returns product/purchase per order
- [ ] /orders paginated with status filter; users see own orders
- [ ] /orders/:id shows full detail (product, status, commissions)
- [ ] Admin nav includes Orders link
- [ ] Empty state for users with no orders
- [ ] Existing routes unchanged
