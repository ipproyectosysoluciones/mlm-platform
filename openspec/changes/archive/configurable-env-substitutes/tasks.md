# Tasks: Configurable Environment Substitutes

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~110 |
| 400-line budget risk | Low |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Config layer) → PR 2 (Substitution) → PR 3 (Flows + tests) |
| Delivery strategy | force-chained |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Create `platform.ts` config module + env vars | PR 1 | base = feature/tracker; creates platformUrl() and exports |
| 2 | Add substituteEnvVars() in ai.service + KB placeholders | PR 2 | base = PR 1 branch; substitution pass before prompt assembly |
| 3 | Replace hardcoded URLs in 6 flows + update e2e assertions | PR 3 | base = PR 2 branch; import platformUrl in all flows |

## Phase 1: Foundation — Config Module

- [x] 1.1 Create `bot/src/config/platform.ts` — `platformUrl(path?)` helper + 4 env-backed constants (PLATFORM_URL, EMAIL, CALENDLY_LINK, OFFICE_ADDRESS)
- [x] 1.2 Add 4 new env vars to `bot/.env.example` with comments
- [x] 1.3 Add 4 new env vars to `docker-compose.prod.yml` bot service `environment:` block

## Phase 2: Core — KB Substitution Engine ✅ (merged PR #226)

- [x] 2.1 Add `substituteEnvVars(kb)` function to `bot/src/services/ai.service.ts` — replaces [PLATFORM_URL], [EMAIL], [CALENDLY_LINK], [OFFICE_ADDRESS] + legacy aliases; empty env → generic fallback "Ask the agent for more information"
- [x] 2.2 Wire `substituteEnvVars()` into `buildSystemPrompt()` — call after `loadFile('knowledge-base.md')`, before `basePrompt.replace('{KNOWLEDGE_BASE}', ...)`
- [x] 2.3 Rename placeholders in `bot/src/prompt_kb/knowledge-base.md` — [EMAIL_NEXO_REAL] → [EMAIL], [WEB_NEXO_REAL] → [PLATFORM_URL], [DIRECCION_NEXO_REAL]/[ADDRESS_NEXO_REAL] → [OFFICE_ADDRESS]

## Phase 3: Integration — Flow URL Replacement ✅ (merged PR #225)

- [x] 3.1 Modify `bot/src/flows/balance.flow.ts` — import platformUrl, replace 2 hardcoded URLs
- [x] 3.2 Modify `bot/src/flows/network.flow.ts` — import platformUrl, replace 2 hardcoded URLs
- [x] 3.3 Modify `bot/src/flows/support.flow.ts` — import platformUrl, replace 1 hardcoded URL
- [x] 3.4 Modify `bot/src/flows/reservations.flow.ts` — import platformUrl, replace 3 hardcoded URLs
- [x] 3.5 Modify `bot/src/flows/properties.flow.ts` — import platformUrl, replace 3 hardcoded URLs
- [x] 3.6 Modify `bot/src/flows/tours.flow.ts` — import platformUrl, replace 4 hardcoded URLs

## Phase 4: Testing — E2E Assertion Updates ✅ (verified 2026-07-15)

- [x] 4.1 Update `bot/src/__tests__/e2e/network.flow.test.ts` — assertion on `nexoreal.xyz` still passes with default PLATFORM_URL
- [x] 4.2 Update `bot/src/__tests__/e2e/support.flow.test.ts` — assertion on `nexoreal.xyz` still passes with default PLATFORM_URL
- [x] 4.3 Update `bot/src/__tests__/e2e/balance.flow.test.ts` — no URL assertion change needed
