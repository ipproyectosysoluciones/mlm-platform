# Design: Frontend Refactoring - Component Modularization

## Technical Approach

Modularizar 6 archivos extensos (Dashboard.tsx 735 líneas, CRM.tsx 1177 líneas, TreeView.tsx 343 líneas, AdminDashboard.tsx 275 líneas, AppLayout.tsx 298 líneas) en componentes pequeños, reutilizables y testeables. El enfoque será **extractivo**: crear primero los nuevos componentes y luego refactorizar los archivos originales para que los importen.

---

## Architecture Decisions

### Decision 1: Estrategia de Imports - Barrel Exports

| Option | Tradeoff | Decision |
|--------|----------|----------|
| index.ts por carpeta | Más archivos pero imports limpios | **Elegido** |
| Re-exports en pages/index.ts | Menos archivos, pero caos de imports | Descartado |
| Exports individuales en cada archivo | Simple pero imports largos | Descartado |

**Rationale**: 
- Permite imports limpios: `import { StatsCards, ReferralChart } from '@/components/dashboard'`
- Evita imports circulares
- Mantiene el código organizado por dominio
- Patrón ya usado parcialmente en el proyecto (`components/index.ts`)

### Decision 2: State Management - Props Drilling vs Context

| Área | Approach | Rationale |
|------|----------|-----------|
| Dashboard | Props drilling | Datos fluyen en 1-2 niveles, no hay reutilización compleja |
| CRM | Props drilling + estados locales | Kanban tiene estado local de drag-drop |
| Tree | Zustand store existente (treeStore) | Ya tiene persistencia y acciones complejas |
| Layout | AuthContext existente | User/Auth ya en contexto, no duplicar |
| Admin | Props drilling | UI simple, sin estado compartido |

**Alternatives considered**: Crear CRMContext, DashboardContext
**Rationale**: Agregar contexto introduce complejidad innecesaria para estados que no se comparten entre páginas. Mantener simple.

### Decision 3: Componentes Existentes - Rename vs Keep

| Archivo Actual | Nuevo Nombre | Rationale |
|---------------|--------------|-----------|
| `CRM/CRMKanban.tsx` | `crm/KanbanBoard.tsx` | Consistencia PascalCase + dominio |
| `tree/SearchBar.tsx` | `crm/TreeSearch.tsx` | Consistencia con otros componentes tree |
| `tree/DetailsPanel.tsx` | `crm/TreeDetails.tsx` | Mismo reason |
| `components/EmptyState.tsx` | `shared/EmptyState.tsx` | Ya existe, mover a shared |

### Decision 4: Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Componentes individuales (StatsCards, LeadCard, etc.) | Vitest + RTL |
| Integration | Flujos completos (crear lead, mover Kanban) | Vitest + RTL |
| E2E | Navegación entre páginas, rutas | Playwright (ya configurado) |

**Rationale**: Setup ya existe en `test/setup.ts` con mocks de i18n, ResizeObserver, IntersectionObserver. Vitest es más rápido que Jest.

---

## Data Flow

```
AppLayout.tsx (Shell)
    │
    ├── Navbar.tsx ──────────► AuthContext (global)
    ├── MobileMenu.tsx
    ├── LanguageSelector.tsx
    └── UserMenu.tsx

Dashboard.tsx (Shell)
    │
    ├── StatsCards.tsx
    ├── ReferralChart.tsx
    ├── CommissionChart.tsx
    └── RecentActivity.tsx

CRM.tsx (Shell)
    │
    ├── KanbanBoard.tsx ────► treeStore (Zustand)
    ├── LeadCard.tsx
    ├── LeadModal.tsx
    ├── TaskCard.tsx
    └── TaskModal.tsx

TreeView.tsx (Shell)
    │
    ├── TreeControls.tsx
    ├── TreeSearch.tsx
    ├── TreeDetails.tsx
    └── TreeMinimap.tsx

AdminDashboard.tsx (Shell)
    │
    ├── StatsOverview.tsx
    ├── UsersTable.tsx
    └── UserFilters.tsx
```

---

## File Changes

### Nuevos Archivos a Crear (27 archivos)

| File | Action | Description |
|------|--------|-------------|
| `components/dashboard/index.ts` | Create | Barrel export |
| `components/dashboard/StatsCards.tsx` | Create | Cards de estadísticas con skeleton |
| `components/dashboard/ReferralChart.tsx` | Create | Gráfico de referidos (Recharts) |
| `components/dashboard/CommissionChart.tsx` | Create | Gráfico de comisiones (Recharts) |
| `components/dashboard/RecentActivity.tsx` | Create | Listas de actividad reciente |
| `components/crm/index.ts` | Create | Barrel export |
| `components/crm/KanbanBoard.tsx` | Rename | De CRMKanban.tsx |
| `components/crm/LeadCard.tsx` | Create | Card individual de lead |
| `components/crm/LeadModal.tsx` | Create | Formulario create/edit lead |
| `components/crm/TaskCard.tsx` | Create | Card de tarea |
| `components/crm/TaskModal.tsx` | Create | Formulario create/edit tarea |
| `components/tree/index.ts` | Create | Barrel export |
| `components/tree/TreeMinimap.tsx` | Create | Minimapa (React Flow) |
| `components/admin/index.ts` | Create | Barrel export |
| `components/admin/UsersTable.tsx` | Create | Tabla de usuarios admin |
| `components/admin/StatsOverview.tsx` | Create | Stats cards admin |
| `components/admin/UserFilters.tsx` | Create | Filtros de búsqueda |
| `components/layout/index.ts` | Create | Barrel export |
| `components/layout/Navbar.tsx` | Create | Navbar extraído |
| `components/layout/MobileMenu.tsx` | Create | Drawer móvil |
| `components/layout/LanguageSelector.tsx` | Create | Selector idioma |
| `components/layout/UserMenu.tsx` | Create | Menú usuario |
| `components/shared/index.ts` | Create | Barrel export |
| `components/shared/LoadingSpinner.tsx` | Create | Spinner genérico |
| `components/shared/ErrorBoundary.tsx` | Create | Boundary para errores |
| `components/shared/ConfirmDialog.tsx` | Create | Modal confirmación |

