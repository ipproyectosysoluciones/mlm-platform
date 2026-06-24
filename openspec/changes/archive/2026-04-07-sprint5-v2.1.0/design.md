# Design: Sprint 5 — Real Estate & Tourism Frontend (v2.1.0)

**Change**: sprint5-v2.1.0
**Status**: Applied ✅

## Architecture

### Component Structure

```
frontend/src/
├── pages/                          # Route-level components
│   ├── PropertiesPage.tsx          # /properties — listing with filters
│   ├── PropertyDetailPage.tsx      # /properties/:id — detail + gallery
│   ├── ToursPage.tsx               # /tours — listing with filters
│   ├── TourDetailPage.tsx          # /tours/:id — detail + itinerary
│   ├── ReservationFlowPage.tsx     # /reservations/new — 3-step wizard
│   └── MisReservasPage.tsx         # /mis-reservas — user dashboard
├── services/
│   ├── propertyService.ts          # HTTP client for /api/properties
│   ├── tourService.ts              # HTTP client for /api/tours
│   └── reservationService.ts       # HTTP client for /api/reservations
└── stores/
    └── reservationStore.ts         # Zustand 5 wizard state
```

### State Management

**Reservation Wizard State** (Zustand 5):
```typescript
interface ReservationStore {
  step: 1 | 2 | 3
  reservableType: 'property' | 'tour' | null
  reservableId: string | null
  startDate: string | null
  endDate: string | null
  guests: number
  notes: string
  // Actions
  setStep: (step: 1 | 2 | 3) => void
  setReservable: (type: 'property' | 'tour', id: string) => void
  setDates: (start: string, end: string) => void
  setGuests: (guests: number) => void
  setNotes: (notes: string) => void
  reset: () => void
  submit: () => Promise<Reservation>
}
```

### Security Design

Images array validation (CWE-843 fix):
```typescript
// BEFORE (unsafe)
const images = (property.images as string[]) ?? []

// AFTER (runtime-safe)
const rawImages = property.images
const images = Array.isArray(rawImages)
  ? rawImages.filter((img): img is string => typeof img === 'string')
  : []
```

## Key Decisions

1. **useShallow** in reservationStore: prevents unnecessary re-renders when only non-selected state slices change
2. **reservableType discriminator**: single ReservationFlowPage handles both property and tour reservations via URL params
3. **Runtime type guards** over TypeScript casts: safer for untrusted API data, satisfies CodeQL CWE-843
