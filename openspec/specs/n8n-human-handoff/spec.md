# n8n-human-handoff Specification

## Purpose

Define the n8n workflow that receives a `human-handoff` webhook from the bot, records the
escalation in the Notion CRM with status "Needs Human", and notifies the assigned human
agent. The workflow MUST handle Notion unavailability via a fallback notification mechanism.

---

## Requirements

### Requirement: Webhook Reception and Payload Validation

The n8n workflow MUST expose a webhook at `N8N_BASE_URL/human-handoff` that accepts HTTP
POST requests. The workflow MUST validate that `phone`, `name`, `reason`, `agent`, `language`,
and `escalatedAt` are present in the payload.

#### Scenario: Valid Payload Received

- GIVEN the bot sends `POST /human-handoff` with `{ phone, name, reason, agent, language, escalatedAt }`
- WHEN the webhook node receives the request
- THEN the workflow proceeds to Notion CRM update
- AND returns HTTP 200 immediately

#### Scenario: Missing Required Fields

- GIVEN the payload is missing `phone` or `agent`
- WHEN the webhook node receives the request
- THEN the workflow returns HTTP 400 with `{ error: "Missing required fields" }`
- AND halts without creating Notion records or sending notifications

---

### Requirement: Notion CRM Escalation Record

The workflow MUST create or update a Notion CRM entry for the lead with:
`status = "Needs Human"`, `escalatedAt`, `reason`, `assignedAgent`, `phone`, `name`.

#### Scenario: Lead Created in Notion

- GIVEN the payload is valid and no prior Notion entry exists for this phone
- WHEN the Notion node runs
- THEN a new lead record is created with status "Needs Human"
- AND `escalatedAt` is saved as ISO 8601 datetime

#### Scenario: Lead Updated in Notion

- GIVEN a prior Notion entry exists for the phone number
- WHEN the Notion node runs
- THEN the existing record is updated with status "Needs Human"
- AND the prior history is preserved (not overwritten)

#### Scenario: Notion Unavailable

- GIVEN Notion API returns a 5xx error or times out
- WHEN the Notion node fails
- THEN the workflow logs the full payload with error details
- AND proceeds to the fallback notification step
- AND does NOT halt or return an error to the bot

---

### Requirement: Agent Notification

The workflow MUST notify the assigned agent (`agent` field) when a handoff occurs.
The primary notification channel is configurable (e.g., WhatsApp, email, or Slack node in n8n).
A fallback notification MUST be sent if the primary channel fails or if Notion is unavailable.

#### Scenario: Agent Notified Successfully

- GIVEN the Notion record was created/updated
- WHEN the notification node runs
- THEN the assigned agent receives a message containing: user phone, name, reason, and escalation time
- AND the message is sent in the same language as the `language` field

#### Scenario: Primary Notification Channel Fails

- GIVEN the primary notification node returns an error
- WHEN the error is caught by the workflow
- THEN the workflow attempts the fallback notification channel
- AND logs both the original and fallback attempts

#### Scenario: All Notification Channels Fail

- GIVEN both primary and fallback notification nodes fail
- WHEN all notification attempts are exhausted
- THEN the workflow logs a CRITICAL error with full payload
- AND returns HTTP 200 to the bot (the user experience MUST NOT be affected)

---

### Requirement: User Acknowledgment Message

After triggering the handoff, the bot MUST inform the user that a human agent will contact
them. This requirement governs the workflow's response, not the bot flow itself.

#### Scenario: Handoff Acknowledged to User

- GIVEN the workflow received the handoff payload
- WHEN processing completes (success or fallback)
- THEN the workflow response to the bot includes `{ status: "ok", message: "Handoff registered" }`
- AND the bot MUST use this to display an acknowledgment to the user in their language
