# Spec: Frontend — Tests Sprint 4

## Overview

Especificaciones de cobertura de tests del frontend agregados en Sprint 4. Cubren componentes de
leaderboard, achievements, servicios y configuración de Vitest.

**Versión origen**: v2.0.0 (sprint4-complete)
**Baseline**: 155 tests → 210 tests (+55)

---

## 1. Componentes Leaderboard

**REQ-TEST-010**: El componente `Podium` MUST tener al menos 12 tests cubriendo: renderizado del
podio, posiciones top 3, casos con menos de 3 usuarios, avatares, scores.

**REQ-TEST-011**: El componente `RankingTable` MUST tener al menos 12 tests cubriendo: renderizado
de filas, paginación, ranking del usuario actual resaltado, columnas.

**REQ-TEST-012**: El componente `UserRankBanner` MUST tener al menos 8 tests cubriendo: datos del
usuario, posición, cambio respecto al período anterior.

---

## 2. AchievementsPage

**REQ-TEST-020**: `AchievementsPage` MUST tener al menos 12 tests cubriendo: renderizado de la
página, lista de achievements, achievements desbloqueados vs bloqueados, badges, loading state.

---

## 3. Services

**REQ-TEST-030**: `services.test.ts` MUST cubrir los nuevos endpoints de achievements y leaderboard
(al menos 9 tests adicionales).

---

## 4. Configuración Vitest

**REQ-TEST-040**: `vitest.config.ts` MUST incluir `singleFork: true` para compatibilidad con
Vitest 4 en el entorno de CI.

**Scenario 4-A: Todos los tests pasan**
```
Given: 210 tests definidos en el frontend
When: Se ejecuta `pnpm test` en el workspace frontend
Then: Todos los 210 tests pasan sin errores
And: No hay tests en estado "skipped" por problemas de configuración
```

---

**Fuente**: openspec/changes/archive/2026-04-06-sprint4-complete/spec.md (Feature 3)
**Versión**: v2.0.0
**Archived**: 2026-04-06

---

## Sprint 5: Real Estate & Tourism Frontend (v2.1.0)

**Versión origen**: v2.1.0 (sprint5-v2.1.0)

### FR-01: Property Listings

**REQ-FRONT-510**: `PropertiesPage` MUST display paginated list of properties (rental/sale/management).

**REQ-FRONT-511**: `PropertiesPage` MUST support filtering by type, city, price range, and bedrooms.

**REQ-FRONT-512**: `PropertiesPage` MUST show property card with image, price, bedrooms, bathrooms, area.

### FR-02: Property Detail

**REQ-FRONT-520**: `PropertyDetailPage` MUST display full property information with image gallery.

**REQ-FRONT-521**: `PropertyDetailPage` MUST show property features list.

**REQ-FRONT-522**: `PropertyDetailPage` MUST provide CTA to start reservation flow (navigates to `/reservations/new?type=property&id=:id`).

### FR-03: Tour Packages

**REQ-FRONT-530**: `ToursPage` MUST display paginated list of tour packages.

**REQ-FRONT-531**: `ToursPage` MUST support filtering by category, duration range, price range.

**REQ-FRONT-532**: `ToursPage` MUST show tour card with image, category, duration, price.

### FR-04: Tour Detail

**REQ-FRONT-540**: `TourDetailPage` MUST display full tour information with itinerary.

**REQ-FRONT-541**: `TourDetailPage` MUST show availability calendar.

**REQ-FRONT-542**: `TourDetailPage` MUST provide CTA to start reservation flow.

### FR-05: Reservation Wizard

**REQ-FRONT-550**: `ReservationFlowPage` MUST implement 3-step wizard: `dates → guests → confirm`.

**REQ-FRONT-551**: Wizard MUST support both property and tour reservations via `reservableType` discriminator.

**REQ-FRONT-552**: Wizard state MUST be persisted in `reservationStore` (Zustand 5) using `useShallow`.

**REQ-FRONT-553**: Wizard MUST submit via `reservationService.create()`.

### FR-06: My Reservations

**REQ-FRONT-560**: `MisReservasPage` MUST show user's reservation list with status badges.

