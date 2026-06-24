# Tasks: Sprint 6 — Nexo Real v2.2.0

> **Change**: sprint6  
> **Date**: 2026-04-07  
> **Branches**: `feature/sprint6-deuda-tecnica` · `feature/sprint6-admin-dashboard` · `feature/sprint6-nexo-bot` · `feature/sprint6-docs` · `feature/sprint6-seo-content` · `feature/sprint6-security`

---

## Fase 0: Setup — Issues + Ramas

- [x] 0.1 Crear issue `[CHORE] Sprint 6: Migración binary_balance → network_balance` (labels: area:backend, type:chore, sprint:6, priority:high) — asignar a `bladimir`
- [x] 0.2 Crear issue `[CHORE] Sprint 6: Build hardening — excluir .map de imagen Docker` (labels: area:backend, type:chore, sprint:6, priority:medium) — asignar a `bladimir`
- [x] 0.3 Crear issue `[CHORE] Sprint 6: i18n cleanup — deduplicar es.json/en.json` (labels: area:frontend, type:chore, sprint:6, priority:medium) — asignar a `bladimir`
- [x] 0.4 Crear issue `[FEATURE] Sprint 6: Admin Dashboard — vista reservas y comisiones afiliados` (labels: area:frontend, type:feature, sprint:6, priority:high) — asignar a `bladimir`
- [x] 0.5 Crear issue `[FEATURE] Sprint 6: Backend — endpoints /api/bot/properties y /api/bot/tours` (labels: area:backend, type:feature, sprint:6, priority:high) — asignar a `bladimir`
- [x] 0.6 Crear issue `[FEATURE] Sprint 6: Nexo Bot — flows propiedades/tours` (labels: area:bot, type:feature, sprint:6, priority:high) — asignar a `bladimir`
- [x] 0.7 Referenciar issues existentes #66 (Admin Dashboard CRUD) y #68 (Docs/Swagger) en Project de GitHub Sprint 6
- [x] 0.8 Crear rama `feature/sprint6-deuda-tecnica` desde `development`
- [x] 0.9 Crear rama `feature/sprint6-admin-dashboard` desde `development`
- [x] 0.10 Crear rama `feature/sprint6-nexo-bot` desde `development`
- [x] 0.11 Crear rama `feature/sprint6-docs` desde `development`

---

## Fase 1: Fundaciones — Migration + Build Hardening

> Rama: `feature/sprint6-deuda-tecnica`

- [x] 1.1 Verificar en DB: `SELECT condition_type, COUNT(*) FROM achievements GROUP BY condition_type;` — documentar resultado antes de migrar
- [x] 1.2 Crear `backend/src/database/migrations/20260407000001-rename-binary-balance.js` — `up()`: ADD VALUE `'network_balance'` al enum + UPDATE rows + `down()`: rollback con UPDATE inverso
- [x] 1.3 Modificar `backend/src/models/Achievement.ts` — cambiar `'binary_balance'` → `'network_balance'` en `AchievementConditionType` enum
- [x] 1.4 Modificar `frontend/src/services/achievementService.ts` — actualizar tipo `'binary_balance'` → `'network_balance'`; verificar que TypeScript compila sin errores
- [x] 1.5 Modificar `backend/scripts/build.mjs` — agregar `await rm('dist/server.mjs.map', { force: true })` al final del bloque de producción
- [x] 1.6 Verificar build local: `NODE_ENV=production node backend/scripts/build.mjs` → confirmar ausencia de `*.map` en `dist/`
- [x] 1.7 Commit en `feature/sprint6-deuda-tecnica` con `--no-gpg-sign`: `chore: rename binary_balance to network_balance + build hardening`
- [x] 1.8 PR + merge `feature/sprint6-deuda-tecnica` → `development`

---

## Fase 2: i18n Cleanup

> Rama: `feature/sprint6-deuda-tecnica` (misma rama o abrir sub-PR)

