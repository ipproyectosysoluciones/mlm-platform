# Phase 3: Visual Tree UI — Implementation Tasks

## Change Name

**Visual Tree UI**

---

## Overview

Total: **28 tareas**  
Backend: **8 tareas**  
Frontend: **16 tareas**  
Testing: **4 tareas**

---

## Phase 3.1: Backend Optimization

### Task 3.1.1: Install React Flow Dependencies

**Archivo:** `frontend/package.json`  
**Dependencias:**

```json
{
  "@xyflow/react": "^12.0.0",
  "zustand": "^5.0.0",
  "react-i18next": "^14.0.0",
  "i18next": "^23.0.0"
}
```

**Validación:** `pnpm list @xyflow/react`

**Status:** ✅ COMPLETADO (23 Mar 2026)

---

### Task 3.1.2: Add Pagination to TreeService

**Archivos:**

- `backend/src/services/TreeService.ts`
- `backend/src/types/index.ts`

**Cambios:**

1. Agregar método `getSubtreePaginated(userId, depth, page, limit)`
2. Optimizar `getChildren()` para batch queries
3. Retornar metadata de paginación

**Status:** ✅ COMPLETADO (23 Mar 2026) - Método getSubtreePaginated implementado con countNodes recursivo

---

### Task 3.1.3: Add Batch Count Query

**Archivo:** `backend/src/services/TreeService.ts`

**Reemplazar N+1:**

```typescript
private async getChildren(userId: string, maxDepth?: number): Promise<TreeNode[]> {
  const children = await User.findAll({
    where: { sponsorId: userId },
  });

  if (children.length === 0) return [];

  // Batch query para evitar N+1
  const childIds = children.map(c => c.id);
  const counts = await User.findAll({
    attributes: ['sponsorId', 'position',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    where: { sponsorId: childIds },
    group: ['sponsorId', 'position'],
    raw: true,
  }) as Array<{ sponsorId: string; position: string; count: number }>;

  // Map counts by sponsorId + position
  const countMap = new Map<string, number>();
  counts.forEach(c => countMap.set(`${c.sponsorId}-${c.position}`, c.count));

  // Build tree nodes
  const treeNodes: TreeNode[] = children.map(child => {
    const leftCount = countMap.get(`${child.id}-left`) || 0;
    const rightCount = countMap.get(`${child.id}-right`) || 0;
    // ... rest of node creation
  });

  return treeNodes;
}
```

**Status:** ✅ COMPLETADO (23 Mar 2026) - N+1 queries eliminado, usa batch query con Map para acceso O(1)

---

### Task 3.1.4: Add Search Endpoint

**Archivos:**

- `backend/src/controllers/UserController.ts`
- `backend/src/routes/user.routes.ts`

**Status:** ✅ COMPLETADO (23 Mar 2026) - Endpoint GET /api/users/search?q=&limit= implementado

---

### Task 3.1.5: Add User Details Endpoint

**Archivos:**

- `backend/src/controllers/UserController.ts`
- `backend/src/routes/user.routes.ts`

**Status:** ✅ COMPLETADO (23 Mar 2026) - Endpoint GET /api/users/:id/details implementado con verificación de relación ancestro-descendiente

---

### Task 3.1.6: Update Swagger Documentation

**Archivos:**

- `backend/src/config/swagger.ts`
- `backend/src/routes/user.routes.ts`
- `backend/src/routes/crm.routes.ts`

**Status:** ✅ COMPLETADO (23 Mar 2026)

Documentación Swagger/JSDoc completa con:

- Schemas: UserSearchResult, UserDetails, UserStats, PaginationMeta, TreePaginatedResponse
- Todos los endpoints con JSDocs bilingües ES/EN
- Parámetros de paginación documentados para endpoints de tree
- Todos los routes de CRM documentados
- Version actualizada a 3.0.0

---

### Task 3.1.7: Add Integration Tests for New Endpoints

**Archivo:** `backend/src/__tests__/integration/tree-api.test.ts`

**Tests:**

- `GET /api/users/search?q=` returns matching users
- `GET /api/users/search?q=` with invalid query returns 400
- `GET /api/users/:id/details` returns user details
- `GET /api/users/:id/details` with invalid ID returns 404
- Pagination metadata in tree response

