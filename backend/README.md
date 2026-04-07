# Nexo Real — Backend

> **Versión actual: v2.2.0** — Sprint 6 completado (2026-04-07)

API REST con Express + TypeScript para la plataforma Nexo Real. Soporta afiliaciones binarias, e-commerce, Real Estate, Tourism, bot integrations y administración completa.

## 🛠️ Stack

- **Node.js 24+** + TypeScript
- **Express** (framework HTTP)
- **Sequelize** (ORM) + **PostgreSQL 16+**
- **Redis** (caché, opcional)
- **JWT** (autenticación)
- **Swagger / OpenAPI** (documentación v2.2.0)
- **Jest** (tests unitarios e integración)
- **Docker Compose** (desarrollo local)

## 📦 Instalación

```bash
cd backend
cp .env.example .env
pnpm install
pnpm build
```

## 🚀 Ejecución

```bash
# Desarrollo
pnpm dev

# Producción
pnpm build && pnpm start
```

## 🐳 Docker (Desarrollo)

```bash
docker compose up -d
# PostgreSQL dev  → puerto 5434
# PostgreSQL test → puerto 5435
# Redis           → puerto 6379
```

## 🧪 Testing

```bash
# Tests unitarios
pnpm test

# Tests de integración
pnpm test:integration
```

## 🔌 API Endpoints

### Autenticación

| Método | Endpoint             | Descripción       |
| ------ | -------------------- | ----------------- |
| POST   | `/api/auth/register` | Registrar usuario |
| POST   | `/api/auth/login`    | Iniciar sesión    |
| GET    | `/api/auth/me`       | Usuario actual    |

### Dashboard & Red

| Método | Endpoint             | Descripción           |
| ------ | -------------------- | --------------------- |
| GET    | `/api/dashboard`     | Dashboard del usuario |
| GET    | `/api/users/me/tree` | Árbol binario         |
| GET    | `/api/commissions`   | Lista de comisiones   |

### Real Estate & Tourism

| Método | Endpoint                             | Descripción                          |
| ------ | ------------------------------------ | ------------------------------------ |
| GET    | `/api/properties`                    | Listar propiedades (público)         |
| GET    | `/api/properties/:id`                | Detalle de propiedad                 |
| POST   | `/api/properties`                    | Crear propiedad (admin)              |
| PUT    | `/api/properties/:id`                | Actualizar propiedad (admin)         |
| DELETE | `/api/properties/:id`                | Eliminar propiedad (admin)           |
| GET    | `/api/tours`                         | Listar paquetes turísticos (público) |
| GET    | `/api/tours/:id`                     | Detalle de tour                      |
| POST   | `/api/tours`                         | Crear tour (admin)                   |
| PUT    | `/api/tours/:id`                     | Actualizar tour (admin)              |
| DELETE | `/api/tours/:id`                     | Eliminar tour (admin)                |
| GET    | `/api/reservations`                  | Listar reservas del usuario          |
| POST   | `/api/reservations`                  | Crear reserva                        |
| PATCH  | `/api/admin/reservations/:id/status` | Cambiar estado de reserva (admin)    |

### Bot API (v2.2.0)

| Método | Endpoint              | Auth           | Descripción                                      |
| ------ | --------------------- | -------------- | ------------------------------------------------ |
| GET    | `/api/bot/properties` | `X-Bot-Secret` | Listar propiedades para el bot (máx. 5, activas) |
| GET    | `/api/bot/tours`      | `X-Bot-Secret` | Listar tours para el bot (máx. 5, activos)       |

> Autenticación mediante header `X-Bot-Secret`. Ver `BotController.ts`.

### Admin

| Método | Endpoint                                 | Descripción                   |
| ------ | ---------------------------------------- | ----------------------------- |
| GET    | `/api/admin/stats`                       | Estadísticas globales         |
| GET    | `/api/admin/users`                       | Lista de usuarios             |
| GET    | `/api/admin/products`                    | Listar todos los productos    |
| PATCH  | `/api/admin/vendors/:id/commission-rate` | Actualizar comisión de vendor |
| GET    | `/api/admin/contracts`                   | Gestión de contratos          |

### E-commerce