- [x] 2.1 Grep previo: `grep -r "t('common\." frontend/src/` — documentar keys usadas para no romper componentes
- [x] 2.2 Grep previo: `grep -r "DashboardStreaming" frontend/src/` — confirmar 0 referencias activas
- [x] 2.3 Modificar `frontend/public/locales/es/translation.json` — eliminar bloque duplicado `nav` (conservar 1ro), eliminar bloque duplicado `twoFactor` (conservar 1ro), eliminar bloque duplicado `common` (conservar 2do = 18 keys), cambiar `admin.ratio` → `admin.networkDistribution: "Distribución de Red"`
- [x] 2.4 Modificar `frontend/public/locales/en/translation.json` — mismo cleanup; `admin.networkDistribution: "Network Distribution"`
- [x] 2.5 Verificar JSON válido: `node -e "JSON.parse(require('fs').readFileSync('frontend/public/locales/es/translation.json','utf8'))"` — ídem en.json
- [x] 2.6 Verificar componente que usa `admin.ratio` / `admin.networkDistribution` — actualizar referencia en el componente si es necesario
- [x] 2.7 Eliminar `frontend/src/pages/DashboardStreaming.tsx`
- [x] 2.8 Commit con `--no-gpg-sign`: `chore: i18n cleanup + remove DashboardStreaming orphan`
- [x] 2.9 Merge a `development` si no se hizo en 1.8

---

## Fase 3: Backend — Endpoints Bot

> Rama: `feature/sprint6-nexo-bot`

- [x] 3.1 Modificar `backend/src/controllers/BotController.ts` — agregar `getBotProperties(req, res)`: query params `city?, type?, maxPrice?, limit?` (default 5, max 10), `Property.findAll({ where: { status: 'available' }, limit })`, response `{ success: true, properties: BotProperty[] }` + JSDoc bilingüe
- [x] 3.2 Modificar `backend/src/controllers/BotController.ts` — agregar `getBotTours(req, res)`: query params `destination?, type?, maxPrice?, limit?` (default 5, max 10), `Tour.findAll({ where: { status: 'active' }, limit })`, response `{ success: true, tours: BotTour[] }` + JSDoc bilingüe
- [x] 3.3 Modificar `backend/src/routes/bot.routes.ts` — registrar `router.get('/properties', authenticateBot, asyncHandler(getBotProperties))` y `router.get('/tours', authenticateBot, asyncHandler(getBotTours))`
- [x] 3.4 Test manual: `curl -H "x-bot-secret: <BOT_SECRET>" http://localhost:3001/api/bot/properties` → 200 con array; sin header → 401
- [x] 3.5 Test: `curl .../api/bot/properties?type=venta` → filtrado correcto

---

## Fase 4: Admin Dashboard Frontend

> Rama: `feature/sprint6-admin-dashboard`

- [x] 4.1 Modificar `frontend/src/services/api.ts` — agregar al `adminService` existente: `getAdminProperties`, `createProperty`, `updateProperty`, `deleteProperty`, `getAdminTours`, `createTour`, `updateTour`, `deleteTour`, `getAdminReservations`, `updateReservationStatus` con firmas del design + JSDoc bilingüe
- [x] 4.2 Crear `frontend/src/pages/AdminPropertiesPage.tsx` — tabla paginada (page, limit, filtros type/status/city) + modal CRUD (crear/editar) + toggle activo/inactivo + JSDoc bilingüe (seguir patrón CommissionConfigPage)
- [x] 4.3 Crear `frontend/src/pages/AdminToursPage.tsx` — tabla paginada (page, limit, filtros destination/status) + modal CRUD + JSDoc bilingüe
- [x] 4.4 Crear `frontend/src/pages/AdminReservationsPage.tsx` — tabla admin con filtros (status, userId) + paginación + cambio de status + notas admin + JSDoc bilingüe
- [x] 4.5 Modificar `frontend/src/App.tsx` — agregar lazy imports + 3 rutas `<AdminRoute>`: `/admin/properties`, `/admin/tours`, `/admin/reservations`
- [x] 4.6 Agregar claves i18n necesarias para las 3 páginas en `es.json` y `en.json` (títulos, labels, mensajes de error)
- [x] 4.7 Verificar: rol no-admin accediendo a `/admin/properties` → redirige (403 o redirect según middleware)
- [x] 4.8 Verificar: paginación en AdminPropertiesPage — botón "siguiente" se deshabilita en última página
- [x] 4.9 Commit con `--no-gpg-sign`: `feat: admin dashboard CRUD properties + tours + reservations`
- [x] 4.10 PR + merge `feature/sprint6-admin-dashboard` → `development`

