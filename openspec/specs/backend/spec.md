# Spec: Backend — Rutas y Modelos Sprint 4

## Overview

Especificaciones de los endpoints backend agregados en Sprint 4: achievements, leaderboard, y
comunicación bot. Incluye asociaciones de modelos Sequelize.

**Versión origen**: v2.0.0 (sprint4-complete)

---

## 1. Achievements Endpoints

**REQ-BACK-010**: `GET /api/achievements` MUST retornar la lista de achievements del sistema.

**REQ-BACK-011**: `GET /api/achievements/:userId` MUST retornar los achievements desbloqueados del
usuario.

**Scenario 1-A: Listar achievements**
```
Given: El sistema tiene achievements configurados
When: Se hace GET /api/achievements con token JWT válido
Then: Responde 200 con array de achievement objects
And: Cada achievement tiene id, name, description, badge
```

---

## 2. Leaderboard Endpoints

**REQ-BACK-020**: `GET /api/leaderboard` MUST retornar el ranking de usuarios por puntos/comisiones.

**REQ-BACK-021**: El endpoint MUST soportar paginación.

**Scenario 2-A: Obtener leaderboard**
```
Given: Existen usuarios con actividad en el sistema
When: Se hace GET /api/leaderboard con token JWT válido
Then: Responde 200 con array ordenado de usuarios con su ranking
And: Incluye posición, nombre, avatar, puntos
```

---

## 3. Bot Endpoints

**REQ-BACK-030**: `POST /api/bot/notify` MUST enviar notificación proactiva via el bot a un usuario.

**REQ-BACK-031**: Todos los endpoints `/api/bot/*` MUST requerir header `x-bot-secret` válido.

**REQ-BACK-032**: Requests sin `x-bot-secret` válido MUST retornar 401.

**Scenario 3-A: Notificación proactiva autenticada**
```
Given: El backend quiere notificar a un usuario via WhatsApp
When: POST /api/bot/notify con x-bot-secret correcto y { userId, message }
Then: Responde 200 y el bot envía el mensaje al usuario
```

**Scenario 3-B: Request sin autenticación**
```
Given: Una request a /api/bot/* sin x-bot-secret
When: El middleware procesa la request
Then: Responde 401 Unauthorized
```

---

## 4. Asociaciones de Modelos

**REQ-BACK-040**: Achievement MUST tener asociación `hasMany` con UserAchievement.

**REQ-BACK-041**: Badge MUST tener asociación con Achievement.

**REQ-BACK-042**: User MUST tener asociación `hasMany` con UserAchievement.

---

**Fuente**: openspec/changes/archive/2026-04-06-sprint4-complete/spec.md (Feature 2)
**Versión**: v2.0.0
**Archived**: 2026-04-06

---

## Sprint 5: Backend Security (v2.1.0)

**Versión origen**: v2.1.0 (sprint5-v2.1.0)

### NFR-01: Security — Runtime Type Guards

**REQ-BACK-510**: `PropertyController` MUST validate images arrays with `Array.isArray()` + `filter()` type guard in ALL handlers (upload AND delete).

**REQ-BACK-511**: `TourPackageController` MUST validate images arrays with `Array.isArray()` + `filter()` type guard in ALL handlers (upload AND delete).

**REQ-BACK-512**: MUST NOT use unsafe TypeScript casts (`as string[]`) on untrusted data read from the database in image handlers.

### Property & Tour API Endpoints

**REQ-BACK-520**: `GET /api/properties` MUST return paginated list of properties with optional filters (type, city, minPrice, maxPrice, bedrooms).

**REQ-BACK-521**: `GET /api/properties/:id` MUST return full property detail including images array.

**REQ-BACK-522**: `GET /api/tours` MUST return paginated list of tour packages with optional filters (category, minDuration, maxDuration, minPrice, maxPrice).

**REQ-BACK-523**: `GET /api/tours/:id` MUST return full tour detail including itinerary and availability.

### Reservation Endpoints

