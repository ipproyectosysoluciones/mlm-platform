# Nexo Real - Plataforma de Afiliaciones

> **Nota:** Este proyecto fue originalmente desarrollado bajo el nombre **MLM Platform**
> (`ipproyectosysoluciones/mlm-platform`). Ha sido renombrado a **Nexo Real** como parte
> del reenfoque hacia servicios inmobiliarios y turismo en LATAM.
> El repositorio de GitHub será renombrado próximamente.

Conectamos tu negocio con el mundo. Plataforma de afiliaciones binarias con comisiones por niveles y visualización de árbol genealógico.

**Versión actual: v2.2.0** — Sprint 6 completado (2026-04-07)

## 🚀 Características / Features

- **Sistema de Afiliaciones Binarias** - Red de usuarios con izquierda/derecha
- **Comisiones Automáticas** - Directas y por niveles (hasta 4 niveles)
- **Código QR de Referido** - Generación automática para cada usuario
- **Dashboard con Gráficos** - Estadísticas, referidos y comisiones por mes
- **CRM Integrado** - Leads, tareas, pipeline Kanban, importar/exportar CSV
- **Árbol Genealógico** - Visualización interactiva con React Flow
- **Landing Pages** - Creador de páginas de captura
- **Panel de Administración** - Gestión completa de usuarios y comisiones
- **API REST Documentada** - OpenAPI/Swagger bilingüe (ES/EN)
- **Tests Automatizados** - 307+ tests (Unit + Integration + E2E con Playwright)
- **i18n** - Interfaz bilingüe (Español/Inglés)
- **Wallet Digital** - Billetera digital con retiros y transacciones
- **2FA (TOTP)** - Two-Factor Authentication con códigos de recuperación
- **Gift Cards** — Creación, validación y redención de tarjetas regalo con QR
- **Abandoned Cart Recovery** — Detección automática, emails de recuperación con tokens seguros
- **Email Automation** — Constructor WYSIWYG, campañas programadas, integración Brevo con fallback SMTP
- **Generic Products + Inventory** — Catálogo genérico (digital/physical/service/membership), SKU, stock tracking, categorías jerárquicas
- **Marketplace Multi-vendor** — Vendors con dashboard propio, split de comisiones 3-way (plataforma/vendor/afiliado)
- **Delivery Integration** — Shipping addresses, delivery providers, shipment tracking con webhooks
- **Affiliate Contracts MVP** — Templates versionados, aceptación con IP/userAgent/hash, admin CRUD
  - **Real Estate Module** — Listado y detalle de propiedades (alquiler, venta, gestión)
  - **Tourism Module** — Paquetes turísticos con itinerarios y disponibilidad
  - **Reservation Wizard** — Flujo de reserva de 3 pasos con wizard UI
  - **Admin Dashboard CRUD** — Gestión completa de Propiedades, Tours y Reservas desde el panel de administración
  - **Nexo Bot** — Chatbot con flows de propiedades y tours en ES/EN (responde hasta 5 resultados por consulta)
  - **SEO Avanzado** — Meta tags dinámicos + JSON-LD schema markup (RealEstateListing / TouristAttraction) + social proof badges
  - **network_balance** — Campo migrado desde `binary_balance` en el modelo Achievement

## 📊 Estado de Implementación / Implementation Status

### ✅ Cambios Completados

