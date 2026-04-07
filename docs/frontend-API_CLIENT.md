# Frontend API Client — Nexo Real

Documentación de los servicios HTTP del frontend React.

---

## Sprint 5 — Real Estate & Tourism Services (v2.1.0)

### propertyService (`src/services/propertyService.ts`)

| Método                        | Endpoint                           | Descripción                                                             |
| ----------------------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| `list(params)`                | `GET /properties`                  | Listado paginado con filtros (type, city, minPrice, maxPrice, bedrooms) |
| `getById(id)`                 | `GET /properties/:id`              | Detalle de propiedad                                                    |
| `getAvailability(id, params)` | `GET /properties/:id/availability` | Disponibilidad por rango de fechas                                      |

### tourService (`src/services/tourService.ts`)

| Método                        | Endpoint                      | Descripción                                                                           |
| ----------------------------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| `list(params)`                | `GET /tours`                  | Listado paginado con filtros (category, minDuration, maxDuration, minPrice, maxPrice) |
| `getById(id)`                 | `GET /tours/:id`              | Detalle del paquete turístico                                                         |
| `getAvailability(id, params)` | `GET /tours/:id/availability` | Fechas disponibles del tour                                                           |

### reservationService (`src/services/reservationService.ts`)

| Método            | Endpoint                         | Descripción                             |
| ----------------- | -------------------------------- | --------------------------------------- |
| `create(payload)` | `POST /reservations`             | Crear reserva (property o tour)         |
| `list(params)`    | `GET /reservations`              | Listar reservas del usuario autenticado |
| `getById(id)`     | `GET /reservations/:id`          | Detalle de reserva                      |
| `cancel(id)`      | `PATCH /reservations/:id/cancel` | Cancelar reserva                        |
