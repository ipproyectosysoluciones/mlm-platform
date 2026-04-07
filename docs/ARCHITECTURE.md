# Arquitectura del Sistema / System Architecture

## Español

### Visión General

La plataforma MLM está construida con una arquitectura de API RESTful, separando claramente el backend (Node.js + Express + TypeScript + Sequelize + PostgreSQL) del frontend (React + Vite + TypeScript + Tailwind CSS). A partir de la v2.0.0 se incorpora un canal de atención por WhatsApp (Nexo Bot) orquestado por n8n para automatizaciones externas.

**Estado del Proyecto**: v2.2.0 — Sprint 6 Completado ✅

**Características Implementadas**:

- Autenticación JWT con rate limiting
- Árbol binario con Closure Table
- Sistema de comisiones de 5 niveles (configurable)
- Dashboard con estadísticas y gráficos
- Generación de códigos QR
- Panel de administración
- CRM completo (Leads, Tareas, Comunicaciones, Kanban)
- Visualización de árbol con React Flow
- Internacionalización bilingüe (ES/EN)
- Navbar horizontal responsivo
- Landing Pages constructor
- E-commerce Streaming (productos, órdenes, suscripciones)
- Wallet (balance, depósitos, retiros)
- Conversión de moneda (API Frankfurter)
- **Security Hardening**: SSRF protection, XSS sanitization, pino-http logging, Docker hardening
- **Generic Products + Inventory**: Category, Product, Inventory con stock tracking
- **Marketplace Multi-vendor**: Vendor, VendorProduct, VendorOrder, split de comisiones 3-way
- **Delivery Integration**: ShippingAddress, DeliveryProvider, ShipmentTracking
- **Affiliate Contracts MVP**: ContractTemplate, AffiliateContract con versionado y hash
- 307 tests automatizados
- **WhatsApp Bot (Nexo Bot)**: BuilderBot + Baileys, 7 flujos conversacionales, IA (GPT-4o)
- **n8n Automation**: orquestación de webhooks → Google Calendar + Notion CRM
- **Sprint 4 Tests**: cobertura frontend de 155 → 210 tests
- **Real Estate Frontend**: PropertiesPage, PropertyDetailPage, filtros, galería
- **Tourism Frontend**: ToursPage, TourDetailPage, itinerario, disponibilidad
- **Reservation Wizard**: wizard 3 pasos + MisReservasPage + reservationStore (Zustand 5)
- **Security Sprint 5**: CodeQL CWE-843 fix en PropertyController + TourPackageController, file-type override
- **Admin Dashboard CRUD**: AdminPropertiesPage, AdminToursPage, AdminReservationsPage con paginación, filtros y modales
- **Bot Flows (Sprint 6)**: propertiesFlow + toursFlow — responde consultas de propiedades y tours por WhatsApp (ES/EN)
- **SEO Frontend**: react-helmet-async, meta tags dinámicos, JSON-LD RealEstateListing + TouristAttraction, social proof badges
- **network_balance**: migración de binary_balance completada en DB + modelos + frontend
- **Build Hardening Sprint 6**: producción sin archivos .map, logs de tamaño post-build

