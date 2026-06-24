# Proposal: Sprint 8 — Bot Completo + n8n Workflows

## Intent

Nexo Bot (v2.3.5) tiene 11 flows operativos pero carece de: (1) Knowledge Base para alimentar GPT-4o con datos reales del negocio, (2) workflows n8n que ejecuten las acciones disparadas por `scheduleFlow` y `handoffFlow`, (3) captura completa de leads desde WhatsApp, y (4) flujo de onboarding para nuevos afiliados. Sin estos componentes el bot responde con contexto vacío, los webhooks no tienen receptor, y los leads se pierden. Sprint 8 cierra estas brechas llevando al bot a estado production-ready.

## Scope

### In Scope
- **8.1** Knowledge Base: crear `bot/src/prompt_kb/` con 4 archivos (base-system-prompt, knowledge-base, sophia.prompt, max.prompt)
- **8.2** n8n workflow `schedule-visit`: webhook -> Google Calendar + Notion CRM
- **8.3** n8n workflow `human-handoff`: webhook -> Notion CRM + notificación agente
- **8.4** Lead Capture: extender `welcomeFlow` (email + área de interés) + `LeadPersistenceService` -> `POST /api/crm/leads`
- **8.5** Onboarding Flow: crear `bot/src/flows/onboarding.flow.ts` (wizard afiliación, keywords, link de registro)

### Out of Scope
- Tests del bot (sin infraestructura de testing; deferred)
- SLA tracking / escalation timers en handoff
- Persistencia de sesiones WhatsApp en DB (MemoryDB es limitación conocida)
- Objection handling avanzado (batch 8.6 — opcional, no incluido en MVP)
- Multi-tenant KB (planes Starter/Managed/Enterprise — Fase 2)
- Notion schema migration tooling

## Capabilities

### New Capabilities
- `bot-knowledge-base`: Sistema de KB privada bilingüe (ES/EN) con inyección en system prompt GPT-4o, personalidades Sophia/Max, y placeholder `{KNOWLEDGE_BASE}`
- `n8n-schedule-visit`: Workflow n8n que recibe webhook del bot, crea evento Google Calendar, y registra lead en Notion CRM
- `n8n-human-handoff`: Workflow n8n que recibe webhook de escalación, crea registro en Notion CRM, y notifica al agente humano asignado
- `bot-lead-capture`: Servicio de persistencia que captura datos del lead (nombre, email, teléfono, área de interés) desde welcomeFlow y los envía al backend CRM
- `bot-onboarding-flow`: Flujo conversacional de onboarding para afiliados potenciales (wizard multi-step: interés -> requisitos -> datos -> link registro)

### Modified Capabilities
- `bot` (spec existente `openspec/specs/bot/spec.md`): welcomeFlow se extiende con captura de email y área de interés (REQ-BOT-010/011 impactados); ai.service.ts ahora carga KB real en lugar de string vacío

## Approach

**Secuencial por batch** con PRs independientes `feature/sprint8-8.X` -> `development`:

1. **KB primero** (8.1) — Desbloquea el contexto de GPT-4o. Archivos `.md` en `prompt_kb/` (gitignored). `ai.service.ts` ya tiene `loadFile()` que retorna empty string si no existen.
2. **Lead capture** (8.4) — Nuevo `LeadPersistenceService` en `bot/src/services/`. Extiende `welcomeFlow` con 2 steps adicionales (email, areaOfInterest). Usa endpoint existente `POST /api/crm/leads`.
3. **Backend CRM validation** (8.4b) — Validación de campos nuevos si es necesaria en el endpoint existente.
4. **n8n schedule-visit** (8.2) — JSON workflow exportado. Nodos: Webhook Trigger -> Date Parser (date-fns) -> Google Calendar (OAuth2) -> Notion Create Page.
5. **n8n human-handoff** (8.3) — JSON workflow. Nodos: Webhook Trigger -> Notion Create Page (CRM) -> Slack/Email notification al agente.
6. **Onboarding** (8.5) — Nuevo flow con keywords `ONBOARDING_KEYWORDS`. Multi-step wizard: confirmar interés -> verificar requisitos -> recopilar datos -> generar link de registro (lógica ya existe en backend).

