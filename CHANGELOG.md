# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

## [2.2.0] - 2026-04-07

### Added

- **Sprint 6: Admin Dashboard CRUD — Real Estate & Tourism**
  - `AdminPropertiesPage` — tabla paginada con filtros por tipo, estado y ciudad; modal CRUD; toggle activo/inactivo
  - `AdminToursPage` — tabla paginada con filtros por tipo, estado y destino; modal CRUD; toggle activo/inactivo
  - `AdminReservationsPage` — tabla con filtros por estado/tipo; confirm/cancel rápido; modal de notas y estado detallado
  - 12 métodos en `adminService` (`api.ts`): `getAdminProperties`, `createProperty`, `updateProperty`, `deleteProperty`, `getAdminTours`, `createTour`, `updateTour`, `deleteTour`, `getAdminReservations`, `updateReservationStatus`, `confirmReservation`, `cancelReservation`
  - 3 rutas lazy `<AdminRoute>` en `App.tsx`: `/admin/properties`, `/admin/tours`, `/admin/reservations`

- **Sprint 6: Nexo Bot — Properties & Tours Flows**
  - `properties.flow.ts` — 11 keywords ES/EN, llama `mlmApi.searchProperties({ limit: 5 })`, formatea con precio/ciudad/tipo/habitaciones/m², manejo de array vacío y errores
  - `tours.flow.ts` — 11 keywords ES/EN, llama `mlmApi.searchTours({ limit: 5 })`, formatea con precio/destino/duración/capacidad, manejo de array vacío y errores
  - `bot/src/app.ts` — `propertiesFlow` y `toursFlow` registrados en `createFlow([...])`
  - Idioma leído del state (definido por `welcomeFlow`) para respuestas bilingües

- **Sprint 6: Swagger / OpenAPI v2.2.0**
  - Versión actualizada a `2.2.0` en `swagger.ts`
  - Schemas globales `BotProperty` y `BotTour` agregados en `components/schemas`
  - Security scheme `botSecret` (apiKey, header `X-Bot-Secret`)
  - Endpoints documentados con `@swagger`: `GET /api/bot/properties` y `GET /api/bot/tours` (tag: bot)
  - Tag `bot` agregado en lista de tags de Swagger UI

- **Sprint 6: SEO — Meta Tags Dinámicos + Schema Markup + Social Proof**
  - `PropertyDetailPage` — `<Helmet>` con title dinámico, meta description, Open Graph tags, Twitter Card y JSON-LD `RealEstateListing` schema markup
  - `TourDetailPage` — `<Helmet>` con title dinámico, meta description, Open Graph tags, Twitter Card y JSON-LD `TouristAttraction` schema markup
  - `PropertiesPage` — `<Helmet>` dinámico basado en filtros activos (tipo, ciudad) + social proof badge "X personas vieron esto hoy" en cada card
  - `ToursPage` — `<Helmet>` dinámico basado en filtros activos (categoría, destino) + social proof badge en cada card
  - `HelmetProvider` wrapeando la app en `main.tsx` + `react-helmet-async` instalado
  - Slugs: backend sin campo `slug` → fallback a rutas con ID (correcto según spec)

### Changed

