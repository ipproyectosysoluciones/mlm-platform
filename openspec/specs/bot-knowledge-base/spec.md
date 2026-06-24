# bot-knowledge-base Specification

## Purpose

Provide the Nexo Real bot with a bilingual (ES/EN) knowledge base that is loaded at startup
and injected into the GPT-4o system prompt, enabling Sophia and Max to answer with accurate,
brand-aligned information. The KB MUST NOT exceed 1,500 tokens to avoid cost bloat.

---

## Requirements

### Requirement: KB File Loading at Startup

The bot MUST load the following files from `bot/src/prompt_kb/` at process startup before
any conversation is handled:
- `base-system-prompt.md`
- `knowledge-base.md`
- `sophia.prompt.md`
- `max.prompt.md`

If any file is missing the bot SHOULD log a warning and fall back to a generic system prompt
so the bot remains operational.

#### Scenario: Successful KB Load

- GIVEN all four KB files exist in `bot/src/prompt_kb/`
- WHEN the bot process starts
- THEN all files are read into memory
- AND no error is logged

#### Scenario: KB File Missing — Fallback

- GIVEN `knowledge-base.md` does NOT exist
- WHEN the bot process starts
- THEN the bot logs a warning `[KB] knowledge-base.md not found — using generic prompt`
- AND the bot continues startup using a hardcoded generic system prompt
- AND conversations can still be handled (no crash)

#### Scenario: KB Token Limit Enforced

- GIVEN the loaded KB content exceeds 1,500 tokens
- WHEN the system prompt is assembled
- THEN the bot truncates the KB section at 1,500 tokens
- AND appends a marker `[KB truncated]` at the cut point

---

### Requirement: GPT-4o System Prompt Injection

The bot MUST inject the loaded KB into every GPT-4o `chat.completions.create` call as part of
the `system` role message. The injection MUST use the agent-specific personality prompt
(Sophia for male users, Max for female users) combined with `base-system-prompt.md` and
`knowledge-base.md`.

#### Scenario: System Prompt Assembled for Sophia

- GIVEN the assigned agent is Sophia
- WHEN `ai.service.ts` builds the system prompt
- THEN the system message concatenates: `base-system-prompt.md` + `knowledge-base.md` + `sophia.prompt.md`
- AND the combined token count is verified to be ≤ 1,500 tokens

#### Scenario: System Prompt Assembled for Max

- GIVEN the assigned agent is Max
- WHEN `ai.service.ts` builds the system prompt
- THEN the system message concatenates: `base-system-prompt.md` + `knowledge-base.md` + `max.prompt.md`

#### Scenario: No Agent Assigned — Base Prompt Only

- GIVEN no agent has been assigned to the conversation
- WHEN `ai.service.ts` builds the system prompt
- THEN only `base-system-prompt.md` + `knowledge-base.md` is used

---

### Requirement: Bilingual Response Matching

The knowledge base MUST include content in both Spanish (ES) and English (EN). The system
prompt MUST instruct GPT-4o to respond in the same language the user is writing in.

#### Scenario: User Writes in Spanish

- GIVEN the user sends a message in Spanish
- WHEN GPT-4o processes the message with the injected KB
- THEN the response MUST be in Spanish
- AND the response MUST reference Nexo Real branding only

#### Scenario: User Writes in English

- GIVEN the user sends a message in English
- WHEN GPT-4o processes the message with the injected KB
- THEN the response MUST be in English
- AND the response MUST reference Nexo Real branding only

---

### Requirement: Sophia and Max Distinct Personalities

`sophia.prompt.md` MUST define a warm, empathetic tone for attending male users.
`max.prompt.md` MUST define a professional, concise tone for attending female users.
Both MUST reinforce the Nexo Real brand identity and avoid competitor mentions.

#### Scenario: Sophia Tone Validation

- GIVEN Sophia is the assigned agent
- WHEN GPT-4o responds to a general inquiry
- THEN the response tone is warm and empathetic
- AND does NOT mention competitors

#### Scenario: Max Tone Validation

- GIVEN Max is the assigned agent
- WHEN GPT-4o responds to a general inquiry
- THEN the response tone is professional and concise
- AND does NOT mention competitors
