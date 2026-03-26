# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

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