---

## Fase 5: Nexo Bot — Flows

> Rama: `feature/sprint6-nexo-bot`

- [x] 5.1 Crear `bot/src/flows/properties.flow.ts` — `PROPERTIES_KEYWORDS` array, `propertiesFlow = addKeyword(...)`, `.addAction`: obtener lang desde state, llamar `mlmApi.searchProperties({ limit: 5 })`, formatear con `formatPropertiesMessage(lang, properties)`, manejar array vacío ("no hay propiedades disponibles") + JSDoc bilingüe
- [x] 5.2 Crear `bot/src/flows/tours.flow.ts` — mismo patrón: `TOURS_KEYWORDS`, `toursFlow`, `mlmApi.searchTours({ limit: 5 })`, `formatToursMessage(lang, tours)`, manejo de vacío + JSDoc bilingüe
- [x] 5.3 Modificar `bot/src/app.ts` — importar `propertiesFlow` y `toursFlow`, agregarlos al array de `createFlow([...])`
- [x] 5.4 Test local bot: enviar "ver propiedades" por WhatsApp dev → recibir lista de max 5 propiedades en ES
- [x] 5.5 Test local bot: enviar "tours disponibles" → recibir lista tours o mensaje "sin tours"
- [x] 5.6 Commit con `--no-gpg-sign`: `feat: nexo bot flows properties + tours`
- [x] 5.7 PR + merge `feature/sprint6-nexo-bot` → `development`

---

## Fase 6: Documentación

> Rama: `feature/sprint6-docs`

- [x] 6.1 Modificar `backend/src/config/swagger.ts` — actualizar versión a `2.2.0`, agregar schemas globales `Property`, `Tour`, `Reservation`, documentar endpoints `GET /api/bot/properties` y `GET /api/bot/tours` con parámetros, security BOT_SECRET y responses
- [x] 6.2 Verificar JSDoc bilingüe en todos los archivos creados/modificados del sprint: BotController (métodos nuevos), properties.flow.ts, tours.flow.ts, AdminPropertiesPage.tsx, AdminToursPage.tsx, AdminReservationsPage.tsx, api.ts (métodos nuevos), migration file
- [x] 6.3 Modificar `ROADMAP.md` — agregar sección `## Sprint 6 — v2.2.0` con las 6 áreas: Admin Dashboard CRUD, Bot Flows, i18n Cleanup, binary_balance Migration, Build Hardening, Docs
- [x] 6.4 Crear/actualizar `CHANGELOG.md` — sección `## [2.2.0] — 2026-04-07` con subsecciones Added / Changed / Fixed / Removed del sprint
- [x] 6.5 Commit con `--no-gpg-sign`: `docs: swagger v2.2.0 + JSDoc bilingüe + ROADMAP + CHANGELOG`
- [x] 6.6 PR + merge `feature/sprint6-docs` → `development`

---

## Fase 8: SEO + Contenido + Psicología de Conversión

> Rama: `feature/sprint6-seo-content`