**REQ-FRONT-561**: `MisReservasPage` MUST allow cancellation of pending/confirmed reservations with confirmation dialog.

**REQ-FRONT-562**: `/mis-reservas` route MUST require authentication (protected via `<ProtectedRoute>`).

### NFR-02: Code Quality (Sprint 5)

**REQ-FRONT-570**: All new frontend files MUST include bilingual JSDoc (`@fileoverview` ES+EN).

**REQ-FRONT-571**: Vitest tests MUST cover `propertyService`, `tourService`, `reservationService`, and `reservationStore`.

### Scenarios

**Scenario: Filter properties by city**
```
Given the user is on /properties
When they type "Bogotá" in the city filter
Then the list refreshes showing only properties in Bogotá
```

**Scenario: Reserve a property**
```
Given the user is on /properties/:id
When they click "Reservar ahora"
Then they are redirected to /reservations/new?type=property&id=:id
And the wizard starts at Step 1 (date selection)
```

**Scenario: Cancel a reservation**
```
Given the user is on /mis-reservas
When they click "Cancelar" on a pending reservation
Then a confirmation dialog appears
And on confirm, the reservation status changes to "cancelled"
```

---

**Fuente**: openspec/changes/archive/2026-04-07-sprint5-v2.1.0/spec.md
**Versión**: v2.1.0
**Archived**: 2026-04-07

---

## Sprint 6: Admin Dashboard (v2.2.0)

**Versión origen**: v2.2.0 (sprint6)

### Requirement: CRUD Propiedades (Admin)

El sistema MUST proveer páginas para crear, editar, eliminar y cambiar el estado activo/inactivo de propiedades. El soft-delete MUST marcar el registro como inactivo sin eliminar de la base de datos.

**Scenario: Admin crea una propiedad**
```
Given el usuario tiene rol `admin` y está autenticado
When envía el formulario con datos válidos de una propiedad nueva
Then la propiedad es persistida y aparece en la lista con estado activo
And se muestra notificación de éxito
```

**Scenario: Admin elimina (soft-delete) una propiedad**
```
Given existe una propiedad y el admin confirma la eliminación
When el admin ejecuta la acción eliminar
Then la propiedad es marcada como inactiva (soft-delete) y deja de aparecer en la lista activa
And el registro persiste en la base de datos
```

**Scenario: Acceso denegado a rol no-admin**
```
Given un usuario con rol `affiliate` intenta acceder a AdminPropertiesPage
When intenta navegar a la ruta protegida
Then es redirigido con error 403 o al dashboard de afiliado
```

### Requirement: CRUD Tours/Paquetes Turísticos (Admin)

El sistema MUST proveer las mismas operaciones CRUD y toggle que para propiedades, aplicadas a la entidad tour.

### Requirement: Vista de Reservas Admin

El sistema MUST mostrar todas las reservas del sistema con filtros por tipo, status, userId, vendorId y rango de fechas.

### Requirement: Vista de Reservas y Comisiones para Afiliado

El sistema MUST mostrar al afiliado SOLO sus propias reservas y comisiones, filtradas por el userId extraído del token JWT. El sistema MUST NOT exponer reservas o comisiones de otros usuarios.

**Scenario: Afiliado no puede ver datos de otros usuarios**
```
Given el afiliado manipula la URL o parámetros de filtro con un userId ajeno
When realiza la consulta
Then el sistema ignora el userId del parámetro y usa el del token JWT
```

### Requirement: Paginación en Todas las Listas

Todas las listas del admin dashboard MUST implementar paginación del lado del servidor. La UI MUST mostrar controles de página (anterior/siguiente y número de página).

### Requirement: Protección de Rutas por Rol

Las rutas de CRUD admin MUST estar protegidas con middleware que verifique rol `admin`. Las rutas de afiliado MUST verificar rol `affiliate` o `admin`.

**Scenario: Token expirado en ruta protegida**
```
Given el usuario tiene un token JWT expirado
When intenta acceder a cualquier ruta del admin dashboard
Then es redirigido al login con mensaje de sesión expirada
```

---

## Sprint 6: i18n Cleanup (v2.2.0)

