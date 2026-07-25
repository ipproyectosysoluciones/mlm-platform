# Proposal: Configurable Environment Substitutes

## Intent

Two issues block tenant-specific deployments: (1) KB placeholders (`[EMAIL_NEXO_REAL]`, `[WEB_NEXO_REAL]`, etc.) are sent literally to users because no substitution logic exists, and (2) `nexoreal.xyz` is hardcoded in 16 locations across 6 flow files, making the bot non-portable.

## Scope

### In Scope
- Unify KB placeholders: `[EMAIL_NEXO_REAL]`→`[EMAIL]`, `[WEB_NEXO_REAL]`→`[PLATFORM_URL]`, `[DIRECCION_NEXO_REAL]`/`[ADDRESS_NEXO_REAL]`→`[OFFICE_ADDRESS]`, keep `[CALENDLY_LINK]`
- Add `substituteEnvVars()` in `ai.service.ts` that replaces placeholders before sending prompt to LLM
- Replace all 16 hardcoded `nexoreal.xyz` URLs with env-var-driven helper
- Add `PLATFORM_URL`, `EMAIL`, `CALENDLY_LINK`, `OFFICE_ADDRESS` to `.env.example`
- Update e2e tests that assert `nexoreal.xyz`

### Out of Scope
- Per-locale platform URLs (single env var for all languages)
- Other hardcoded subdomains (n8n.nexoreal.xyz — separate concern)
- Runtime env reload or admin UI for these values

## Capabilities

### New Capabilities
- `platform-config`: Centralized env-var-backed configuration for bot platform URLs and contact info.

### Modified Capabilities
- None.

## Approach

1. **Config helper** — New `bot/src/config/platform.ts` exports `platformUrl(path?)` that reads `PLATFORM_URL` (default: `https://nexoreal.xyz`) and appends optional path.
2. **KB substitution** — In `ai.service.ts`, add `substituteEnvVars(kb: string)` that replaces placeholders with env var values before injection into system prompt. Empty vars get a fallback message.
3. **Flow files** — Import `platformUrl` in all 6 flow files and replace every literal `https://nexoreal.xyz/...` with `platformUrl('/path')`.
4. **Tests** — Update assertions that check for `nexoreal.xyz` to use the env default or mock.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `bot/src/config/platform.ts` | New | `platformUrl()` helper |
| `bot/src/services/ai.service.ts` | Modified | Add `substituteEnvVars()` in `buildSystemPrompt` |
| `bot/src/flows/balance.flow.ts` | Modified | 2 URLs → `platformUrl()` |
| `bot/src/flows/network.flow.ts` | Modified | 2 URLs → `platformUrl()` |
| `bot/src/flows/support.flow.ts` | Modified | 1 URL → `platformUrl()` |
| `bot/src/flows/reservations.flow.ts` | Modified | 3 URLs → `platformUrl()` |
| `bot/src/flows/properties.flow.ts` | Modified | 4 URLs → `platformUrl()` |
| `bot/src/flows/tours.flow.ts` | Modified | 4 URLs → `platformUrl()` |
| `bot/src/prompt_kb/knowledge-base.md` | Modified | Renamed placeholders |
| `bot/.env.example` | Modified | Added 4 new env vars |
| `bot/src/__tests__/e2e/*.flow.test.ts` | Modified | Update domain assertions |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Empty env vars → broken links | Low | Sensible defaults + fallback messages |
| Docker Compose missing new vars | Medium | Add to docker-compose.yml in same PR |
| Tests fail if env not set in CI | Low | Tests use defaults (no mock needed) |

## Rollback Plan

Revert the `platformUrl()` import in all 6 flows. Remove `substituteEnvVars()` call from `buildSystemPrompt`. Restore old placeholder names in KB. Revert `.env.example`. Tests revert automatically.

## Dependencies

- None (self-contained bot change)

## Success Criteria

- [ ] `substituteEnvVars()` replaces all 4 placeholder types in KB output
- [ ] All 16 domain references use `platformUrl()` instead of literal strings
- [ ] `PLATFORM_URL= http://localhost:3000 ` produces local URLs in bot responses
- [ ] All e2e tests pass with default and custom env values
