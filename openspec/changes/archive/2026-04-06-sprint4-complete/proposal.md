# Proposal: Sprint 4 — Nexo Bot MVP + Backend Hardening + v2.0.0

## Intent

Sprint 3 completó el nucleo de la plataforma Nexo Real (leaderboard, achievements, MLM engine
completo). Sprint 4 extiende la plataforma en tres dimensiones:

1. **Nexo Bot (WhatsApp)** — Canal de atención y conversión 24/7 con IA, integrado a n8n para
   automatizar agenda de visitas y escalación a agentes humanos.
2. **Backend Hardening** — Endpoints de achievements, leaderboard y bot que faltaban, más las
   asociaciones de modelos Achievement/Badge/UserAchievement.
3. **Cobertura de tests** — Elevar el frontend de 155 a 210 tests cubriendo los componentes de
   leaderboard y achievements de Sprint 3.

El resultado es un release mayor: **v2.0.0**.

## Scope

### In Scope

**Nexo Bot (WhatsApp)**
- Bootstrap con BuilderBot + Baileys (WhatsApp Web API, sin número oficial requerido)
- Flujos conversacionales: bienvenida, balance de wallet, red MLM, soporte, agenda, escalación, idioma
- Agentes IA GPT-4o: Sophia (español, atiende hombres) y Max (inglés, atiende mujeres)
- Detección automática de idioma al inicio de conversación
- Sesión persistente por 3 horas (experimentalStore=true, timeRelease=10800000)
- Integración con API REST del backend (saldo, red, comisiones)
- Automatización n8n: agendar visita → Google Calendar + Notion CRM
- Automatización n8n: escalación humana → Notion CRM + notificación agente
- Auth bot via `x-bot-secret` header
- Dockerizado, puerto 3002
- Documentación completa en `docs/N8N-SETUP.md`

**Backend Additions**
- Endpoints `/api/achievements` y `/api/leaderboard` (faltaban desde Sprint 3)
- Endpoints `/api/bot` para notificaciones proactivas del bot
- Middleware de autenticación específico para bot (`x-bot-secret`)
- Asociaciones Achievement → Badge → UserAchievement en `models/index.ts`

**Frontend Tests**
- Tests unitarios para componentes `Podium`, `RankingTable`, `UserRankBanner` (leaderboard)
- Tests unitarios para `AchievementsPage`
- Ampliación de `services.test.ts` (+9 tests de servicios)
- Fix de Vitest 4: `singleFork: true` en `vitest.config.ts`
- Resultado: 155 → 210 tests (✅ todos pasando)

**Architecture & Release**
- `docs/ARCHITECTURE.md` actualizado con sección Sprint 4, bumped a v2.0.0
- Merge `development → main`
- Tag `v2.0.0` y GitHub Release publicado

### Out of Scope

- Número oficial de WhatsApp Business API (se usa Baileys/Web)
- Multi-tenancy del bot (Fase 2: planes Starter/Managed/Enterprise)
- Pagos via bot
- Tests E2E para el bot (requiere WhatsApp sandbox)
- Deployment a cloud de n8n (actualmente Docker local)

## Approach

### Arquitectura del Bot

```
WhatsApp (usuario)
      ↓
BuilderBot + Baileys (bot/src/app.ts, puerto 3002)
      ├── Flujos temáticos (welcome, balance, network, support, schedule, handoff, language)
      ├── Agente IA fallback (agent.flow.ts → GPT-4o)
      │       └── ai.service.ts — OpenAI SDK
      ├── mlm-api.service.ts — REST calls al backend
      └── n8n.service.ts — webhooks a n8n
              ├── /webhook/schedule-visit → Google Calendar + Notion CRM
              └── /webhook/human-handoff → Notion CRM + notificación agente
```

### Stack de Automatización

- **n8n** corre en Docker en la misma red `mlm-network`
- **Google Calendar** para citas de visitas a propiedades
- **Notion CRM** para leads y escalaciones
- Auth entre bot y n8n: secreto compartido en variables de entorno

### Backend Pattern

Sigue los patrones establecidos del proyecto:
- Controller → Service → Model (Sequelize)
- Middleware de auth específico para bot (no JWT, sino `x-bot-secret`)
- Routes registradas en `routes/index.ts`

## Affected Areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `bot/` | Nuevo | Directorio completo del Nexo Bot |
| `backend/src/routes/` | Nuevo | achievement.routes.ts, leaderboard.routes.ts, bot.routes.ts |
| `backend/src/controllers/` | Nuevo | BotController.ts |
| `backend/src/middleware/` | Nuevo | bot.middleware.ts |
| `backend/src/models/index.ts` | Modificado | Asociaciones Achievement/Badge/UserAchievement |
| `frontend/src/components/leaderboard/__tests__/` | Nuevo | Podium, RankingTable, UserRankBanner tests |
| `frontend/src/pages/__tests__/` | Nuevo | AchievementsPage tests |
| `frontend/src/__tests__/services.test.ts` | Modificado | +9 tests de servicios |
| `frontend/vitest.config.ts` | Modificado | singleFork: true |
| `docs/` | Modificado | ARCHITECTURE.md + N8N-SETUP.md |

## Risks

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Baileys desconexión de WhatsApp Web | Media | experimentalStore + timeRelease=3h |
| GPT-4o hallucinations | Media | KB privada como única fuente de verdad; bot MUST never invent |
| n8n webhook autenticación | Baja | Secret compartido en env vars, no expuesto en código |
| Baileys ban de número en pruebas | Baja | Usar número de prueba dedicado, no el de producción |

## Rollback Plan

1. **Bot**: `docker compose stop nexo-bot` — no afecta la plataforma web
2. **Backend routes**: Remover imports de achievement/leaderboard/bot routes de `routes/index.ts`
3. **Models index**: Revertir commit de asociaciones con `git revert`
4. **Frontend tests**: Solo afectan CI, no el producto en producción
5. **Tag v2.0.0**: No destructivo — el tag queda como referencia histórica

## Dependencies

- OpenAI API Key (`OPENAI_API_KEY`) para GPT-4o
- n8n instance (Docker) con webhooks configurados
- Google Calendar OAuth credentials en n8n
- Notion API token en n8n
- `BOT_SECRET` compartido entre bot y backend

## Success Criteria

- [x] Bot responde en WhatsApp: menú principal, balance, red, soporte
- [x] Agendamiento de visita crea evento en Google Calendar via n8n
- [x] Escalación humana crea registro en Notion CRM via n8n
- [x] GPT-4o responde solo con información de la KB
- [x] Idioma ES/EN se detecta y mantiene por sesión
- [x] Backend: `GET /api/achievements` y `GET /api/leaderboard` responden 200
- [x] Backend: `POST /api/bot/notify` protegido con x-bot-secret
- [x] Frontend: 210 tests pasando (de 155 en Sprint 3)
- [x] Tag v2.0.0 en main con GitHub Release

---

**Change**: sprint4-complete
**Branch**: development → main
**Mode**: openspec
**Registrado retroactivamente**: 2026-04-06