**REQ-BACK-530**: `POST /api/reservations` MUST create a reservation for a property or tour (requires auth).

**REQ-BACK-531**: `GET /api/reservations/my` MUST return the authenticated user's reservations with optional status filter.

**REQ-BACK-532**: `PATCH /api/reservations/:id/cancel` MUST cancel a pending/confirmed reservation (requires auth, owner only).

---

**Fuente**: openspec/changes/archive/2026-04-07-sprint5-v2.1.0/spec.md
**Versión**: v2.1.0
**Archived**: 2026-04-07

---

## Sprint 6: Admin CRUD Endpoints (v2.2.0)

**Versión origen**: v2.2.0 (sprint6)

### Admin Property Endpoints

**REQ-BACK-610**: `GET /api/admin/properties` MUST return paginated list of ALL properties (active + inactive) for admin role.

**REQ-BACK-611**: `POST /api/admin/properties` MUST create a new property. Requires role `admin`.

**REQ-BACK-612**: `PUT /api/admin/properties/:id` MUST update a property. Requires role `admin`.

**REQ-BACK-613**: `DELETE /api/admin/properties/:id` MUST soft-delete a property (mark inactive, do NOT remove from DB). Requires role `admin`.

### Admin Tour Endpoints

**REQ-BACK-620**: `GET /api/admin/tours` MUST return paginated list of ALL tours for admin role.

**REQ-BACK-621**: `POST /api/admin/tours` MUST create a new tour package. Requires role `admin`.

**REQ-BACK-622**: `PUT /api/admin/tours/:id` MUST update a tour package. Requires role `admin`.

**REQ-BACK-623**: `DELETE /api/admin/tours/:id` MUST soft-delete a tour package. Requires role `admin`.

### Bot Endpoints (Sprint 6 Extension)

**REQ-BACK-630**: `GET /api/bot/properties` MUST return up to 5 active properties, filterable by type and city, authenticated by `BOT_SECRET`.

**REQ-BACK-631**: `GET /api/bot/tours` MUST return up to 5 active tours, filterable by destination and maxPrice, authenticated by `BOT_SECRET`.

**REQ-BACK-632**: Both bot endpoints MUST return 401 Unauthorized when `BOT_SECRET` is missing or invalid.

---

## Sprint 6: Binary Balance Migration (v2.2.0)

### Requirement: Migración Sequelize — Renombrar condition_type

El sistema MUST proveer una migración Sequelize que ejecute un `UPDATE` en la tabla `Achievements` cambiando todos los registros donde `condition_type = 'binary_balance'` a `condition_type = 'network_balance'`. La migración MUST tener una función `down()` que restaure el valor original.

**Scenario: Migración up exitosamente**
```
Given existen registros en Achievements con condition_type = 'binary_balance'
When se ejecuta pnpm sequelize db:migrate
Then todos esos registros tienen condition_type = 'network_balance'
And no se eliminan registros ni se alteran otros campos
```

**Scenario: Rollback con migración down**
```
Given la migración fue ejecutada y existen registros con network_balance
When se ejecuta pnpm sequelize db:migrate:undo
Then todos los registros con condition_type = 'network_balance' vuelven a 'binary_balance'
```

### Requirement: Actualización del Modelo Achievement

El modelo `Achievement.ts` MUST actualizar el enum de `condition_type` reemplazando `'binary_balance'` por `'network_balance'`. El modelo MUST NOT referenciar el valor `'binary_balance'` tras el cambio.

### Requirement: Actualización Frontend en achievementService.ts

El servicio `achievementService.ts` MUST actualizar el tipo TypeScript correspondiente de `'binary_balance'` a `'network_balance'`. El sistema MUST NOT compilar si queda alguna referencia a `'binary_balance'`.

---

**Fuente**: openspec/changes/archive/2026-04-07-sprint6/specs/binary-balance-migration/spec.md
**Versión**: v2.2.0
**Archived**: 2026-04-07

---

## Sprint 7: Bot Stability & Health Endpoint (v2.3.0 → v2.3.5)