| Cambio                            | Descripción                                          | Estado       | Fecha      |
| --------------------------------- | ---------------------------------------------------- | ------------ | ---------- |
| streaming-subscriptions-ecommerce | Sistema de suscripciones y e-commerce                | ✅ Archivado | 2026-03-27 |
| wallet-digital                    | Billetera digital con retiros                        | ✅ Archivado | 2026-03-27 |
| sdd-i18n-bilingual                | Sistema de internacionalización ES/EN                | ✅ Archivado | 2026-03-27 |
| phase-3-visual-tree               | Visual Tree UI con React Flow                        | ✅ Archivado | 2026-03-27 |
| sdd-horizontal-navbar             | Layout de navbar horizontal                          | ✅ Archivado | 2026-03-27 |
| es-modules-migration              | Migración a ES Modules                               | ✅ Completo  | 2026-03-28 |
| postgresql-support                | Soporte para PostgreSQL + Docker                     | ✅ Completo  | 2026-03-28 |
| build-optimization                | Build optimizado (3.4MB → 1.2MB)                     | ✅ Completo  | 2026-03-28 |
| github-templates                  | CODE_OF_CONDUCT, Issues, PR templates                | ✅ Completo  | 2026-03-28 |
| 2fa-totp                          | Two-Factor Authentication con TOTP                   | ✅ Archivado | 2026-03-29 |
| playwright-visual-testing         | Scripts E2E con modo visual                          | ✅ Archivado | 2026-03-29 |
| frontend-2fa-ui                   | UI de React para 2FA con QR code                     | ✅ Completo  | 2026-03-30 |
| frontend-refactoring              | Modularización de componentes frontend               | ✅ Completo  | 2026-03-30 |
| backend-refactoring               | Controllers modulares (auth, crm, etc)               | ✅ Completo  | 2026-04-01 |
| pwa-offline-pages                 | Páginas 404 y Offline                                | ✅ Completo  | 2026-03-31 |
| pwa-improvements                  | Iconos multi-size, OfflineBanner                     | ✅ Completo  | 2026-03-31 |
| sprint2-v1.10.0                   | Gift Cards, Abandoned Cart, Email Automation         | ✅ Completo  | 2026-04-04 |
| sprint3-v1.11.0                   | Security, Products, Marketplace, Delivery, Contracts | ✅ Completo  | 2026-04-04 |
| sprint5-v2.1.0                    | Real Estate & Tourism frontend + security fixes      | ✅ Completo  | 2026-04-07 |
| sprint6-v2.2.0                    | Admin CRUD, Nexo Bot flows, SEO, network_balance     | ✅ Completo  | 2026-04-07 |

### 🚧 Cambios en Progreso

| Cambio    | Descripción | Progreso |
| --------- | ----------- | -------- |
| (ninguno) | -           | -        |

### 📁 Ubicación de Artefactos

- **Cambios activos**: `sdd/`
- **Cambios archivados**: `sdd/_archived/`
- **Specs (OpenSpec)**: `openspec/changes/`

## 📋 Requisitos / Requirements

- Node.js 24+ (verificar con `node -v`)
- PostgreSQL 16+ (base de datos principal)
- Redis 7+ (opcional)
- Docker y Docker Compose (para desarrollo)

> **Nota**: El proyecto usa ES Modules (ESM). Asegúrate de usar Node.js 18+.

## 🛠️ Instalación / Installation

```bash
# Clonar el repositorio
git clone <repo-url>
cd MLM

# Backend
cd backend
cp .env.example .env
pnpm install
pnpm build

# Frontend
cd ../frontend
pnpm install
```

## 🐳 Docker (Desarrollo)

```bash
cd backend
docker compose up -d

# Servicios disponibles:
# - PostgreSQL dev (puerto 5434)
# - PostgreSQL test (puerto 5435)
# - Redis (puerto 6379)
```

### Configurar base de datos

```bash
# Variables de entorno (por defecto usa PostgreSQL)
export DB_DIALECT=postgres
export DB_PORT=5434  # para desarrollo
export TEST_DB_PORT=5435  # para tests
```

## ⚙️ Configuración / Configuration

### Variables de Entorno

| Variable                             | Descripción                              | Default              |
| ------------------------------------ | ---------------------------------------- | -------------------- |
| `DB_DIALECT`                         | Dialecto de DB (postgres)                | postgres             |
| `DB_HOST`                            | Host de PostgreSQL                       | localhost            |
| `DB_PORT`                            | Puerto de PostgreSQL                     | 5434                 |
| `DB_NAME`                            | Nombre de la base de datos               | mlm_db               |
| `DB_USER`                            | Usuario de PostgreSQL                    | mlm                  |
| `DB_PASSWORD`                        | Contraseña de PostgreSQL                 | -                    |
| `JWT_SECRET`                         | Secreto para JWT                         | -                    |
| `REDIS_ENABLED`                      | Habilitar Redis                          | false                |
| `REDIS_HOST`                         | Host de Redis                            | localhost            |
| `REDIS_PORT`                         | Puerto de Redis                          | 6379                 |
| `REDIS_PASSWORD`                     | Contraseña de Redis (opcional)           | -                    |
| `ALLOWED_ORIGINS`                    | Origins permitidos (producción)          | localhost            |
| `VAPID_PUBLIC_KEY`                   | Clave pública VAPID (push notifications) | -                    |
| `VAPID_PRIVATE_KEY`                  | Clave privada VAPID (push notifications) | -                    |
| `BREVO_API_KEY`                      | API key de Brevo (email service)         | -                    |
| `BREVO_SMTP_HOST`                    | Host SMTP de Brevo                       | smtp-relay.brevo.com |
| `BREVO_SMTP_PORT`                    | Puerto SMTP de Brevo                     | 587                  |
| `BREVO_SMTP_USER`                    | Usuario SMTP de Brevo                    | -                    |
| `BREVO_SMTP_PASS`                    | Contraseña SMTP de Brevo                 | -                    |
| `EMAIL_FROM`                         | Email remitente por defecto              | noreply@example.com  |
| `EMAIL_FROM_NAME`                    | Nombre del remitente                     | Nexo Real            |
| `CART_ABANDONMENT_THRESHOLD_MINUTES` | Umbral para carrito abandonado           | 1000                 |
| `CART_RECOVERY_TOKEN_EXPIRY_DAYS`    | Días de expiración del token             | 7                    |

