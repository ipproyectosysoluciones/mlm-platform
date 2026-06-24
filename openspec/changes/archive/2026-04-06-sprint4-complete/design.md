# Design: Sprint 4 — Nexo Bot MVP + Backend Hardening + v2.0.0

## Technical Approach

Sprint 4 agrega un nuevo servicio autónomo (Nexo Bot) al monorepo, hardening del backend con rutas
faltantes de Sprint 3, y cobertura de tests del frontend. La estrategia central es:

1. **Bot como microservicio independiente** — Vive en `bot/` con su propio `package.json`,
   `Dockerfile` y runtime. No interfiere con el monorepo pnpm de la plataforma core.
2. **Comunicación bot ↔ backend via REST** — El bot es un cliente HTTP del backend, sin acceso
   directo a la base de datos.
3. **Automatización via n8n** — Flujos complejos (Google Calendar, Notion) delegados a n8n para
   mantener el bot simple.
4. **Backend pattern consistency** — Las rutas nuevas siguen exactamente el mismo patrón
   Controller → Service → Model establecido en Sprints 1-3.

---

## Architecture Decisions

### Decision: BuilderBot + Baileys (no WhatsApp Business API oficial)

**Choice**: BuilderBot como framework de flujos + Baileys como provider de WhatsApp Web
**Alternatives considered**:
- WhatsApp Business Cloud API (Meta) — requiere número verificado, review de 2-6 semanas, costo
- Twilio WhatsApp — costo por mensaje, complejidad de setup
- WPPConnect — más bajo nivel, menos abstracción
**Rationale**: BuilderBot ofrece la abstracción perfecta (flujos declarativos) y Baileys funciona
con cualquier número desde el primer día. Ideal para MVP. La migración a API oficial es posible
cambiando solo el provider en `app.ts` (una línea).

### Decision: CommonJS para el bot (no ESM)

**Choice**: `bot/` usa `"type": "commonjs"` en `package.json`
**Alternatives considered**: ESM como el resto del monorepo
**Rationale**: Baileys y BuilderBot tienen compatibilidad más robusta con CJS. Varios providers
de BuilderBot usan `require()` internamente. El config del proyecto (`openspec/config.yaml`)
establece: *"Bot code MUST be CommonJS only (not ESM)"*.

### Decision: n8n como hub de automatización (no integrar directamente)

**Choice**: El bot llama a n8n via webhook; n8n maneja Google Calendar y Notion
**Alternatives considered**:
- Integrar Google Calendar API directamente en el bot — más dependencias, más código
- Integrar Notion API directamente en el bot — idem
**Rationale**: n8n desacopla las integraciones externas del bot. Si cambia la API de Google o
Notion, solo se actualiza el workflow de n8n, no el código del bot. Además, n8n permite probar y
debuggear los workflows sin deployar el bot.

### Decision: Dos agentes IA con personalidades distintas

**Choice**: Sophia (ES, femenina) para usuarios masculinos + Max (EN, masculino) para femeninos
**Alternatives considered**: Un solo agente neutro
**Rationale**: La estrategia de ventas del producto Nexo Real apunta a un mercado LATAM donde la
conexión emocional con el agente aumenta conversión. Los prompts privados en `prompt_kb/` definen
cada personalidad. El idioma detectado al inicio determina qué agente se activa.

### Decision: x-bot-secret (no JWT) para autenticación bot ↔ backend

**Choice**: Header `x-bot-secret` con secreto compartido en env vars
**Alternatives considered**: JWT con service account, mTLS
**Rationale**: El bot es un servicio interno en la misma red Docker (`mlm-network`). Un secreto
compartido es suficiente para MVP. No necesita rotación frecuente ni refresh tokens.

### Decision: experimentalStore=true + timeRelease=10800000

**Choice**: Sesión de WhatsApp persiste 3 horas con almacenamiento experimental de BuilderBot
**Alternatives considered**: Redis para persistencia de sesión
**Rationale**: Para MVP, el store experimental de BuilderBot es suficiente. Mantiene el estado de
conversación durante 3 horas, cubriendo el caso de uso típico de un lead calificado. Redis queda
como mejora para producción multi-instancia.

### Decision: singleFork: true en Vitest 4

