# Nexo Real — Frontend

> **Versión actual: v2.2.0** — Sprint 6 completado (2026-04-07)

Aplicación React + TypeScript para la plataforma Nexo Real. Interfaz bilingüe (ES/EN) con soporte PWA, árbol binario interactivo, módulos de Real Estate y Tourism, y panel de administración completo.

## 🛠️ Stack

- **React 19** + TypeScript
- **Vite 8** (bundler)
- **Tailwind CSS 4**
- **Zustand** (estado global)
- **React Router v7**
- **React Flow / @xyflow** (árbol genealógico)
- **Recharts** (gráficos)
- **react-helmet-async** (SEO dinámico)
- **Vitest** + Testing Library (tests unitarios)
- **Playwright** (E2E)
- **Vite PWA Plugin** (service worker, offline)

## 📦 Instalación

```bash
cd frontend
pnpm install
```

## 🚀 Ejecución

```bash
# Desarrollo
pnpm dev

# Producción
pnpm build
pnpm preview
```

## 🧪 Testing

```bash
# Tests unitarios
pnpm test

# E2E (Playwright)
pnpm test:e2e
```

## 📋 Páginas / Pages

### Autenticación & Perfil

- `Login.tsx` — Inicio de sesión
- `Register.tsx` — Registro con código de referido
- `Profile.tsx` — Perfil del usuario
- `TwoFactor.tsx` — Configuración y verificación 2FA (TOTP)
- `PublicProfile.tsx` — Perfil público con QR de referido

### Dashboard & Red

- `Dashboard.tsx` — Estadísticas, comisiones, referidos del mes
- `TreeView.tsx` — Árbol binario interactivo con React Flow
- `WalletPage.tsx` — Billetera digital, retiros, historial
- `AchievementsPage.tsx` — Logros y ranking
- `LeaderboardPage.tsx` — Tabla de líderes

### Real Estate & Tourism

- `PropertiesPage.tsx` — Listado de propiedades con filtros y social proof badges
- `PropertyDetailPage.tsx` — Detalle de propiedad con SEO completo (JSON-LD `RealEstateListing`)
- `ToursPage.tsx` — Listado de paquetes turísticos con social proof badges
- `TourDetailPage.tsx` — Detalle de tour con SEO completo (JSON-LD `TouristAttraction`)
- `ReservationFlowPage.tsx` — Wizard de reserva en 3 pasos
- `MisReservasPage.tsx` — Reservas del usuario autenticado

### Admin Dashboard (v2.2.0)

- `AdminDashboard.tsx` — Panel principal de administración con stats globales
- `AdminPropertiesPage.tsx` — CRUD de propiedades: tabla paginada, modal de creación/edición, filtros por estado/ciudad/tipo
- `AdminToursPage.tsx` — CRUD de tours: gestión completa de paquetes turísticos
- `AdminReservationsPage.tsx` — Gestión de reservas con cambio de estado (pendiente → confirmada → cancelada)

### E-commerce & CRM

- `ProductCatalog.tsx` — Catálogo de productos
- `ProductLanding.tsx` — Landing pública de producto
- `Checkout.tsx` — Proceso de compra
- `OrderProcessing.tsx` / `OrderSuccess.tsx` — Estados post-compra
- `RecoverCartPage.tsx` — Recuperación de carrito abandonado por token
- `EmailCampaignPage.tsx` — Dashboard de campañas de email
- `CRM.tsx` — Leads, tareas, pipeline Kanban
- `LandingPages.tsx` — Creador de landing pages

### Otros

- `NotFound.tsx` — Página 404
- `Offline.tsx` — Página offline (PWA)
- `CommissionConfigPage.tsx` — Configuración de comisiones (admin)

## 🔍 SEO (v2.2.0)

Implementado con `react-helmet-async` en todas las páginas relevantes:

- **Title dinámico** — por página y por ítem (propiedad, tour)
- **Meta description** — generada dinámicamente desde los datos
- **Open Graph tags** — `og:title`, `og:description`, `og:image`, `og:url`
- **Twitter Card** — `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- **JSON-LD Schema Markup**:
  - `PropertyDetailPage` → `RealEstateListing`
  - `TourDetailPage` → `TouristAttraction`
- **Social Proof Badges** — en `PropertiesPage` y `ToursPage` (indicadores de popularidad, disponibilidad, reviews)

## 🌐 i18n

Interfaz bilingüe (ES/EN) con `i18next`. Sprint 6 incluyó limpieza de claves huérfanas y remoción de `DashboardStreaming`.

## 📁 Estructura

```
frontend/src/
├── components/          # Componentes reutilizables
│   ├── admin/           # Componentes de administración
│   ├── achievements/
│   ├── Cart/
│   ├── crm/
│   ├── dashboard/
│   ├── EmailBuilder/
│   ├── GiftCards/
│   ├── layout/          # Navbar, Sidebar, Layout
│   └── tree/            # Árbol binario
├── pages/               # Páginas (ver lista arriba)
├── stores/              # Estado global con Zustand
│   └── cartStore.ts
├── hooks/               # Custom hooks
├── lib/                 # Utilidades y configuración
├── locales/             # Archivos de traducción ES/EN
└── types/               # TypeScript types
```