| Método | Endpoint                            | Descripción                  |
| ------ | ----------------------------------- | ---------------------------- |
| POST   | `/api/v1/gift-cards`                | Crear tarjeta regalo (admin) |
| GET    | `/api/v1/gift-cards/{id}/validate`  | Validar tarjeta regalo       |
| POST   | `/api/v1/gift-cards/{id}/redeem`    | Redimir tarjeta regalo       |
| GET    | `/api/v1/carts/me`                  | Obtener carrito actual       |
| POST   | `/api/v1/carts/me/items`            | Agregar item al carrito      |
| GET    | `/api/v1/carts/recover/{token}`     | Recuperar carrito abandonado |
| POST   | `/api/v1/email-campaigns`           | Crear campaña de email       |
| POST   | `/api/v1/email-campaigns/{id}/send` | Enviar campaña               |

## 🧩 Controllers

| Controller                | Descripción                                                            |
| ------------------------- | ---------------------------------------------------------------------- |
| `AuthController`          | Registro, login, perfil                                                |
| `AdminController`         | Stats globales, gestión de usuarios                                    |
| `PropertyController`      | CRUD de propiedades (CodeQL fix: CWE-843)                              |
| `TourPackageController`   | CRUD de paquetes turísticos (CodeQL fix: CWE-843)                      |
| `ReservationController`   | Reservas del usuario                                                   |
| `BotController`           | Endpoints para Nexo Bot (`/api/bot/*`) autenticados con `X-Bot-Secret` |
| `DashboardController`     | Dashboard del usuario                                                  |
| `AchievementController`   | Logros y ranking (usa `network_balance`)                               |
| `CommissionController`    | Comisiones automáticas multinivel                                      |
| `GiftCardController`      | Gift cards con QR                                                      |
| `CartController`          | Carrito de compras + abandono                                          |
| `EmailCampaignController` | Campañas de email con Brevo                                            |
| `CRMController`           | Leads, tareas, pipeline                                                |
| `ProductController`       | Catálogo de productos                                                  |
| `ContractController`      | Contratos de afiliación                                                |
| `AdminContractController` | Gestión de contratos (admin)                                           |
| `AdminVendorController`   | Gestión de vendors (admin)                                             |
| `LandingPageController`   | Landing pages del afiliado                                             |
| `TwoFactorController`     | TOTP 2FA                                                               |
| `LeaderboardController`   | Tabla de líderes                                                       |
| `InvoiceController`       | Facturas                                                               |

## 🗄️ Cambios de Modelo (v2.2.0)

### `binary_balance` → `network_balance`

El campo `binary_balance` del modelo `Achievement` fue renombrado a `network_balance` en v2.2.0. La migración es compatible hacia atrás para lectura. Verificar que cualquier referencia directa al campo use el nombre nuevo.

**Archivos afectados:**

- `src/models/Achievement.ts`
- Migraciones de Sequelize correspondientes
- `AchievementController.ts`

## 📖 Documentación de API (Swagger)

Disponible en desarrollo en: `http://localhost:3000/api-docs`

**v2.2.0** incluye:

- Schemas `BotProperty` y `BotTour`
- Endpoints `/api/bot/properties` y `/api/bot/tours` documentados con parámetros de autenticación
- Schemas actualizados para `network_balance`

## 🔒 Seguridad

- **CodeQL fixes (v2.2.0)**: CWE-843 (Type Confusion) corregido en `PropertyController` y `TourPackageController`
- **Build hardening**: Sin `.map` en producción (`sourcemap: false`)
- JWT con expiración configurable
- Rate limiting en endpoints sensibles
- CORS configurado por `ALLOWED_ORIGINS`
- Sanitización de inputs con validación de tipos

## 📁 Estructura

```
backend/src/
├── controllers/         # Lógica de cada endpoint
│   ├── admin/           # Controladores de administración
│   ├── auth/            # Autenticación
│   ├── BotController.ts # Bot API endpoints
│   └── ...
├── services/            # Business logic
├── models/              # Sequelize models (PostgreSQL)
├── routes/              # Definición de rutas
├── middleware/          # Auth, rate limiting, validación
└── migrations/          # Migraciones de base de datos
```