**Choice**: Agregar `singleFork: true` en `vitest.config.ts`
**Alternatives considered**: `threads: false`, downgrade de Vitest
**Rationale**: Vitest 4 cambió el comportamiento de isolation de workers. En el proyecto,
los tests de componentes React con JSDOM y Zustand stores tenían race conditions en múltiples
forks. `singleFork: true` resuelve esto sin sacrificar performance significativamente
(210 tests pasan en tiempo aceptable).

---

## Architecture Diagram

```
┌─────────────────────────────── mlm-network (Docker) ──────────────────────────────┐
│                                                                                     │
│  ┌──────────────────────────────────────┐                                          │
│  │           Nexo Bot                   │                                          │
│  │  bot/src/app.ts (puerto 3002)        │                                          │
│  │                                      │                                          │
│  │  Flows:                              │                                          │
│  │  ├── welcome.flow.ts                 │  HTTP REST        ┌─────────────────┐   │
│  │  ├── balance.flow.ts  ──────────────────────────────────▶│  Backend        │   │
│  │  ├── network.flow.ts  ──────────────────────────────────▶│  (Express 5)    │   │
│  │  ├── support.flow.ts                 │  x-bot-secret ◀───│  puerto 3001    │   │
│  │  ├── schedule.flow.ts                │                   └─────────────────┘   │
│  │  ├── handoff.flow.ts  ──────┐        │                                          │
│  │  ├── language.flow.ts       │        │                                          │
│  │  └── agent.flow.ts          │        │  HTTP Webhooks    ┌─────────────────┐   │
│  │       └── ai.service.ts     └────────────────────────────▶  n8n             │   │
│  │           (GPT-4o: Sophia/Max)       │                   │  puerto 5678    │   │
│  └──────────────────────────────────────┘                   │                 │   │
│                                                              │  ┌───────────┐  │   │
│                                                              │  │G.Calendar │  │   │
│                                                              │  ├───────────┤  │   │
│                                                              │  │Notion CRM │  │   │
│                                                              │  └───────────┘  │   │
│                                                              └─────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

WhatsApp (usuario móvil)
        ↕ Baileys (WhatsApp Web protocol)
[Nexo Bot]
```

---

## Conversation Flow

```
Usuario: Primer mensaje
        ↓
[language.flow] — detecta idioma (ES/EN)
        ↓
[welcome.flow] — muestra menú principal
        ↓
Usuario elige opción
        ├── "1" → [balance.flow] → mlm-api.service → GET /api/wallets/:userId
        ├── "2" → [network.flow] → mlm-api.service → GET /api/network/:userId
        ├── "3" → [support.flow] → FAQ desde KB, opción escalación
        ├── "4" → [schedule.flow] → recolecta datos → n8n.service → /webhook/schedule-visit
        ├── "5" → [language.flow] → cambia idioma
        └── No match → [agent.flow] → ai.service → GPT-4o (Sophia/Max)
                                ├── system prompt = base-prompt + KB privada
                                └── responde basado SOLO en KB
                                        └── si no sabe → [handoff.flow] → n8n → Notion
```

---

## File Structure

### Bot (`bot/`)

| Archivo | Descripción |
|---------|-------------|
| `bot/src/app.ts` | Bootstrap: BaileysProvider, HttpServer, flujos registrados, puerto 3002 |
| `bot/src/flows/welcome.flow.ts` | Saludo + menú principal (ES/EN) |
| `bot/src/flows/balance.flow.ts` | Consulta saldo wallet |
| `bot/src/flows/network.flow.ts` | Consulta red MLM y comisiones |
| `bot/src/flows/support.flow.ts` | FAQ + opción de escalación |
| `bot/src/flows/schedule.flow.ts` | Recolección de datos para visita → n8n |
| `bot/src/flows/handoff.flow.ts` | Escalación a agente humano → n8n |
| `bot/src/flows/language.flow.ts` | Detección y cambio de idioma ES/EN |
| `bot/src/flows/agent.flow.ts` | Fallback GPT-4o (Sophia ES / Max EN) |
| `bot/src/services/ai.service.ts` | Cliente OpenAI SDK, GPT-4o, carga prompts privados |
| `bot/src/services/mlm-api.service.ts` | HTTP client (axios) al backend REST |
| `bot/src/services/n8n.service.ts` | HTTP client (axios) para webhooks n8n |
| `bot/Dockerfile` | Build Docker, Node 20 LTS, CommonJS |
| `bot/package.json` | Deps: @builderbot/bot, @builderbot/provider-baileys, openai, axios |