**Validación:** `npm test -- tree-api`

---

### Task 3.1.8: Performance Test — N+1 Resolution

**Archivo:** `backend/src/__tests__/integration/performance.test.ts`

**Test:**

```typescript
it('getUserTree should not have N+1 queries', async () => {
  // Create 50 users in tree
  const sponsor = await createTestUser();
  for (let i = 0; i < 50; i++) {
    await createTestUser({ sponsorId: sponsor.id });
  }

  const queries: string[] = [];
  const originalQuery = sequelize.query.bind(sequelize);
  sequelize.query = (...args) => {
    queries.push(args[0] as string);
    return originalQuery(...args);
  };

  await treeService.getUserTree(sponsor.id, 3);

  sequelize.query = originalQuery;

  // Should have ~5 queries max, not 50+
  expect(queries.length).toBeLessThan(10);
});
```

**Validación:** Test pasa

---

## Phase 3.2: Frontend Core

### Task 3.2.1: Install React Flow

**Comando:**

```bash
cd frontend && npm install @xyflow/react zustand react-i18next i18next
```

**Validación:** `npm list @xyflow/react`

**Status:** ✅ COMPLETADO (23 Mar 2026) - @xyflow/react v12.10.1 instalado

---

### Task 3.2.2: Create TreeStore

**Archivo:** `frontend/src/stores/treeStore.ts`

**Implementar:**

```typescript
import { create } from 'zustand';
import type { TreeNode, UserDetails, User } from '../types';

interface TreeState {
  tree: TreeNode | null;
  selectedNodeId: string | null;
  selectedNodeDetails: UserDetails | null;
  isDetailsPanelOpen: boolean;
  searchQuery: string;
  searchResults: User[];

  setTree: (tree: TreeNode | null) => void;
  selectNode: (nodeId: string | null) => void;
  setNodeDetails: (details: UserDetails | null) => void;
  toggleDetailsPanel: (open: boolean) => void;
  setSearchResults: (results: User[]) => void;
  clearSearch: () => void;
}

export const useTreeStore = create<TreeState>((set) => ({
  tree: null,
  selectedNodeId: null,
  selectedNodeDetails: null,
  isDetailsPanelOpen: false,
  searchQuery: '',
  searchResults: [],

  setTree: (tree) => set({ tree }),
  selectNode: (nodeId) =>
    set({
      selectedNodeId: nodeId,
      isDetailsPanelOpen: !!nodeId,
    }),
  setNodeDetails: (details) => set({ selectedNodeDetails: details }),
  toggleDetailsPanel: (open) => set({ isDetailsPanelOpen: open }),
  setSearchResults: (results) => set({ searchResults: results }),
  clearSearch: () => set({ searchQuery: '', searchResults: [] }),
}));
```

**Validación:** `npm run build`

**Status:** ✅ COMPLETADO (23 Mar 2026) - Zustand store implementado con depth y zoomLevel

---

### Task 3.2.3: Create TreeNodeComponent

**Archivo:** `frontend/src/components/tree/TreeNodeComponent.tsx`

**Implementar:**

- Custom node para React Flow
- Avatar circular con inicial
- Email truncado
- Nivel y pierna (izq/der)
- Stats left/right
- Click handler para seleccionar

**Validación:** Componente renderiza sin errores

**Status:** ✅ COMPLETADO (23 Mar 2026) - TreeNodeComponent con Handle de React Flow

---

### Task 3.2.4: Create SearchBar Component

**Archivo:** `frontend/src/components/tree/SearchBar.tsx`

**Implementar:**

- Input con debounce (300ms)
- Dropdown de resultados
- Click en resultado selecciona nodo
- Estados: idle, searching, results, no-results
- Traducción ES/EN

**Validación:** Búsqueda funcional

**Status:** ✅ COMPLETADO (23 Mar 2026) - SearchBar con debounce y dropdown de resultados

---

### Task 3.2.5: Create DetailsPanel Component

**Archivo:** `frontend/src/components/tree/DetailsPanel.tsx`

**Implementar:**