### Requirement: Eliminación de Claves Duplicadas en es.json y en.json

El sistema MUST eliminar todas las claves duplicadas de los namespaces `nav`, `twoFactor` y `common` en `es.json` y `en.json`. Cuando existan dos versiones de una clave, MUST conservarse la versión más completa (mayor número de keys).

### Requirement: Renombrar Clave admin.ratio → admin.networkDistribution

El sistema MUST reemplazar la clave `admin.ratio` por `admin.networkDistribution` en `es.json` y `en.json`. Los valores MUST ser "Distribución de Red" (es) y "Network Distribution" (en).

### Requirement: Eliminación de DashboardStreaming.tsx

El sistema MUST eliminar el archivo `frontend/src/pages/DashboardStreaming.tsx`. Este archivo MUST NOT tener ninguna ruta activa, import, ni referencia en el codebase al momento de su eliminación.

---

**Fuente**: openspec/changes/archive/2026-04-07-sprint6/specs/admin-dashboard/spec.md + specs/i18n-cleanup/spec.md
**Versión**: v2.2.0
**Archived**: 2026-04-07

---

## Sprint 7: UI/UX Rebranding + Testing (v2.3.0 / v2.3.5)

**Versión origen**: v2.3.0 (sprint7) / v2.3.5 (patch)
**Fecha**: 2026-04-08 — 2026-04-09

### Domain: `src/pages/landing/NexoRealLanding` (New)

#### Requirement: Landing Page Nexo Real

La ruta `/` MUST renderizar `NexoRealLanding` (no `ProductCatalog`). La ruta `/products` MUST mantenerse para `ProductCatalog`.

**REQ-FRONT-710**: `NexoRealLanding` MUST renderizar un hero con `h1`, subtítulo `p`, y barra de búsqueda con botón "Buscar / Search".

**REQ-FRONT-711**: `NexoRealLanding` MUST renderizar grid de 3–4 `PropertyCard` (featured properties). Grid 1 col en 320px → 2 en 768px → 3–4 en 1280px+.

**REQ-FRONT-712**: `NexoRealLanding` MUST renderizar grid de 2–3 `TourCard` (featured tours). Sección visualmente distinta a propiedades.

**REQ-FRONT-713**: `NexoRealLanding` MUST renderizar sección CTA con botón que navega a `/register` (SPA, sin reload).

**REQ-FRONT-714**: `NexoRealLanding` MUST renderizar footer con copyright, toggle locale y ≥1 link de navegación. MUST NOT contener texto streaming/MLM.

**REQ-FRONT-715**: Todos los strings MUST ser via `t()` del sistema i18n (ES+EN).

**Scenario: Route / renderiza NexoRealLanding**
```
Given el usuario navega a /
When la página carga
Then NexoRealLanding es renderizado con hero, property grid, tour grid, CTA y footer
And no hay referencia a streaming o MLM en el DOM
```

---

### Domain: `src/components/property/PropertyCard` (New)

#### Requirement: PropertyCard Component

**REQ-FRONT-720**: `PropertyCard` MUST aceptar props: `property: Property`, `variant: 'grid' | 'list'`.

**REQ-FRONT-721**: Grid variant: imagen arriba, detalles abajo. List variant: imagen izquierda, detalles derecha.

**REQ-FRONT-722**: MUST mostrar: título, precio, ubicación, imagen, habitaciones, baños, m².

**REQ-FRONT-723**: Si `imageUrl` es null/undefined, MUST renderizar imagen placeholder sin crash.

---

### Domain: `src/components/tour/TourCard` (New)

#### Requirement: TourCard Component

**REQ-FRONT-730**: `TourCard` MUST aceptar props: `tour: TourPackage`, `variant: 'grid' | 'list'`.

**REQ-FRONT-731**: MUST mostrar: título, precio, duración, imagen, badge de categoría visible.

---

### Domain: `src/pages/auth/Login` + `Register` (Modified)

#### Requirement: Nexo Real Branding — No Streaming References

**REQ-FRONT-740**: `Login.tsx` MUST NOT contener texto referenciando streaming, binary compensation, o MLM genérico.

