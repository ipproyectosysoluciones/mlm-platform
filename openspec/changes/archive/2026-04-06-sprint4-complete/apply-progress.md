# Apply Progress: Sprint 4 — Nexo Bot MVP + Backend Hardening + v2.0.0

## Status: COMPLETED ✅

**Implementado directamente (sin SDD previo) — documentado retroactivamente**
**Fecha de completado**: 2026-04-06
**Tag**: v2.0.0
**GitHub Release**: https://github.com/ipproyectosysoluciones/mlm-platform/releases/tag/v2.0.0

---

## What Was Implemented

### 1. Nexo Bot (WhatsApp) — `bot/`

Bootstrap con **BuilderBot + Baileys** en puerto 3002, CommonJS, Dockerizado.

**Flows implementados** (todos completos):

| Flow | Archivo | Función |
|------|---------|---------|
| Language | `bot/src/flows/language.flow.ts` | Detección ES/EN + cambio mid-session |
| Welcome | `bot/src/flows/welcome.flow.ts` | Saludo + menú numerado (ES + EN) |
| Balance | `bot/src/flows/balance.flow.ts` | Saldo wallet via MLM API |
| Network | `bot/src/flows/network.flow.ts` | Downline + comisiones |
| Support | `bot/src/flows/support.flow.ts` | FAQ desde KB + opción escalación |
| Schedule | `bot/src/flows/schedule.flow.ts` | Form visita → n8n → Google Calendar + Notion |
| Handoff | `bot/src/flows/handoff.flow.ts` | Escalación humana → n8n → Notion CRM |
| Agent | `bot/src/flows/agent.flow.ts` | GPT-4o fallback (Sophia ES / Max EN) |

**Servicios implementados**:

| Servicio | Archivo | Función |
|---------|---------|---------|
| AI Service | `bot/src/services/ai.service.ts` | OpenAI GPT-4o, carga prompts privados, selecciona agente por idioma |
| MLM API | `bot/src/services/mlm-api.service.ts` | HTTP client al backend REST |
| n8n Service | `bot/src/services/n8n.service.ts` | HTTP client para webhooks n8n |

**Infra**:
- `bot/Dockerfile` — Node 20, EXPOSE 3002
- `bot/package.json` — CommonJS, deps: @builderbot/bot, @builderbot/provider-baileys, openai, axios
- Sesión persistente: `experimentalStore=true`, `timeRelease=10800000` (3h)

### 2. n8n Automation

| Webhook | Acciones |
|---------|----------|
| `POST /webhook/schedule-visit` | Google Calendar event + Notion CRM lead |
| `POST /webhook/human-handoff` | Notion CRM escalation + agent notification |

- `docs/N8N-SETUP.md` — guía completa de configuración
- n8n en Docker en `mlm-network`, puerto 5678 interno

### 3. Backend Additions (PR #52)

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `backend/src/routes/achievement.routes.ts` | Nuevo | GET /achievements, GET /achievements/:userId |
| `backend/src/routes/leaderboard.routes.ts` | Nuevo | GET /leaderboard (paginado) |
| `backend/src/routes/bot.routes.ts` | Nuevo | POST /bot/notify, GET /bot/status |
| `backend/src/controllers/BotController.ts` | Nuevo | notifyUser(), getStatus() |
| `backend/src/middleware/bot.middleware.ts` | Nuevo | Validación x-bot-secret → 401 si inválido |
| `backend/src/models/index.ts` | Modificado | Achievement/Badge/UserAchievement associations |

### 4. Frontend Tests (PR #53)

| Archivo | Tests | Cobertura |
|---------|-------|-----------|
| `frontend/src/components/leaderboard/__tests__/Podium.test.tsx` | 12 | Top 3, avatares, scores, edge cases |
| `frontend/src/components/leaderboard/__tests__/RankingTable.test.tsx` | 12 | Filas, paginación, highlight usuario actual |
| `frontend/src/components/leaderboard/__tests__/UserRankBanner.test.tsx` | 8 | Datos, posición, cambio de rank |
| `frontend/src/pages/__tests__/AchievementsPage.test.tsx` | 12 | Lista, locked/unlocked, badges, loading, error |
| `frontend/src/__tests__/services.test.ts` | +9 | Achievements + leaderboard services |
| `frontend/vitest.config.ts` | fix | `singleFork: true` para Vitest 4 |

**Resultado**: 155 → **210 tests** ✅ todos pasando

### 5. Architecture Docs + Release (PR #54)

- `docs/ARCHITECTURE.md` — sección Sprint 4 agregada, versión bumped a v2.0.0
- Merge `development → main`
- Tag `v2.0.0` creado en main
- GitHub Release publicado

---

## Files Changed (Summary)

### New Files
- `bot/` — directorio completo (14 archivos)
- `docs/N8N-SETUP.md`
- `backend/src/routes/achievement.routes.ts`
- `backend/src/routes/leaderboard.routes.ts`
- `backend/src/routes/bot.routes.ts`
- `backend/src/controllers/BotController.ts`
- `backend/src/middleware/bot.middleware.ts`
- `frontend/src/components/leaderboard/__tests__/Podium.test.tsx`
- `frontend/src/components/leaderboard/__tests__/RankingTable.test.tsx`
- `frontend/src/components/leaderboard/__tests__/UserRankBanner.test.tsx`
- `frontend/src/pages/__tests__/AchievementsPage.test.tsx`

### Modified Files
- `backend/src/models/index.ts` — achievement/badge/userachievement associations
- `backend/src/routes/index.ts` — register achievement, leaderboard, bot routes
- `frontend/src/__tests__/services.test.ts` — +9 tests
- `frontend/vitest.config.ts` — singleFork: true
- `docs/ARCHITECTURE.md` — Sprint 4 section + v2.0.0

---

## PRs

| PR | Título | Status |
|----|--------|--------|
| #52 | `fix(backend): sprint4 backend fixes and integration tests` | Merged ✅ |
| #53 | `test(frontend): increase test coverage from 155 to 210 tests` | Merged ✅ |
| #54 | `docs(architecture): update ARCHITECTURE.md for v2.0.0` | Merged ✅ |

---

## Deviations from Design

Ninguna — la implementación fue directa. Este documento captura lo que fue implementado; el design
fue creado retroactivamente como documentación fiel.

---

## Known Limitations (for future sprints)

1. **Bot en producción** — Baileys usa WhatsApp Web; para producción a escala se debe migrar a
   WhatsApp Business API oficial (cambio de provider en `app.ts`).
2. **n8n en cloud** — Actualmente Docker local. Sprint 5 debería migrar a n8n cloud o auto-hosted
   con persistencia en Postgres.
3. **Bot session** — `experimentalStore` no es multi-instancia. Si el bot escala horizontalmente,
   necesita Redis para estado de sesión compartido.
4. **Bot tests automáticos** — No hay E2E para el bot. WhatsApp sandbox necesario para CI.
