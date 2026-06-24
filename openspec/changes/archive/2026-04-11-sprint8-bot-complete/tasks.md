# Tasks: sprint8-bot-complete

> **Version objetivo**: v2.4.0 | **Branches**: `feature/sprint8-8.X` → `development`
> **Estado**: ✅ COMPLETADO — todos los batches mergeados a `development`

---

## ✅ Pre-conditions — RESUELTAS

- [x] ⚠️ Obtener Notion database ID para **Visitas** (n8n 8.2) — ✅ configurado
- [x] ⚠️ Obtener Notion database ID para **Leads** (n8n 8.3) — ✅ configurado
- [x] ⚠️ Confirmar **Brevo template ID** para handoff (n8n 8.3) — ✅ template #1 "Bot Handoff — Notificación Equipo"
- [x] ⚠️ Confirmar **BOT_SYSTEM_USER_ID** (migration o seed manual) (8.4) — ✅ `00000000-0000-0000-0000-000000000001`
- [x] ⚠️ Confirmar **Google Calendar ID** del equipo (n8n 8.2) — ✅ configurado

---

## Batch 8.1 — Knowledge Base ✅ PR #107 MERGED

### Infrastructure
- [x] 8.1.0 Crear GitHub Issue "[S8/Batch 8.1] Knowledge Base — 4 prompt_kb files"
- [x] 8.1.1 Crear directorio `bot/src/prompt_kb/`

### Implementation
- [x] 8.1.2 CREATE `bot/src/prompt_kb/base-system-prompt.md`
- [x] 8.1.3 CREATE `bot/src/prompt_kb/knowledge-base.md`
- [x] 8.1.4 CREATE `bot/src/prompt_kb/sophia.prompt.md`
- [x] 8.1.5 CREATE `bot/src/prompt_kb/max.prompt.md`

### Testing & Docs
- [x] 8.1.6 Verificar que `ai.service.ts` carga los 4 archivos correctamente
- [x] 8.1.7 Smoke test OK
- [x] 8.1.8 PR `feature/sprint8-8.1-knowledge-base` → `development` ✅ mergeado

---

## Batch 8.2 — n8n Schedule Visit ✅ PR #110 + #112 MERGED

### Infrastructure
- [x] 8.2.0 Crear GitHub Issue "[S8/Batch 8.2] n8n Workflow — Schedule Visit"
- [x] 8.2.1 Crear directorio `bot/n8n/workflows/`
- [x] 8.2.2 UPDATE `bot/.env.example` — `GOOGLE_CALENDAR_ID`, `N8N_SCHEDULE_VISIT_URL`

### Implementation
- [x] 8.2.3 CREATE `bot/n8n/workflows/schedule-visit.json`
- [x] 8.2.4 CREATE `bot/n8n/README.md`

### Testing & Docs
- [x] 8.2.5 Workflow funcional en n8n con Google Calendar + Notion IDs reales
- [x] 8.2.6 PR mergeado ✅

---

## Batch 8.3 — n8n Human Handoff ✅ PR #111 + #112 MERGED

### Infrastructure
- [x] 8.3.0 Crear GitHub Issue "[S8/Batch 8.3] n8n Workflow — Human Handoff"
- [x] 8.3.1 UPDATE `bot/.env.example` — `NOTION_DATABASE_ID_LEADS`, `BREVO_HANDOFF_TEMPLATE_ID=1`

### Implementation
- [x] 8.3.2 CREATE `bot/n8n/workflows/human-handoff.json`

### Testing & Docs
- [x] 8.3.3 Workflow funcional con template Brevo #1 + Notion IDs reales
- [x] 8.3.4 PR mergeado ✅

---

## Batch 8.4 — Lead Capture ✅ PR #114 MERGED

### Infrastructure
- [x] 8.4.0 Crear GitHub Issue "[S8/Batch 8.4] Lead Capture"
- [x] 8.4.1 CREATE `bot/src/types/lead.types.ts`
- [x] 8.4.2 CREATE `backend/database/migrations/20260409000000-add-whatsapp-bot-source.js`
- [x] 8.4.3 UPDATE `bot/.env.example` — `BOT_SYSTEM_USER_ID`

### Implementation
- [x] 8.4.4 CREATE `backend/src/routes/bot-leads.routes.ts`
- [x] 8.4.5 UPDATE `backend/src/routes/bot.routes.ts`
- [x] 8.4.6 CREATE `bot/src/services/lead-persistence.service.js`
- [x] 8.4.7 MODIFY `bot/src/flows/welcome.flow.ts` — captura email + areaOfInterest + saveLead

### Testing & Docs
- [x] 8.4.8 Migración aplicada en DB local
- [x] 8.4.9 Lead persiste con `source = 'whatsapp_bot'` ✅
- [x] 8.4.10 Ruta `/api/crm/leads` no afectada ✅
- [x] 8.4.11 PR mergeado ✅

---

## Batch 8.5 — Onboarding Flow ✅ PR #116 MERGED

### Infrastructure
- [x] 8.5.0 Crear GitHub Issue #115 "[S8/Batch 8.5] Onboarding Flow"
- [x] 8.5.1 CREATE `bot/src/config/keywords.ts` — registry centralizado, tipado, JSDoc bilingüe
- [x] 8.5.2 UPDATE `bot/.env.example` — `FRONTEND_URL`, `GOOGLE_CALENDAR_ID`, `NOTION_DATABASE_ID_VISITS`, `NOTION_DATABASE_ID_LEADS`, `BREVO_HANDOFF_TEMPLATE_ID=1`

### Implementation
- [x] 8.5.3 CREATE `bot/src/flows/onboarding.flow.ts` — `EVENTS.ACTION`, menú bilingüe
- [x] 8.5.4 UPDATE `bot/src/app.ts` — registrar `onboardingFlow` + `COMMISSIONS_KEYWORDS`
- [x] 8.5.5 Refactor flows: balance, network, support, schedule, handoff, properties, tours, language, welcome

### Testing & Docs
- [x] 8.5.6 Smoke test: keywords centralizadas, flows existentes OK
- [x] 8.5.7 `schedule`, `handoff` funcionan tras refactor ✅
- [x] 8.5.8 PR #116 mergeado ✅

---

## Summary Table

| Batch | PR | Estado |
|-------|----|--------|
| 8.1 Knowledge Base | #107 | ✅ MERGED |
| 8.2 n8n Schedule Visit | #110, #112 | ✅ MERGED |
| 8.3 n8n Human Handoff | #111, #112 | ✅ MERGED |
| 8.4 Lead Capture | #114 | ✅ MERGED |
| 8.5 Onboarding Flow | #116 | ✅ MERGED |
| **TOTAL** | **6 PRs** | **✅ SPRINT COMPLETO** |
