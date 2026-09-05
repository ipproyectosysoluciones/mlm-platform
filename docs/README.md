# Nexo Real - Documentación General / General Documentation

## Español

Bienvenido a la documentación de Nexo Real. Esta plataforma incluye un sistema de afiliados Unilevel con comisiones automáticas, distribución en niveles y visualización del árbol genealógico.

### Características Principales

- **Sistema de Afiliaciones Unilevel** - Red de usuarios multinivel sin restricción de posición
- **Comisiones Automáticas** - Directas y por niveles (hasta 10 niveles configurables)
- **Código QR de Referido** - Generación automática para cada usuario
- **Dashboard en Tiempo Real** - Estadísticas, gráficos y rendimiento
- **Panel de Administración** - Gestión completa de usuarios y comisiones
- **CRM Integrado** - Gestión de leads, tareas y pipeline Kanban
- **Importación/Exportación CSV** - Carga masiva de leads
- **Visualización del Árbol** - Árbol genealógico interactivo con React Flow
- **Landing Pages** - Creador de páginas de captura
- **API REST Documentada** - OpenAPI/Swagger bilingüe (ES/EN)
- **Tests Automatizados** - ~1,850 tests (1155 backend + 695 frontend)
- **i18n** - Interfaz bilingüe (Español/Inglés)
- **Wallet Digital** - Billetera con retiros PayPal Payouts y transacciones
- **2FA (TOTP)** - Two-Factor Authentication con códigos de recuperación
- **Gift Cards** — Creación, validación y redención con QR
- **Email Automation** — Constructor WYSIWYG, campañas programadas, integración Brevo
- **Marketplace Multi-vendor** — Split de comisiones 3-way

### Estructura del Proyecto

```tree
nexo-real/
├── backend/          # REST API (Node.js, Express, PostgreSQL, Sequelize)
├── frontend/         # React 19 + Vite
├── bot/              # Nexo Bot (BuilderBot + Baileys)
├── docs/             # Documentación general
├── openspec/         # OpenSpec artifacts (SDD)
└── package.json      # pnpm workspace root
```

### Requisitos

- Node.js 24+
- PostgreSQL 16+
- Redis 7+ (opcional)
- Docker y Docker Compose (para desarrollo)

---

## English

Welcome to the Nexo Real documentation. This platform includes a Unilevel affiliate system with automatic commissions, multi-level distribution, and genealogy tree visualization.

### Key Features

- **Unilevel Affiliation System** - User network with multi-level positions
- **Automatic Commissions** - Direct and multi-level (up to 10 configurable levels)
- **Referral QR Code** - Automatic generation for each user
- **Real-Time Dashboard** - Statistics, charts and performance
- **Admin Panel** - Complete user and commission management
- **Integrated CRM** - Lead management, tasks and Kanban pipeline
- **CSV Import/Export** - Bulk lead loading
- **Tree Visualization** - Interactive genealogy tree with React Flow
- **Landing Pages** - Capture page builder
- **Documented REST API** - Bilingual OpenAPI/Swagger
- **Automated Tests** - ~1,850 tests (1155 backend + 695 frontend)
- **i18n** - Bilingual interface (Spanish/English)
- **Digital Wallet** - PayPal Payouts withdrawals and transactions
- **2FA (TOTP)** - Two-Factor Authentication with recovery codes
- **Gift Cards** — Create, validate, and redeem with QR
- **Email Automation** — WYSIWYG builder, scheduled campaigns, Brevo integration
- **Multi-vendor Marketplace** — 3-way commission split

### Project Structure

```tree
nexo-real/
├── backend/          # REST API (Node.js, Express, PostgreSQL)
├── frontend/         # React 19 + Vite
├── bot/              # Nexo Bot (BuilderBot + Baileys)
├── docs/             # General documentation
└── package.json      # pnpm workspace root
```

### Requirements

- Node.js 24+
- PostgreSQL 16+
- Redis 7+ (optional)
- Docker and Docker Compose (for development)

---

## Quick Start / Inicio Rápido

```bash
# Clonar / Clone
git clone <repo-url>
cd MLM

# Backend / Backend
cd backend
cp .env.example .env
pnpm install
pnpm dev

# Frontend / Frontend
cd ../frontend
pnpm install
pnpm dev
```

## Testing

```bash
# Backend Tests / Tests de Backend
cd backend
pnpm test              # Unit tests
pnpm test:integration   # Integration tests

# Frontend Tests / Tests de Frontend
cd ../frontend
pnpm test              # Unit tests
pnpm test:e2e           # E2E tests (Playwright)
```

## Documentation Index / Índice de Documentación

| File                            | Description / Descripción                               |
| ------------------------------- | ------------------------------------------------------- |
| `README.md`                     | Project overview / Descripción del proyecto             |
| `docs/README.md`                | Documentation index / Índice de documentación           |
| `docs/ARCHITECTURE.md`          | System architecture / Arquitectura del sistema          |
| `docs/API.md`                   | API endpoints guide / Guía de endpoints                 |
| `docs/TESTING.md`               | Testing documentation / Documentación de tests          |
| `docs/DEPLOYMENT.md`            | Deployment guide / Guía de despliegue                   |
| `docs/PRD.md`                   | Product Requirements Document / Documento de requisitos |
| `docs/ROADMAP.md`               | Project roadmap / Hoja de ruta                          |
| `CHANGELOG.md`                  | Version history / Historial de versiones                |
| `SECURITY.md`                   | Security policy / Política de seguridad                 |
| `CONTRIBUTING.md`               | Contribution guidelines / Guía de contribuciones        |
| `CODE_OF_CONDUCT.md`            | Code of conduct / Código de conducta                    |
| `BRANCHING.md`                  | Git branching strategy / Estrategia de ramas Git        |
| `guides/SECURITY_MONITORING.md` | Security monitoring / Monitoreo de seguridad            |
| `docs/guides/SETUP_DATABASE.md` | Database setup / Configuración de base de datos         |

### Frontend Documentation (frontend/docs/)

| File            | Description / Descripción                     |
| --------------- | --------------------------------------------- |
| `README.md`     | Project overview / Descripción del proyecto   |
| `COMPONENTS.md` | Component documentation / Docs de componentes |
| `PAGES.md`      | Pages and routes / Páginas y rutas            |
| `API_CLIENT.md` | API client documentation / Docs de API client |

### SDD Documents (sdd/)

| Directory                | Description / Descripción                        |
| ------------------------ | ------------------------------------------------ |
| `sdd-i18n-bilingual/`    | i18n bilingual system / Sistema de i18n          |
| `sdd-horizontal-navbar/` | Horizontal navbar layout / Layout navbar         |
| `phase-3-visual-tree/`   | Visual tree UI / UI de árbol visual              |
| `phase-2-notifications/` | Notifications system / Sistema de notificaciones |

---

## License / Licencia

MIT