```map
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
│   │              PostgreSQL 16 + Sequelize ORM              │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Estructura de Capas / Layer Structure

```tree
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
│   ├── CRMController.ts
│   ├── CategoryController.ts        # Sprint 3
│   ├── ProductController.ts         # Sprint 3
│   ├── AdminCategoryController.ts   # Sprint 3
│   ├── AdminProductController.ts    # Sprint 3
│   ├── VendorController.ts          # Sprint 3
│   ├── AdminVendorController.ts     # Sprint 3
│   ├── ContractController.ts        # Sprint 3
│   ├── AdminContractController.ts   # Sprint 3
│   └── BotController.ts             # Sprint 6 — bot endpoints
├── services/           # Lógica de negocio / Business Logic
│   ├── AuthService.ts
│   ├── UserService.ts
│   ├── TreeService.ts
│   ├── CommissionService.ts
│   ├── CRMService.ts
│   └── ContractService.ts           # Sprint 3
├── models/             # Modelos Sequelize / Sequelize Models
│   ├── User.ts
│   ├── Commission.ts
│   ├── Purchase.ts
│   ├── Lead.ts
│   ├── Task.ts
│   ├── Category.ts                  # Sprint 3
│   ├── Product.ts                   # Sprint 3
│   ├── Inventory.ts                 # Sprint 3
│   ├── Vendor.ts                    # Sprint 3
│   ├── VendorProduct.ts             # Sprint 3
│   ├── VendorOrder.ts               # Sprint 3
│   ├── ShippingAddress.ts           # Sprint 3
│   ├── DeliveryProvider.ts          # Sprint 3
│   ├── ShipmentTracking.ts          # Sprint 3
│   ├── ContractTemplate.ts          # Sprint 3
│   └── AffiliateContract.ts         # Sprint 3
├── routes/             # Definiciones de rutas / Route Definitions
├── middleware/         # Middleware (auth, errors, validation)
└── utils/             # Utilidades / Utilities
```

The MLM platform is built with a RESTful API architecture, clearly separating the backend (Node.js + Express + TypeScript + Sequelize + PostgreSQL) from the frontend (React + Vite + TypeScript + Tailwind CSS).

**Project Status**: v2.2.0 — Sprint 6 Completed ✅

**Implemented Features**:

- JWT Authentication with rate limiting
- Binary Tree with Closure Table
- 5-level Commission System (configurable)
- Dashboard with stats and charts
- QR Code Generation
- Admin Panel
- Full CRM (Leads, Tasks, Communications, Kanban)
- Tree Visualization with React Flow
- Bilingual i18n (ES/EN)
- Responsive Horizontal Navbar
- Landing Pages Builder
- E-commerce Streaming (products, orders, subscriptions)
- Wallet (balance, deposits, withdrawals)
- Currency Conversion (Frankfurter API)
- **Security Hardening**: SSRF protection, XSS sanitization, pino-http logging, Docker hardening
- **Generic Products + Inventory**: Category, Product, Inventory with stock tracking
- **Marketplace Multi-vendor**: Vendor, VendorProduct, VendorOrder, 3-way commission split
- **Delivery Integration**: ShippingAddress, DeliveryProvider, ShipmentTracking
- **Affiliate Contracts MVP**: ContractTemplate, AffiliateContract with versioning and hash
- 307 automated tests
- **WhatsApp Bot (Nexo Bot)**: BuilderBot + Baileys, 7 conversation flows, AI (GPT-4o)
- **n8n Automation**: webhook orchestration → Google Calendar + Notion CRM
- **Sprint 4 Tests**: frontend coverage from 155 → 210 tests
- **Real Estate Frontend**: PropertiesPage, PropertyDetailPage, filters, gallery
- **Tourism Frontend**: ToursPage, TourDetailPage, itinerary, availability
- **Reservation Wizard**: 3-step wizard + MisReservasPage + reservationStore (Zustand 5)
- **Security Sprint 5**: CodeQL CWE-843 fix in PropertyController + TourPackageController, file-type override
- **Admin Dashboard CRUD**: AdminPropertiesPage, AdminToursPage, AdminReservationsPage with pagination, filters and modals
- **Bot Flows (Sprint 6)**: propertiesFlow + toursFlow — answers property and tour queries via WhatsApp (ES/EN)
- **SEO Frontend**: react-helmet-async, dynamic meta tags, JSON-LD RealEstateListing + TouristAttraction, social proof badges
- **network_balance**: migration from binary_balance completed in DB + models + frontend
- **Build Hardening Sprint 6**: production without .map files, post-build size logs

### Layer Structure

```tree
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
│   ├── CRMController.ts
│   ├── CategoryController.ts        # Sprint 3
│   ├── ProductController.ts         # Sprint 3
│   ├── AdminCategoryController.ts   # Sprint 3
│   ├── AdminProductController.ts    # Sprint 3
│   ├── VendorController.ts          # Sprint 3
│   ├── AdminVendorController.ts     # Sprint 3
│   ├── ContractController.ts        # Sprint 3
│   ├── AdminContractController.ts   # Sprint 3
│   └── BotController.ts             # Sprint 6 — bot endpoints
├── services/            # Business Logic
│   ├── AuthService.ts
│   ├── UserService.ts
│   ├── TreeService.ts
│   ├── CommissionService.ts
│   ├── CRMService.ts
│   └── ContractService.ts           # Sprint 3
├── models/             # Sequelize Models
│   ├── User.ts
│   ├── Commission.ts
│   ├── Purchase.ts
│   ├── Lead.ts
│   ├── Task.ts
│   ├── Category.ts                  # Sprint 3
│   ├── Product.ts                   # Sprint 3
│   ├── Inventory.ts                 # Sprint 3
│   ├── Vendor.ts                    # Sprint 3
│   ├── VendorProduct.ts             # Sprint 3
│   ├── VendorOrder.ts               # Sprint 3
│   ├── ShippingAddress.ts           # Sprint 3
│   ├── DeliveryProvider.ts          # Sprint 3
│   ├── ShipmentTracking.ts          # Sprint 3
│   ├── ContractTemplate.ts          # Sprint 3
│   └── AffiliateContract.ts         # Sprint 3
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
│   ├── PublicProfile.tsx
│   ├── PropertiesPage.tsx        # Sprint 5
│   ├── PropertyDetailPage.tsx    # Sprint 5
│   ├── ToursPage.tsx             # Sprint 5
│   ├── TourDetailPage.tsx        # Sprint 5
│   ├── ReservationFlowPage.tsx   # Sprint 5
│   └── MisReservasPage.tsx       # Sprint 5
├── stores/            # State Management
│   └── treeStore.ts  # Zustand store for tree
├── services/         # API Services
│   ├── api.ts        # Centralized API client
│   ├── propertyService.ts    # Sprint 5
│   ├── tourService.ts        # Sprint 5
│   └── reservationService.ts # Sprint 5
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