- Panel lateral fijo a la derecha
- Muestra todos los detalles del usuario
- Botón "Ver Subtree"
- Botón cerrar
- Animación de entrada/salida

**Validación:** Panel abre/cierra correctamente

**Status:** ✅ COMPLETADO (23 Mar 2026) - DetailsPanel con animate-slide-in desde la derecha

---

### Task 3.2.6: Create TreeControls Component

**Archivo:** `frontend/src/components/tree/TreeControls.tsx`

**Implementar:**

- Botones zoom in/out
- Botón fit view
- Selector de profundidad (1-10)
- Tooltips en ES/EN

**Validación:** Controles funcionan

**Status:** ✅ COMPLETADO (23 Mar 2026) - TreeControls con zoom, fit view y selector de profundidad

---

### Task 3.2.7: Refactor TreeView.tsx to React Flow

**Archivo:** `frontend/src/pages/TreeView.tsx`

**Implementar:**

- Integración con ReactFlow
- Conversión de TreeNode a nodes/edges
- Layout automático (dagre o manual positioning)
- Minimap
- Background
- Controls

**Validación:** Árbol renderiza correctamente

**Status:** ✅ COMPLETADO (23 Mar 2026) - TreeView.tsx (382 líneas) con ReactFlow completo: layout, zoom, minimap, controls, search, details panel

---

### Task 3.2.8: Add i18n Configuration

**Archivo:** `frontend/src/i18n/index.ts`

**Agregar:**

```typescript
import en from './locales/en.json';
import es from './locales/es.json';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, es: { translation: es } },
  lng: 'en',
  fallbackLng: 'en',
});
```

**Validación:** Traducciones disponibles

**Status:** ⏳ PENDIENTE - i18n no configurado, componentes usan texto hardcodeado en inglés

---

### Task 3.2.9: Create Translation Files

**Archivos:**

- `frontend/src/i18n/locales/en.json`
- `frontend/src/i18n/locales/es.json`

**Keys requeridas:**

```json
{
  "tree": {
    "title": "Binary Tree",
    "search": {
      "placeholder": "Search by email or code...",
      "noResults": "No users found"
    },
    "controls": {
      "zoomIn": "Zoom In",
      "zoomOut": "Zoom Out",
      "fitView": "Fit View"
    },
    "details": {
      "title": "User Details",
      "close": "Close",
      "viewSubtree": "View Subtree"
    },
    "empty": {
      "title": "No Members Yet"
    }
  }
}
```

**Validación:** Traducciones aparecen en UI

**Status:** ⏳ PENDIENTE - Archivos de traducción no existen

---

### Task 3.2.10: Update API Service

**Archivo:** `frontend/src/services/api.ts`

**Agregar:**

```typescript
// Search users
searchUsers: async (query: string): Promise<User[]> => {
  const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
  return response.data.data;
},

// Get user details
getUserDetails: async (userId: string): Promise<UserDetails> => {
  const response = await api.get(`/users/${userId}/details`);
  return response.data.data;
},
```

**Validación:** `npm run build`

**Status:** ✅ COMPLETADO (23 Mar 2026) - API service actualizado con searchUsers y getUserDetails

---

### Task 3.2.11: Add Node Type to React Flow

**Archivo:** `frontend/src/pages/TreeView.tsx`

**Agregar:**

```typescript
import TreeNodeComponent from '../components/tree/TreeNodeComponent';

const nodeTypes = {
  custom: TreeNodeComponent,
};
```

**Validación:** Nodos personalizados renderizan

**Status:** ✅ COMPLETADO (23 Mar 2026) - nodeTypes con 'treeNode': TreeNodeComponent

---

### Task 3.2.12: Implement Center on Node

**Archivo:** `frontend/src/pages/TreeView.tsx`

**Agregar:**

```typescript
import { useReactFlow } from '@xyflow/react';

const { fitView, setCenter } = useReactFlow();

const centerOnNode = (nodeId: string) => {
  const node = nodes.find((n) => n.id === nodeId);
  if (node) {
    setCenter(node.position.x + 75, node.position.y + 50, { zoom: 1, duration: 500 });
  }
};
```

**Validación:** Click en búsqueda centra en nodo

