# Roadmap del Proyecto MLM Platform

> Hoja de ruta completa para la plataforma MLM de Afiliaciones Binarias.

**Versión actual**: 1.3.0  
**Última actualización**: 2026-03-30  
**Estado**: Activo - Desarrollo continuo

---

## 📊 Resumen de Progreso

```
███████████████░░░░░░░░░░░░░░ 75% Completado
```

| Fase    | Nombre         | Estado           | Versión |
| ------- | -------------- | ---------------- | ------- |
| Phase 1 | MVP - Core     | ✅ Completo      | v1.0.0  |
| Phase 2 | Notificaciones | ❌ Cancelado     | -       |
| Phase 3 | Visual Tree UI | ✅ Completo      | v1.1.0  |
| Phase 4 | E-commerce     | ✅ Parcial       | v1.2.0  |
| Phase 5 | Deployment     | ✅ Completo      | v1.3.0  |
| Phase 6 | Wallet + Pagos | 🔄 En desarrollo | v1.4.0  |
| Phase 7 | Enterprise     | 📋 Planeado      | v2.0.0  |

---

## 🎯 Historial de Versiones

### ✅ v1.0.0 - MVP (Marzo 2026)

**Fecha de lanzamiento**: 2026-03-15  
**Estado**: ✅ Stable

#### Funcionalidades Implementadas

- [x] Sistema de autenticación JWT
  - Registro con código de patrocinador
  - Login con email/password
  - Renovación de tokens
- [x] Árbol binario con Closure Table
  - Colocación automática izquierda/derecha
  - Consulta de upline y downline
- [x] Sistema de comisiones (5 niveles)
  - Directo: 10%
  - Nivel 1: 5%
  - Nivel 2: 3%
  - Nivel 3: 2%
  - Nivel 4: 1%
- [x] Dashboard con estadísticas
  - Total de referidos
  - Conteo izquierda/derecha
  - Ganancias totales y pendientes
- [x] Panel de administración
  - Gestión de usuarios
  - Cambio de estado
  - Roles admin/user
- [x] CRM básico
  - Leads (prospectos)
  - Tareas
  - Comunicaciones
- [x] Generación de códigos QR
- [x] Rate limiting
- [x] 158 tests de integración

---

### ✅ v1.1.0 - Visual Tree UI (Marzo 2026)

**Fecha de lanzamiento**: 2026-03-20  
**Estado**: ✅ Stable

#### Funcionalidades Implementadas

- [x] Visualización interactiva del árbol (React Flow)
  - Pan y zoom suaves
  - Minimap para navegación
- [x] Nodos personalizados
  - Indicadores de posición (izquierda/derecha)
  - Estados: vacío, con usuario, seleccionado
- [x] Búsqueda de miembros
  - Por nombre o email
  - Navegación directa al nodo
- [x] Panel de detalles
  - Información del usuario
  - Estadísticas del nodo
  - Navegación a subárbol
- [x] Controles de profundidad
  - Selector de niveles (1-10)
- [x] Estados de carga optimizados
  - Loading con skeleton
  - Empty state con mensaje
  - Error state con retry
- [x] Internacionalización (ES/EN)
- [x] 13 tests E2E adicionales

---

### ✅ v1.2.0 - E-commerce Streaming (Marzo 2026)

**Fecha de lanzamiento**: 2026-03-25  
**Estado**: ✅ Stable

#### Funcionalidades Implementadas

- [x] Catálogo de productos
  - Netflix, Spotify, HBO, Disney+, Amazon Prime
  - Suscripciones de streaming
- [x] Gestión de productos (admin)
  - CRUD completo
  - Categorías
  - Precios configurables
- [x] Sistema de pedidos
  - Compra con un clic
  - Estado del pedido
  - Historial de compras
- [x] URLs de streaming
  - Generación de tokens
  - URLs temporales
- [x] Integración con comisiones
  - Comisiones automáticas al comprar
- [x] 17 tests adicionales

---

### ✅ v1.3.0 - Deployment & CI/CD (Marzo 2026)

**Fecha de lanzamiento**: 2026-03-30  
**Estado**: ✅ Stable

#### Funcionalidades Implementadas

- [x] Docker deployment
  - Imágenes optimizadas
  - Multi-stage builds
  - docker-compose.prod.yml
- [x] CI/CD con GitHub Actions
  - Pipeline de CI (tests)
  - Pipeline de CD (Docker Hub)
- [x] Documentación completa
  - ARCHITECTURE.md
  - API.md
  - DEPLOYMENT.md
  - PRD.md
