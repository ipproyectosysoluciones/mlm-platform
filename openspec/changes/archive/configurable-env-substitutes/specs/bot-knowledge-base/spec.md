# Delta for bot-knowledge-base

## MODIFIED Requirements

### Requirement: KB File Loading at Startup

The bot MUST load KB files at startup, then run `substituteEnvVars()` on the
loaded `knowledge-base.md` content before injecting into the system prompt.
Placeholder names MUST be the unified set: `[EMAIL]`, `[PLATFORM_URL]`,
`[CALENDLY_LINK]`, `[OFFICE_ADDRESS]`.
(Previously: KB loaded and injected directly with old placeholder names
`[EMAIL_NEXO_REAL]`, `[WEB_NEXO_REAL]`, `[DIRECCION_NEXO_REAL]`)

#### Scenario: Placeholders substituted at build time

- GIVEN `knowledge-base.md` contains `[EMAIL]`, `[PLATFORM_URL]`, `[CALENDLY_LINK]`, `[OFFICE_ADDRESS]`
- WHEN `buildSystemPrompt()` assembles the system prompt
- THEN all four placeholders are replaced with their env var values
- AND old placeholder names are NOT present in the final prompt

#### Scenario: Missing env var produces fallback

- GIVEN `EMAIL` env var is not set
- WHEN `substituteEnvVars()` processes `[EMAIL]`
- THEN it replaces with a non-empty fallback string
- AND the bot does NOT crash

#### Scenario: Old placeholder still recognized

- GIVEN `knowledge-base.md` accidentally contains legacy `[EMAIL_NEXO_REAL]`
- WHEN `substituteEnvVars()` runs
- THEN it replaces the legacy placeholder the same as `[EMAIL]`