### Backend (nuevas adiciones)

| Archivo | Descripción |
|---------|-------------|
| `backend/src/routes/achievement.routes.ts` | GET /achievements, GET /achievements/:userId |
| `backend/src/routes/leaderboard.routes.ts` | GET /leaderboard (paginado) |
| `backend/src/routes/bot.routes.ts` | POST /bot/notify, GET /bot/status |
| `backend/src/controllers/BotController.ts` | Handler notificaciones proactivas del bot |
| `backend/src/middleware/bot.middleware.ts` | Validación x-bot-secret |
| `backend/src/models/index.ts` | Achievement hasMany UserAchievement, Badge associations |

### Frontend (nuevos tests)

| Archivo | Tests |
|---------|-------|
| `frontend/src/components/leaderboard/__tests__/Podium.test.tsx` | 12 tests |
| `frontend/src/components/leaderboard/__tests__/RankingTable.test.tsx` | 12 tests |
| `frontend/src/components/leaderboard/__tests__/UserRankBanner.test.tsx` | 8 tests |
| `frontend/src/pages/__tests__/AchievementsPage.test.tsx` | 12 tests |
| `frontend/src/__tests__/services.test.ts` | +9 tests (total ampliado) |
| `frontend/vitest.config.ts` | singleFork: true |

---

## n8n Webhook Contracts

### POST /webhook/schedule-visit

```typescript
interface ScheduleVisitPayload {
  name: string;
  email: string;
  phone: string;           // número WhatsApp del usuario
  property: string;        // nombre/ID de la propiedad de interés
  preferredDate: string;   // ISO 8601
  preferredTime: string;   // HH:MM
  notes?: string;
}
```

**n8n Actions**:
1. Crear evento en Google Calendar con título "Visita: {property}" + datos del lead
2. Crear/actualizar lead en Notion CRM con status "Nueva visita"
3. Retornar confirmación al bot

### POST /webhook/human-handoff

```typescript
interface HumanHandoffPayload {
  whatsappId: string;    // número WhatsApp del usuario
  userId?: string;       // ID en el sistema si está logueado
  reason: string;        // motivo de escalación
  summary: string;       // últimos N mensajes de la conversación
  language: 'es' | 'en';
}
```

**n8n Actions**:
1. Crear registro en Notion CRM con status "Escalado - Requiere humano"
2. Notificar al agente asignado (email o Slack)
3. Retornar ACK al bot

---

## Bot Auth with Backend

```
Bot → POST /api/bot/notify
      Headers: { "x-bot-secret": process.env.BOT_SECRET }
      Body: { userId, message, type }

Backend bot.middleware.ts:
  const secret = req.headers['x-bot-secret']
  if (secret !== process.env.BOT_SECRET) → 401 Unauthorized
  next()
```

---

## Environment Variables (New in Sprint 4)

```env
# Bot (bot/.env)
OPENAI_API_KEY=sk-...
BOT_SECRET=your-shared-secret
BACKEND_URL=http://backend:3001
N8N_WEBHOOK_URL=http://n8n:5678

# Backend (.env)
BOT_SECRET=your-shared-secret   # same secret

# n8n (environment)
GOOGLE_CALENDAR_ID=your@calendar.com
NOTION_API_TOKEN=secret_...
NOTION_DATABASE_ID=...
```

---

## Testing Strategy

| Capa | Qué se testea | Herramienta |
|------|--------------|-------------|
| Unit (backend) | achievement routes, leaderboard routes, bot middleware | Jest + supertest |
| Unit (frontend) | Podium, RankingTable, UserRankBanner, AchievementsPage | Vitest + @testing-library/react |
| Integration | services.test.ts (achievements + leaderboard services) | Vitest |
| Manual | Flujos del bot en WhatsApp | WhatsApp test number |

*No E2E automatizados para el bot — requiere WhatsApp sandbox que no está disponible en CI.*

---

**Design created**: 2026-04-06 (retroactivo)
**Change**: sprint4-complete
**Mode**: openspec
