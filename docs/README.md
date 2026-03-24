# MLM Platform - Documentación General / General Documentation

## Español

Bienvenido a la documentación de la plataforma MLM (Marketing Multinivel). Esta plataforma incluye un sistema de afiliados binarios con comisiones automáticas, distribución en niveles y visualización del árbol genealógico.

### Características Principales

- **Sistema de Afiliaciones Binarias** - Red de usuarios con posición izquierda/derecha
- **Comisiones Automáticas** - Directas y por niveles (hasta 4 niveles)
- **Código QR de Referido** - Generación automática para cada usuario
- **Dashboard en Tiempo Real** - Estadísticas y rendimiento
- **Panel de Administración** - Gestión completa de usuarios y comisiones
- **CRM Integrado** - Gestión de leads y tareas
- **API REST Documentada** - OpenAPI/Swagger integrado
- **Tests Automatizados** - Unit, Integration y E2E

### Estructura del Proyecto

```tree
MLM/
├── backend/          # API REST (Node.js, Express, TypeScript)
├── frontend/         # Aplicación React
├── docs/             # Documentación general
└── SPEC.md           # Especificación técnica
```

### Requisitos

- Node.js 18+
- MySQL 8.0+
- Docker y Docker Compose (para desarrollo)

---

## English

Welcome to the MLM (Multi-Level Marketing) platform documentation. This platform includes a binary affiliate system with automatic commissions, multi-level distribution, and genealogy tree visualization.

### Key Features

- **Binary Affiliation System** - User network with left/right positions
- **Automatic Commissions** - Direct and multi-level (up to 4 levels)
- **Referral QR Code** - Automatic generation for each user
- **Real-Time Dashboard** - Statistics and performance
- **Admin Panel** - Complete user and commission management
- **Integrated CRM** - Lead and task management
- **Documented REST API** - OpenAPI/Swagger integrated
- **Automated Tests** - Unit, Integration and E2E

### Project Structure

```tree
MLM/
├── backend/          # REST API (Node.js, Express, TypeScript)
├── frontend/         # React Application
├── docs/             # General documentation
└── SPEC.md           # Technical specification
```

### Requirements

- Node.js 18+
- MySQL 8.0+
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

| File                   | Description / Descripción                                      |
| ---------------------- | -------------------------------------------------------------- |
| `README.md`            | Project overview / Descripción del proyecto                    |
| `SPEC.md`              | Complete API specification / Especificación completa de la API |
| `docs/ARCHITECTURE.md` | System architecture / Arquitectura del sistema                 |
| `docs/API.md`          | API endpoints guide / Guía de endpoints                        |
| `docs/TESTING.md`      | Testing documentation / Documentación de tests                 |
| `docs/CONTRIBUTING.md` | Contribution guidelines / Guía de contribuciones               |
| `docs/CRM-ROADMAP.md`  | CRM feature roadmap / Roadmap de funcionalidades CRM           |
| `CHANGELOG.md`         | Version history / Historial de versiones                       |
| `BRANCHING.md`         | Git branching strategy / Estrategia de ramas Git               |

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