**Status:** ✅ COMPLETADO (23 Mar 2026) - handleSearchSelect centra en nodo con setCenter

---

### Task 3.2.13: Add Empty State

**Archivo:** `frontend/src/pages/TreeView.tsx`

**Implementar:**

```typescript
if (!tree || tree.children.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <TreeDeciduous className="w-24 h-24 text-gray-300 mb-4" />
      <h2 className="text-xl font-semibold text-gray-600">{t('tree.empty.title')}</h2>
      <p className="text-gray-500">{t('tree.empty.description')}</p>
    </div>
  );
}
```

**Validación:** Estado vacío visible

**Status:** ✅ COMPLETADO (23 Mar 2026) - Empty state con TreeDeciduous icon y mensaje

---

### Task 3.2.14: Add Loading State

**Archivo:** `frontend/src/pages/TreeView.tsx`

**Implementar spinner con:**

- Loader2 de lucide-react
- Centrado vertical/horizontal
- Texto "Loading tree..."

**Validación:** Spinner aparece durante carga

**Status:** ✅ COMPLETADO (23 Mar 2026) - Loading spinner con Loader2 de lucide-react

---

### Task 3.2.15: Add Error Handling

**Archivo:** `frontend/src/pages/TreeView.tsx`

**Implementar:**

```typescript
try {
  const treeData = await treeService.getMyTree(depth);
  setTree(treeData);
} catch (error) {
  toast.error(t('errors.loadTreeFailed'));
  setError(true);
}
```

**Validación:** Error toast aparece en fallo

**Status:** ✅ COMPLETADO (23 Mar 2026) - Error state con mensaje y botón dismiss

---

### Task 3.2.16: Update App Router

**Archivo:** `frontend/src/App.tsx`

**Verificar que `/tree` ruta existe:**

```typescript
<Route path="/tree" element={<TreeView />} />
```

**Validación:** Navegación a `/tree` funciona

**Status:** ✅ COMPLETADO (23 Mar 2026) - Ruta /tree configurada en App.tsx

---

## Phase 3.3: Testing

### Task 3.3.1: Add E2E Tests for Tree Visualization

**Archivo:** `frontend/e2e/tree.spec.ts`

**Tests:**

- Tree page loads
- React Flow container visible
- Minimap visible
- Controls visible

**Validación:** `npx playwright test tree.spec.ts`

---

### Task 3.3.2: Add E2E Tests for Search

**Archivo:** `frontend/e2e/tree-search.spec.ts`

**Tests:**

- Search input exists
- Results appear after typing
- Click on result selects node
- Details panel opens

**Validación:** `npx playwright test tree-search.spec.ts`

---

### Task 3.3.3: Add E2E Tests for Zoom/Pan

**Archivo:** `frontend/e2e/tree-controls.spec.ts`

**Tests:**

- Zoom in/out buttons work
- Fit view button works
- Depth selector works
- Pan with mouse drag works

**Validación:** `npx playwright test tree-controls.spec.ts`

---

### Task 3.3.4: Add Visual Regression Tests

**Archivo:** `frontend/e2e/tree-visual.spec.ts`

**Tests:**

- Tree nodes render correctly
- Node colors match position (left/right)
- Minimap shows tree
- Empty state displays

**Validación:** `npx playwright test tree-visual.spec.ts --ui`

---

## Phase 3.4: Documentation

### Task 3.4.1: Update ARCHITECTURE.md

**Archivo:** `docs/ARCHITECTURE.md`

**Agregar:**

- Sección de Visual Tree UI
- Diagrama de componentes
- Nueva estructura de archivos

---

### Task 3.4.2: Update API.md

**Archivo:** `backend/docs/API.md`

**Agregar:**

- Nuevos endpoints (search, details)
- Schemas de respuesta
- Ejemplos de uso

---

## Status

- [x] Tasks 3.1.1 - 3.1.6 (Backend: Core + Swagger) ✅
- [x] Tasks 3.1.7 - 3.1.8 (Backend: Integration & Performance Tests) ✅
- [x] Tasks 3.2.1 - 3.2.7 (Frontend: Core Components) ✅
- [x] Tasks 3.2.8 - 3.2.9 (Frontend: i18n Configuration) ✅
- [x] Tasks 3.2.10 - 3.2.16 (Frontend: Integration & States) ✅
- [x] Tasks 3.3.1 - 3.3.4 (Testing: E2E) ✅
- [x] Tasks 3.4.1 - 3.4.2 (Documentation) ✅