**Lead attribution**: Bot-generated leads usarán `source: "whatsapp-bot"` y `userId: null` (asignación manual posterior por admin).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `bot/src/prompt_kb/` | New | 4 archivos KB: base-system-prompt.md, knowledge-base.md, sophia.prompt.md, max.prompt.md |
| `bot/src/services/lead-persistence.service.ts` | New | Servicio HTTP para persistir leads vía API backend |
| `bot/src/flows/onboarding.flow.ts` | New | Flujo conversacional de onboarding afiliados |
| `bot/src/flows/welcome.flow.ts` | Modified | +2 steps: email capture + área de interés |
| `bot/src/services/ai.service.ts` | Modified | KB injection ahora carga archivos reales en lugar de empty string |
| `n8n/workflows/schedule-visit.json` | New | Workflow n8n: webhook -> Google Calendar -> Notion |
| `n8n/workflows/human-handoff.json` | New | Workflow n8n: webhook -> Notion CRM -> notificación agente |
| `backend/src/routes/crm.routes.ts` | Modified | Validación adicional para campos bot-originated leads |
| `.gitignore` | Modified | Asegurar `bot/src/prompt_kb/*.md` está excluido |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| KB token bloat (>2000 tokens comprimen contexto GPT-4o) | Med | Limitar KB a ~1500 tokens; secciones colapsables con headers; medir con tiktoken antes de merge |
| Date/time parsing en texto libre para schedule-visit | High | Paso de confirmación obligatorio en scheduleFlow antes de enviar webhook; formato explícito en prompt |
| Notion schema sin definir (CRM database) | Med | Definir schema mínimo en design doc: Name, Phone, Email, Source, Status, Agent, CreatedAt |
| Lead attribution (userId null para bot leads) | Low | Campo `source: "whatsapp-bot"` + asignación manual en CRM; fase futura auto-assign |
| Multi-language KB (ES + EN en un archivo o separados) | Low | Un solo archivo bilingüe con secciones `## ES` / `## EN`; reduce mantenimiento |
| Google Calendar OAuth2 token expiry en n8n | Med | Configurar refresh token; documentar proceso de re-auth en runbook |
| n8n downtime durante agendamiento | Med | Bot ya tiene manejo de error en scheduleFlow (Scenario 6-B); n8n health check periódico |

## Rollback Plan

- **KB (8.1)**: Eliminar archivos de `prompt_kb/`; `ai.service.ts` vuelve a empty string (comportamiento actual).
- **Lead capture (8.4)**: Revertir PR; welcomeFlow vuelve a capturar solo idioma+nombre+agente.
- **n8n workflows (8.2, 8.3)**: Desactivar workflows en n8n dashboard; webhooks del bot retornan 404 y manejan error existente (Scenario 6-B, 5-B).
- **Onboarding (8.5)**: Eliminar `onboarding.flow.ts` y quitar del registro de flows; keywords quedan sin handler (fallback a IA).
- **General**: Cada batch es un PR independiente. Revert quirúrgico via `git revert <merge-commit>` en `development`.

## Dependencies

- **Google Calendar API**: OAuth2 credentials configuradas en n8n (Service Account o OAuth consent screen)
- **Notion API**: Integration token con permisos de escritura en base de datos CRM
- **n8n**: Instancia Docker local operativa (`docker-compose.dev.yml`)
- **Backend API**: `POST /api/crm/leads` endpoint operativo (ya existe desde Sprint 5)
- **Backend API**: Lógica de generación de link de registro para onboarding (verificar existencia)

## Success Criteria

- [ ] GPT-4o responde preguntas sobre Nexo Real usando KB real (no respuestas genéricas/vacías)
- [ ] Sophia y Max tienen personalidades diferenciadas en sus respuestas
- [ ] `welcomeFlow` captura email + área de interés y el lead aparece en `POST /api/crm/leads`
- [ ] Agendar visita desde WhatsApp crea evento en Google Calendar via n8n
- [ ] Escalación humana desde WhatsApp crea registro en Notion CRM y notifica agente
- [ ] Onboarding flow guía al usuario hasta generar link de registro
- [ ] KB total < 1500 tokens (medido con tiktoken)
- [ ] Todos los PRs mergeados a `development` sin conflictos
- [ ] Bot mantiene manejo de errores existente (n8n down, API down)
- [ ] Swagger actualizado con cambios al endpoint de leads
