# Design: Sprint 6 — Nexo Real

> **Change**: sprint6  
> **Date**: 2026-04-07  
> **Scope**: Admin Dashboard frontend, Bot flows, i18n cleanup, binary→network_balance migration, build hardening, docs

---

## Technical Approach

Sprint 6 completes the frontend admin CRUD (backend is 100% ready), adds 2 bot flows con endpoints faltantes en backend, corrige deuda técnica i18n/tipos, y endurece el pipeline de build. No hay cambios de esquema complejos — la migración es solo un RENAME de un valor enum.

---

## Architecture Decisions

| # | Decisión | Elegida | Alternativa rechazada | Razón |
|---|----------|---------|----------------------|-------|
| 1 | Páginas admin separadas | AdminPropertiesPage / AdminToursPage / AdminReservationsPage | Tabs en AdminDashboard existente | Patrón ya establecido en el proyecto — CommissionConfigPage, EmailCampaignPage son páginas separadas con AdminRoute |
| 2 | adminService en api.ts | Agregar métodos al `adminService` existente | Nuevo archivo adminPropertyService.ts | Consistencia — todos los servicios admin ya están en adminService (getStats, getUsers, etc.) |
| 3 | Bot endpoints en BotController | Agregar `getProperties`/`getTours` al BotController existente | Nuevo BotPropertyController | DRY — mismo patrón que getWalletInfo, getRecentCommissions ya en BotController |
| 4 | i18n merge | Merge manual section-by-section, conservar versión extendida de `common` | Script automático | JSON tiene triples duplicados — merge automático no puede elegir semántica correcta sin contexto |
| 5 | binary_balance rename | Migration con `queryInterface.sequelize.query()` UPDATE | Nuevo tipo enum | Sequelize no soporta rename de enum values — raw SQL es el único camino seguro |
| 6 | Build sourcemaps | `await rm('dist/*.map', ...)` después del build en modo producción | `.dockerignore` para excluir `*.map` | build.mjs ya tiene `sourcemap: !isProduction` → en prod no genera .map. Fix real: `sourcemap: false` explícito ya está. Agregar `rm` es defensa adicional para artifacts stale de builds previos |

---

## Data Flow

### A) Admin Dashboard — CRUD Flow

```
AdminRoute (role: admin)
  └─ AdminPropertiesPage.tsx
       ├─ useEffect → adminService.getAdminProperties(params)
       │               GET /admin/properties?page=1&limit=20&status=...
       │               ← PropertyController.getProperties() [ya existe]
       ├─ PropertyModal (create/edit)
       │   └─ adminService.createProperty / updateProperty
       │       POST/PUT /admin/properties[/:id]
       └─ Toggle activo: adminService.updateProperty(id, { status })
```

### B) Bot — Properties/Tours Flow

```
WhatsApp user: "ver propiedades" / "quiero ver tours"
  └─ properties.flow.ts / tours.flow.ts
       └─ mlmApi.searchProperties(params)  [ya existe en mlm-api.service.ts]
           GET /api/bot/properties?city=...&limit=5
           └─ BotController.getBotProperties()  [NUEVO]
               Property.findAll({ where: { status: 'available' }, limit: 5 })
               ← [{id, type, title, price, city, bedrooms, bathrooms}]
       └─ formatPropertiesMessage(lang, properties)
           → WhatsApp message con lista formateada (max 5 items)
```

### C) Migración binary_balance → network_balance

```
Migration file: 20260407000001-rename-binary-balance.js
  up():
    1. ALTER TYPE enum_achievements_condition_type ADD VALUE 'network_balance'
    2. UPDATE achievements SET condition_type = 'network_balance'
       WHERE condition_type = 'binary_balance'
    3. ALTER TABLE achievements ALTER COLUMN condition_type
       TYPE enum_achievements_condition_type USING condition_type::text::enum_achievements_condition_type
       (en PostgreSQL — dejar old value en enum hasta confirmar 0 rows)
  
  ANTES de ejecutar: verificar con
    SELECT COUNT(*) FROM achievements WHERE condition_type = 'binary_balance';
```

---

## Interfaces / Contracts

### Backend — Nuevos métodos en BotController

```typescript
// GET /api/bot/properties
// Query: city?, type?, maxPrice?, limit? (default 5, max 10)
export async function getBotProperties(req: Request, res: Response): Promise<void>
// Response: { success: true, properties: BotProperty[] }

// GET /api/bot/tours
// Query: destination?, type?, maxPrice?, limit? (default 5, max 10)
export async function getBotTours(req: Request, res: Response): Promise<void>
// Response: { success: true, tours: BotTour[] }
```

### Frontend — Nuevos métodos en adminService

```typescript
// En frontend/src/services/api.ts → dentro del objeto adminService existente
getAdminProperties: (params?: { page?:number; limit?:number; status?:string; type?:string; city?:string }) => Promise<any>
createProperty: (data: CreatePropertyPayload) => Promise<any>
updateProperty: (id: string, data: Partial<CreatePropertyPayload>) => Promise<any>
deleteProperty: (id: string) => Promise<any>

getAdminTours: (params?: { page?:number; limit?:number; status?:string }) => Promise<any>
createTour: (data: CreateTourPayload) => Promise<any>
updateTour: (id: string, data: Partial<CreateTourPayload>) => Promise<any>
deleteTour: (id: string) => Promise<any>

getAdminReservations: (params?: { page?:number; limit?:number; type?:string; status?:string }) => Promise<any>
updateReservationStatus: (id: string, status: string, adminNotes?: string) => Promise<any>
```

### Bot — Estructura de los nuevos flows

