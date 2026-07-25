# Design: Configurable Environment Substitutes

## Technical Approach

Four coordinated changes: (1) new `platform.ts` config module, (2) string-substitution pass in `ai.service.ts` before KB injection, (3) replace 16 hardcoded URLs across 6 flow files, (4) update e2e assertions + `.env.example`. No runtime env reload, no new dependencies.

## Architecture Decisions

| Option | Tradeoffs | Decision |
|--------|-----------|----------|
| `platformUrl()` vs inline `process.env` reads | Helper ensures consistent trailing-slash handling + single import | `platformUrl(path?)` 
| Substitution in `buildSystemPrompt()` vs separate pipeline | KB already loaded there; avoids new hook points | Inject after `loadFile()`, before `basePrompt.replace()`
| Legacy placeholder support | Simplifies transition; tiny code cost | Map old names (e.g. `EMAIL_NEXO_REAL`) to new in same substitution pass |
| `.js` vs `.ts` imports | Project uses ESM with `.js` extensions in imports | `from '../config/platform.js'` |

## Data Flow

```
.env (PLATFORM_URL, EMAIL, ...)
       │
       ▼
bot/src/config/platform.ts  ─── exports: platformUrl(), EMAIL, ...
       │
       ├── ai.service.ts: substituteEnvVars(KB) ──► system prompt
       │
       └── 6 flows: balance, network, support,     ──► flowDynamic()
                   reservations, properties, tours
```

**Substitution flow** (in `ai.service.ts`):
```
loadFile('knowledge-base.md')
    │
    ▼
substituteEnvVars(kb)    ← replaces [PLATFORM_URL] → platformUrl(),
    │                        [EMAIL] → EMAIL, etc. + legacy aliases
    ▼
basePrompt.replace('{KNOWLEDGE_BASE}', substitutedKb)
    │
    ▼
+ agentPrompt + langInstruction + liveContext
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `bot/src/config/platform.ts` | **Create** | `platformUrl(path?)` helper + exported env constants |
| `bot/src/services/ai.service.ts` | **Modify** | Add `substituteEnvVars()` call in `buildSystemPrompt()` |
| `bot/src/prompt_kb/knowledge-base.md` | **Modify** | Rename `[EMAIL_NEXO_REAL]`→`[EMAIL]`, `[WEB_NEXO_REAL]`→`[PLATFORM_URL]`, `[DIRECCION_NEXO_REAL]`/`[ADDRESS_NEXO_REAL]`→`[OFFICE_ADDRESS]`; keep `[CALENDLY_LINK]` |
| `bot/src/flows/balance.flow.ts` | **Modify** | 2 URLs → `platformUrl('/register')` + `platformUrl()` |
| `bot/src/flows/network.flow.ts` | **Modify** | 2 URLs → `platformUrl('/register')` + `platformUrl('/tree')` |
| `bot/src/flows/support.flow.ts` | **Modify** | 1 URL → `platformUrl()` |
| `bot/src/flows/reservations.flow.ts` | **Modify** | 3 URLs → `platformUrl('/register')`, `platformUrl()`, `platformUrl('/reservations')` |
| `bot/src/flows/properties.flow.ts` | **Modify** | 4 URLs → `platformUrl('/properties')` |
| `bot/src/flows/tours.flow.ts` | **Modify** | 4 URLs → `platformUrl('/tours')` |
| `bot/src/__tests__/e2e/network.flow.test.ts` | **Modify** | Assert `nexoreal.xyz` (default still works) |
| `bot/src/__tests__/e2e/support.flow.test.ts` | **Modify** | Assert `nexoreal.xyz` (default still works) |
| `bot/.env.example` | **Modify** | Add `PLATFORM_URL`, `EMAIL`, `CALENDLY_LINK`, `OFFICE_ADDRESS` |

## Interfaces / Contracts

```typescript
// bot/src/config/platform.ts
export function platformUrl(path?: string): string;
export const PLATFORM_URL: string;      // default: 'https://nexoreal.xyz'
export const EMAIL: string;             // default: ''
export const CALENDLY_LINK: string;     // default: ''
export const OFFICE_ADDRESS: string;    // default: ''
```

```typescript
// bot/src/services/ai.service.ts — new function
function substituteEnvVars(kb: string): string;
  // Replaces: [PLATFORM_URL], [EMAIL], [CALENDLY_LINK], [OFFICE_ADDRESS]
  // Legacy: [WEB_NEXO_REAL] → PLATFORM_URL, [EMAIL_NEXO_REAL] → EMAIL,
  //          [DIRECCION_NEXO_REAL] → OFFICE_ADDRESS, [ADDRESS_NEXO_REAL] → OFFICE_ADDRESS
  // Empty env → fallback: "Ask your advisor for more info" / "Consultá a tu asesor"
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `platformUrl()` with/without path | Import directly, call with no env, call with custom env |
| Unit | `substituteEnvVars()` | Unit test with known inputs — all placeholders, empty env, legacy names |
| E2E | Flow responses contain URLs | Tests remain unchanged — default `PLATFORM_URL` = `https://nexoreal.xyz` |
| Integration | `buildSystemPrompt()` outputs substituted text | Verify no raw placeholders in output |

No migration required. All changes are backwards-compatible: old KB placeholders are recognized, default URL matches the current hardcoded value.

## Implementation Order

1. **Create** `bot/src/config/platform.ts` — config module with `platformUrl()` + env exports
2. **Modify** `bot/src/services/ai.service.ts` — add `substituteEnvVars()`, wire into `buildSystemPrompt()`
3. **Modify** `bot/src/prompt_kb/knowledge-base.md` — rename all placeholders to unified names
4. **Modify** 6 flow files — import `platformUrl`, replace literal URLs
5. **Modify** `bot/src/__tests__/e2e/network.flow.test.ts` + `support.flow.test.ts` — update assertions if needed
6. **Modify** `bot/.env.example` — add 4 new env vars

## Open Questions

- [ ] Should `substituteEnvVars()` fallback message be bilingual (detect from KB section) or a single generic string? Currently leaning toward single generic.
