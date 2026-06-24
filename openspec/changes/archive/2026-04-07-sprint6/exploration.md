# Exploration: Sprint 6 — Nexo Real

> **Fecha:** 2026-04-07
> **Change:** sprint6
> **Artifact store:** hybrid (Engram + openspec filesystem)

---

## Current State

Sprint 5 (v2.1.0) fue cerrado y archivado. El sistema tiene:

- **Backend completo** para propiedades, tours, reservaciones (rutas admin + bot) con Swagger JSDoc en cada route file.
- **Frontend** con vistas públicas (`PropertiesPage`, `ToursPage`) y vista de reservas del afiliado (`MisReservasPage`), pero **sin UI de CRUD admin** para ninguna de estas entidades.
- **Bot de WhatsApp** con flows MLM funcionales (balance, red, soporte, agendamiento), pero **sin flows de propiedades/tours**.
- **`bot.routes.ts`** solo expone 4 endpoints (user-by-phone, wallet, network, commissions) — los endpoints `/bot/properties` y `/bot/tours` que `mlm-api.service.ts` ya consume **NO están implementados** en el backend.
- **i18n** con duplicados estructurales en `es.json` y `en.json`.
- **`swagger.ts`** global desactualizado (versión 1.10.0, Sprint 2).
- **`backend/dist/server.mjs.map`** presente en el directorio de dist (generado en dev local, no debe copiarse a producción).
- **`binary_balance`** como tipo de condición de logro en el modelo `Achievement` — semánticamente obsoleto para arquitectura Unilevel.

---

## Affected Areas

### A) Admin Dashboard — Frontend CRUD

| Archivo | Estado | Problema |
|---|---|---|
| `frontend/src/pages/AdminDashboard.tsx` | Existe | Solo gestión de usuarios MLM — NO tiene sección de propiedades/tours/reservaciones |
| `frontend/src/services/api.ts` | Existe | `adminService` sin métodos para properties, tours ni reservations |
| `backend/src/routes/admin-property.routes.ts` | ✅ Completo | CRUD + imágenes + Swagger JSDoc implementados |
| `backend/src/routes/admin-tour.routes.ts` | ✅ Completo | CRUD + imágenes + Swagger JSDoc implementados |
| `backend/src/routes/admin-reservation.routes.ts` | ✅ Completo | GET/POST/PUT/cancel/confirm + Swagger JSDoc implementados |

**Gap crítico:** El backend admin está 100% listo. El frontend no tiene NINGUNA página ni componente para que el admin gestione propiedades, tours ni reservaciones.

**Vista de comisiones para afiliados:**
- `MisReservasPage.tsx` existe (reservas del afiliado) ✅
- `AdminDashboard.tsx` tiene sección de comisiones MLM (árbol), pero NO muestra comisiones por cierre de propiedades/tours.

---

### B) Nexo Bot — Flows de propiedades y tours

| Archivo | Estado | Detalle |
|---|---|---|
| `bot/src/app.ts` | Existe | Flows registrados: welcome/balance/network/support/schedule/handoff |
| `bot/src/services/mlm-api.service.ts` | Existe | Tiene `searchProperties()` y `searchTours()` YA implementados — llaman a `/bot/properties` y `/bot/tours` |
| `backend/src/routes/bot.routes.ts` | Incompleto | Solo tiene: user-by-phone, wallet, network, commissions — **faltan `/bot/properties` y `/bot/tours`** |
| `bot/src/flows/properties.flow.ts` | ❌ No existe | — |
| `bot/src/flows/tours.flow.ts` | ❌ No existe | — |

**Gap crítico (doble):**
1. El backend no tiene los endpoints `/api/bot/properties` y `/api/bot/tours`.
2. El bot no tiene los flows `properties.flow.ts` ni `tours.flow.ts`.

El servicio `mlm-api.service.ts` ya tiene los tipos `BotProperty` y `BotTour` definidos, y los métodos listos — solo falta el backend que los sirva y el flow que los presente.

---

### C) Deuda técnica i18n + binary_balance