- **`binary_balance` → `network_balance`** (Sprint 6 Fase 1, PR #89): campo renombrado en modelo `User`, migración Sequelize `20260407000000-rename-binary-balance.js`, eliminadas todas las referencias en frontend y backend
- **Build hardening** (Sprint 6 Fase 1, PR #89): `build.mjs` actualizado para producción — elimina archivos `.map` con `--sourcemap false`, log de tamaños post-build
- **i18n cleanup** (Sprint 6 Fase 2, PR #90): eliminadas 8 claves huérfanas en `es.json` y `en.json`, eliminado componente `DashboardStreaming` que no existía

### Security

- **CodeQL #39 & #40** (Sprint 6 Fase 9, PR #88): `req.files` cast normalizado a `Array.isArray(req.files) ? req.files : Object.values(req.files ?? {}).flat()` en `PropertyController.ts` y `TourPackageController.ts` — previene CWE-843 type confusion

---

## [2.1.0] - 2026-04-07

### Added

- **Sprint 5: Real Estate & Tourism Frontend**
  - `PropertiesPage` — listado paginado de propiedades con filtros por tipo, ciudad y rango de precio
  - `PropertyDetailPage` — detalle de propiedad con galería de imágenes, features y CTA de reserva
  - `ToursPage` — listado paginado de paquetes turísticos con filtros por categoría, duración y precio
  - `TourDetailPage` — detalle de tour con itinerario, disponibilidad y CTA de reserva
  - `ReservationFlowPage` — wizard de 3 pasos: selección de fechas → datos del huésped → confirmación
  - `MisReservasPage` — dashboard de reservas del usuario con estados y cancelación
  - `propertyService` — cliente HTTP para propiedades (list, detail, availability)
  - `tourService` — cliente HTTP para paquetes turísticos (list, detail, availability)
  - `reservationService` — cliente HTTP para reservas (create, list, cancel)
  - `reservationStore` (Zustand 5) — estado del wizard de 3 pasos con useShallow
  - Rutas agregadas en `App.tsx`: `/properties`, `/properties/:id`, `/tours`, `/tours/:id`, `/reservations/new`, `/mis-reservas`
  - Tests Vitest: `sprint5-services.test.ts` y `sprint5-store.test.ts`

### Fixed

- **Playwright CI webServer**: `playwright.config.ts` usaba `echo && exit 0` como webServer en CI, causando `Process from config.webServer exited early`. Corregido usando `pnpm preview --port 4173` con `baseURL: http://localhost:4173` cuando `process.env.CI` está activo.

### Security

- **CodeQL Critical #39 & #40** (CWE-843 Type Confusion): `(property.images as string[]) ?? []` reemplazado con validación runtime `Array.isArray(rawImages) ? rawImages.filter((img): img is string => typeof img === 'string') : []` en `PropertyController.ts` y `TourPackageController.ts`
- **Dependabot #37** (Moderate, `file-type` infinite loop DoS): forzado `file-type>=21.3.1` via `pnpm.overrides` en root `package.json`. Lockfile resuelve solo `file-type@21.3.4`

---

## [2.0.0] - 2026-04-06

### Added

- **Sprint 4: Nexo Bot + n8n Automation**
  - WhatsApp Bot (Nexo Bot): BuilderBot + Baileys + OpenAI GPT-4o, agentes Sophia (♀) y Max (♂)
  - 7 flujos conversacionales: bienvenida, propiedades, tours, reservas, FAQ, derivación humana, cierre
  - n8n Automation: webhooks → Google Calendar + Notion CRM + notificación a agente humano
  - Frontend Sprint 4: 155 → 210 tests (Vitest + Testing Library)
  - ARCHITECTURE.md v2.0.0 documentando arquitectura completa del sistema
  - Gamificación: Leaderboards + Achievement system con Redis cache

### Security

- **CodeQL HIGH #52** (CWE-1321 Prototype Pollution): `Object.assign` reemplazado con spread operator en rutas de achievements
- **Dependabot múltiples** (#34–#36 lodash HIGH/MEDIUM): actualizados via pnpm overrides

---

## [1.11.0] - 2026-04-04

### Added

- **Phase 0: Security Hardening**
  - SSRF protection: validación de URLs en todas las integraciones externas (no permite IPs privadas, loopback ni metadatos cloud)
  - XSS sanitization: sanitización de inputs HTML en templates de email y landing pages
  - `pino-http` logging: request/response logging seguro sin exponer tokens ni datos sensibles
  - Docker hardening: imágenes non-root, read-only filesystems, `no-new-privileges`, health checks con timeouts

- **Phase 1: Generic Products + Inventory**
  - Modelo `Category` (Sequelize): nombre, slug único, descripción, imagen, parent_id para categorías jerárquicas, soft-delete
  - Modelo `Product` (Sequelize): SKU, nombre, precio, tipo (digital/physical/service/membership), categoría, metadatos JSON, stock tracking, soft-delete
  - Modelo `Inventory` (Sequelize): stock actual, stock mínimo, historial de movimientos (movements JSONB), vinculado 1:1 con Product
  - `CategoryController` / `AdminCategoryController`: CRUD completo para categorías (público: listado activo; admin: gestión completa)
  - `ProductController` / `AdminProductController`: CRUD completo para productos + gestión de inventario por admin
  - Endpoints públicos: `GET /api/products`, `GET /api/products/:id`, `GET /api/categories`
  - Endpoints admin: `GET|POST /api/admin/categories`, `PUT|DELETE /api/admin/categories/:id`
  - Endpoints admin productos: `GET|POST /api/admin/products`, `PUT|DELETE /api/admin/products/:id`
  - Endpoints admin inventario: `GET|POST /api/admin/products/:id/inventory`, `GET|POST /api/admin/products/:id/inventory/movements`

- **Phase 1 Follow-up: Integration Tests + Swagger**
  - 307 tests de integración en total (eran 195 antes del Sprint 3)
  - Swagger docs actualizados con todos los nuevos endpoints de productos, inventario, vendors y contratos

- **Phase 2: Marketplace Multi-vendor**
  - Modelo `Vendor` (Sequelize): perfil de vendedor vinculado a User, commission_rate configurable, estado (pending/approved/rejected/suspended)
  - Modelo `VendorProduct` (Sequelize): asociación vendor–product con precio override opcional
  - Modelo `VendorOrder` (Sequelize): tracking de pedidos por vendor
  - `VendorController`: dashboard de vendor (`GET /api/vendor/dashboard`) y listado de productos propios (`GET /api/vendor/products`)
  - `AdminVendorController`: CRUD admin de vendors, actualización de commission rate
  - Split de comisiones 3-way: plataforma / vendor / afiliado en cada venta

- **Phase 3: Delivery Integration**
  - Modelo `ShippingAddress` (Sequelize): dirección postal completa, soporte multi-dirección por usuario, flag `is_default`
  - Modelo `DeliveryProvider` (Sequelize): proveedores de envío (nombre, tipo, config JSON, activo/inactivo)
  - Modelo `ShipmentTracking` (Sequelize): tracking_number, provider_id, status, estimated_delivery, eventos de tracking
  - Endpoints de direcciones (montados en `/api/addresses`): `GET|POST /api/addresses`, `GET|PUT|DELETE /api/addresses/:id`, `PATCH /api/addresses/:id/default`
  - Endpoints de shipping en contexto de órdenes: `PUT /api/orders/:id/shipping`, `GET /api/orders/:id/tracking`
  - Webhook para actualizaciones del proveedor de delivery: `POST /api/webhooks/shipping/:providerId`

- **Phase 3.5: Affiliate Contracts MVP**
  - Modelo `ContractTemplate` (Sequelize): título, cuerpo Markdown, versión semver, activo/inactivo, admin CRUD con versionado automático
  - Modelo `AffiliateContract` (Sequelize): aceptación/declinación de usuario, IP, userAgent, SHA-256 hash del contenido, timestamp
  - `ContractController`: listado de contratos con estado de aceptación del usuario logueado, aceptar y declinar
  - `AdminContractController`: CRUD completo de templates, ver aceptaciones por usuario, revocar contrato
  - `ContractService`: lógica de negocio para creación de versiones, validación de hash, consulta de estado
  - Migración: `20260412000000-create-contract-tables.js`

### Fixed

- **ContractService ORDER BY snake_case**: Sequelize `underscored: true` genera columnas `snake_case` pero el ORDER BY en raw queries usaba `camelCase`, causando error `column "createdAt" does not exist` en PostgreSQL. Corregido usando `order: [['created_at', 'DESC']]` con el nombre de columna real.

### Security

- SSRF Protection: validación estricta de URLs para prevenir Server-Side Request Forgery en integraciones externas
- XSS Sanitization: sanitización de todos los inputs que se renderizan como HTML
- Secure Logging: `pino-http` configurado para redactar headers sensibles (`authorization`, `cookie`, `x-api-key`) en logs
- Docker Hardening: contenedores ejecutando como usuario non-root con capacidades mínimas

---

## [1.6.0] - 2026-04-01

### Added

- **PWA Improvements**
  - PWA con Service Worker para offline
  - Páginas offline dedicadas (404, offline)
  - Iconos multi-size (72, 96, 128, 144, 152, 192, 384, 512)
  - OfflineBanner component para detectar estado de conexión
  - Theme colors en manifest.json

- **Backend Refactoring**
  - Controllers modulares por dominio (auth, crm, commissions, wallet, products)
  - Estructura de carpetas reorganizada
  - Mejor separación de responsabilidades

- **Email Notifications**
  - Integración con nodemailer
  - Notificaciones de registro, comisiones, withdrawals

### Changed

- Swagger version actualizado a 1.6.0
- Documentación actualizada (README, INDEX, ROADMAP)

## [1.5.0] - 2026-03-31

### Added

- **Backend Controllers Modularization**
  - AuthController: autenticación y 2FA
  - CRMController: leads y tareas
  - CommissionController: comisiones y purchases
  - WalletController: wallet y transacciones
  - ProductController: productos
  - OrderController: pedidos

- **Email Notifications Integration**
  - Configuración de email con nodemailer
  - Templates de email para diferentes eventos

### Changed

- Reorganización de rutas en `/src/routes/`
- Middleware refactorizado para mejor modularidad

## [1.4.0] - 2026-03-28

### Added

- **Wallet Digital**
  - Billetera digital para usuarios
  - Balance y historial de transacciones
  - Sistema de retiros (withdrawals)
  - Comisiones integradas a wallet
  - Estados: pending, approved, paid, rejected

- **Two-Factor Authentication (2FA)**
  - TOTP-based 2FA usando speakeasy
  - QR code para apps autenticadoras (Google Authenticator, Authy)
  - Códigos de recuperación (8 códigos)
  - Rate limiting: 10 intentos/minuto
  - Bloqueo después de 5 intentos fallidos (15 min)

### API Endpoints

| Endpoint                     | Method | Description              |
| ---------------------------- | ------ | ------------------------ |
| `/api/wallet`                | GET    | Get user wallet balance  |
| `/api/wallet/transactions`   | GET    | List wallet transactions |
| `/api/wallet/withdraw`       | POST   | Request withdrawal       |
| `/api/auth/2fa/status`       | GET    | Get user's 2FA status    |
| `/api/auth/2fa/setup`        | POST   | Initiate 2FA setup       |
| `/api/auth/2fa/verify-setup` | POST   | Verify and enable 2FA    |
| `/api/auth/2fa/disable`      | POST   | Disable 2FA              |
| `/api/auth/2fa/verify`       | POST   | Verify TOTP code         |

## [1.3.0] - 2026-03-29

### Added

- **Two-Factor Authentication (2FA)**
  - TOTP-based 2FA using speakeasy library
  - QR code generation for authenticator apps (Google Authenticator, Authy)
  - Manual entry fallback with secret display
  - Recovery codes (8 codes, bcrypt hashed)
  - Rate limiting: 10 attempts/minute for 2FA endpoints
  - Account lockout after 5 failed attempts (15 min)
  - **20/20 integration tests passing** ✅

### API Endpoints

| Endpoint                     | Method | Description                                  |
| ---------------------------- | ------ | -------------------------------------------- |
| `/api/auth/2fa/status`       | GET    | Get user's 2FA status                        |
| `/api/auth/2fa/setup`        | POST   | Initiate 2FA setup (generates QR code)       |
| `/api/auth/2fa/verify-setup` | POST   | Verify TOTP code and enable 2FA              |
| `/api/auth/2fa/disable`      | POST   | Disable 2FA (requires TOTP or recovery code) |
| `/api/auth/2fa/verify`       | POST   | Verify TOTP code (used during login)         |

### Security Features

- AES-256-GCM encryption for TOTP secrets
- bcrypt (12 rounds) hashing for recovery codes
- 30-second TOTP window tolerance (±1 step)
- Environment variable: `TWO_FACTOR_SECRET_KEY`

## [1.2.0] - 2026-03-29

### Fixed

- **Tests de Integración** (con `pnpm`)
  - Configuración ts-jest para ES Modules con CommonJS
  - UUID validation: acepta nil UUID (00000000-0000-0000-0000-000000000000)
  - Auth middleware: formato de errores consistente `{ code, message }`
  - Wallet: nombres de columnas underscored (`created_at` vs `createdAt`)
  - Wallet: tipo de transacción correcto (`commission_earned` vs `COMMISSION`)
  - **158/158 tests de integración pasando** ✅

### Changed

- **Infraestructura de Tests**
  - `tsconfig.test.json` para ts-jest (CommonJS module)
  - `setup.ts` reescrito para crear Sequelize directamente
  - `resetSequelize()` ahora es async para mejor cleanup
  - Documentación de tests actualizada con `pnpm test:integration`

### Added

- **E2E Page Objects**
  - Playwright: getters para locators (más resilientes)

## [1.1.0] - 2026-03-24

### Added

- **CRM Avanzado**
  - Pipeline Kanban con drag & drop de leads entre estados
  - Filtros avanzados (status, source, search, fecha, valor)
  - Importación masiva de leads desde CSV
  - Exportación de leads a CSV (compatible con Excel)
  - Crear tareas desde el modal de lead

- **Dashboard con Gráficos**
  - Gráfico de barras: referidos por mes (últimos 6 meses)
  - Gráfico de líneas: comisiones por mes (últimos 6 meses)
  - Datos agregados directamente desde el backend

- **Mejoras varias**
  - Traducciones bilingües ES/EN para todas las features
  - Validación de tareas en backend
  - Fix de seguridad: serialize-javascript actualizado
  - Fix de tests: detectOpenHandles deshabilitado

## [1.0.0] - 2026-03-20

### Added

- Sistema de autenticación JWT completo (registro, login, logout)
- Sistema de afiliaciones binarias con closure table
- Comisiones automáticas por niveles (direct + 4 niveles)
- Generación de códigos QR para referidos
- Dashboard de usuario con estadísticas en tiempo real
- Panel de administración con gestión de usuarios
- API REST documentada con Swagger/OpenAPI
- Tests unitarios para backend y frontend
- Tests de integración para API
- Tests E2E con Playwright
- Cache con Redis (opcional)
- CORS hardening para producción
- Configuración de seguridad con Helmet

### Backend

- Express + TypeScript
- Sequelize ORM con MySQL
- Middleware de autenticación y roles
- Rate limiting para endpoints de auth
- JSDocs bilingüe (ES/EN)

### Frontend

- React 19 + Vite
- Tailwind CSS
- Autenticación con contexto
- Páginas: Login, Register, Dashboard, TreeView, Profile, Admin
- SweetAlert2 para modales
- PWA-ready

### Database

- Modelos: User, UserClosure, Commission, Purchase
- Índices optimizados
- Closure table para árbol genealógico

## [0.1.0] - 2026-03-01

### Added

- Proyecto inicializado
- Estructura base backend/frontend