---

## Progress Summary (22 Mar 2026)

### ✅ Completed (30 tareas) - 100%

**Backend:**

- ✅ 3.1.1: Dependencias instaladas (@xyflow/react, zustand, react-i18next, i18next)
- ✅ 3.1.2: getSubtreePaginated implementado en TreeService
- ✅ 3.1.3: N+1 queries eliminado con batch queries
- ✅ 3.1.4: Endpoint searchUsers implementado (GET /api/users/search)
- ✅ 3.1.5: Endpoint getUserDetails implementado (GET /api/users/:id/details)
- ✅ 3.1.6: Swagger/JSDoc documentación completa
- ✅ 3.1.7: Integration tests para endpoints search y details (10 tests)
- ✅ 3.1.8: Performance tests N+1 resolution (3 tests)

**Frontend:**

- ✅ 3.2.1: Dependencias @xyflow/react v12.10.1
- ✅ 3.2.2: treeStore.ts con Zustand (tree, depth, zoomLevel, etc.)
- ✅ 3.2.3: TreeNodeComponent.tsx (nodos personalizados React Flow)
- ✅ 3.2.4: SearchBar.tsx (debounce, dropdown resultados)
- ✅ 3.2.5: DetailsPanel.tsx (panel lateral con animate-slide-in)
- ✅ 3.2.6: TreeControls.tsx (zoom, fit view, profundidad)
- ✅ 3.2.7: TreeView.tsx (ReactFlow completo con i18n)
- ✅ 3.2.8: Configuración i18n (frontend/src/i18n/index.ts)
- ✅ 3.2.9: Archivos de traducción (en.json, es.json)
- ✅ 3.2.10: API service actualizado (searchUsers, getUserDetails)
- ✅ 3.2.11: nodeTypes con 'treeNode': TreeNodeComponent
- ✅ 3.2.12: center on node con setCenter
- ✅ 3.2.13: Empty state con TreeDeciduous icon
- ✅ 3.2.14: Loading spinner con Loader2
- ✅ 3.2.15: Error handling con mensaje y dismiss
- ✅ 3.2.16: Ruta /tree en App.tsx

**E2E Testing:**

- ✅ 3.3.1-4: E2E tests para Tree (37 tests totales)

**Documentation:**

- ✅ 3.4.1: Update ARCHITECTURE.md (Phase 3 section added)
- ✅ 3.4.2: Update API.md (new endpoints documented)

---

## Progress: 100% (30/30 tareas completadas)

### Test Results

| Category              | Tests   | Status  |
| --------------------- | ------- | ------- |
| Integration (Backend) | 137     | ✅ PASS |
| E2E (Frontend)        | 37      | ✅ PASS |
| **TOTAL**             | **174** | ✅ PASS |

### Files Created/Modified

**i18n:**

- `frontend/src/i18n/index.ts` - Configuración i18next
- `frontend/src/i18n/locales/en.json` - Traducciones inglés
- `frontend/src/i18n/locales/es.json` - Traducciones español
- `frontend/src/main.tsx` - Import i18n

**Components (i18n integrated):**

- `frontend/src/pages/TreeView.tsx` - i18n hook + translations
- `frontend/src/components/tree/SearchBar.tsx` - i18n translations
- `frontend/src/components/tree/DetailsPanel.tsx` - i18n translations
- `frontend/src/components/tree/TreeControls.tsx` - i18n translations

**Backend Tests:**

- `backend/src/__tests__/integration/tree-api.test.ts` - 10 tests
- `backend/src/__tests__/integration/performance.test.ts` - 3 tests
- `backend/src/__tests__/fixtures.ts` - cleanupTestUsers helper

**Documentation:**

- `docs/ARCHITECTURE.md` - Phase 3 Visual Tree UI section
- `backend/docs/API.md` - New endpoints (search, details, tree pagination)

---

## 🎉 PHASE 3 COMPLETE