**REQ-FRONT-741**: `Login.tsx` MUST usar paleta Tailwind `emerald` + `slate`. MUST ser bilingüe via i18n.

**REQ-FRONT-742**: `Register.tsx` MUST cumplir los mismos requisitos que Login (REQ-FRONT-740, REQ-FRONT-741).

---

### Domain: `src/components/layout/Navbar` (Modified)

#### Requirement: Sidebar con Navegación Nexo Real

**REQ-FRONT-750**: `Navbar.tsx` MUST mostrar nav items: Properties, Tours, Reservations, Dashboard, Wallet, Profile.

**REQ-FRONT-751**: MUST NOT renderizar "Premium Streaming" ni gradiente purple-to-blue.

**REQ-FRONT-752**: MUST usar gradiente emerald-600.

---

### Domain: Stores Zustand (New)

**REQ-FRONT-760**: `frontend/src/stores/propertiesStore.ts` MUST exportar store Zustand con: `featuredProperties`, `isLoading`, `error`, `fetchFeatured()` → GET /api/properties?featured=true.

**REQ-FRONT-761**: `frontend/src/stores/toursStore.ts` MUST exportar store Zustand con: `featuredTours`, `isLoading`, `error`, `fetchFeatured()` → GET /api/tours?featured=true.

---

### Domain: Testing — Sprint 7 (New/Modified)

#### Requirement: Vitest Coverage Gate

**REQ-FRONT-770**: `frontend/vitest.config.ts` MUST incluir bloque `coverage` con provider `v8`, thresholds 90% (statements/branches/functions/lines), excludes: `*.config.*`, `*.d.ts`, `src/main.tsx`, `src/vite-env.d.ts`, `src/test/**`.

**REQ-FRONT-771**: Baseline de cobertura MUST estar documentado en `docs/coverage-baseline.txt`.

#### Requirement: Unit Tests Sprint 7

**REQ-FRONT-780**: `frontend/src/test/PropertyCard.test.tsx` MUST tener ≥3 tests (grid/list variants + missing image fallback).

**REQ-FRONT-781**: `frontend/src/test/TourCard.test.tsx` MUST tener ≥3 tests (grid/list + category badge).

**REQ-FRONT-782**: `frontend/src/test/NexoRealLanding.test.tsx` MUST tener ≥4 tests (hero, property section, tours section, no streaming text).

**REQ-FRONT-783**: `frontend/src/test/reservationStore.test.ts` MUST tener ≥20 tests (coverage gap closure).

**REQ-FRONT-784**: `frontend/src/test/walletStore.test.ts` MUST tener ≥22 tests (coverage gap closure).

#### Requirement: E2E Playwright Sprint 7

**REQ-FRONT-790**: `frontend/e2e/property-search.spec.ts` — E2E: landing → búsqueda → ≥1 PropertyCard en resultados → click → detail page renderiza título + precio.

**REQ-FRONT-791**: `frontend/e2e/reservation-wizard.spec.ts` — E2E: usuario autenticado → Reserve en property detail → wizard 3 pasos → success message. También: back nav preserva datos + validación Step 1 vacío.

**REQ-FRONT-792**: `frontend/e2e/i18n-toggle.spec.ts` — E2E: landing EN toggle → h1 cambia → ES toggle → vuelve. Sin page reload.

**REQ-FRONT-793**: `frontend/e2e/responsive.spec.ts` — E2E: landing en 375×667, 768×1024, 1280×800 — sin horizontal overflow, column count correcto.

---

### Non-Functional Requirements — Sprint 7

| Requirement | Valor |
|---|---|
| Responsive breakpoints | 375px, 768px, 1280px, 1440px (mínimo) |
| Paleta de colores | Tailwind `emerald` + `slate` ONLY |
| i18n | Todos los strings via t() (ES+EN) |
| JSDoc | Bilingüe ES+EN en todos los archivos nuevos/modificados |
| Sin referencias streaming/MLM | MUST NOT en ningún archivo nuevo o modificado |

---

### Sprint 7 Patch — Bug Fixes (v2.3.5)