- [x] 8.1 Crear issue `[FEATURE] Sprint 6: SEO — meta tags dinámicos + schema markup + slugs` (labels: area:frontend, type:feature, sprint:6, priority:medium) — asignar a `bladimir`
- [x] 8.2 Crear rama `feature/sprint6-seo-content` desde `development`
- [x] 8.3 Modificar `frontend/src/pages/PropertyDetailPage.tsx` — agregar `<Helmet>` con `<title>`, `<meta name="description">`, OG tags dinámicos (title, description, image) usando datos de la propiedad + JSDoc bilingüe
- [x] 8.4 Modificar `frontend/src/pages/TourDetailPage.tsx` — ídem con datos del tour + JSDoc bilingüe
- [x] 8.5 Modificar `frontend/src/pages/PropertiesPage.tsx` — agregar `<Helmet>` con meta description dinámica por ciudad/tipo (si hay filtros activos) + badge social proof "X personas vieron esto hoy" en cada card (dato simulado o real si hay endpoint) + JSDoc
- [x] 8.6 Modificar `frontend/src/pages/ToursPage.tsx` — ídem badges social proof en cards
- [x] 8.7 Modificar `frontend/src/pages/PropertyDetailPage.tsx` — agregar JSON-LD `RealEstateListing` schema markup con `name`, `description`, `url`, `price`, `address`, `image`
- [x] 8.8 Modificar `frontend/src/pages/TourDetailPage.tsx` — agregar JSON-LD `TouristAttraction` schema markup con `name`, `description`, `url`, `image`, `offers`
- [x] 8.9 Modificar `frontend/src/App.tsx` — cambiar rutas `/properties/:id` y `/tours/:id` para usar slug SEO-friendly (`/propiedades/:slug` y `/tours/:slug`) si el backend devuelve slug; fallback a ID si no
- [x] 8.10 Verificar con `react-helmet-async` (o equivalente ya instalado): que los meta tags aparezcan correctamente en `view-source` para SSR/CSR
- [x] 8.11 Commit con `--no-gpg-sign`: `feat: SEO meta tags + schema markup + social proof badges`
- [x] 8.12 PR + merge `feature/sprint6-seo-content` → `development`

---

## Fase 9: Security — Fix CodeQL Alerts

> Rama: `feature/sprint6-security`  
> CodeQL alerts: #39 (TourPackageController) + #40 (PropertyController) — severity: error

- [x] 9.1 Crear issue `[SECURITY] Fix CodeQL: type confusion through parameter tampering #39 #40` (labels: area:backend, type:security, sprint:6, priority:critical) — asignar a `bladimir`
- [x] 9.2 Crear rama `feature/sprint6-security` desde `development`
- [x] 9.3 Modificar `backend/src/controllers/PropertyController.ts` línea 369 — reemplazar cast directo `req.files as Express.Multer.File[]` por extracción segura: `Array.isArray(req.files) ? req.files : Object.values(req.files ?? {}).flat()` + JSDoc bilingüe actualizado
- [x] 9.4 Modificar `backend/src/controllers/TourPackageController.ts` línea 381 — mismo fix
- [x] 9.5 Verificar TypeScript compila sin errores: `cd backend && tsc --noEmit`
- [x] 9.6 Test manual: subir imagen a `/api/admin/properties/:id/images` → respuesta correcta; subir con array de files → no crash
- [x] 9.7 Commit con `--no-gpg-sign`: `fix(security): normalize req.files cast to prevent type confusion (CodeQL #39 #40)`
- [x] 9.8 PR + merge `feature/sprint6-security` → `development`
- [x] 9.9 Verificar en GitHub Security tab que alertas #39 y #40 cambian a "fixed" tras merge

---

## Fase 7: Testing + Verificación Final

> Rama: `development` (post-merge de todas las features)