```typescript
// bot/src/flows/properties.flow.ts
const PROPERTIES_KEYWORDS: [string, ...string[]] = [
  'propiedades', 'ver propiedades', 'properties', 'alquilar', 'comprar casa',
  'apartamento', 'inmuebles'
]
export const propertiesFlow = addKeyword(PROPERTIES_KEYWORDS)
  .addAction(async (ctx, { state, flowDynamic }) => {
    const lang = (state.getMyState() as any)?.lang ?? 'es'
    // Capture optional city from ctx.body
    const properties = await mlmApi.searchProperties({ limit: 5 })
    const msg = formatPropertiesMessage(lang, properties)
    await flowDynamic([{ body: msg }])
  })
```

### i18n — Claves duplicadas a eliminar

```
es.json / en.json:
  - Bloque "nav" duplicado (línea ~15 y línea ~350) → conservar PRIMERO
  - Bloque "twoFactor" duplicado → conservar PRIMERO  
  - Bloque "common" duplicado → conservar SEGUNDO (versión extendida con 18 keys)
  - Cambiar: admin.ratio → "Distribución de Red" / "Network Distribution"
```

---

## File Changes

### Backend

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `backend/src/controllers/BotController.ts` | Modify | Agregar `getBotProperties` y `getBotTours` |
| `backend/src/routes/bot.routes.ts` | Modify | Registrar GET `/properties` y GET `/tours` con `asyncHandler` |
| `backend/src/database/migrations/20260407000001-rename-binary-balance.js` | Create | Migration: ADD 'network_balance' enum value + UPDATE rows + validación |
| `backend/src/models/Achievement.ts` | Modify | Cambiar `'binary_balance'` → `'network_balance'` en `AchievementConditionType` |
| `backend/src/config/swagger.ts` | Modify | Versión 2.2.0 + schemas globales Property, Tour, Reservation |
| `backend/scripts/build.mjs` | Modify | Agregar `await rm('dist/server.mjs.map', { force: true })` después del build en producción |

### Frontend

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `frontend/src/pages/AdminPropertiesPage.tsx` | Create | Tabla paginada + modal CRUD + filtros (type, status, city) |
| `frontend/src/pages/AdminToursPage.tsx` | Create | Tabla paginada + modal CRUD (destination, status, type) |
| `frontend/src/pages/AdminReservationsPage.tsx` | Create | Tabla admin reservas + cambio de status + notas admin |
| `frontend/src/services/api.ts` | Modify | Agregar métodos admin en `adminService`: properties, tours, reservations |
| `frontend/src/services/achievementService.ts` | Modify | `'binary_balance'` → `'network_balance'` en `AchievementConditionType` |
| `frontend/src/App.tsx` | Modify | Agregar 3 rutas `AdminRoute`: `/admin/properties`, `/admin/tours`, `/admin/reservations` + lazy imports |
| `frontend/src/pages/DashboardStreaming.tsx` | Delete | Página huérfana sin ruta — confirmado en App.tsx |
| `frontend/public/locales/es/translation.json` | Modify | Eliminar duplicados nav/twoFactor/common; actualizar admin.ratio |
| `frontend/public/locales/en/translation.json` | Modify | Mismo cleanup que es.json |

### Bot

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `bot/src/flows/properties.flow.ts` | Create | Flow keywords inmobiliarios → mlmApi.searchProperties() → msg formateado |
| `bot/src/flows/tours.flow.ts` | Create | Flow keywords turismo → mlmApi.searchTours() → msg formateado |
| `bot/src/app.ts` | Modify | Importar y registrar propertiesFlow y toursFlow en createFlow([...]) |

### Docs

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `ROADMAP.md` | Modify | Agregar Sprint 6 (v2.2.0) con las 6 áreas de trabajo |

---

## Testing Strategy

| Layer | Qué testear | Approach |
|-------|-------------|----------|
| Unit | BotController.getBotProperties — filtros, limit clamp, empty result | Jest + Sequelize mock |
| Unit | Migration up/down — sin datos reales en test DB | Sequelize migration test runner |
| Unit | `achievementService.ts` tipos — no breaking change | TypeScript compile check |
| Integration | AdminPropertiesPage — render, fetch, modal create/edit | Vitest + MSW (mock /admin/properties) |
| Manual | i18n cleanup — verificar no hay `t('common.X')` rotos | `grep -r "t('common\." src/` antes del merge |
| Manual | Bot flows — mensajes en ES/EN con properties vacías y con data | Baileys local con bot dev |

---

## Migration / Rollout

```
Orden de deploy obligatorio:
1. Backend: correr migration (agrega 'network_balance', actualiza rows existentes)
2. Backend: deploy con nuevo Achievement.ts (acepta nuevo tipo)
3. Frontend: deploy con achievementService.ts actualizado
4. Bot: deploy con nuevos flows

VERIFICACIÓN previa (producción):
  SELECT condition_type, COUNT(*) FROM achievements GROUP BY condition_type;
  → Si hay rows con 'binary_balance', la migration los actualiza automáticamente.
  → Si count = 0, la migration no rompe nada de todas formas.
```

---

## Open Questions

- [ ] `DashboardStreaming.tsx` — confirmar que no hay ninguna ruta o link interno que la referencie antes de eliminar (grep recomendado)
- [ ] `admin.ratio` i18n key — verificar en qué componente se usa para asegurar que el cambio de label no rompe la UI del gráfico
- [ ] Bot flows — ¿se requiere captura de parámetros (city, type) via conversación o solo búsqueda por defecto? Diseño actual usa solo defaults (5 resultados, sin filtro)