### Archivos a Modificar (5 archivos)

| File | Description |
|------|-------------|
| `pages/Dashboard.tsx` | Importar componentes, eliminar código inline |
| `pages/CRM.tsx` | Importar de componentes, simplificado a shell |
| `pages/AdminDashboard.tsx` | Importar de componentes |
| `components/layout/AppLayout.tsx` | Importar sub-componentes |
| `components/index.ts` | Re-export desde sub-carpetas |

---

## Interfaces / Contracts

### Dashboard Types (nuevo archivo: `types/dashboard.ts`)

```typescript
export interface DashboardStats {
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  leftCount: number;
  rightCount: number;
}

export interface StatsCardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

export interface ReferralChartProps {
  data: { month: string; count: number }[];
  isLoading?: boolean;
}

export interface CommissionChartProps {
  data: { month: string; amount: number }[];
  isLoading?: boolean;
}
```

### CRM Types (extender `types/index.ts`)

```typescript
export interface LeadFormData {
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  company?: string;
  source: Lead['source'];
  notes?: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  type?: string;
  dueDate?: Date;
}
```

### Layout Types (extender `types/index.ts`)

```typescript
export interface NavItem {
  path: string;
  labelKey: string;
  icon: LucideIcon;
}

export interface NavbarProps {
  navItems: NavItem[];
  isAdmin?: boolean;
}

export interface UserMenuProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}
```

---

## Testing Strategy

### Unit Tests (Vitest + React Testing Library)

| Component | Tests Required |
|-----------|---------------|
| StatsCards | Render data, loading skeleton, click wallet navigation |
| ReferralChart | Empty state, responsive, data rendering |
| CommissionChart | Empty state, responsive, data rendering |
| RecentActivity | Lists rendering, empty states, scroll |
| LeadCard | All fields render, click handlers |
| LeadModal | Form validation, save flow, reset on close |
| TaskCard | Toggle completion, click handlers |
| TaskModal | Form validation, save flow |
| UsersTable | Sort, filter, pagination, action buttons |
| UserFilters | Input changes, clear filters |
| LoadingSpinner | Size variants (sm/md/lg) |
| EmptyState | Icon, title, description, action button click |
| ConfirmDialog | Confirm/cancel callbacks, variant styles |
| ErrorBoundary | Error catch, fallback render |

### Estructura de Tests

```
frontend/src/
├── __tests__/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── StatsCards.test.tsx
│   │   │   ├── ReferralChart.test.tsx
│   │   │   └── RecentActivity.test.tsx
│   │   ├── crm/
│   │   │   ├── LeadCard.test.tsx
│   │   │   └── LeadModal.test.tsx
│   │   ├── layout/
│   │   │   └── UserMenu.test.tsx
│   │   └── shared/
│   │       ├── LoadingSpinner.test.tsx
│   │       ├── EmptyState.test.tsx
│   │       └── ConfirmDialog.test.tsx
```

### Configuración Existente a Usar

- Setup: `src/test/setup.ts` (ya tiene mocks de i18n, ResizeObserver, IntersectionObserver)
- Test runner: Vitest
- Assertions: Jest DOM matchers via `@testing-library/jest-dom`

---

## Migration / Rollout

### Fase 1: Shared Components (Semana 1)
1. Crear `components/shared/` (LoadingSpinner, ErrorBoundary, ConfirmDialog)
2. Mover `components/EmptyState.tsx` → `components/shared/EmptyState.tsx`
3. Actualizar imports en todo el proyecto

### Fase 2: Layout Components (Semana 1)
1. Extraer Navbar, MobileMenu, LanguageSelector, UserMenu de AppLayout.tsx
2. Crear barrel exports en `components/layout/`
3. Refactorizar AppLayout.tsx para importar sub-componentes

### Fase 3: Dashboard Components (Semana 2)
1. Crear StatsCards, ReferralChart, CommissionChart, RecentActivity
2. Refactorizar Dashboard.tsx como shell
3. Tests unitarios para cada componente

### Fase 4: Tree Components (Semana 2)
1. Renombrar SearchBar → TreeSearch, DetailsPanel → TreeDetails
2. Crear TreeMinimap
3. Crear barrel exports en `components/tree/`

### Fase 5: CRM Components (Semana 3)
1. Mover CRMKanban.tsx → crm/KanbanBoard.tsx
2. Crear LeadCard, LeadModal, TaskCard, TaskModal
3. Refactorizar CRM.tsx como shell

### Fase 6: Admin Components (Semana 3)
1. Crear UsersTable, StatsOverview, UserFilters
2. Refactorizar AdminDashboard.tsx como shell
3. Tests de integración

### Validación Post-Migración
- Ninguna ruta debe romperse (verificar manualmente)
- Lighthouse score no debe degradar
- Los tests existentes siguen pasando

---

## Open Questions

- [ ] **Icons**: ¿Mantener lucide-react o migrar a otro? → Mantener (ya usado en todo el proyecto)
- [ ] **Chart library**: ¿Mantener Recharts? → Sí (ya usado, funciona bien)
- [ ] **Estado de errores**: ¿Crear ErrorContext para manejo global? → No por ahora
- [ ] **Migración progresiva**: ¿Mantener archivos grandes hasta el final o borrar incrementalmente? → Borrar tras cada fase validada
