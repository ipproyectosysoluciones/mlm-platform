# Spec: Sprint 5 — Real Estate & Tourism Frontend (v2.1.0)

**Change**: sprint5-v2.1.0
**Status**: Applied ✅

## Requirements

### FR-01: Property Listings
- **MUST** display paginated list of properties (rental/sale/management)
- **MUST** support filtering by type, city, price range, and bedrooms
- **MUST** show property card with image, price, bedrooms, bathrooms, area

### FR-02: Property Detail
- **MUST** display full property information with image gallery
- **MUST** show property features list
- **MUST** provide CTA to start reservation flow

### FR-03: Tour Packages
- **MUST** display paginated list of tour packages
- **MUST** support filtering by category, duration range, price range
- **MUST** show tour card with image, category, duration, price

### FR-04: Tour Detail
- **MUST** display full tour information with itinerary
- **MUST** show availability calendar
- **MUST** provide CTA to start reservation flow

### FR-05: Reservation Wizard
- **MUST** implement 3-step wizard: dates → guest data → confirmation
- **MUST** support both property and tour reservations (reservableType)
- **MUST** persist wizard state in Zustand store with useShallow
- **MUST** submit via reservationService.create()

### FR-06: My Reservations
- **MUST** show user's reservation list with status badges
- **MUST** allow cancellation of pending/confirmed reservations
- **MUST** require authentication (redirect to login if unauthenticated)

### NFR-01: Security
- **MUST** validate images array with runtime type guard (Array.isArray + filter)
- **MUST** not use unsafe TypeScript casts on untrusted data

### NFR-02: Code Quality
- **MUST** include bilingual JSDoc (@fileoverview ES+EN) in all new files
- **MUST** have Vitest tests for services and store

## Scenarios

### Scenario: Filter properties by city
Given the user is on /properties
When they type "Bogotá" in the city filter
Then the list refreshes showing only properties in Bogotá

### Scenario: Reserve a property
Given the user is on /properties/:id
When they click "Reservar ahora"
Then they are redirected to /reservations/new?type=property&id=:id
And the wizard starts at Step 1 (date selection)

### Scenario: Cancel a reservation
Given the user is on /mis-reservas
When they click "Cancelar" on a pending reservation
Then a confirmation dialog appears
And on confirm, the reservation status changes to "cancelled"