**Versión origen**: v2.3.0 (sprint7) + v2.3.5 (patch)

### Bot Health Endpoint (Phase 3)

**REQ-BACK-710**: `GET /api/bot/health` MUST return HTTP 200 with JSON body `{ status: "ok", uptime: number, version: string }`.

**REQ-BACK-711**: The `/api/bot/health` endpoint MUST NOT require authentication (no `x-bot-secret` header required).

**REQ-BACK-712**: The health endpoint MUST be registered BEFORE the `authenticateBot` middleware in `bot.routes.ts`.

**REQ-BACK-713**: Response time for `/api/bot/health` MUST be < 200ms under normal conditions.

**REQ-BACK-714**: The health endpoint MUST return HTTP 200 even when OpenAI is unreachable (health ≠ dependency health).

**Scenario 710-A: Health check returns ok**
```
Given: Bot service is running
When: GET /api/bot/health is called without any headers
Then: HTTP 200 is returned
And: body contains { status: "ok", uptime: <positive number>, version: <semver string> }
And: response time is < 200ms
```

**Scenario 710-B: Health check during OpenAI degradation**
```
Given: OpenAI service is unreachable (timeout)
When: GET /api/bot/health is called
Then: HTTP 200 is still returned
And: body contains { status: "ok" } with uptime present
```

---

### OpenAI Retry Logic — withRetry (Phase 3)

**REQ-BACK-720**: All OpenAI API calls in `BotController.ts` MUST be wrapped with a `withRetry` helper.

**REQ-BACK-721**: `withRetry` MUST retry up to 3 times on timeout using exponential backoff: 1s, 2s, 4s.

**REQ-BACK-722**: After 3 failed attempts, the bot MUST send a friendly fallback message to the user and log the full error context (userId, timestamp, attemptCount, errorCode).

**Scenario 720-A: OpenAI timeout → success on 2nd attempt**
```
Given: OpenAI mock returns timeout on attempt 1, success on attempt 2
When: Bot processes a message
Then: Bot responds with the AI-generated message
And: Exactly 2 attempts were made
```

**Scenario 720-B: 3 retries exhausted**
```
Given: OpenAI mock returns timeout on all 3 attempts
When: Bot processes a message
Then: Bot sends friendly fallback: "Estamos experimentando problemas técnicos. Por favor intenta en unos minutos."
And: Error is logged with full context (userId, timestamp, attemptCount, errorCode)
```

---

### Bot Demo Integration Tests (Phase 3)

**REQ-BACK-730**: Bot integration tests MUST verify the 3-turn conversation flow using recorded WhatsApp message fixtures (no live Baileys connection in CI).

**REQ-BACK-731**: Test location MUST be `backend/src/__tests__/bot/`.

**Scenario 730-A: Full demo flow completes**
```
Given: Fixture — user asks about a property by name or ID
When: Bot handler processes the message
Then: Bot responds with property details
When: Fixture — user requests to schedule a visit
Then: Bot responds with available slots or calendar prompt
When: Fixture — user confirms a slot
Then: Bot responds with confirmation including date, time, and property reference
```

**Scenario 730-B: User abandons flow at step 2**
```
Given: Bot has responded with property details
When: No follow-up message arrives within session timeout
Then: Bot state resets without error
```

---

### Bot Error Handling — WhatsApp Disconnect (Phase 3)

**REQ-BACK-740**: If the WhatsApp connection drops, the bot MUST NOT crash.

**REQ-BACK-741**: The bot MUST log the disconnect event and attempt reconnection.

**Scenario 740-A: Disconnect does not crash bot**
```
Given: WhatsApp connection mock fires disconnect event
When: Bot handles the event
Then: Process remains alive (no uncaught exception)
And: A reconnection attempt is logged
```

---

### v2.3.5 Patch Fixes

**REQ-BACK-750**: `PayPalService` MUST NOT reference `crc32` before definition. The `crc32` helper MUST be defined before any function that calls it (hoisting fix).

