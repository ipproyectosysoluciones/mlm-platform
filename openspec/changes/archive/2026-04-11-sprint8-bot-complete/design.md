# Design: Sprint 8 — Bot Completo + n8n Workflows

## Technical Approach

Six incremental PRs transforming the bot from demo to production. Each PR is independently deployable:
1. **8.1** — KB files + ai.service.ts prompt injection (zero runtime deps added)
2. **8.2** — n8n schedule-visit workflow JSON + bot date confirmation step
3. **8.3** — n8n human-handoff workflow JSON + Brevo email notification
4. **8.4** — LeadPersistenceService + new `POST /api/bot/leads` backend route
5. **8.5** — Onboarding flow with state machine + keyword config
6. **8.6** — welcomeFlow integration of lead capture (depends on 8.4)

Existing patterns preserved: ESM throughout `bot/`, `x-bot-secret` auth for bot→backend, `n8nService.postWebhook` for n8n calls, BuilderBot `state`/`flowDynamic` API.

## Architecture Decisions

| Decision | Choice | Alternatives Rejected | Rationale |
|---|---|---|---|
| **KB Loading** | `fs.readFileSync` at import-time in `ai.service.ts`, cache in module-level `const` | (a) Read per-request (b) Redis cache (c) DB-stored prompts | Files < 10KB total. Module-level read = once per process start. No infra needed. Matches existing `loadFile()` pattern already in ai.service.ts L49-57. |
| **Date/Time Parsing** | Bot confirms date in structured steps BEFORE sending to n8n. Webhook receives `preferredDate` as free-text (existing contract). n8n does NOT parse dates. | (a) chrono-node in bot (b) GPT function-call extraction (c) n8n date parser | schedule.flow.ts already sends free-text `preferredDate` (L113). Changing to ISO would break the existing contract. Keep MVP simple — human agent confirms final date via Calendar UI. |
| **Handoff Notification** | Brevo transactional email via n8n HTTP Request node | (a) WhatsApp via Baileys to agent (b) Slack webhook (c) Twilio SMS | Brevo is already in the MLM stack for transactional emails. WhatsApp agent notification requires a separate Baileys session (complex). Email is reliable and auditable. |
| **Lead UserId Attribution** | `BOT_SYSTEM_USER_ID` env var → UUID of a "Bot System" user in the DB | (a) Hardcoded UUID (b) Create user on-the-fly (c) Null userId | Lead model requires `userId` (FK to `users`, NOT NULL). A system user is cleanest — same pattern as "system" actors in CRMs. Config via env = no hardcoded UUIDs. |
| **Lead Creation Route** | New `POST /api/bot/leads` in `bot.routes.ts` (x-bot-secret auth) | (a) Reuse `POST /api/crm/leads` (JWT auth) (b) Direct DB call from bot | CRM route requires `authenticateToken` (JWT). Bot uses `x-bot-secret`. Adding a bot-specific route follows the existing `/api/bot/*` pattern. |
| **Onboarding State** | BuilderBot `state.update()` with `onboardingStep` field (same pattern as `schedulingStep`) | (a) Separate state machine lib (b) Redis session (c) New flow per step | schedule.flow.ts already uses `state.update({ schedulingStep })` pattern (L82, L97). Consistent. No new deps. |
| **Keywords Config** | New file `bot/src/config/keywords.ts` exporting keyword arrays per flow | (a) Hardcoded in each flow file (b) JSON config file (c) DB-stored | Centralized, typed, importable. Matches TypeScript project conventions. Easy to extend. |
| **Lead Source Enum** | Add `'whatsapp_bot'` to backend `LeadSource` type + DB migration | (a) Use existing `'other'` source (b) Use `metadata.source` | Proper source tracking for analytics. Requires ENUM migration but worth it for CRM filtering. |

## Data Flow

### 1. KB Loading (startup)

```
Process Start
    │
    ▼
ai.service.ts (module load)
    │
    ├─ loadFile('base-system-prompt.md')  ──→ prompt_kb/base-system-prompt.md
    ├─ loadFile('knowledge-base.md')       ──→ prompt_kb/knowledge-base.md
    ├─ loadFile('sophia.prompt.md')        ──→ prompt_kb/sophia.prompt.md
    └─ loadFile('max.prompt.md')           ──→ prompt_kb/max.prompt.md
    │
    ▼
buildSystemPrompt(agent, lang, liveCtx)
    │
    ├─ basePrompt.replace('{KNOWLEDGE_BASE}', knowledgeBase)
    ├─ + agentPrompt
    ├─ + langInstruction
    └─ + liveContext (fetched per-request, non-blocking)
    │
    ▼
OpenAI chat.completions.create({ system: composedPrompt })
```