- [x] 7.1 Run `grep -r "binary_balance" backend/src frontend/src bot/src` → 0 resultados en código fuente
- [x] 7.2 Run `grep -r "DashboardStreaming" frontend/src` → 0 resultados
- [x] 7.3 Verificar JSON válido: ambos archivos i18n parseables sin error
- [x] 7.4 TypeScript compile check: `cd frontend && tsc --noEmit` → 0 errores; `cd backend && tsc --noEmit` → 0 errores
- [x] 7.5 Test unitario: `BotController.getBotProperties` — mock `Property.findAll`, verificar limit clamp a 10, filtros opcionales, response shape
- [x] 7.6 Test unitario: migration up/down en test DB vacía — 0 filas afectadas, sin error
- [x] 7.7 Test integración: `AdminPropertiesPage` — render, fetch mockeado con MSW `/admin/properties`, abrir modal crear, submit → llamada a `createProperty`
- [x] 7.8 Smoke test E2E manual: login admin → navegar `/admin/properties` → crear propiedad → editar → toggle inactivo → verificar en lista
- [x] 7.9 Smoke test E2E manual: bot dev → "ver propiedades" → respuesta con lista → "tours" → respuesta tours
- [x] 7.10 Verificar Swagger UI en `/api/docs` → endpoints bot visibles, versión 2.2.0, schemas correctos
- [x] 7.11 Build final: `NODE_ENV=production node backend/scripts/build.mjs` → confirmar 0 archivos `*.map` en `dist/`

---

## Resumen

| Fase | Tasks | Rama | Issues |
|------|-------|------|--------|
| 0 — Setup | 11 | — | Crear 6 issues nuevas |
| 1 — Fundaciones | 8 | sprint6-deuda-tecnica | #nueva-1, #nueva-2 |
| 2 — i18n Cleanup | 9 | sprint6-deuda-tecnica | #nueva-3 |
| 3 — Backend Bot | 5 | sprint6-nexo-bot | #nueva-5 |
| 4 — Admin Dashboard | 10 | sprint6-admin-dashboard | #66, #nueva-4 |
| 5 — Bot Flows | 7 | sprint6-nexo-bot | #nueva-6 |
| 6 — Docs | 6 | sprint6-docs | #68 |
| 7 — Testing | 11 | development | — |
| 8 — SEO + Contenido | 12 | sprint6-seo-content | #nueva-7 |
| 9 — Security CodeQL | 9 | sprint6-security | #nueva-8 |
| **Total** | **88** | | |

---

## Issues a crear (en Fase 0)

| # | Título | Labels | Prioridad |
|---|--------|--------|-----------|
| Nueva | `[CHORE] Sprint 6: Migración binary_balance → network_balance` | area:backend, type:chore, sprint:6 | high |
| Nueva | `[CHORE] Sprint 6: Build hardening — excluir .map de imagen Docker` | area:backend, type:chore, sprint:6 | medium |
| Nueva | `[CHORE] Sprint 6: i18n cleanup — deduplicar es.json/en.json` | area:frontend, type:chore, sprint:6 | medium |
| Nueva | `[FEATURE] Sprint 6: Admin Dashboard — vista reservas y comisiones afiliados` | area:frontend, type:feature, sprint:6 | high |
| Nueva | `[FEATURE] Sprint 6: Backend — endpoints /api/bot/properties y /api/bot/tours` | area:backend, type:feature, sprint:6 | high |
| Nueva | `[FEATURE] Sprint 6: Nexo Bot — flows propiedades/tours` | area:bot, type:feature, sprint:6 | high |
| Nueva | `[FEATURE] Sprint 6: SEO — meta tags dinámicos + schema markup + slugs` | area:frontend, type:feature, sprint:6 | medium |
| Nueva | `[SECURITY] Fix CodeQL: type confusion through parameter tampering #39 #40` | area:backend, type:security, sprint:6 | critical |
| #66 ✅ | `[FEATURE] Sprint 5: Admin Dashboard — CRUD propiedades y tours` | ya existe — actualizar a sprint:6 | — |
| #68 ✅ | `[DOCS] Sprint 5: Swagger v2.2.0 + JSDoc bilingüe + ROADMAP` | ya existe — actualizar a sprint:6 | — |

---

## Orden de deploy (producción)

```
1. Correr migration 20260407000001-rename-binary-balance.js
2. Deploy backend (Achievement.ts nuevo tipo, BotController endpoints)
3. Deploy frontend (adminService métodos, AdminPages, achievementService, App.tsx rutas)
4. Deploy bot (propertiesFlow, toursFlow registrados en app.ts)
```