**REQ-BACK-751**: The axios SSRF vulnerability (CVE-2024-28849) MUST be resolved by upgrading axios to a patched version.

**Scenario 750-A: PayPalService initializes without ReferenceError**
```
Given: Backend starts and PayPalService is loaded
When: No PayPal transaction is triggered
Then: No ReferenceError is thrown during module initialization
```

---

### NFR — Sprint 7 Backend

| Requirement | Value |
|---|---|
| Health endpoint response time | < 200ms |
| OpenAI retry strategy | Exponential backoff: 1s, 2s, 4s (max 3 attempts) |
| WhatsApp CI isolation | MUST use recorded fixtures — NEVER connect Baileys in CI |
| Error log format | Structured JSON with: timestamp, userId, attemptCount, errorCode |
| JSDoc | ES+EN on all new/modified backend files in Sprint 7 |

---

**Fuente**: openspec/changes/archive/2026-04-09-sprint7-v2.3.5/ (Phase 3)
**Versión**: v2.3.5
**Archived**: 2026-04-10

---

## Backend Authorization Test Coverage (backend-test-gaps-authz)

**Versión origen**: backend-test-gaps-authz
**Change**: backend-test-gaps-authz — test-only, no implementation changes

### Requirement: PaymentMercadoPagoController Refund Authorization Test

The system SHALL verify that the refund endpoint returns 403 FORBIDDEN when an authenticated user who is not the order buyer, not the order vendor, and not an admin attempts to refund a payment.

#### Scenario: Refund by unauthorized user returns 403

- GIVEN an authenticated user with role 'user' (not admin)
- AND a marketplace order exists with `userId: 'user-uuid'`, `vendorId: 'vendor-1'`, `notes: 'mercadopago:888777666'`
- AND the requesting user's ID is different from both `order.userId` and `order.vendorId`
- WHEN the user calls POST /api/payment/mercadopago/refund with `{ paymentId: '888777666' }`
- THEN the response SHALL have status 403
- AND the response body SHALL contain error code 'FORBIDDEN'
- AND the refund service SHALL NOT be called

---

### Requirement: ShipmentTrackingController AddTracking Authorization Tests

The system SHALL verify that the addTracking endpoint returns 403 FORBIDDEN when an authenticated user who is not the order owner and not an admin attempts to add tracking to an order.

#### Scenario: Add tracking by non-owner non-admin returns 403

- GIVEN an authenticated user with role 'user' (not admin)
- AND an order exists with `userId: 'owner-uuid'`
- AND the requesting user's ID is different from `order.userId`
- WHEN the user calls PUT /api/orders/:id/shipping with valid tracking data
- THEN the response SHALL have status 403
- AND the response body SHALL contain error code 'FORBIDDEN'
- AND the ShipmentTrackingService.addTracking SHALL NOT be called

#### Scenario: Add tracking by order owner returns 201 (happy path)

- GIVEN an authenticated user with role 'user'
- AND an order exists with `userId` matching the requesting user's ID
- WHEN the user calls PUT /api/orders/:id/shipping with valid tracking data
- THEN the response SHALL have status 201
- AND the response body SHALL contain the created tracking data
- AND the ShipmentTrackingService.addTracking SHALL be called

#### Scenario: Add tracking by admin returns 201 (happy path)

- GIVEN an authenticated user with role 'admin'
- AND an order exists with `userId` different from the requesting user's ID
- WHEN the user calls PUT /api/orders/:id/shipping with valid tracking data
- THEN the response SHALL have status 201
- AND the response body SHALL contain the created tracking data

---

### Requirement: ShipmentTrackingController GetTracking Authorization Tests

The system SHALL verify that the getTracking endpoint returns 403 FORBIDDEN when an authenticated user who is not the order owner and not an admin attempts to view tracking for an order.

#### Scenario: Get tracking by non-owner non-admin returns 403