**Note**: `loadFile()` already exists at L49 with try/catch returning `''` on failure. The current code already reads from `PROMPT_KB_DIR` (L38) and calls `loadFile()` inside `buildSystemPrompt()` on EVERY call (L115-117). **Change**: No change to loading strategy needed — the existing pattern already works. We only need to CREATE the 4 markdown files in `bot/src/prompt_kb/`. Optionally optimize to read-once-cache later, but for MVP the files are small and fs is fast.

### 2. Lead Capture in welcomeFlow

```
User ──msg──→ welcomeFlow (STEP 3: AI conversation)
                  │
                  ├─ IF first AI interaction AND no lead captured
                  │     ├─ Extract: phone (ctx.from), userName (state)
                  │     ├─ Extract: areaOfInterest from first AI response context
                  │     └─ ASYNC (non-blocking):
                  │           leadPersistence.createLeadFromBot({
                  │             phone, name, language, areaOfInterest
                  │           })
                  │           │
                  │           ▼
                  │     mlmApi.createBotLead(data)
                  │           │
                  │           ▼
                  │     POST /api/bot/leads ──→ Lead.create()
                  │
                  └─ state.update({ leadCaptured: true })
```

### 3. n8n Schedule-Visit (end-to-end)

```
User ──"agendar visita"──→ schedule.flow.ts
    │
    ├─ Step1: askInterest → capture interest
    ├─ Step2: askDate → capture preferredDate
    ├─ Step3: POST n8n/webhook/schedule-visit
    │              { phone, name, preferredDate, interest, language }
    │
    ▼
n8n Workflow (schedule-visit.json):
    │
    ├─ Webhook Trigger (POST)
    ├─ Notion: Create/Update page in "Visitas" DB
    │     Fields: Name, Phone, Interest, PreferredDate, Status="Pending"
    ├─ Google Calendar: Create event
    │     Title: "Visita: {interest} - {name}"
    │     Date: preferredDate (human agent adjusts manually)
    │     Description: Phone + Interest + Language
    ├─ Respond to Webhook: { success: true }
    │
    ▼
schedule.flow.ts → flowDynamic(success message)
```

### 4. Onboarding Wizard State Transitions

```
User ──"quiero ser afiliado"──→ onboarding.flow.ts
    │
    ▼
┌─────────────────┐    user msg    ┌──────────────┐    user msg
│ INTEREST_CHECK  │ ─────────────→ │ REQUIREMENTS │ ─────────────→
│ "¿Te interesa   │                │ Show reqs &  │
│  el programa?"  │                │ ask confirm  │
└─────────────────┘                └──────────────┘
                                          │ user confirms
                                          ▼
                                   ┌──────────────┐    user msg
                                   │  BENEFITS    │ ─────────────→
                                   │ Show benefits│
                                   │ ask if ready │
                                   └──────────────┘
                                          │ user ready
                                          ▼
                                   ┌──────────────┐
                                   │ DATA_CONFIRM │
                                   │ "Confirmo:   │
                                   │  Name, Phone"│
                                   └──────────────┘
                                          │ user confirms
                                          ▼
                                   ┌─────────────────┐
                                   │ LINK_GENERATION  │
                                   │ Send register    │
                                   │ link + capture   │
                                   │ lead (source:    │
                                   │ whatsapp_bot)    │
                                   └─────────────────┘
                                          │ auto
                                          ▼
                                   ┌────────────────────┐
                                   │ FOLLOWUP_SCHEDULED │
                                   │ "Te contactamos    │
                                   │  en 48h" → END     │
                                   └────────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `bot/src/prompt_kb/base-system-prompt.md` | Create | Base prompt with `{KNOWLEDGE_BASE}` placeholder. Nexo Real context, rules, tone. Max ~500 tokens. |
| `bot/src/prompt_kb/knowledge-base.md` | Create | Business KB: services, pricing, locations, policies. Max ~800 tokens. |
| `bot/src/prompt_kb/sophia.prompt.md` | Create | Sophia personality: warm, empathetic female advisor. ~150 tokens. |
| `bot/src/prompt_kb/max.prompt.md` | Create | Max personality: professional, direct male advisor. ~150 tokens. |
| `bot/n8n/workflows/schedule-visit.json` | Create | n8n workflow: Webhook → Notion → Google Calendar → Respond |
| `bot/n8n/workflows/human-handoff.json` | Create | n8n workflow: Webhook → Notion → Brevo Email → Respond |
| `bot/src/services/lead-persistence.service.ts` | Create | `createLeadFromBot(data: BotLeadData)` — async, non-blocking via mlmApi |
| `bot/src/services/mlm-api.service.ts` | Modify | Add `createBotLead(data)` method → `POST /api/bot/leads` |
| `bot/src/flows/onboarding.flow.ts` | Create | 6-step state machine: INTEREST → REQUIREMENTS → BENEFITS → DATA_CONFIRM → LINK → FOLLOWUP |
| `bot/src/flows/welcome.flow.ts` | Modify | After first AI response, fire `leadPersistence.createLeadFromBot()` async. Add `leadCaptured` state check. |
| `bot/src/config/keywords.ts` | Create | Centralized keyword arrays: `ONBOARDING_KEYWORDS`, `SCHEDULE_KEYWORDS`, `HANDOFF_KEYWORDS` |
| `bot/src/flows/schedule.flow.ts` | Modify | Import keywords from `config/keywords.ts` instead of local const |
| `bot/src/flows/handoff.flow.ts` | Modify | Import keywords from `config/keywords.ts` instead of local const |
| `backend/src/routes/bot.routes.ts` | Modify | Add `POST /bot/leads` route with `createBotLead` handler |
| `backend/src/controllers/BotController.ts` | Modify | Add `createBotLead` function (validate + Lead.create) |
| `backend/src/models/Lead.ts` | Modify | Add `'whatsapp_bot'` to `LeadSource` enum type |
| `backend/src/migrations/XXXX-add-whatsapp-bot-source.ts` | Create | `ALTER TYPE lead_source ADD VALUE 'whatsapp_bot'` |
| `bot/.env.example` | Modify | Add `BOT_SYSTEM_USER_ID`, `FRONTEND_URL` |

## Interfaces / Contracts

```typescript
// bot/src/services/lead-persistence.service.ts
export interface BotLeadData {
  phone: string;
  name: string;
  email?: string;
  areaOfInterest: string;
  language: 'es' | 'en';
  source?: 'whatsapp_bot';
}

