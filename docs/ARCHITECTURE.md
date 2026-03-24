# Arquitectura del Sistema / System Architecture

## Español

### Visión General

La plataforma MLM está construida con una arquitectura de API RESTful, separando claramente el backend (Node.js + Express + TypeScript + Sequelize + MySQL) del frontend (React + Vite + TypeScript + Tailwind CSS).

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE / CLIENT                       │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                  FRONTEND (React)                    │   │
│   │   - Vite Build System                               │   │
│   │   - Tailwind CSS (Styling)                          │   │
│   │   - React Router (Navigation)                       │   │
│   │   - Axios (HTTP Client)                            │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        SERVIDOR / SERVER                      │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                  BACKEND (Node.js)                    │   │
│   │                                                       │   │
│   │   Routes → Controllers → Services → Models          │   │
│   │                                                       │   │
│   │   ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │   │
│   │   │ Controllers │  │  Services   │  │  Models   │  │   │
│   │   │  (HTTP)     │  │  (Logic)    │  │   (DB)    │  │   │
│   │   └─────────────┘  └─────────────┘  └───────────┘  │   │
│   │                                                       │   │
│   └─────────────────────────────────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                    DATABASE                           │   │
│   │              MySQL 8.0 + Sequelize ORM                 │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Estructura de Capas / Layer Structure

```
backend/src/
├── config/              # Configuración / Configuration
│   ├── database.ts      # Conexión DB / DB Connection
│   ├── env.ts           # Variables de entorno / Environment
│   └── swagger.ts       # Documentación API / API Docs
├── controllers/        # Controladores / Controllers
│   ├── AuthController.ts
│   ├── UserController.ts
│   ├── CommissionController.ts
│   ├── AdminController.ts
│   └── CRMController.ts
├── services/           # Lógica de negocio / Business Logic
│   ├── AuthService.ts
│   ├── UserService.ts
│   ├── TreeService.ts
│   ├── CommissionService.ts
│   └── CRMService.ts
├── models/             # Modelos Sequelize / Sequelize Models
│   ├── User.ts
│   ├── Commission.ts
│   ├── Purchase.ts
│   ├── Lead.ts
│   └── Task.ts
├── routes/             # Definiciones de rutas / Route Definitions
├── middleware/         # Middleware (auth, errors, validation)
└── utils/             # Utilidades / Utilities
```

---

## English

### Overview

The MLM platform is built with a RESTful API architecture, clearly separating the backend (Node.js + Express + TypeScript + Sequelize + MySQL) from the frontend (React + Vite + TypeScript + Tailwind CSS).

### Layer Structure

```
backend/src/
├── config/              # Configuration
│   ├── database.ts       # DB Connection
│   ├── env.ts            # Environment variables
│   └── swagger.ts        # API Documentation
├── controllers/         # HTTP Request Handlers
│   ├── AuthController.ts
│   ├── UserController.ts
│   ├── CommissionController.ts
│   ├── AdminController.ts
│   └── CRMController.ts
├── services/            # Business Logic
│   ├── AuthService.ts
│   ├── UserService.ts
│   ├── TreeService.ts
│   ├── CommissionService.ts
│   └── CRMService.ts
├── models/             # Sequelize Models
│   ├── User.ts
│   ├── Commission.ts
│   ├── Purchase.ts
│   ├── Lead.ts
│   └── Task.ts
├── routes/             # Route Definitions
├── middleware/         # Middleware (auth, errors, validation)
└── utils/             # Utilities

frontend/src/
├── components/         # UI Components
│   ├── layout/       # Layout Components (NEW)
│   │   └── AppLayout.tsx    # Horizontal navbar layout
│   ├── tree/          # Tree Visualization Components
│   │   ├── TreeNodeComponent.tsx  # Custom React Flow node
│   │   ├── SearchBar.tsx         # User search
│   │   ├── DetailsPanel.tsx      # Node details panel
│   │   └── TreeControls.tsx      # Zoom, fit, depth controls
│   ├── CRM/           # CRM Components
│   │   └── CRMKanban.tsx   # Kanban board (future)
│   └── QRDisplay.tsx  # QR Code display
├── pages/             # Page Components (9 total)
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── TreeView.tsx  # Visual Tree Page (React Flow)
│   ├── Profile.tsx
│   ├── AdminDashboard.tsx
│   ├── CRM.tsx
│   ├── LandingPages.tsx
│   └── PublicProfile.tsx
├── stores/            # State Management
│   └── treeStore.ts  # Zustand store for tree
├── services/         # API Services
│   └── api.ts        # Centralized API client
├── i18n/             # Internationalization
│   ├── index.ts      # Configuration + helpers
│   └── locales/      # en.json, es.json translations
├── context/          # React Context
│   └── AuthContext.tsx  # Authentication context
└── types/            # TypeScript types
    └── index.ts      # Shared types
```

---

## Phase 3: Visual Tree UI / Árbol Visual

### Overview