- [x] Migración a PostgreSQL
  - Sequelize con dialecto postgres
  - Índices optimizados
- [x] Fixes de producción
  - React 19 + Zustand compatibility
  - CORS para localhost:3001
  - Commission status enum fix

---

## 🔄 En Desarrollo

### 🚧 v1.4.0 - Wallet & Pagos

**Estado**: 🔄 En desarrollo  
**Target**: Abril 2026

#### Funcionalidades Planeadas

- [ ] Sistema de wallet completo
  - [x] Balance de usuario
  - [x] Depósitos
  - [x] Retiros (5% fee, $20 min)
  - [ ] Historial de transacciones
- [ ] Conversión de moneda
  - [x] API Frankfurter integration
  - [ ] Tasas en tiempo real en frontend
- [ ] Pagos automáticos
  - [ ] Integración con Stripe Connect
  - [ ] Integración con PayPal
  - [ ] Transferencias bancarias
- [ ] Auditoría de transacciones
  - [ ] Logs detallados
  - [ ] Reportes financieros

#### Dependencias

| Dependencia    | Estado       | Notas                      |
| -------------- | ------------ | -------------------------- |
| Stripe Connect | ⏳ Pendiente | Requiere cuenta de negocio |
| PayPal         | ⏳ Pendiente | Sandbox disponible         |
| Brevo (Email)  | ⏳ Pendiente | Para notificaciones        |

---

## 📋 Planeado

### 📋 v2.0.0 - Enterprise

**Estado**: 📋 Planeado  
**Target**: Q3-Q4 2026

#### Funcionalidades Enterprise

- [ ] White-label
  - [ ] Dominios personalizados
  - [ ] Temas configurables
  - [ ] Logo personalizable
- [ ] Estructuras de comisión avanzadas
  - [ ] Unilevel
  - [ ] Matrix
  - [ ]自定义
- [ ] SSO/SAML
  - [ ] Google Workspace
  - [ ] Azure AD
  - [ ] Okta
- [ ] Permisos avanzados
  - [ ] Equipos y departamentos
  - [ ] Permisos granulares
- [ ] Webhooks API
  - [ ] Eventos de usuario
  - [ ] Eventos de comisión
  - [ ] Eventos de orden
- [ ] KYC/Verificación de identidad
  - [ ] Documentos de identidad
  - [ ] Verificación facial
- [ ] 2FA (TOTP)
  - [ ] Códigos QR
  - [ ] Códigos de recuperación
  - [ ] App authenticator

---

## 🔧 Refactorización del Código

> **Prioridad**: ⭐ Alta  
> **Estado**: 📋 Planeado  
> **Objetivo**: Mejorar mantenibilidad, legibilidad y escalabilidad del código

### 📋 Motivación

El código actual funciona correctamente, pero algunos archivos han crecido mucho y necesitan ser modularizados para:

- Mejor legibilidad y mantenimiento
- Facilitar onboarding de nuevos desarrolladores
- Mejor organización para testing
- Preparar base para features futuras

---

### 🎨 Frontend React (Priority: Alta)

**Archivos a refactorizar:**

| Archivo Actual       | Problema    | Acción                                                |
| -------------------- | ----------- | ----------------------------------------------------- |
| `Dashboard.tsx`      | >500 líneas | Extraer: Cards, Charts, Stats a componentes separados |
| `TreeView.tsx`       | >400 líneas | Extraer: Controls, Minimap, SearchPanel               |
| `CRM.tsx`            | >600 líneas | Extraer: KanbanBoard, LeadCard, TaskModal             |
| `AdminDashboard.tsx` | >350 líneas | Extraer: UserTable, StatsCards, Filters               |
| `App.tsx`            | >300 líneas | Extraer: Routes config, Route guards                  |
| `AppLayout.tsx`      | >250 líneas | Extraer: Navbar, MobileMenu, LanguageSelector         |

**Estructura propuesta:**