- GIVEN an authenticated user with role 'user' (not admin)
- AND an order exists with `userId: 'owner-uuid'`
- AND the requesting user's ID is different from `order.userId`
- WHEN the user calls GET /api/orders/:id/tracking
- THEN the response SHALL have status 403
- AND the response body SHALL contain error code 'FORBIDDEN'
- AND the ShipmentTrackingService.getByOrder SHALL NOT be called

#### Scenario: Get tracking by order owner returns 200 (happy path)

- GIVEN an authenticated user with role 'user'
- AND an order exists with `userId` matching the requesting user's ID
- AND a shipment tracking record exists for the order
- WHEN the user calls GET /api/orders/:id/tracking
- THEN the response SHALL have status 200
- AND the response body SHALL contain the tracking data

#### Scenario: Get tracking by admin returns 200 (happy path)

- GIVEN an authenticated user with role 'admin'
- AND an order exists with `userId` different from the requesting user's ID
- AND a shipment tracking record exists for the order
- WHEN the user calls GET /api/orders/:id/tracking
- THEN the response SHALL have status 200
- AND the response body SHALL contain the tracking data

---

### Requirement: InvoiceController GetInvoiceById Authorization Test

The system SHALL verify that the getInvoiceById endpoint returns 403 FORBIDDEN when a non-admin user requests an invoice belonging to another user.

#### Scenario: Get invoice by non-owner non-admin returns 403

- GIVEN an authenticated user with role 'user' (not admin)
- AND an invoice exists with `userId: 'owner-uuid'`
- AND the requesting user's ID is different from `invoice.userId`
- WHEN the user calls GET /api/invoices/:id
- THEN the response SHALL have status 403
- AND the response body SHALL contain error code 'INVOICE_FORBIDDEN'
- AND the InvoiceService.findByIdForUser SHALL be called and throw AppError(403)

#### Scenario: Get invoice by owner returns 200 (happy path)

- GIVEN an authenticated user with role 'user'
- AND an invoice exists with `userId` matching the requesting user's ID
- WHEN the user calls GET /api/invoices/:id
- THEN the response SHALL have status 200
- AND the response body SHALL contain the invoice data

#### Scenario: Get invoice by admin returns 200 (happy path)

- GIVEN an authenticated user with role 'admin'
- AND an invoice exists with `userId` different from the requesting user's ID
- WHEN the user calls GET /api/invoices/:id
- THEN the response SHALL have status 200
- AND the response body SHALL contain the invoice data

---

### Requirement: InvoiceController CancelInvoice Authorization Test

The system SHALL verify that the cancelInvoice endpoint returns 403 FORBIDDEN when a non-admin user attempts to cancel an invoice belonging to another user.

#### Scenario: Cancel invoice by non-owner non-admin returns 403

- GIVEN an authenticated user with role 'user' (not admin)
- AND an invoice exists with `userId: 'owner-uuid'` and status 'draft'
- AND the requesting user's ID is different from `invoice.userId`
- WHEN the user calls DELETE /api/invoices/:id
- THEN the response SHALL have status 403
- AND the response body SHALL contain error code 'INVOICE_FORBIDDEN'
- AND the InvoiceService.cancel SHALL be called and throw AppError(403)

#### Scenario: Cancel invoice by owner returns 200 (happy path)

- GIVEN an authenticated user with role 'user'
- AND an invoice exists with `userId` matching the requesting user's ID and status 'draft'
- WHEN the user calls DELETE /api/invoices/:id
- THEN the response SHALL have status 200
- AND the response body SHALL contain the cancelled invoice data

#### Scenario: Cancel invoice by admin returns 200 (happy path)

- GIVEN an authenticated user with role 'admin'
- AND an invoice exists with `userId` different from the requesting user's ID and status 'draft'
- WHEN the user calls DELETE /api/invoices/:id
- THEN the response SHALL have status 200
- AND the response body SHALL contain the cancelled invoice data

---

**Fuente**: openspec/changes/backend-test-gaps-authz/specs/backend/spec.md
**Versión**: backend-test-gaps-authz
**Archived**: 2026-09-01