Phase 3 implements an interactive binary tree visualization using React Flow (@xyflow/react), replacing the previous flexbox-based tree display.

### Tech Stack Additions

| Technology    | Version | Purpose                        |
| ------------- | ------- | ------------------------------ |
| @xyflow/react | v12.x   | Interactive tree visualization |
| Zustand       | v5.x    | Tree state management          |
| react-i18next | v14.x   | Internationalization           |
| i18next       | v23.x   | Translation framework          |

### Features Implemented

- [x] Pan & zoom with smooth animations
- [x] Custom tree nodes (left/right colored)
- [x] Real-time user search
- [x] Details panel on node click
- [x] Minimap for navigation
- [x] Depth selector (1-10 levels)
- [x] Empty/loading/error states
- [x] Bilingual (ES/EN)
- [x] Performance optimized (batch queries, no N+1)

### Tree Visualization Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  TreeView.tsx                        │    │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────┐  │    │
│  │  │ SearchBar   │  │ ReactFlow    │  │ Details   │  │    │
│  │  │             │  │ + Minimap    │  │ Panel     │  │    │
│  │  └─────────────┘  └──────────────┘  └──────────┘  │    │
│  │                                                       │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │         TreeNodeComponent (Custom Node)       │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              TreeService.ts                          │    │
│  │  + Optimized pagination by depth                    │    │
│  │  + Batch queries to avoid N+1                       │    │
│  │  + getUserTree, getSubtreePaginated, getUserDetails │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Performance Optimizations

| Optimization   | Before          | After              |
| -------------- | --------------- | ------------------ |
| N+1 Queries    | 50+ per tree    | < 10 total         |
| Query Strategy | Per-child count | Batch GROUP BY     |
| Response Time  | Variable        | < 2s for 100 nodes |

### Database Schema / Esquema de Base de Datos

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────▶│   Purchase  │◀────│  Commission │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                        ▲
       │                                        │
       ▼                                        │
┌─────────────┐                                  │
│ UserClosure │ (Binary Tree Structure)          │
└─────────────┘                                  │
       │                                         │
       ▼                                         │
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Lead     │────▶│    Task     │     │Communication│
└─────────────┘     └─────────────┘     └─────────────┘
```

### Commission Distribution / Distribución de Comisiones

| Level/Nivel    | Percentage/Porcentaje | Description/Descripción |
| -------------- | --------------------- | ----------------------- |
| Direct/Directo | 10%                   | Sponsor immediately     |
| Level 1        | 5%                    | Direct referrals        |
| Level 2        | 3%                    | Second level            |
| Level 3        | 2%                    | Third level             |
| Level 4        | 1%                    | Fourth level            |

### Security / Seguridad

- JWT Authentication (tokens with 7-day expiry)
- Password hashing with bcrypt (12 rounds)
- Rate limiting on auth endpoints (5 requests/15min in production)
- CORS validation with allowed origins
- Helmet security headers
- Input validation with express-validator

---

## Phase 4: i18n Bilingual System / Sistema de Internacionalización Bilingüe

### Overview / Descripción General

Implementación de sistema de internacionalización bilingüe (ES/EN) con detección automática de idioma del navegador y persistencia de preferencia.

> Bilingual internationalization system (ES/EN) with automatic browser language detection and preference persistence.

### Tech Stack

| Technology                       | Version | Purpose                 |
| -------------------------------- | ------- | ----------------------- |
| react-i18next                    | v14.x   | Translation hooks       |
| i18next                          | v23.x   | Core i18n library       |
| i18next-browser-languagedetector | v7.x    | Auto language detection |

### Features / Características

- [x] Auto-detection from `navigator.language`
- [x] Persistence in localStorage ('mlm-language')
- [x] Complete translations (ES/EN)
- [x] Language switcher in navbar
- [x] All pages use `t()` function
- [x] No hardcoded strings in components

### Translation Files / Archivos de Traducción

```
frontend/src/i18n/
├── index.ts           # Configuration + helpers
└── locales/
    ├── en.json        # English translations (~250 keys)
    └── es.json        # Spanish translations (~250 keys)
```

### Translation Namespace Structure / Estructura de Namespaces

| Namespace     | Description               |
| ------------- | ------------------------- |
| `nav.*`       | Navigation labels         |
| `auth.*`      | Login/Register pages      |
| `dashboard.*` | Dashboard page            |
| `tree.*`      | Tree visualization        |
| `profile.*`   | Profile page              |
| `admin.*`     | Admin panel               |
| `crm.*`       | CRM module (leads, tasks) |
| `common.*`    | Shared buttons, labels    |

### Helper Functions / Funciones Auxiliares

```typescript
// Change language and persist
changeLanguage('en' | 'es'): void