**REQ-FRONT-795**: `frontend/src/pages/ReservationFlowPage.tsx` — `handleConfirm` MUST envolver `await confirmReservation()` en `try/catch` para manejar el error intencional re-lanzado por el store. (El store diseñado así — NO eliminar el try/catch.)

**REQ-FRONT-796**: `frontend/src/pages/PropertiesPage.tsx` — navigate MUST usar ruta en inglés `/properties/${id}` (no `/propiedades/${id}`).

---

**Estado**: Total unit tests frontend al cierre Sprint 7: 432 (Vitest, 33 suites) ✅
**PRs**: #99 (UI/UX), PR #105 (Testing — pendiente merge), todos mergeados en development
**Fuente**: openspec/changes/archive/2026-04-08-sprint7-v2.3.0/ + openspec/changes/archive/2026-04-09-sprint7-v2.3.5/
**Versión**: v2.3.0 / v2.3.5
**Archived**: 2026-04-08 / 2026-04-09

---

<!-- Merged from wallet-integration-continue on 2026-09-03 -->

# Delta Spec: Frontend (Wallet UI, Admin Pages, E2E Fix)

## Purpose

Implement remaining frontend: WithdrawalForm with per-gateway destination and API config, TransactionHistory with correct enums, admin pages (WalletWithdrawalsPage + WithdrawalApprovalModal), extended walletStore, and E2E fix #347.

## ADDED Requirements

### Requirement: WithdrawalForm with Per-Gateway Destination and Config API

The system SHALL extend `WithdrawalForm` with:
1. **Gateway selector**: Radio/group (PayPal visible, MercadoPago disabled)
2. **Dynamic destination field**: Email input for PayPal (email validation); hidden for MP
3. **Config from API**: On mount, calls `walletStore.fetchWalletConfig()`; uses config for validation/display (REMOVES hardcodes)
4. **Submit with destination**: `walletStore.createWithdrawal(amount, destination)` where `destination = { email }`
5. **Backend errors displayed**: `INVALID_DESTINATION`, `LIMIT_EXCEEDED`, `INSUFFICIENT_BALANCE`, `MINIMUM_AMOUNT`

#### Scenario: User selects PayPal and enters email
- GIVEN user on WithdrawalForm with config loaded
- WHEN selects PayPal, enters valid email, amount within limits
- WHEN submits
- THEN calls createWithdrawal({ amount, destination: { email } })

#### Scenario: Client-side validation uses config
- GIVEN config: min=20, max=500, fee=5%
- WHEN user enters amount < 20 or > 500
- THEN form shows inline error without API call

#### Scenario: Backend error displayed
- GIVEN backend rejects with `LIMIT_EXCEEDED` (exceeds daily max)
- WHEN user submits
- THEN shows "Exceeds daily limit of $1000" (from backend)

### Requirement: Extended WalletStore

The system SHALL extend walletStore with:
- `config: WalletConfig | null` state
- `fetchWalletConfig(): Promise<WalletConfig>` — calls GET /wallet/config, updates store
- `createWithdrawal(amount, destination): Promise<WithdrawalResponse>` — calls API with destination
- Types: `WalletConfig` (minWithdrawal, feePercentage, maxWithdrawal, maxWithdrawalDailyPerUser, payoutMode, gateways), `WithdrawalDestination = { email: string }`

### Requirement: TransactionHistory with Correct Enums

The system SHALL align `TransactionHistory` filters with backend enum. Frontend MAY send legacy `commission`/`refund`; backend maps. UI option values match conceptually.

#### Scenario: Filter by commissions shows results
- GIVEN user has `commission_earned` transactions
- WHEN filters by "Commissions"
- THEN list shows commissions (not empty)

#### Scenario: Filter by adjustments shows results
- GIVEN user has `adjustment` transactions
- WHEN filters by "Adjustments"
- THEN list shows adjustments (not empty)

### Requirement: Admin Pages — WalletWithdrawalsPage + WithdrawalApprovalModal

**WalletWithdrawalsPage:** paginated table (User, Amount, Fee, Net, Status, Destination email, Gateway, Date, Actions), filters (Status, Gateway, User search), pagination (page, limit=20), "Approve" button opens modal.

