# Frontend Pages — Nexo Real

Documentación de las páginas del frontend React.

---

## Sprint 5 — Real Estate & Tourism Pages (v2.1.0)

### PropertiesPage (`/properties`)

- **Descripción**: Listado paginado de propiedades inmobiliarias
- **Features**: Filtros por tipo (rental/sale/management), ciudad y rango de precio; cards con imagen, precio, habitaciones, baños y m²
- **Service**: `propertyService.list()`
- **Navegación**: → `PropertyDetailPage`

### PropertyDetailPage (`/properties/:id`)

- **Descripción**: Detalle de propiedad con galería de imágenes
- **Features**: Galería multi-imagen, lista de features, precio destacado, CTA "Reservar ahora"
- **Service**: `propertyService.getById()`
- **Navegación**: → `ReservationFlowPage?type=property&id=:id`

### ToursPage (`/tours`)

- **Descripción**: Listado paginado de paquetes turísticos
- **Features**: Filtros por categoría, duración y precio; cards con imagen, rating, duración e incluye
- **Service**: `tourService.list()`
- **Navegación**: → `TourDetailPage`

### TourDetailPage (`/tours/:id`)

- **Descripción**: Detalle de paquete turístico con itinerario y disponibilidad
- **Features**: Itinerario por días, galería, disponibilidad de fechas, CTA "Reservar ahora"
- **Service**: `tourService.getById()`, `tourService.getAvailability()`
- **Navegación**: → `ReservationFlowPage?type=tour&id=:id`

### ReservationFlowPage (`/reservations/new`)

- **Descripción**: Wizard de reserva en 3 pasos
- **Pasos**: 1) Selección de fechas 2) Datos del huésped 3) Confirmación
- **Store**: `reservationStore` (Zustand 5 con `useShallow`)
- **Services**: `reservationService.create()`
- **Navegación**: ← `PropertyDetailPage` | `TourDetailPage` → `MisReservasPage`

### MisReservasPage (`/mis-reservas`)

- **Descripción**: Dashboard de reservas del usuario autenticado
- **Features**: Lista de reservas con estado (pending/confirmed/cancelled/completed), acción de cancelación
- **Service**: `reservationService.list()`, `reservationService.cancel()`
- **Auth**: Requiere autenticación (redirect a login si no autenticado)