## 🚀 Ejecución / Running

### Development

```bash
# Backend
cd backend
pnpm dev

# Frontend (en otra terminal)
cd frontend
pnpm dev
```

### Production

```bash
# Backend
cd backend
pnpm build
pnpm start

# Frontend
cd frontend
pnpm build
pnpm preview
```

## 🧪 Testing

```bash
# Backend - Unit Tests
cd backend
pnpm test

# Backend - Integration Tests
pnpm test:integration

# Frontend - Unit Tests
cd ../frontend
pnpm test

# E2E Tests
pnpm test:e2e
```

## 📚 Documentación

Ver [docs/INDEX.md](docs/INDEX.md) para el directorio completo de documentación.

### Documentación Principal

| Documento                                                          | Descripción                          |
| ------------------------------------------------------------------ | ------------------------------------ |
| [docs/INDEX.md](docs/INDEX.md)                                     | Directorio de documentación          |
| [docs/PRD.md](docs/PRD.md)                                         | Product Requirements Document        |
| [docs/ROADMAP.md](docs/ROADMAP.md)                                 | Hoja de ruta del proyecto            |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)                       | Arquitectura del sistema             |
| [docs/TASKS-Sprint2.md](docs/TASKS-Sprint2.md)                     | Sprint 2 tasks & acceptance criteria |
| [docs/EMAIL-AUTOMATION-GUIDE.md](docs/EMAIL-AUTOMATION-GUIDE.md)   | Guía de email campaigns              |
| [docs/BREVO-INTEGRATION.md](docs/BREVO-INTEGRATION.md)             | Integración con Brevo                |
| [docs/ABANDONED-CART-WORKFLOW.md](docs/ABANDONED-CART-WORKFLOW.md) | Flujo de carrito abandonado          |

### API Endpoints Principales

| Método | Endpoint                                 | Descripción                               |
| ------ | ---------------------------------------- | ----------------------------------------- |
| POST   | `/api/auth/register`                     | Registrar usuario                         |
| POST   | `/api/auth/login`                        | Iniciar sesión                            |
| GET    | `/api/auth/me`                           | Usuario actual                            |
| GET    | `/api/dashboard`                         | Dashboard del usuario                     |
| GET    | `/api/users/me/tree`                     | Árbol binario                             |
| GET    | `/api/commissions`                       | Lista de comisiones                       |
| GET    | `/api/admin/stats`                       | Estadísticas globales (admin)             |
| GET    | `/api/admin/users`                       | Lista de usuarios (admin)                 |
| POST   | `/api/v1/gift-cards`                     | Crear tarjeta regalo (admin)              |
| GET    | `/api/v1/gift-cards/{id}/validate`       | Validar tarjeta regalo                    |
| POST   | `/api/v1/gift-cards/{id}/redeem`         | Redimir tarjeta regalo                    |
| GET    | `/api/v1/gift-cards`                     | Listar tarjetas (admin)                   |
| GET    | `/api/v1/carts/me`                       | Obtener carrito actual                    |
| POST   | `/api/v1/carts/me/items`                 | Agregar item al carrito                   |
| GET    | `/api/v1/carts/recover/{token}`          | Recuperar carrito abandonado              |
| GET    | `/api/v1/carts/abandoned`                | Listar carritos abandonados (admin)       |
| POST   | `/api/v1/email-templates`                | Crear template de email                   |
| POST   | `/api/v1/email-campaigns`                | Crear campaña de email                    |
| POST   | `/api/v1/email-campaigns/{id}/send`      | Enviar campaña                            |
| POST   | `/api/v1/email-campaigns/{id}/pause`     | Pausar campaña                            |
| GET    | `/api/v1/email-campaigns/{id}/logs`      | Ver logs de campaña                       |
| GET    | `/api/v1/email-campaigns`                | Listar campañas                           |
| GET    | `/api/products`                          | Listar productos activos (público)        |
| GET    | `/api/products/:id`                      | Detalle de producto                       |
| GET    | `/api/categories`                        | Listar categorías activas                 |
| GET    | `/api/addresses`                         | Listar direcciones de envío               |
| POST   | `/api/addresses`                         | Crear dirección de envío                  |
| PATCH  | `/api/addresses/:id/default`             | Marcar dirección como predeterminada      |
| PUT    | `/api/orders/:id/shipping`               | Asignar envío a una orden                 |
| GET    | `/api/orders/:id/tracking`               | Ver tracking de una orden                 |
| GET    | `/api/contracts`                         | Listar contratos con estado de aceptación |
| POST   | `/api/contracts/:id/accept`              | Aceptar contrato (guarda IP/hash)         |
| GET    | `/api/vendor/dashboard`                  | Dashboard del vendor                      |
| GET    | `/api/admin/products`                    | Listar todos los productos (admin)        |
| PATCH  | `/api/admin/vendors/:id/commission-rate` | Actualizar comisión de vendor             |
| GET    | `/api/admin/contracts`                   | Gestión de contratos (admin)              |

