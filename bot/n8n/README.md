# bot/n8n — Workflows de Automatización Nexo Real

This directory contains n8n workflow definitions for the Nexo Real bot integrations.

---

## Workflows

### `schedule-visit.json` — Agendar Visita (Google Calendar)

**Trigger**: `POST /webhook/schedule-visit`

**Description**: Receives a visit scheduling request from the bot and creates a Google Calendar event, notifying the sales team.

**Input payload**:

```json
{
  "phone": "+573001234567",
  "name": "Juan Pérez",
  "preferredDate": "2026-04-15T10:00:00-05:00",
  "propertyId": "PROP-001",
  "agentName": "Sophia"
}
```

**Response (success)**:

```json
{
  "success": true,
  "eventId": "abc123xyz",
  "calendarLink": "https://calendar.google.com/calendar/event?eid=...",
  "scheduledAt": "2026-04-15T10:00:00.000Z"
}
```

**Response (error)**:

```json
{
  "success": false,
  "error": "Missing required field: phone"
}
```

**Required environment variables**:

| Variable             | Description                            | Example               |
| -------------------- | -------------------------------------- | --------------------- |
| `GOOGLE_CALENDAR_ID` | Google Calendar ID for the team        | `team@nexoreal.com`   |
| `SALES_TEAM_EMAIL`   | Email to add as attendee to all events | `ventas@nexoreal.com` |

**Required n8n credentials**:

- `googleCalendarOAuth2Api` — OAuth2 connection to Google Calendar

---

### `human-handoff.json` — Handoff a Agente Humano (Notion + Brevo)

**Trigger**: `POST /webhook/human-handoff`

**Description**: When the bot escalates to a human agent, this workflow captures the lead in Notion and sends an email notification to the sales team via Brevo.

**Input payload**:

```json
{
  "phone": "+573001234567",
  "name": "María García",
  "summary": "Interesada en apartamento 2 habitaciones, presupuesto $200M",
  "agentName": "Max",
  "language": "es"
}
```

**Response (success)**:

```json
{
  "success": true,
  "notionPageId": "abc-123-def",
  "emailSent": true
}
```

**Required environment variables**:

| Variable                    | Description                           | Example                                |
| --------------------------- | ------------------------------------- | -------------------------------------- |
| `NOTION_LEADS_DB_ID`        | Notion database ID for leads          | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `BREVO_HANDOFF_TEMPLATE_ID` | Brevo transactional email template ID | `42`                                   |
| `SALES_TEAM_EMAIL`          | Email to notify on handoff            | `ventas@nexoreal.com`                  |

**Required n8n credentials**:

- `notionApi` — Notion integration API key
- `brevoApi` — Brevo (Sendinblue) API key

---

## Setup

### 1. Import workflows

In n8n:

1. Go to **Workflows** → **Import from file**
2. Select the `.json` file from this directory
3. Configure credentials (see above)
4. Set environment variables in n8n Settings → Variables
5. Activate the workflow

### 2. Configure bot environment

Add to `bot/.env`:

```env
# n8n Webhook URLs
N8N_SCHEDULE_VISIT_URL=https://your-n8n-instance.com/webhook/schedule-visit
N8N_HUMAN_HANDOFF_URL=https://your-n8n-instance.com/webhook/human-handoff
```

### 3. Test

Use the included Postman collection or:

```bash
# Test schedule-visit
curl -X POST https://your-n8n-instance.com/webhook/schedule-visit \
  -H "Content-Type: application/json" \
  -d '{"phone":"+573001234567","name":"Test User","preferredDate":"2026-04-15T10:00:00-05:00","propertyId":"PROP-001"}'

# Test human-handoff
curl -X POST https://your-n8n-instance.com/webhook/human-handoff \
  -H "Content-Type: application/json" \
  -d '{"phone":"+573001234567","name":"Test User","summary":"Test handoff","agentName":"Sophia"}'
```

---

## Architecture

```
WhatsApp Bot (BuilderBot)
        │
        ▼
   n8n Webhook
        │
   ┌────┴─────┐
   │          │
   ▼          ▼
Google      Notion
Calendar    Leads DB
   +           +
Sales       Brevo
Notify      Email
```