**WithdrawalApprovalModal:** shows full details (user, amount, fee, net, **prominent destination email**, gateway, date), optional `approvalComment`, "Confirm"/"Cancel" buttons (Cancel sends NO request), confirm calls `walletApi.approveWithdrawal(id, { approvalComment })`.

### Requirement: Extended API Service

The system SHALL extend `walletApi` with: `getConfig()`, `withdraw({amount, destination})`, `getAdminWithdrawals({page,limit,status,gateway})`, `approveWithdrawal(id, {approvalComment?})`, `rejectWithdrawal(id, {rejectionReason})`.

### Requirement: Updated Wallet Types

- `WithdrawalStatus = 'pending' | 'approved' | 'paid' | 'rejected' | 'failed'`
- `TransactionType = 'commission_earned' | 'adjustment' | 'withdrawal' | 'fee' | 'deposit'`
- `WithdrawalRequest`: id, userId, requestedAmount, feeAmount, netAmount, status, destination, gateway, gatewayPayoutId, gatewayStatus, rejectionReason, createdAt, processedAt, approvedAt, rejectedAt
- `AdminWithdrawalsResponse`: data[], pagination
- `WalletConfig`: as above

### Requirement: E2E Fix #347

Fix `frontend/e2e/wallet.spec.ts` (GitHub #347):
1. **Flags ON in test env**: `VITE_FEATURE_CRYPTO_WALLET=true` (frontend), `FEATURE_CRYPTO_WALLET=true` + `WALLET_PAYOUT_MODE=manual` (backend)
2. **Real assertions**: each test validates full flow (create → admin list → approve → verify state)
3. **Remove `.catch(() => {})`**: no vacuous try-catch hiding failures
4. **Test destination flow**: create with email → verify in admin → approve → verify paid/failed

#### Scenario: E2E suite passes with flags ON
- GIVEN test env with flags enabled
- WHEN `pnpm test:e2e` runs wallet.spec.ts
- THEN all tests pass, no silent skips

#### Scenario: No empty tests
- GIVEN wallet.spec.ts code
- WHEN tests audited
- THEN no test uses empty `.catch` or non-validating assertions

## Modified Files

- `WithdrawalForm.tsx`: gateway selector, dynamic destination, config-driven fee/min/max, error display
- `TransactionHistory.tsx`: correct enum values for filters
- `WithdrawalModal.tsx`: confirmation with destination
- `walletStore.ts`: config state, fetchWalletConfig, createWithdrawal(amount, destination)
- `api/wallet.ts`: destination in withdraw, getConfig, admin methods
- `types/wallet.ts`: WalletConfig, WithdrawalStatus='paid', TransactionType backend enum, WithdrawalDestination
- `admin/WalletWithdrawalsPage.tsx` **New**: paginated table, filters, actions
- `admin/WithdrawalApprovalModal.tsx` **New**: modal with prominent destination, confirm/cancel
- `utils/featureFlags.ts`: doc enablement path
- `e2e/wallet.spec.ts`: fix #347: flags ON, real assertions, no vacuous .catch
- `.env.test` **New/Modify**: `VITE_FEATURE_CRYPTO_WALLET=true`
- Backend test env: `FEATURE_CRYPTO_WALLET=true`, `WALLET_PAYOUT_MODE=manual`

## Testing Focus

| Layer | Tests |
|-------|-------|
| Unit | WithdrawalForm: gateway selector, email validation, fee/min/max from MSW config, submit with destination |
| Unit | TransactionHistory: commission/adjustment filters return results (MSW backend map) |
| Unit | walletStore: fetchWalletConfig updates store; createWithdrawal calls API with destination |
| Unit | Admin pages: WalletWithdrawalsPage renders table; WithdrawalApprovalModal shows destination, cancel doesn't call API |
| E2E | wallet.spec.ts: full suite with flags ON; create→list→approve→state flow; destination visible |

## References

- Original design: `openspec/changes/wallet-integration/design.md` (File Changes frontend, Interfaces)
- Original frontend spec: `openspec/changes/wallet-integration/specs/frontend/spec.md`
- Related specs: `wallet-config-api`, `wallet-admin`, `wallet-payouts`