// Get current language
getCurrentLanguage(): 'en' | 'es'
```

### i18n Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                   App.tsx                            │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │              i18n.init()                     │   │  │
│  │  │  - Load saved language from localStorage    │   │  │
│  │  │  - Or detect from navigator.language         │   │  │
│  │  │  - Fallback to 'es'                         │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────┘  │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                   AppLayout.tsx                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │  │
│  │  │   Navbar    │  │  Language   │  │   User   │  │  │
│  │  │             │  │  Selector   │  │   Menu   │  │  │
│  │  │  🇪🇸 🇺🇸  │  │  (ES/EN)   │  │          │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                   Pages (CRM, Dashboard, etc.)        │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  const { t } = useTranslation();                │ │  │
│  │  │  <h1>{t('crm.title')}</h1>                    │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 5: Horizontal Navbar Layout / Layout con Navbar Horizontal

### Overview / Descripción General

Reemplazo del sidebar lateral por un navbar horizontal moderno con menú hamburguesa para móvil.

> Replacement of lateral sidebar with modern horizontal navbar with hamburger menu for mobile.

### Layout Structure / Estructura del Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Logo]   [Dashboard] [Árbol] [CRM] [Landing Pages]  [ES|EN] [👤] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                         Main Content Area                            │
│                         (with pt-16 padding)                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Structure / Estructura de Componentes

```
frontend/src/components/layout/
└── AppLayout.tsx           # Main layout component (NEW)
    │
    ├── Navbar (fixed top-0, h-16)
    │   ├── Logo (left)
    │   ├── NavLinks (center) - desktop only
    │   ├── LanguageSelector (right)
    │   └── UserMenu (right)
    │
    ├── MobileMenu (absolute, lg:hidden)
    │   ├── NavLinks (vertical)
    │   ├── LanguageSelector
    │   └── UserMenu dropdown
    │
    └── Content (pt-16, min-h-screen)
```

### Responsive Breakpoints / Puntos de Quiebre

| Breakpoint | Width     | Behavior                             |
| ---------- | --------- | ------------------------------------ |
| Mobile     | < 1024px  | Hamburger menu visible, vertical nav |
| Desktop    | >= 1024px | Full horizontal nav, no hamburger    |

### Features Implemented / Características Implementadas

- [x] Fixed horizontal navbar (64px height)
- [x] Logo + navigation + user menu
- [x] Responsive hamburger menu (mobile)
- [x] User dropdown menu
- [x] Language selector with flags
- [x] Click-outside to close menus
- [x] Keyboard navigation (Escape to close)
- [x] All text using i18n

### Navigation Items / Items de Navegación

| Path           | Label Key        | Icon            | Admin |
| -------------- | ---------------- | --------------- | ----- |
| /dashboard     | nav.dashboard    | LayoutDashboard | No    |
| /tree          | nav.tree         | TreeDeciduous   | No    |
| /crm           | nav.crm          | Users           | No    |
| /landing-pages | nav.landingPages | FileText        | No    |
| /profile       | nav.profile      | User            | No    |
| /admin         | nav.admin        | Shield          | Yes   |

### App.tsx Integration / Integración con App.tsx

```tsx
// Before
<Route path="/dashboard" element={<Dashboard />} />

// After - wrapped in AppLayout
<Route element={<AppLayout />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/tree" element={<TreeView />} />
  {/* ... */}
</Route>
```

---

## Testing Architecture / Arquitectura de Testing

```
┌─────────────────────────────────────────────────────┐
│                    TESTING LAYERS                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  E2E TESTS (Playwright)                       │  │
│  │  - Full application flow                      │  │
│  │  - Browser automation                        │  │
│  │  - Real HTTP requests                        │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  INTEGRATION TESTS (Jest + Supertest)         │  │
│  │  - API endpoint testing                       │  │
│  │  - Database integration                       │  │
│  │  - Service layer testing                      │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  UNIT TESTS (Jest)                           │  │
│  │  - Individual functions                        │  │
│  │  - Isolated logic                             │  │
│  │  - Mocked dependencies                         │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Test Coverage / Cobertura de Tests

| Suite               | Tests   | Purpose                   |
| ------------------- | ------- | ------------------------- |
| auth.test.ts        | 15      | Authentication flows      |
| tree.test.ts        | 10      | Binary tree operations    |
| tree-visual.test.ts | 17      | Visual tree integration   |
| tree-api.test.ts    | 10      | Tree API endpoints        |
| performance.test.ts | 3       | N+1 query resolution      |
| commissions.test.ts | 17      | Commission calculations   |
| rbac.test.ts        | 20      | Role-based access control |
| crm.test.ts         | 17      | Lead management           |
| pagination.test.ts  | 6       | Pagination                |
| validation.test.ts  | 24      | Input validation          |
| auth.spec.ts        | 6       | E2E auth flows            |
| admin.spec.ts       | 10      | E2E admin flows           |
| dashboard.spec.ts   | 8       | E2E dashboard flows       |
| tree.spec.ts        | 13      | E2E tree visualization    |
| **Integration**     | **149** | **Backend tests**         |
| **E2E**             | **37**  | **Playwright tests**      |
| **TOTAL**           | **186** | **All passing**           |

> Note: CRM.tsx fully translated to bilingual (ES/EN), E2E tests updated with new selectors.