**i18n — Duplicados en `es.json` y `en.json`:**

| Key duplicada | Primera aparición | Segunda aparición | Acción |
|---|---|---|---|
| `nav` | línea ~98 | línea ~503 (idéntica) | Eliminar segunda |
| `twoFactor` | línea ~116 | línea ~521 (idéntica) | Eliminar segunda |
| `common` | línea ~158 (11 keys: base) | línea ~555 (18 keys: extendida) | Eliminar primera; conservar segunda (más completa) |

> Los duplicados en `es.json` y `en.json` son estructuralmente idénticos — misma corrección aplica a ambos archivos.

**binary_balance:**
- Definido en `frontend/src/services/achievementService.ts` como tipo `AchievementConditionType`.
- Definido en `backend/src/models/Achievement.ts` como valor de `condition_type` (columna DB).
- Corresponde al logro "binary_balanced" (10 izq + 10 der) — semánticamente inválido en arquitectura Unilevel actual.
- **No hay migración** que agregue este tipo — fue incluido en el modelo desde el principio.
- Acción: remover o renombrar a `network_balance` / `unilevel_balance`. Requiere coordinación frontend + backend + DB.

---

### D) Build del backend — Dockerfile

| Ítem | Estado |
|---|---|
| `backend/scripts/build.mjs` | `minify: true` en producción ✅, `sourcemap: false` en producción ✅ |
| `backend/Dockerfile` | Copia solo `dist/server.mjs` (NO copia `server.mjs.map`) ✅ |
| `backend/dist/server.mjs.map` | Existe en dist local (build de dev) — pero **no se copia** al container |

**Dockerfile (`backend/Dockerfile`) — 1 stage (no multi-stage):**
- `FROM node:24-alpine` — imagen de producción directa
- Copia `package.json` → `pnpm install --prod --no-lockfile`
- Copia solo `COPY dist/server.mjs ./dist/server.mjs` — ✅ el `.map` NO va al container
- Healthcheck en `/api/health` ✅
- Arranca con `--alter` (Sequelize sync safe) ✅

**Hallazgo:** El `.map` en `dist/` es un artifact de un build local en modo dev. No hay riesgo en producción. La limpieza de `dist/` antes de cada build de prod resuelve el problema.

---

### E) Documentación

| Archivo | Estado | Problema |
|---|---|---|
| `docs/ROADMAP.md` | ✅ Actualizado a v2.1.0 | Sprint 6 no definido aún |
| `backend/src/config/swagger.ts` | ❌ Desactualizado | Versión `1.10.0` (Sprint 2). No tiene schemas de `Property`, `Tour`, `Reservation`. Los endpoints tienen JSDoc en sus route files pero el header global está desfasado. |

**swagger.ts — Historial de versiones registradas:**
- `1.0.0` → `1.10.0` — Sprint 2
- Sprint 3 (multi-vendor, delivery, contracts) → no actualizado
- Sprint 4 (bot, architecture) → no actualizado
- Sprint 5 (properties, tours, reservations) → no actualizado

---

## Approaches

### A) Admin Dashboard

**Approach A1 — Páginas separadas por entidad**
- Crear `AdminPropertiesPage.tsx`, `AdminToursPage.tsx`, `AdminReservationsPage.tsx` como rutas separadas en el dashboard admin.
- Pros: separación clara, escalable, código pequeño por archivo.
- Cons: más rutas a configurar, posible duplicación de lógica de tabla/filtros.
- Effort: Medium

**Approach A2 — Tabs dentro de AdminDashboard (extender el existente)**
- Agregar tabs "Propiedades", "Tours", "Reservaciones" al `AdminDashboard.tsx` existente.
- Pros: menos rutas, mantiene UX centralizada.
- Cons: el archivo crece; mezcla responsabilidades.
- Effort: Low-Medium

**Recomendación:** A1 — páginas separadas, siguiendo el patrón ya establecido en el proyecto (cada feature tiene su propia page).

---

### B) Bot Flows

