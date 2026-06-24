# bot-onboarding-flow Specification

## Purpose

Provide a multi-step conversational wizard (`onboarding.flow.ts`) that guides interested
users through the Nexo Real affiliate program: confirming interest, presenting requirements,
highlighting benefits, collecting registration data, and delivering a personalized registration
link. The flow MUST detect repeat users and escalate off-script questions to a human agent.

---

## Requirements

### Requirement: Trigger Keywords

`onboarding.flow.ts` MUST activate when the user sends a message matching any keyword in
the trigger list (case-insensitive). The list MUST include ES and EN variants.

ES: `"afiliado"`, `"afiliarme"`, `"unirme"`, `"registro"`, `"quiero unirme"`, `"únete"`, `"comisión"`, `"comisiones"`
EN: `"affiliate"`, `"join"`, `"register"`, `"sign up"`, `"commission"`, `"commissions"`, `"become affiliate"`

#### Scenario: ES Trigger Keyword Detected

- GIVEN a user sends "quiero afiliarme"
- WHEN the flow router evaluates the message
- THEN `onboarding.flow.ts` is activated
- AND the flow starts at Step 1: Interest Confirmation

#### Scenario: EN Trigger Keyword Detected

- GIVEN a user sends "I want to become an affiliate"
- WHEN the flow router evaluates the message
- THEN `onboarding.flow.ts` is activated
- AND the flow starts in English mode

#### Scenario: No Keyword Match

- GIVEN a user sends a message with no trigger keyword
- WHEN the flow router evaluates the message
- THEN `onboarding.flow.ts` is NOT activated
- AND the message is handled by the default flow

---

### Requirement: Repeat User Detection

Before starting the wizard, the flow MUST check the session store for an
`onboardingCompleted` flag for the user's phone number. If present, the flow MUST NOT
repeat the full wizard.

#### Scenario: First-Time Onboarding

- GIVEN `onboardingCompleted` is NOT set for the user's phone
- WHEN a trigger keyword is detected
- THEN the full multi-step wizard is initiated

#### Scenario: Repeat Onboarding Attempt

- GIVEN `onboardingCompleted = true` is stored for the user's phone
- WHEN a trigger keyword is detected
- THEN the bot sends a follow-up message: "¡Ya estás registrado! Aquí está tu link: {link}" / "You're already registered! Here's your link: {link}"
- AND the wizard is NOT re-initiated

---

### Requirement: Multi-Step Wizard Flow

The wizard MUST execute the following steps in order. Each step MUST wait for user
confirmation before advancing. The bot MUST allow the user to exit at any point by
replying "cancelar" / "cancel".

**Step 1 — Interest Confirmation**: Ask "¿Te gustaría conocer más sobre ser afiliado de Nexo Real?" → await "Sí/Yes"
**Step 2 — Requirements**: Present the 3–5 affiliate requirements → await "Entendido / Got it"
**Step 3 — Benefits**: Present the commission structure and benefits → await "Interesante / Interesting"
**Step 4 — Data Collection**: Ask for full name and email (if not already captured)
**Step 5 — Registration Link**: Generate and send the link including `?ref={phone}`

#### Scenario: Happy Path — Full Wizard Completed

- GIVEN a first-time user triggers the flow
- WHEN the user confirms at each step (Steps 1–4)
- THEN at Step 5 the bot sends: "Aquí está tu link de registro: https://nexo.real/registro?ref={phone}"
- AND `onboardingCompleted = true` is stored for the user's phone

#### Scenario: User Cancels Mid-Wizard

- GIVEN the user is at Step 3
- WHEN the user replies "cancelar"
- THEN the bot responds "Sin problema, escríbenos cuando quieras"
- AND the wizard is terminated
- AND `onboardingCompleted` is NOT set

#### Scenario: User Does Not Confirm at Step 1

- GIVEN the bot asked if the user is interested (Step 1)
- WHEN the user replies "No" or "no me interesa"
- THEN the bot responds "Entendido, cualquier pregunta aquí estamos"
- AND the wizard is terminated

---

### Requirement: Registration Link Generation

The registration link MUST include the user's phone number as the `ref` query parameter
so affiliate attribution can be tracked by the backend.

#### Scenario: Link Generated with Referrer Phone

- GIVEN the user completed Step 4 (data collection)
- WHEN Step 5 executes
- THEN the generated URL is `{REGISTRATION_BASE_URL}?ref={sanitizedPhone}`
- AND `sanitizedPhone` has country code but no special characters (e.g., `+521234567890` → `521234567890`)

---

### Requirement: Off-Script Question Escalation

If the user asks a question during the wizard that is not answerable by the script (and GPT-4o
confidence is below threshold), the flow MUST escalate to a human agent via `handoff.flow.ts`.

#### Scenario: Off-Script Question During Wizard

- GIVEN the user is at any wizard step
- WHEN the user sends a message that does not match the expected reply pattern
- AND GPT-4o classifies the message as "off-script" (intent: unknown)
- THEN the bot responds "Voy a conectarte con un agente para responder eso mejor"
- AND `handoff.flow.ts` is triggered with `reason: "off-script-onboarding"`
- AND the onboarding wizard is suspended (not terminated)
