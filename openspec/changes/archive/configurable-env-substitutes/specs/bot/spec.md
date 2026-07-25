# Delta for bot

## MODIFIED Requirements

### Requirement: AI Service Knowledge Base Loading

`ai.service.ts` MUST load KB files, run `substituteEnvVars()` on the knowledge base,
and inject the substituted result into every GPT-4o system prompt under `{KNOWLEDGE_BASE}`.
(Previously: KB loaded and injected directly without substitution)

#### Scenario: Substitution runs before prompt assembly

- GIVEN `ai.service.ts` initializes
- WHEN `buildSystemPrompt()` is called
- THEN it calls `substituteEnvVars()` on loaded KB content
- AND passes the substituted KB to the system prompt

#### Scenario: No file I/O on substitution call

- GIVEN KB files are already loaded and cached
- WHEN `substituteEnvVars()` runs
- THEN no additional file I/O occurs (string replacement only)

## ADDED Requirements

### Requirement: Flow Files Use `platformUrl()`

All 6 flow files MUST import `platformUrl` from `../config/platform.js` and
replace every hardcoded `https://nexoreal.xyz/...` string with `platformUrl('/path')`.

#### Scenario: Balance flow uses configurable URL

- GIVEN `PLATFORM_URL=http://localhost:3000`
- WHEN the balance flow shows "Registrate en:"
- THEN the link reads `http://localhost:3000/register`

#### Scenario: Properties flow uses configurable URL

- GIVEN `PLATFORM_URL=https://nexoreal.xyz`
- WHEN properties flow shows "Ver todas las propiedades:"
- THEN the link reads `https://nexoreal.xyz/properties`

### Requirement: E2E Tests Use Configurable Assertions

Tests asserting `nexoreal.xyz` MUST be updated to assert against the default URL
behavior of `platformUrl()` or the env var default.

#### Scenario: URL test uses default value

- GIVEN no `PLATFORM_URL` override in test env
- WHEN the support flow test asserts the URL
- THEN it checks the output contains the default domain