**Approach B1 — Implementar backend + bot flow completo**
- Agregar endpoints `/api/bot/properties` y `/api/bot/tours` en `bot.routes.ts` + controlador.
- Crear `properties.flow.ts` y `tours.flow.ts` en el bot.
- Registrar flows en `app.ts`.
- Pros: completa la funcionalidad, `mlm-api.service.ts` ya está listo.
- Cons: requiere trabajo coordinado en backend y bot.
- Effort: Medium

**Approach B2 — Solo flows (consumir endpoints de propiedades públicos)**
- Usar el endpoint público de propiedades/tours en vez de crear endpoints bot dedicados.
- Pros: menos código backend.
- Cons: los endpoints públicos devuelven más data de la necesaria para el bot; autenticación diferente.
- Effort: Low-Medium

**Recomendación:** B1 — los tipos `BotProperty`/`BotTour` en `mlm-api.service.ts` son la spec de lo que el backend debe devolver. Implementar el endpoint dedicado es la arquitectura correcta.

---

### C) Deuda técnica

**i18n:** Fix quirúrgico — eliminar las keys duplicadas. Sin alternativas: es una corrección directa.

**binary_balance:** Dos opciones:
- **C1 — Eliminar el logro** si nadie lo usa actualmente (verificar si hay datos en DB).
- **C2 — Renombrar** a `network_balance` con migración de datos.
- Effort: Low (eliminar) o Low-Medium (renombrar con migración)

---

### D) Build

No requiere cambio de código. Solo agregar `rm -f dist/*.map` al script de build de prod o al CI.

---

### E) Documentación

**Approach E1 — Actualizar solo `swagger.ts` header**
- Actualizar versión a `2.1.0` + agregar schemas `Property`, `Tour`, `Reservation` en el archivo global.
- Effort: Low

**Approach E2 — Migrar a Swagger con auto-generación**
- Innecesario por ahora; el proyecto ya tiene JSDoc en los route files y `swagger-jsdoc` funcionando.
- Effort: High (overkill)

**Recomendación:** E1.

---

## Recommendation

Para Sprint 6, el orden de prioridad recomendado:

1. **Admin Dashboard (A)** — es el issue #66, el trabajo de mayor valor. Backend listo. Implementar páginas frontend + métodos en `adminService`.
2. **Bot flows (B)** — alta visibilidad, backend 50% listo (solo faltan 2 endpoints). `mlm-api.service.ts` ya preparado.
3. **i18n duplicados (C)** — deuda técnica rápida (< 1h), eliminar antes de que crezca más.
4. **Swagger (E)** — documentación, bajo riesgo, acompañar con el trabajo de admin.
5. **binary_balance (C)** — evaluar si hay datos en DB antes de decidir eliminar o renombrar.
6. **Build .map (D)** — 1 línea de fix en CI/script de build.

---

## Risks

- **Admin Dashboard:** El `ReservationController` comparte lógica admin/usuario — verificar que los filtros admin (por `vendorId`, `userId`) estén correctamente implementados y no expuestos a usuarios normales.
- **Bot flows:** El endpoint `/bot/properties` debe ser paginado o limitado — devolver todas las propiedades sin límite en un mensaje de WhatsApp no es viable.
- **binary_balance:** Si existen logros de usuario con `condition_type = 'binary_balance'` en la DB de producción, la eliminación directa rompe datos. Requiere migración o soft-delete.
- **i18n `common` duplicado:** La versión corta (línea ~158) puede ser referenciada por algunos componentes. Verificar que los 7 keys extra de la versión larga no sean nuevos antes de eliminar la primera.

---

## Ready for Proposal

**Sí.** La exploración está completa. El orquestador puede proceder con la fase `propose` para el Sprint 6 con las siguientes áreas confirmadas:

- `A` Admin Dashboard CRUD (issue #66)
- `B` Bot flows: propiedades + tours
- `C` Deuda técnica: i18n duplicados + binary_balance
- `D` Build: limpiar `.map` de dist en prod
- `E` Documentación: actualizar swagger.ts (issue #68)