```map
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

```map
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
- **SSRF Protection**: URL validation blocks private IPs, loopback, cloud metadata endpoints
- **XSS Sanitization**: HTML inputs sanitized before storage and rendering
- **Secure Logging**: pino-http with redacted sensitive headers (authorization, cookie, x-api-key)
- **Docker Hardening**: non-root user, read-only filesystem, no-new-privileges, health checks

---

## Sprint 3: Multi-vendor, Products, Delivery, Contracts

### New Models (Sprint 3)

```map
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Category   │────▶│   Product   │────▶│  Inventory  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vendor    │────▶│VendorProduct│     │ VendorOrder │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       ▼
┌─────────────────┐   ┌─────────────────┐   ┌───────────────────┐
│ ShippingAddress │   │ DeliveryProvider│   │ ShipmentTracking  │
└─────────────────┘   └─────────────────┘   └───────────────────┘

┌──────────────────┐     ┌─────────────────┐
│ ContractTemplate │────▶│AffiliateContract│
└──────────────────┘     └─────────────────┘
```

### 3-way Commission Split (Multi-vendor)

| Party     | Description                        |
| --------- | ---------------------------------- |
| Platform  | Base platform fee                  |
| Vendor    | Vendor commission (configurable %) |
| Affiliate | MLM commission chain (5 levels)    |

### Affiliate Contracts

| Field     | Description                                       |
| --------- | ------------------------------------------------- |
| version   | Semver (e.g. 1.0.0), auto-incremented on updates  |
| hash      | SHA-256 of contract content at time of acceptance |
| ip        | User's IP address at acceptance time              |
| userAgent | Browser user agent at acceptance time             |
| status    | accepted / declined / revoked                     |

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

```tree
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

```map
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

```map
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

```map
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

