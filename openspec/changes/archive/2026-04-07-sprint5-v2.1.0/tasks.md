# Tasks: Sprint 5 — Real Estate & Tourism Frontend (v2.1.0)

**Change**: sprint5-v2.1.0
**Status**: All tasks complete ✅

## Checklist

### Backend Security Fixes
- [x] Fix CodeQL #39 — type confusion in TourPackageController.ts (images array runtime validation)
- [x] Fix CodeQL #40 — type confusion in PropertyController.ts (images array runtime validation)
- [x] Fix Dependabot #37 — file-type >= 21.3.1 via pnpm.overrides

### Frontend Pages
- [x] PropertiesPage — paginated listing with type/city/price filters
- [x] PropertyDetailPage — detail view with image gallery and reservation CTA
- [x] ToursPage — paginated listing with category/duration/price filters
- [x] TourDetailPage — detail view with itinerary, availability, and reservation CTA
- [x] ReservationFlowPage — 3-step wizard (dates → guest data → confirmation)
- [x] MisReservasPage — user reservation dashboard with cancellation

### Frontend Services & Store
- [x] propertyService.ts — HTTP client (list, getById, getAvailability)
- [x] tourService.ts — HTTP client (list, getById, getAvailability)
- [x] reservationService.ts — HTTP client (create, list, getById, cancel)
- [x] reservationStore.ts — Zustand 5 store with useShallow

### Routing
- [x] App.tsx — add 6 new routes (/properties, /properties/:id, /tours, /tours/:id, /reservations/new, /mis-reservas)

### Tests
- [x] sprint5-services.test.ts — Vitest tests for propertyService, tourService, reservationService
- [x] sprint5-store.test.ts — Vitest tests for reservationStore

### CI Fix
- [x] playwright.config.ts — fix webServer for CI (pnpm preview --port 4173)

### PRs
- [x] PR #77 merged to development (frontend pages)
- [x] PR #78 merged to development (security CodeQL fix)
- [x] PR #79 merged to development (dependabot fix)

## Summary
All 20 tasks complete. Sprint 5 fully implemented and merged to development.
