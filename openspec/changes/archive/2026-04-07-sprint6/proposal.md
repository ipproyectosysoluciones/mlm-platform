# Proposal: Sprint 6 — Nexo Real

> **Fecha:** 2026-04-07
> **Change:** sprint6
> **Artifact store:** hybrid (Engram + openspec filesystem)
> **Issues:** #66 (Admin Dashboard), #68 (Docs)

---

## Intent

Sprint 6 cierra los gaps críticos entre backend y frontend/bot que quedaron pendientes en Sprint 5:
- El backend admin (properties, tours, reservations) está 100% implementado; el frontend no tiene ninguna UI de gestión para esas entidades.
- El bot tiene los servicios `searchProperties()`/`searchTours()` listos pero los endpoints backend y los flows no existen.
- La deuda técnica i18n (duplicados) y `binary_balance` (semánticamente inválido en Unilevel) crece con cada sprint.
- El swagger global sigue en v1.10.0 (Sprint 2).

---

## Scope

### In Scope

1. **Admin Dashboard — Frontend CRUD** (issue #66)
   - `AdminPropertiesPage.tsx` — CRUD + toggle activo/inactivo
   - `AdminToursPage.tsx` — CRUD completo
   - `AdminReservationsPage.tsx` — listado completo + acciones admin
   - Métodos admin en `api.ts → adminService` (properties, tours, reservations)
   - Vista de afiliado: sus reservas + comisiones propias (page existente ampliada o nueva)

2. **Nexo Bot — Flows propiedades y tours**
   - `GET /api/bot/properties` y `GET /api/bot/tours` en `bot.routes.ts` + controlador
   - `bot/src/flows/properties.flow.ts`
   - `bot/src/flows/tours.flow.ts`
   - Registro de flows en `bot/src/app.ts`

3. **Deuda técnica i18n**
   - Eliminar duplicados `nav`, `twoFactor`, `common` (conservar versión extendida) en `es.json` y `en.json`
   - Actualizar clave `admin.ratio` → "Distribución de Red"
   - Eliminar `DashboardStreaming.tsx` (archivo huérfano)

4. **Migración `binary_balance` → `network_balance`**
   - Backend: migration Sequelize + actualizar `Achievement.ts`
   - Frontend: actualizar tipo en `achievementService.ts`

5. **Build hardening**
   - Agregar `rm -f dist/*.map` al script de build de prod / CI

6. **Documentación** (issue #68)
   - Actualizar `swagger.ts` header → v2.2.0 + schemas globales `Property`, `Tour`, `Reservation`
   - Actualizar `docs/ROADMAP.md` con Sprint 6
   - JSDoc bilingüe (ES + EN) en todos los archivos nuevos

### Out of Scope

- Agentes duales Sophia/Max y detección de género → sprint 7 (requiere diseño de UX aparte)
- Integración Google Calendar vía n8n → sprint 7
- Dockerización del bot → sprint 7
- Multi-stage Dockerfile backend → no necesario (Dockerfile actual ya es correcto)
- Auto-generación de Swagger → overkill, E1 es suficiente

---

## Approach

| Área | Approach elegido | Razón |
|------|-----------------|-------|
| Admin Dashboard | **A1** — páginas separadas | Patrón ya establecido en el proyecto; escalable |
| Bot flows | **B1** — 2 endpoints backend + 2 flows | `mlm-api.service.ts` ya preparado; arquitectura correcta |
| i18n | Fix quirúrgico | Corrección directa, sin alternativas |
| binary_balance | **C2** — renombrar con migración | Preserva integridad de datos en producción |
| Build | 1 línea `rm -f dist/*.map` | Riesgo mínimo, no requiere refactor |
| Docs | **E1** — actualizar header swagger.ts | JSDoc en route files ya está; solo header desactualizado |

---

## Affected Areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `frontend/src/pages/AdminPropertiesPage.tsx` | New | CRUD propiedades admin |
| `frontend/src/pages/AdminToursPage.tsx` | New | CRUD tours admin |
| `frontend/src/pages/AdminReservationsPage.tsx` | New | Vista reservas admin |
| `frontend/src/services/api.ts` | Modified | Métodos admin para properties/tours/reservations |
| `frontend/src/services/achievementService.ts` | Modified | `binary_balance` → `network_balance` |
| `frontend/src/locales/es.json` | Modified | Eliminar duplicados nav/twoFactor/common |
| `frontend/src/locales/en.json` | Modified | Eliminar duplicados nav/twoFactor/common |
| `backend/src/routes/bot.routes.ts` | Modified | Agregar `/bot/properties` y `/bot/tours` |
| `backend/src/models/Achievement.ts` | Modified | `binary_balance` → `network_balance` |
| `backend/src/migrations/YYYYMMDD-rename-binary-balance.ts` | New | Migración Sequelize |
| `backend/src/config/swagger.ts` | Modified | Versión 2.2.0 + schemas globales |
| `backend/scripts/build.mjs` | Modified | Agregar limpieza de `.map` en prod |
| `bot/src/flows/properties.flow.ts` | New | Flow WhatsApp propiedades |
| `bot/src/flows/tours.flow.ts` | New | Flow WhatsApp tours |
| `bot/src/app.ts` | Modified | Registrar flows nuevos |
| `docs/ROADMAP.md` | Modified | Sprint 6 entry |
| `frontend/src/pages/DashboardStreaming.tsx` | Removed | Huérfano sin ruta |

---

## Risks

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| `binary_balance` con datos en DB producción | Media | Verificar antes de migrar; usar `UPDATE` con rollback en la migration |
| Bot endpoint `/bot/properties` sin paginación satura WhatsApp | Alta | Limitar a 5 resultados por defecto en el endpoint |
| `common` i18n — versión corta referenciada por algún componente | Baja | Grep de todas las keys de la versión corta antes de eliminar |
| `AdminReservationsPage` — filtros admin/usuario compartidos | Media | Revisar `ReservationController` para confirmar middleware `isAdmin` en rutas admin |

---

## Rollback Plan

- **Admin Dashboard:** páginas nuevas — revertir rama feature; no toca datos.
- **binary_balance migration:** Sequelize migration `down()` restaura el valor original. Script de rollback: `pnpm sequelize db:migrate:undo`.
- **i18n:** Git revert en `es.json`/`en.json`. Sin impacto en DB.
- **Bot flows:** revertir rama feature; los endpoints nuevos se eliminan del router.
- **Build:** revertir el 1 línea en `build.mjs`; sin impacto funcional.

---

## Dependencies

- Backend admin routes: implementados ✅ (no bloquean)
- `mlm-api.service.ts` bot services: implementados ✅ (no bloquean)
- GitHub issues #66 y #68: asignados a bladimir ✅
- GPG signing expirado: usar `--no-gpg-sign` en todos los commits

---

## Success Criteria

- [ ] Admin puede crear, editar, eliminar y toggle activo/inactivo propiedades y tours desde el dashboard
- [ ] Admin ve todas las reservas; afiliado ve solo las suyas con comisiones
- [ ] Bot responde al usuario con listado de propiedades y tours disponibles (máx 5)
- [ ] `es.json` y `en.json` sin keys duplicadas (verificado con JSON lint)
- [ ] `binary_balance` no aparece en ningún archivo del proyecto (verificado con grep)
- [ ] `dist/server.mjs.map` no se genera en build de producción
- [ ] `swagger.ts` en versión 2.2.0 con schemas Property, Tour, Reservation
- [ ] `ROADMAP.md` actualizado con Sprint 6
- [ ] Todos los archivos nuevos tienen JSDoc bilingüe (ES + EN)
- [ ] Build de producción pasa sin errores en CI