```map
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

| Suite               | Tests   | Purpose                         |
| ------------------- | ------- | ------------------------------- |
| auth.test.ts        | 15      | Authentication flows            |
| tree.test.ts        | 10      | Binary tree operations          |
| tree-visual.test.ts | 17      | Visual tree integration         |
| tree-api.test.ts    | 10      | Tree API endpoints              |
| performance.test.ts | 3       | N+1 query resolution            |
| commissions.test.ts | 17      | Commission calculations         |
| rbac.test.ts        | 20      | Role-based access control       |
| crm.test.ts         | 17      | Lead management                 |
| wallet.test.ts      | 15      | Wallet operations               |
| pagination.test.ts  | 6       | Pagination                      |
| validation.test.ts  | 24      | Input validation                |
| products.test.ts    | ~25     | Products + Inventory (Sprint 3) |
| vendors.test.ts     | ~20     | Marketplace multi-vendor (S3)   |
| contracts.test.ts   | ~20     | Affiliate contracts (Sprint 3)  |
| addresses.test.ts   | ~15     | Shipping addresses (Sprint 3)   |
| auth.spec.ts        | 6       | E2E auth flows                  |
| admin.spec.ts       | 10      | E2E admin flows                 |
| dashboard.spec.ts   | 8       | E2E dashboard flows             |
| tree.spec.ts        | 13      | E2E tree visualization          |
| **Integration**     | **270** | **Backend tests**               |
| **E2E**             | **37**  | **Playwright tests**            |
| **TOTAL**           | **307** | **All passing**                 |

> Note: Test count increased from 195 (pre-Sprint 3) to 307 with new integration tests for all Sprint 3 phases.

---

## Sprint 4: WhatsApp Bot + n8n Automation / Bot de WhatsApp + Automatización

### Overview

Sprint 4 añade un canal de atención por WhatsApp construido sobre **BuilderBot + Baileys** y orquestado con **n8n** para automatizaciones externas (Google Calendar, Notion CRM).

> Sprint 4 adds a WhatsApp customer channel built on **BuilderBot + Baileys**, orchestrated with **n8n** for external automations (Google Calendar, Notion CRM).

### Architecture Diagram / Diagrama de Arquitectura

```map
┌──────────────────────────────────────────────────────────────────────────┐
│                           NEXO REAL v2.0.0                               │
│                                                                           │
│  ┌─────────────┐     ┌─────────────────────────────────────────────────┐ │
│  │  WhatsApp   │────▶│              Nexo Bot (BuilderBot)              │ │
│  │  (User)     │     │              port 3002                          │ │
│  └─────────────┘     │                                                 │ │
│                       │  Flows:                                         │ │
│                       │  welcome · balance · network · support          │ │
│                       │  schedule · handoff · language · agent          │ │
│                       └──────────────────┬──────────────────────────────┘ │
│                                          │                                │
│                    ┌─────────────────────┴────────────────────┐          │
│                    │                                           │          │
│                    ▼                                           ▼          │
│         ┌──────────────────────┐               ┌──────────────────────┐  │
│         │   Backend API        │               │       n8n            │  │
│         │   port 3001          │               │   port 5678          │  │
│         │                      │               │   (internal only)    │  │
│         │  REST API            │               │                      │  │
│         │  (balance, network,  │               │  Webhooks:           │  │
│         │   commissions)       │               │  /schedule-visit     │  │
│         └──────────┬───────────┘               │  /human-handoff      │  │
│                    │                            └───────┬──────────────┘  │
│                    ▼                                    │                 │
│         ┌──────────────────────┐         ┌─────────────┴──────────────┐  │
│         │   PostgreSQL 16      │         │   External Services        │  │
│         │   + Sequelize ORM    │         │                            │  │
│         └──────────────────────┘         │   ┌──────────────────────┐ │  │
│                                          │   │   Google Calendar    │ │  │
│                                          │   └──────────────────────┘ │  │
│                                          │   ┌──────────────────────┐ │  │
│                                          │   │    Notion CRM        │ │  │
│                                          │   └──────────────────────┘ │  │
│                                          └────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Bot Tech Stack

| Technology                   | Version | Purpose                                |
| ---------------------------- | ------- | -------------------------------------- |
| @builderbot/bot              | latest  | Conversation flow engine               |
| @builderbot/provider-baileys | latest  | WhatsApp connection via Baileys WA Web |
| openai                       | ^4.x    | GPT-4o for AI agent responses          |
| axios                        | ^1.x    | HTTP client for MLM API calls          |
| tsx                          | ^4.x    | Dev server with hot reload             |
| TypeScript                   | ^5.x    | Type safety (ESM, `"type": "module"`)  |

### Bot Structure / Estructura del Bot

```tree
bot/src/
├── app.ts                   # Bootstrap: provider, flows, HTTP server (port 3002)
├── flows/
│   ├── welcome.flow.ts      # Greeting + main menu
│   ├── balance.flow.ts      # Wallet balance via MLM API
│   ├── network.flow.ts      # Downline + commissions
│   ├── support.flow.ts      # FAQ + escalation
│   ├── schedule.flow.ts     # Book a visit → n8n → Google Calendar + Notion
│   ├── handoff.flow.ts      # Human escalation → n8n → Notion CRM
│   ├── language.flow.ts     # ES/EN language switch
│   └── agent.flow.ts        # AI agent mode (Sophia / Max)
└── services/
    ├── ai.service.ts         # OpenAI GPT-4o integration
    ├── mlm-api.service.ts    # MLM Backend REST API client
    └── n8n.service.ts        # n8n webhook HTTP client
```

### Bot Flows / Flujos del Bot

| Flow     | Keywords (ES)                         | Description                               |
| -------- | ------------------------------------- | ----------------------------------------- |
| welcome  | hola, inicio, menu, start             | Greeting + main menu                      |
| balance  | saldo, balance, wallet, mi saldo      | Wallet balance from MLM API               |
| network  | red, equipo, network, comisiones      | Downline tree + commission summary        |
| support  | ayuda, soporte, help, support         | FAQ + escalation to human                 |
| schedule | agendar, visita, reunión, appointment | Book visit → Google Calendar + Notion CRM |
| handoff  | asesor, agente, humano, human, agent  | Escalate to human → Notion CRM            |
| language | idioma, language, english, español    | Switch between ES / EN                    |
| agent    | (AI fallback — EVENTS.WELCOME)        | GPT-4o agent (Sophia ES / Max EN)         |