// bot/src/config/keywords.ts
export const ONBOARDING_KEYWORDS: [string, ...string[]];
export const SCHEDULE_KEYWORDS: [string, ...string[]];
export const HANDOFF_KEYWORDS: [string, ...string[]];

// bot/src/flows/onboarding.flow.ts
export type OnboardingStep =
  | 'interest_check'
  | 'requirements'
  | 'benefits'
  | 'data_confirm'
  | 'link_generation'
  | 'followup_scheduled';

// POST /api/bot/leads — request body
interface CreateBotLeadBody {
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  source: 'whatsapp_bot';
  notes?: string;
  metadata?: {
    areaOfInterest: string;
    language: string;
    onboardingCompleted?: boolean;
    capturedAt: string;
  };
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `buildSystemPrompt()` — KB placeholder injection | Mock `fs.readFileSync`, verify `{KNOWLEDGE_BASE}` replaced. Jest/vitest. |
| Unit | `leadPersistence.createLeadFromBot()` — maps BotLeadData → API call | Mock `mlmApi.createBotLead`, verify payload shape. |
| Unit | `onboarding.flow.ts` — state transitions | Mock `state`/`flowDynamic`, walk through each step. Verify state updates. |
| Unit | Keywords config — all arrays are non-empty `[string, ...string[]]` | Simple assertion test. |
| Integration | `POST /api/bot/leads` — creates lead with correct source | Supertest + test DB. Verify `source: 'whatsapp_bot'`, `userId: BOT_SYSTEM_USER_ID`. |
| Integration | n8n workflow JSONs — valid structure | JSON schema validation (webhook trigger present, required nodes exist). |
| Manual/E2E | Full onboarding wizard in WhatsApp sandbox | Human QA: trigger keywords → walk through 6 steps → verify lead in DB + registration link. |

## Migration / Rollout

1. **DB Migration first** (8.4 backend PR): Add `'whatsapp_bot'` to `LeadSource` ENUM. Non-breaking — existing data untouched.
2. **Create system bot user**: Manual step — `INSERT INTO users` with known UUID, set in `BOT_SYSTEM_USER_ID` env. Document in PR.
3. **KB files** (8.1): Deploy bot with prompt_kb/ files. If files missing, existing `loadFile()` fallback returns `''` — graceful degradation.
4. **n8n workflows** (8.2, 8.3): Import JSON via n8n UI. Requires Notion + Google Calendar + Brevo credentials configured in n8n.
5. **Feature order**: 8.1 → 8.4 (backend) → 8.2 → 8.3 → 8.5 → 8.6. Each independently deployable except 8.6 depends on 8.4.

## Open Questions

- [ ] **Notion database IDs**: Need workspace DB IDs for "Visitas" and "Leads" databases in n8n workflows. Who provides?
- [ ] **Brevo template ID**: Which Brevo transactional template for handoff notifications? Or create new one?
- [ ] **BOT_SYSTEM_USER_ID**: Should we create the system user via migration (automated) or manual seed? If migration, need to coordinate UUID across envs.
- [ ] **Google Calendar**: Which calendar ID? Shared team calendar or per-agent calendars?
- [ ] **`whatsapp_bot` source migration**: PostgreSQL `ALTER TYPE ... ADD VALUE` is not transactional. Confirm this is acceptable for the deploy pipeline.