```
frontend/src/
├── components/
│   ├── dashboard/
│   │   ├── DashboardPage.tsx      # Componente principal
│   │   ├── StatsCards.tsx         # Tarjetas de estadísticas
│   │   ├── ReferralChart.tsx      # Gráfico de referidos
│   │   ├── CommissionChart.tsx    # Gráfico de comisiones
│   │   └── RecentActivity.tsx     # Actividad reciente
│   │
│   ├── tree/
│   │   ├── TreeViewPage.tsx       # Página principal
│   │   ├── TreeControls.tsx       # Controles de zoom/profundidad
│   │   ├── TreeSearch.tsx         # Búsqueda de usuarios
│   │   ├── TreeDetails.tsx        # Panel de detalles
│   │   └── TreeMinimap.tsx       # Minimap
│   │
│   ├── crm/
│   │   ├── CRMPage.tsx            # Página principal
│   │   ├── KanbanBoard.tsx        # Tablero Kanban
│   │   ├── LeadCard.tsx           # Tarjeta de lead
│   │   ├── LeadModal.tsx          # Modal de creación/edición
│   │   ├── TaskCard.tsx           # Tarjeta de tarea
│   │   └── TaskModal.tsx          # Modal de tarea
│   │
│   ├── admin/
│   │   ├── AdminPage.tsx          # Página principal
│   │   ├── UsersTable.tsx         # Tabla de usuarios
│   │   ├── StatsOverview.tsx      # Estadísticas generales
│   │   └── UserFilters.tsx        # Filtros de búsqueda
│   │
│   ├── layout/
│   │   ├── AppLayout.tsx          # Layout principal
│   │   ├── Navbar.tsx             # Barra de navegación
│   │   ├── MobileMenu.tsx         # Menú móvil
│   │   ├── LanguageSelector.tsx   # Selector de idioma
│   │   └── UserMenu.tsx           # Menú de usuario
│   │
│   └── shared/
│       ├── LoadingSpinner.tsx     # Spinner de carga
│       ├── ErrorBoundary.tsx      # Manejo de errores
│       ├── EmptyState.tsx         # Estados vacíos
│       └── ConfirmDialog.tsx      # Diálogos de confirmación
```

**Tareas específicas:**

- [ ] Extraer componentes de Dashboard
- [ ] Extraer componentes de TreeView
- [ ] Extraer componentes de CRM
- [ ] Extraer componentes de AdminDashboard
- [ ] Refactorizar App.tsx routing
- [ ] Crear carpeta `shared/` para componentes reutilizables
- [ ] Actualizar imports en todos los archivos
- [ ] Agregar JSDoc comments
- [ ] Verificar que todos los tests pasen

---

### ⚙️ Backend Node.js (Priority: Media-Alta)

**Archivos a refactorizar:**

| Archivo Actual            | Problema    | Acción                                   |
| ------------------------- | ----------- | ---------------------------------------- |
| `AuthController.ts`       | >400 líneas | Separar: login, register, profile, 2FA   |
| `UserController.ts`       | >350 líneas | Separar: tree, qr, profile               |
| `CRMController.ts`        | >500 líneas | Separar: leads, tasks, communications    |
| `CommissionController.ts` | >300 líneas | Separar: history, stats, config          |
| `WalletController.ts`     | >400 líneas | Separar: balance, transactions, withdraw |

**Estructura propuesta:**

```
backend/src/
├── controllers/
│   ├── auth/
│   │   ├── AuthController.ts       # Auth principal
│   │   ├── LoginController.ts     # Login endpoint
│   │   ├── RegisterController.ts  # Register endpoint
│   │   ├── ProfileController.ts   # Profile endpoints
│   │   └── TwoFactorController.ts # 2FA endpoints
│   │
│   ├── users/
│   │   ├── UserController.ts      # User principal
│   │   ├── TreeController.ts      # Tree endpoints
│   │   └── QRController.ts        # QR endpoints
│   │
│   ├── crm/
│   │   ├── CRMController.ts       # CRM principal
│   │   ├── LeadController.ts      # Lead endpoints
│   │   ├── TaskController.ts      # Task endpoints
│   │   └── CommunicationController.ts
│   │
│   ├── commissions/
│   │   ├── CommissionController.ts
│   │   ├── HistoryController.ts    # Commission history
│   │   └── StatsController.ts     # Commission stats
│   │
│   └── wallet/
│       ├── WalletController.ts     # Wallet principal
│       ├── TransactionController.ts # Transactions
│       └── WithdrawalController.ts # Withdrawals
```

**Tareas específicas:**

- [ ] Separar AuthController en sub-controladores
- [ ] Separar UserController en tree/qr
- [ ] Separar CRMController en leads/tasks/comms
- [ ] Separar CommissionController
- [ ] Separar WalletController
- [ ] Crear índice de exports por carpeta
- [ ] Actualizar rutas para nuevos controllers
- [ ] Verificar que todos los tests pasen

---

### 📊 Beneficios Esperados

| Métrica                       | Antes    | Después |
| ----------------------------- | -------- | ------- |
| Líneas por archivo (promedio) | ~350     | ~150    |
| Complejidad ciclomática       | Alta     | Media   |
| Tiempo de onboarding          | 2-3 días | 1 día   |
| Facilidad de testing          | Media    | Alta    |
| Cobertura de tests            | 85%      | 90%+    |