### n8n Integration / Integración con n8n

n8n actúa como orquestador de automatizaciones externas. Nexo Bot dispara webhooks HTTP (internos, dentro de `mlm-network`) y n8n ejecuta los flujos.

> n8n acts as the external automation orchestrator. Nexo Bot fires internal HTTP webhooks (inside `mlm-network`) and n8n executes the workflows.

```map
Nexo Bot
   │
   ├── POST /webhook/schedule-visit ──► n8n
   │      Payload: { phone, name, preferredDate, interest, language }
   │                     │
   │                     ├──► Google Calendar (create event)
   │                     └──► Notion CRM (lead: status = "Visit Scheduled")
   │
   └── POST /webhook/human-handoff ───► n8n
          Payload: { phone, name, reason, agent, language, escalatedAt }
                        │
                        ├──► Notion CRM (lead: status = "Needs Human")
                        └──► WhatsApp agent notification
```

#### n8n Webhook Payloads

**schedule-visit**

| Field         | Type   | Description                                  |
| ------------- | ------ | -------------------------------------------- |
| phone         | string | WhatsApp number (international format)       |
| name          | string | User's name as captured in conversation      |
| preferredDate | string | Free text date (e.g. "martes 15 a las 10am") |
| interest      | string | Property/service of interest                 |
| language      | es/en  | Conversation language                        |

**human-handoff**

| Field       | Type   | Description                            |
| ----------- | ------ | -------------------------------------- |
| phone       | string | WhatsApp number                        |
| name        | string | User's name                            |
| reason      | string | Brief summary of escalation reason     |
| agent       | string | Last AI agent assigned (sophia \| max) |
| language    | es/en  | Conversation language                  |
| escalatedAt | string | ISO timestamp of escalation            |

#### n8n Infrastructure

| Component | Value                                      |
| --------- | ------------------------------------------ |
| Image     | `n8nio/n8n:2.14.2`                         |
| Port      | 5678 (internal only — not exposed to host) |
| Network   | `mlm-network` (Docker bridge)              |
| Base URL  | `http://n8n:5678/webhook`                  |
| Database  | SQLite (MVP) — volume `mlm_n8n_data`       |
| Auth      | Basic auth / Owner account                 |

### Proactive Notifications (Bot HTTP API)

El backend MLM puede enviar mensajes proactivos por WhatsApp a través del servidor HTTP del bot.

> The MLM backend can send proactive WhatsApp messages via the bot's built-in HTTP server.

```
POST http://nexo-bot:3002/v1/messages
Content-Type: application/json

{ "number": "5491122334455", "message": "Tu comisión de $50 fue acreditada 🎉" }
```

**Use cases:**

- Commission earned notification
- Welcome after registration
- Withdrawal status update

### AI Agents / Agentes de IA

| Agent  | Language | Persona                     |
| ------ | -------- | --------------------------- |
| Sophia | Spanish  | Cálida asesora de Nexo Real |
| Max    | English  | Friendly Nexo Real advisor  |

Both agents use **GPT-4o** with a shared conversation history stored in bot state (MemoryDB).  
Can be upgraded to PostgreSQLDB in a future sprint for persistence across restarts.

---

## Sprint 4: Frontend Tests

### Overview

Sprint 4 increments frontend test coverage from **155 → 210 tests** through new unit/integration tests for the Leaderboard and Achievements modules.

### Test Breakdown (Frontend — Sprint 4)

| File                                                       | Tests | New in S4 |
| ---------------------------------------------------------- | ----- | --------- |
| `components/leaderboard/__tests__/Podium.test.tsx`         | 12    | ✅        |
| `components/leaderboard/__tests__/RankingTable.test.tsx`   | 12    | ✅        |
| `components/leaderboard/__tests__/UserRankBanner.test.tsx` | 8     | ✅        |
| `pages/__tests__/AchievementsPage.test.tsx`                | 12    | ✅        |
| `__tests__/services.test.ts` (extended)                    | +9    | ✅        |

### Vitest Config Change (Sprint 4)

`poolOptions` was removed in Vitest 4. Parallel test hangs fixed by migrating to:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    pool: 'forks',
    singleFork: true, // replaces poolOptions.forks.singleFork
  },
});
```

### Overall Test Summary (v2.0.0)

| Layer          | Count   | Framework        |
| -------------- | ------- | ---------------- |
| Backend tests  | 307     | Jest + Supertest |
| Frontend tests | 210     | Vitest + RTL     |
| E2E tests      | 37      | Playwright       |
| **TOTAL**      | **554** | **All passing**  |