## 📁 Estructura del Proyecto / Project Structure

```tree
MLM/
├── docs/                     # Documentación general
│   ├── INDEX.md             # Directorio de documentación
│   ├── PRD.md               # Product Requirements
│   ├── ROADMAP.md           # Hoja de ruta
│   ├── ARCHITECTURE.md      # Arquitectura del sistema
│   ├── API.md               # Referencia de API
│   ├── DEPLOYMENT.md        # Guía de deployment
│   ├── TESTING.md           # Guía de testing
│   └── guides/              # Guías y políticas
│       ├── CONTRIBUTING.md
│       ├── SECURITY.md
│       └── CHANGELOG.md
├── backend/
│   ├── src/
│   │   ├── controllers/       # Express controllers
│   │   │   ├── GiftCardController.ts
│   │   │   ├── CartController.ts
│   │   │   ├── EmailCampaignController.ts
│   │   │   ├── CategoryController.ts
│   │   │   ├── ProductController.ts
│   │   │   ├── AdminCategoryController.ts
│   │   │   ├── AdminProductController.ts
│   │   │   ├── VendorController.ts
│   │   │   ├── AdminVendorController.ts
│   │   │   ├── ContractController.ts
│   │   │   └── AdminContractController.ts
│   │   ├── services/          # Business logic
│   │   │   ├── GiftCardService.ts
│   │   │   ├── QRService.ts
│   │   │   ├── CartService.ts
│   │   │   ├── CartRecoveryEmailService.ts
│   │   │   ├── EmailCampaignService.ts
│   │   │   ├── BrevoEmailService.ts
│   │   │   ├── EmailQueueService.ts
│   │   │   ├── SchedulerService.ts
│   │   │   └── ContractService.ts
│   │   ├── models/            # Sequelize models
│   │   ├── routes/            # API routes
│   │   └── middleware/        # Auth, rate limiting
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GiftCards/     # Gift card create & redeem
│   │   │   ├── Cart/          # Cart preview & recovery
│   │   │   ├── EmailBuilder/  # WYSIWYG email builder
│   │   │   └── EmailCampaigns/ # Campaign dashboard & monitoring
│   │   ├── pages/
│   │   │   ├── RecoverCartPage.tsx
│   │   │   └── EmailCampaignPage.tsx
│   │   └── stores/
│   │       └── cartStore.ts   # Zustand cart state
│   └── ...
├── docker-compose.prod.yml  # Producción
└── deploy.sh               # Script de deployment
```

## 💜 Apoyar el Proyecto / Support

Si este proyecto te resulta útil, podés apoyarlo con una donación:

<a href="https://www.paypal.com/donate/?hosted_button_id=EHHNLEUMEMK6L">
  <img src=".github/assets/paypal-qr.png" alt="Donar con PayPal" width="200">
</a>

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-❤️-ea4aaa?style=for-the-badge&logo=github)](https://github.com/sponsors/ipproyectosysoluciones)
[![PayPal](https://img.shields.io/badge/PayPal-Donar-00457C?style=for-the-badge&logo=paypal)](https://www.paypal.com/donate/?hosted_button_id=EHHNLEUMEMK6L)

## 📞 Contacto

- **Proyecto**: Nexo Real - Plataforma de Afiliaciones
- **GitHub**: https://github.com/ipproyectosysoluciones/mlm-platform _(será renombrado próximamente)_
- **Docker Hub**: https://hub.docker.com/u/ipproyectos

## 📄 Licencia

ISC
