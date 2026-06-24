# n8n-schedule-visit Specification

## Purpose

Define the n8n workflow that receives a `schedule-visit` webhook from the bot, confirms the
requested date/time with the user, creates a Google Calendar event, and records the
appointment in the Notion CRM with status "Visit Scheduled". The workflow MUST handle
Google Calendar unavailability gracefully.

---

## Requirements

### Requirement: Webhook Reception and Payload Validation

The n8n workflow MUST expose a webhook at `N8N_BASE_URL/schedule-visit` that accepts HTTP
POST requests. The workflow MUST validate that the following fields are present in the payload:
`phone`, `name`, `preferredDate`, `interest`, `language`.

#### Scenario: Valid Payload Received

- GIVEN the bot sends `POST /schedule-visit` with `{ phone, name, preferredDate, interest, language }`
- WHEN the webhook node receives the request
- THEN the workflow proceeds to the date confirmation step
- AND returns HTTP 200 to the bot immediately

#### Scenario: Missing Required Fields

- GIVEN the payload is missing `phone` or `name`
- WHEN the webhook node receives the request
- THEN the workflow returns HTTP 400 with `{ error: "Missing required fields" }`
- AND the workflow halts without creating Calendar or Notion records

---

### Requirement: Date Confirmation Before Booking

Because `preferredDate` is free text, the workflow MUST send a confirmation message back to
the user via the bot (or via a WhatsApp reply node) before creating the calendar event. The
user MUST explicitly confirm the interpreted date and time.

#### Scenario: Date Parsed and Confirmed

- GIVEN `preferredDate` is "mañana a las 3pm"
- WHEN the workflow interprets the date (relative to current datetime)
- THEN it sends the user a message: "¿Confirmas visita para [fecha ISO localizada]?"
- AND waits for user reply (timeout: 10 minutes)
- WHEN the user replies "Sí" / "Yes" / "Confirmar"
- THEN the workflow proceeds to Google Calendar creation

#### Scenario: User Cancels Confirmation

- GIVEN the confirmation message was sent
- WHEN the user replies "No" or "Cancelar"
- THEN the workflow sends "Entendido, podemos reagendar cuando quieras"
- AND the workflow halts without creating any records

#### Scenario: Confirmation Timeout

- GIVEN the confirmation message was sent
- WHEN 10 minutes pass without a user reply
- THEN the workflow logs the timeout
- AND the workflow halts without creating any records

---

### Requirement: Google Calendar Event Creation

The workflow MUST create a Google Calendar event using OAuth2 credentials stored in n8n.
The event MUST include: title "Visita Nexo Real — {name}", start/end time (1 hour default),
attendee phone reference in the description.

#### Scenario: Event Created Successfully

- GIVEN the user confirmed the date/time
- WHEN the Google Calendar node creates the event
- THEN the event is visible in the Nexo Real calendar
- AND the workflow proceeds to update Notion CRM

#### Scenario: Google Calendar Unavailable

- GIVEN Google Calendar API returns an error (5xx or timeout)
- WHEN the Calendar node fails
- THEN the workflow logs the error with full payload
- AND saves the appointment data to Notion CRM with status "Visit Scheduled (Pending Calendar)"
- AND sends an alert to the agent via the notification node
- AND does NOT return an error to the user — the bot SHOULD inform the user the visit was registered

---

### Requirement: Notion CRM Lead Update

After a successful calendar booking, the workflow MUST create or update a Notion CRM entry
for the lead with: `status = "Visit Scheduled"`, `preferredDate`, `interest`, `phone`, `name`.

#### Scenario: Lead Updated in Notion

- GIVEN the Google Calendar event was created
- WHEN the Notion node runs
- THEN the lead record is created or updated with status "Visit Scheduled"
- AND the `visitDate` field is set to the confirmed ISO date

#### Scenario: Notion Unavailable

- GIVEN Notion API returns an error
- WHEN the Notion node fails
- THEN the workflow logs the error
- AND sends an agent notification with the lead data as a fallback
- AND does NOT crash the workflow
