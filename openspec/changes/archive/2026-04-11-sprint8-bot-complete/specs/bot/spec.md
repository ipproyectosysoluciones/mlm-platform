# Delta for bot

## MODIFIED Requirements

### Requirement: Welcome Flow Data Capture

`welcomeFlow` MUST capture the following user data in sequence:
1. Language selection (ES / EN) — already implemented
2. Full name (`contactName`) — already implemented
3. Email address (`contactEmail`) — **ADDED in Sprint 8**
4. Area of interest (`areaOfInterest`: Propiedades / Tours / Afiliados) — **ADDED in Sprint 8**
5. Agent assignment (Sophia for male, Max for female) — already implemented

(Previously: welcomeFlow only captured language, name, and triggered agent assignment. No
email or area of interest was collected.)

#### Scenario: Full Welcome Flow — ES

- GIVEN a new user sends any message to the bot
- WHEN `welcomeFlow` starts
- THEN the bot greets in Spanish and asks for language preference
- WHEN the user selects ES
- THEN the bot asks for the user's name
- WHEN the name is received
- THEN the bot asks for the user's email
- WHEN a valid email is received
- THEN the bot presents area-of-interest options (1. Propiedades | 2. Tours | 3. Afiliados)
- WHEN the user selects an option
- THEN agent assignment runs and the main menu is presented

#### Scenario: Full Welcome Flow — EN

- GIVEN a new user sends any message to the bot
- WHEN the user selects EN
- THEN all subsequent prompts in welcomeFlow are in English
- AND area-of-interest options read: "1. Properties | 2. Tours | 3. Affiliates"

#### Scenario: Lead Persisted After Welcome Flow

- GIVEN all welcome flow steps completed (name, email, area of interest)
- WHEN `welcomeFlow` finalizes the session data
- THEN `LeadPersistenceService.save()` is called with the captured data
- AND the call is non-blocking (conversation continues regardless of API result)

---

## ADDED Requirements

### Requirement: AI Service Knowledge Base Loading

`ai.service.ts` MUST load the knowledge base from `bot/src/prompt_kb/` at module
initialization (not per-request) and inject it into every GPT-4o system prompt. The
previously used hardcoded/empty system prompt MUST be replaced with the KB-assembled
prompt.

#### Scenario: ai.service.ts Loads KB on Init

- GIVEN the bot process starts
- WHEN `ai.service.ts` is initialized
- THEN it calls the KB loader to read all four prompt files
- AND the loaded content is cached in module scope
- AND no file I/O occurs on subsequent GPT-4o calls

#### Scenario: ai.service.ts Uses Agent-Specific Prompt

- GIVEN an incoming GPT-4o request specifies `agent: "sophia"` or `agent: "max"`
- WHEN `ai.service.ts` assembles the system message
- THEN it uses the agent-specific personality prompt combined with the base prompt and KB
- AND the combined prompt does NOT exceed 1,500 tokens

#### Scenario: KB Unavailable at Init — Graceful Degradation

- GIVEN one or more KB files are missing at startup
- WHEN `ai.service.ts` tries to load them
- THEN it logs a warning per missing file
- AND falls back to a hardcoded minimal system prompt
- AND GPT-4o calls continue to function (bot does not crash)
