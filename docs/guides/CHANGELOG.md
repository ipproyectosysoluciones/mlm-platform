# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

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