---

### 🎯 Orden Sugerido de Ejecución

```
1. Frontend: Dashboard components (más usado)
2. Frontend: Layout components (base para todo)
3. Frontend: CRM components
4. Frontend: TreeView components
5. Backend: AuthController refactor
6. Backend: CRMController refactor
7. Frontend: Admin components
8. Backend: UserController refactor
9. Frontend: Cleanup shared components
10. Backend: Commission/Wallet refactor
```

---

### ⚠️ Precauciones

- **No cambiar comportamiento**: Solo refactorizar, no reescribir lógica
- **Mantener tests verdes**: Cada refactor debe mantener los tests pasando
- **Commits atómicos**: Un archivo/refactor por commit
- **Documentar decisiones**: Agregar comentarios de por qué se reorganizó

---

## ❌ Cancelado

### 🚫 Phase 2 - Email & SMS Notifications

**Razón**: Movido a v2.0 por enfoque en core features

| Feature Original    | Nueva Ubicación |
| ------------------- | --------------- |
| Email notifications | v2.0            |
| SMS 2FA             | v2.0            |
| Weekly digest       | v2.0            |
| Push notifications  | v2.0            |

---

## 📈 Métricas de Proyecto

### Test Coverage

```
┌─────────────────────────────────────────────────────────┐
│                    Cobertura de Tests                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Unit Tests:        ████████████████████  61 tests      │
│  Integration Tests: ████████████████████  158 tests     │
│  E2E Tests:        ████████████████░░░░  37 tests      │
│                                                          │
│  TOTAL:            ████████████████████  256 tests      │
│                                                          │
│  Cobertura:        █████████████████░░░  85%             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Líneas de Código

| Componente                  | Líneas      | Archivos |
| --------------------------- | ----------- | -------- |
| Backend (TypeScript)        | ~15,000     | ~120     |
| Frontend (TypeScript/React) | ~12,000     | ~80      |
| Tests                       | ~8,000      | ~50      |
| Documentación               | ~3,000      | ~8       |
| **TOTAL**                   | **~38,000** | **~258** |

---

## 🗓️ Timeline Esperado

```
2026
├── Q1 (Completado)
│   ├── Enero    ████████████████████ MVP v1.0 ✅
│   ├── Febrero  ████████░░░░░░░░░░░░░░░░░░░░░░  Planning
│   └── Marzo    ████████████████████████ v1.3 ✅
│
├── Q2 (En Progreso)
│   ├── Abril    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ Wallet v1.4 🔄
│   ├── Mayo     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ Wallet v1.4 🔄
│   └── Junio    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ Stability
│
├── Q3 (Planeado)
│   ├── Julio    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ Payments
│   ├── Agosto   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ Payments
│   └── Sept     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ Enterprise
│
└── Q4 (Planeado)
    ├── Oct      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ Enterprise
    ├── Nov      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ Enterprise
    └── Dic      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ v2.0 Launch
```

---

## 🔗 Recursos

### Repositorio

```
GitHub: https://github.com/ipproyectosysoluciones/mlm-platform
Docker Hub: https://hub.docker.com/u/ipproyectos
```

### Tags y Releases

```bash
# Ver todas las versiones
git tag -l

# Ver release notes
git show v1.3.0 --stat
```

### Changelog

| Versión | Fecha      | Cambios                              |
| ------- | ---------- | ------------------------------------ |
| v1.3.0  | 2026-03-30 | Docker deployment, CI/CD, PostgreSQL |
| v1.2.0  | 2026-03-25 | E-commerce streaming, products       |
| v1.1.0  | 2026-03-20 | Visual tree UI, React Flow           |
| v1.0.0  | 2026-03-15 | MVP launch                           |

---

## 📞 Contribuir al Roadmap

### Reportar Issues

Si encuentras bugs o tienes sugerencias:

1. Abre un issue en GitHub
2. Usa el template de bug report
3. Incluir pasos para reproducir

### Proponer Features

Para proponer nuevas características:

1. Discute en GitHub Discussions
2. Crea un feature request
3. El equipo evaluará para futuras versiones

### Pull Requests

Aceptamos contribuciones:

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/mi-feature`)
3. Commit (`git commit -am 'Agrega mi feature'`)
4. Push (`git push origin feature/mi-feature`)
5. Abre un Pull Request

---

**Última actualización**: 2026-03-30  
**Próxima revisión**: 2026-04-15  
**Mantenedor**: MLM Development Team
