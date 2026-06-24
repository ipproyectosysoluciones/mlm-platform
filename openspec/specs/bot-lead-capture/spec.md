# bot-lead-capture Specification

## Purpose

Extend the bot's `welcomeFlow` to capture the user's email address and area of interest,
then persist this data to the backend CRM via `LeadPersistenceService`. Lead capture MUST
NOT block the conversation flow — errors are silent from the user's perspective.

---

## Requirements

### Requirement: Email Capture in welcomeFlow

After capturing the user's name, `welcomeFlow` MUST ask for the user's email address.
The bot MUST validate the format of the email. If invalid, the bot SHOULD ask for a retry
(maximum 2 attempts). After 2 failed attempts the bot MAY continue the flow without email,
storing `contactEmail = null`.

#### Scenario: Valid Email Entered on First Attempt

- GIVEN the bot has captured the user's name
- WHEN the bot asks "¿Cuál es tu correo electrónico?" / "What's your email address?"
- AND the user replies with a valid email format (e.g., `user@domain.com`)
- THEN `contactEmail` is stored in the session
- AND the flow proceeds to area-of-interest capture

#### Scenario: Invalid Email — First Retry

- GIVEN the bot asked for email
- WHEN the user replies with an invalid format (e.g., "noesuncorreo")
- THEN the bot responds "Ese correo no parece válido, intenta de nuevo" / "That email looks invalid, please try again"
- AND the bot asks for the email again (attempt 2 of 2)

#### Scenario: Invalid Email — Max Attempts Reached

- GIVEN the user has failed email validation twice
- WHEN the second invalid email is submitted
- THEN the bot responds "Sin problema, continuamos sin correo"
- AND `contactEmail = null` is stored
- AND the flow proceeds without blocking

#### Scenario: User Skips Email (Empty Reply)

- GIVEN the bot asked for email
- WHEN the user replies with "-", "skip", or an empty message
- THEN `contactEmail = null` is stored
- AND the flow continues without retry

---

### Requirement: Area of Interest Capture in welcomeFlow

After email capture, `welcomeFlow` MUST present the user with three options and capture their
selection as `areaOfInterest`.

Options (ES): "1. Propiedades | 2. Tours | 3. Afiliados"
Options (EN): "1. Properties | 2. Tours | 3. Affiliates"

#### Scenario: Valid Selection

- GIVEN the bot displayed the three area-of-interest options
- WHEN the user replies "1", "2", or "3"
- THEN `areaOfInterest` is stored as the corresponding label (`Propiedades`/`Tours`/`Afiliados`)
- AND the flow proceeds to agent assignment

#### Scenario: Invalid Selection

- GIVEN the bot displayed the options
- WHEN the user replies with anything other than "1", "2", or "3"
- THEN the bot re-displays the options once
- AND if the user still replies invalidly, defaults to `areaOfInterest = "General"`

---

### Requirement: Lead Persistence via LeadPersistenceService

`LeadPersistenceService` MUST call `POST /api/crm/leads` with the following payload upon
completion of `welcomeFlow`: `{ contactName, contactEmail, phone, areaOfInterest, source: "whatsapp-bot", status: "new", userId: null, metadata: { language, agent } }`.

The service MUST NOT block the conversation flow. If the API call fails, the error MUST be
logged server-side and the flow MUST continue normally.

#### Scenario: Lead Saved Successfully

- GIVEN `welcomeFlow` has collected name, email, and area of interest
- WHEN `LeadPersistenceService.save()` is called
- THEN `POST /api/crm/leads` returns HTTP 201
- AND the lead is visible in the CRM backend
- AND the bot conversation continues without delay

#### Scenario: Backend API Unavailable

- GIVEN `POST /api/crm/leads` returns a 5xx error or connection timeout
- WHEN `LeadPersistenceService.save()` catches the error
- THEN the error is logged with the full payload and timestamp
- AND the bot conversation continues as if the save succeeded (user sees no error)

#### Scenario: Duplicate Lead (409 Conflict)

- GIVEN the phone number already exists in the CRM
- WHEN `POST /api/crm/leads` returns HTTP 409
- THEN `LeadPersistenceService` logs the conflict
- AND does NOT retry or throw an unhandled exception
- AND the bot conversation continues
