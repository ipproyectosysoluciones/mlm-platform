# MLM Platform - Sistema de Afiliaciones Binarias

Plataforma MLM (Multi-Level Marketing) con sistema de afiliaciones binarias, comisiones por niveles y visualización de árbol genealógico.

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
- **Tests Automatizados** - Unit, Integration y E2E con Playwright
- **i18n** - Interfaz bilingüe (Español/Inglés)
- **Wallet Digital** - Billetera digital con retiros y transacciones
- **2FA (TOTP)** - Two-Factor Authentication con códigos de recuperación

## 📊 Estado de Implementación / Implementation Status

### ✅ Cambios Completados

| Cambio                            | Descripción                            | Estado       | Fecha      |
| --------------------------------- | -------------------------------------- | ------------ | ---------- |
| streaming-subscriptions-ecommerce | Sistema de suscripciones y e-commerce  | ✅ Archivado | 2026-03-27 |
| wallet-digital                    | Billetera digital con retiros          | ✅ Archivado | 2026-03-27 |
| sdd-i18n-bilingual                | Sistema de internacionalización ES/EN  | ✅ Archivado | 2026-03-27 |
| phase-3-visual-tree               | Visual Tree UI con React Flow          | ✅ Archivado | 2026-03-27 |
| sdd-horizontal-navbar             | Layout de navbar horizontal            | ✅ Archivado | 2026-03-27 |
| es-modules-migration              | Migración a ES Modules                 | ✅ Completo  | 2026-03-28 |
| postgresql-support                | Soporte para PostgreSQL + Docker       | ✅ Completo  | 2026-03-28 |
| build-optimization                | Build optimizado (3.4MB → 1.2MB)       | ✅ Completo  | 2026-03-28 |
| github-templates                  | CODE_OF_CONDUCT, Issues, PR templates  | ✅ Completo  | 2026-03-28 |
| 2fa-totp                          | Two-Factor Authentication con TOTP     | ✅ Archivado | 2026-03-29 |
| playwright-visual-testing         | Scripts E2E con modo visual            | ✅ Archivado | 2026-03-29 |
| frontend-2fa-ui                   | UI de React para 2FA con QR code       | ✅ Completo  | 2026-03-30 |
| frontend-refactoring              | Modularización de componentes frontend | ✅ Completo  | 2026-03-30 |
| backend-refactoring               | Controllers modulares (auth, crm, etc) | ✅ Completo  | 2026-04-01 |
| pwa-offline-pages                 | Páginas 404 y Offline                  | ✅ Completo  | 2026-03-31 |
| pwa-improvements                  | Iconos multi-size, OfflineBanner       | ✅ Completo  | 2026-03-31 |

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
- MySQL 8.0+ o PostgreSQL 16+ (soporta ambos)
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
# - MySQL (puerto 3306)
# - PostgreSQL (puertos 5434, 5435)
# - Redis (puerto 6379)
# - phpMyAdmin (puerto 8080)
```

### Usar PostgreSQL en lugar de MySQL

```bash
# Configurar variables de entorno
export DB_DIALECT=postgres
export DB_PORT=5434  # para desarrollo
export TEST_DB_PORT=5435  # para tests
```

## ⚙️ Configuración / Configuration

### Variables de Entorno

| Variable          | Descripción                     | Default   |
| ----------------- | ------------------------------- | --------- |
| `DB_DIALECT`      | Dialecto de DB (mysql/postgres) | mysql     |
| `DB_HOST`         | Host de MySQL/PostgreSQL        | localhost |
| `DB_PORT`         | Puerto de MySQL/PostgreSQL      | 3306/5432 |
| `DB_NAME`         | Nombre de la base de datos      | mlm_db    |
| `DB_USER`         | Usuario de MySQL/PostgreSQL     | root/mlm  |
| `DB_PASSWORD`     | Contraseña de MySQL/PostgreSQL  | -         |
| `JWT_SECRET`      | Secreto para JWT                | -         |
| `REDIS_ENABLED`   | Habilitar Redis                 | false     |
| `REDIS_HOST`      | Host de Redis                   | localhost |
| `REDIS_PORT`      | Puerto de Redis                 | 6379      |
| `REDIS_PASSWORD`  | Contraseña de Redis (opcional)  | -         |
| `ALLOWED_ORIGINS` | Origins permitidos (producción) | localhost |

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

| Documento                                    | Descripción                   |
| -------------------------------------------- | ----------------------------- |
| [docs/INDEX.md](docs/INDEX.md)               | Directorio de documentación   |
| [docs/PRD.md](docs/PRD.md)                   | Product Requirements Document |
| [docs/ROADMAP.md](docs/ROADMAP.md)           | Hoja de ruta del proyecto     |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitectura del sistema      |

### API Endpoints Principales

| Método | Endpoint             | Descripción                   |
| ------ | -------------------- | ----------------------------- |
| POST   | `/api/auth/register` | Registrar usuario             |
| POST   | `/api/auth/login`    | Iniciar sesión                |
| GET    | `/api/auth/me`       | Usuario actual                |
| GET    | `/api/dashboard`     | Dashboard del usuario         |
| GET    | `/api/users/me/tree` | Árbol binario                 |
| GET    | `/api/commissions`   | Lista de comisiones           |
| GET    | `/api/admin/stats`   | Estadísticas globales (admin) |
| GET    | `/api/admin/users`   | Lista de usuarios (admin)     |

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
│   ├── src/                 # Código fuente
│   └── ...
├── frontend/
│   ├── src/                 # Código fuente
│   └── ...
├── docker-compose.prod.yml  # Producción
└── deploy.sh               # Script de deployment
```

## 📞 Contacto

- **Proyecto**: MLM Binary Affiliations Platform
- **GitHub**: https://github.com/ipproyectosysoluciones/mlm-platform
- **Docker Hub**: https://hub.docker.com/u/ipproyectos

## 📄 Licencia

ISC
