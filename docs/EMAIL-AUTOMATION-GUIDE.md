# Email Automation Guide — Campaign Creation & Management

> Guía de automatización de email — Creación y gestión de campañas.

## Overview / Resumen

The Email Automation system enables admins to create HTML email templates (with a WYSIWYG builder or raw HTML), build campaigns targeting user segments, send immediately or schedule for later, and monitor delivery stats in real time.

El sistema de automatización de email permite a los admins crear templates HTML (con un builder WYSIWYG o HTML crudo), construir campañas dirigidas a segmentos de usuarios, enviar inmediatamente o programar para más tarde, y monitorear estadísticas de entrega en tiempo real.

---

## Campaign Status Lifecycle / Ciclo de vida del estado de campaña

```
draft ────────────► scheduled     (admin sets future date)
  │                    │
  │                    │ (scheduled_for <= NOW)
  │                    ▼
  └──────────────► sending ──────► completed
                     │               (all emails sent/failed)
                     │
                     ▼
                   paused ─────────► sending     (resume via retry)
```

### Status Descriptions / Descripción de estados

| Status      | Description (EN)                                  | Descripción (ES)                                        |
| ----------- | ------------------------------------------------- | ------------------------------------------------------- |
| `draft`     | Campaign created, not yet sent or scheduled       | Campaña creada, aún no enviada ni programada            |
| `scheduled` | Set for future delivery at scheduled_for time     | Programada para envío futuro en la fecha scheduled_for  |
| `sending`   | Emails being queued and processed                 | Emails en cola y siendo procesados                      |
| `paused`    | Admin paused sending (can retry to resume)        | Admin pausó el envío (puede reintentar para continuar)  |
| `completed` | All emails processed (sent or permanently failed) | Todos los emails procesados (enviados o fallidos final) |
| `cancelled` | Campaign cancelled by admin                       | Campaña cancelada por admin                             |

---

## Architecture / Arquitectura

### Backend Components / Componentes Backend

| Component            | File                                                 | Purpose                                    |
| -------------------- | ---------------------------------------------------- | ------------------------------------------ |
| EmailTemplate Model  | `backend/src/models/EmailTemplate.ts`                | Template storage (HTML, WYSIWYG, vars)     |
| EmailCampaign Model  | `backend/src/models/EmailCampaign.ts`                | Campaign metadata + stats                  |
| CampaignRecipient    | `backend/src/models/CampaignRecipient.ts`            | Per-user delivery tracking                 |
| EmailQueue Model     | `backend/src/models/EmailQueue.ts`                   | Email processing queue with retries        |
| EmailCampaignLog     | `backend/src/models/EmailCampaignLog.ts`             | Audit log for all campaign events          |
| EmailCampaignService | `backend/src/services/EmailCampaignService.ts`       | Template validation, campaign CRUD, send   |
| BrevoEmailService    | `backend/src/services/BrevoEmailService.ts`          | REST API + SMTP fallback (circuit breaker) |
| EmailQueueService    | `backend/src/services/EmailQueueService.ts`          | Queue processing, exponential backoff      |
| EmailCampaignCtrl    | `backend/src/controllers/EmailCampaignController.ts` | HTTP endpoint handlers                     |
| Routes               | `backend/src/routes/email-campaigns.routes.ts`       | Express routes with validation             |

### Frontend Components / Componentes Frontend

| Component          | File                                                            | Purpose                            |
| ------------------ | --------------------------------------------------------------- | ---------------------------------- |
| EmailCampaignPage  | `frontend/src/pages/EmailCampaignPage.tsx`                      | Campaign admin dashboard page      |
| CampaignDashboard  | `frontend/src/components/EmailCampaigns/CampaignDashboard.tsx`  | Campaign list with tabs/filters    |
| CampaignCreateForm | `frontend/src/components/EmailCampaigns/CampaignCreateForm.tsx` | New campaign form                  |
| CampaignMonitor    | `frontend/src/components/EmailCampaigns/CampaignMonitor.tsx`    | Real-time stats (progress, counts) |
| CampaignLogsTable  | `frontend/src/components/EmailCampaigns/CampaignLogsTable.tsx`  | Delivery log viewer                |
| EmailBuilder       | `frontend/src/components/EmailBuilder/EmailBuilder.tsx`         | WYSIWYG + HTML template editor     |
| VariablePicker     | `frontend/src/components/EmailBuilder/VariablePicker.tsx`       | Template variable insertion        |
| PreviewPane        | `frontend/src/components/EmailBuilder/PreviewPane.tsx`          | Real-time email preview            |

---

## API Endpoints / Endpoints de API

### Template Routes (JWT + Admin Required)

| Method   | Endpoint                   | Description                      |
| -------- | -------------------------- | -------------------------------- |
| `POST`   | `/api/email-templates`     | Create template (validates vars) |
| `GET`    | `/api/email-templates`     | List templates (paginated)       |
| `GET`    | `/api/email-templates/:id` | Get template by ID               |
| `DELETE` | `/api/email-templates/:id` | Soft-delete template             |

### Campaign Routes (JWT + Admin Required)

| Method | Endpoint                                   | Description                              |
| ------ | ------------------------------------------ | ---------------------------------------- |
| `POST` | `/api/email-campaigns`                     | Create campaign (draft status)           |
| `GET`  | `/api/email-campaigns`                     | List campaigns (filter by status)        |
| `GET`  | `/api/email-campaigns/:id`                 | Get campaign + stats                     |
| `GET`  | `/api/email-campaigns/:id/preview?userId=` | Preview rendered email for user          |
| `POST` | `/api/email-campaigns/:id/send`            | Send immediately                         |
| `POST` | `/api/email-campaigns/:id/schedule`        | Schedule for future (body: scheduledFor) |
| `POST` | `/api/email-campaigns/:id/pause`           | Pause sending campaign                   |
| `POST` | `/api/email-campaigns/:id/retry-failed`    | Retry failed emails                      |
| `GET`  | `/api/email-campaigns/:id/logs`            | Get campaign event logs                  |

---

## Campaign Creation Workflow / Flujo de Creación de Campaña

### Step-by-Step / Paso a Paso

```
1. Create Template (admin)
   ├── Use WYSIWYG builder (drag-drop blocks, rich text)
   ├── OR paste raw HTML (toggle to HTML mode)
   ├── Insert variables: {{firstName}}, {{referralCode}}, etc.
   ├── Preview with sample data (real-time right pane)
   └── Save template → POST /api/email-templates

2. Create Campaign (admin)
   ├── Select template from library
   ├── Set campaign name
   ├── Choose recipient segment (optional filter)
   └── Save as draft → POST /api/email-campaigns

3. Send or Schedule
   ├── Send Now: POST /api/email-campaigns/:id/send
   │   └── Queue items created for each recipient
   │   └── Status: draft → sending
   └── Schedule: POST /api/email-campaigns/:id/schedule
       └── Body: { scheduledFor: "2026-04-15T10:00:00Z" }
       └── Status: draft → scheduled
       └── SchedulerService auto-triggers at scheduled_for

4. Monitor Progress
   ├── Campaign dashboard shows: sent/failed/deferred counts
   ├── Progress bar: sentCount / recipientCount
   ├── Stats refresh every 10 seconds (polling)
   └── Hover on failed rows to see error details

5. Handle Failures
   ├── Pause: POST /api/email-campaigns/:id/pause
   │   └── Stops new emails from being processed
   └── Retry Failed: POST /api/email-campaigns/:id/retry-failed
       └── Resets failed items to pending (retryCount=0)
       └── Resumes sending if campaign was paused/completed
```

---

## Template Management / Gestión de Templates

### Allowed Variables / Variables Permitidas

| Variable           | Description (EN)           | Descripción (ES)               |
| ------------------ | -------------------------- | ------------------------------ |
| `{{firstName}}`    | User's first name          | Nombre del usuario             |
| `{{lastName}}`     | User's last name           | Apellido del usuario           |
| `{{email}}`        | User's email address       | Correo del usuario             |
| `{{referralCode}}` | User's referral code       | Código de referido del usuario |
| `{{discountCode}}` | Discount code for campaign | Código de descuento            |
| `{{expiresAt}}`    | Expiration date string     | Fecha de expiración            |

### Variable Validation / Validación de Variables

- Template HTML and subject line are scanned for `{{variableName}}` patterns
- Only variables from the allowlist are accepted
- Unknown variables return a **400 error**: `"Unknown variable: {{badVar}}"`
- All variable values are **HTML-escaped** to prevent XSS injection

### WYSIWYG vs HTML Mode / Modo WYSIWYG vs HTML

| Feature   | WYSIWYG Mode                   | HTML Mode                   |
| --------- | ------------------------------ | --------------------------- |
| Editing   | Rich text toolbar (bold, etc.) | Raw code editor             |
| Variables | Click to insert from picker    | Type `{{varName}}` manually |
| Preview   | Real-time right pane           | Real-time right pane        |
| Best for  | Non-technical admins           | Advanced customization      |

---

## Monitoring & Stats / Monitoreo y Estadísticas

### Dashboard Metrics / Métricas del Dashboard

| Metric         | Description                                  |
| -------------- | -------------------------------------------- |
| recipientCount | Total recipients when campaign was sent      |
| sentCount      | Emails successfully delivered                |
| failedCount    | Emails that permanently failed (max retries) |
| deferredCount  | Emails waiting for retry (temporary failure) |
| openCount      | Emails opened (tracking pixel)               |
| clickCount     | Links clicked within emails                  |

### Campaign Logs / Logs de Campaña

Each campaign event is logged to `email_campaign_logs`:

| Event Type           | Description                            |
| -------------------- | -------------------------------------- |
| `sending_started`    | Campaign send initiated                |
| `scheduled`          | Campaign scheduled for future delivery |
| `paused`             | Campaign paused by admin               |
| `retry_failed`       | Failed emails re-queued                |
| `sent`               | Individual email delivered             |
| `deferred`           | Individual email deferred (will retry) |
| `failed`             | Individual email permanently failed    |
| `campaign_completed` | All emails in campaign processed       |

---

## Troubleshooting / Solución de Problemas

### Common Issues / Problemas Comunes

| Issue                         | Cause                                  | Solution                                              |
| ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| Template creation returns 400 | Unknown variable in HTML or subject    | Use only allowed variables from the allowlist         |
| Campaign stuck in "sending"   | Queue processor not running            | Verify SchedulerService is active (check logs)        |
| High failed count             | Brevo API rate limit or downtime       | Check circuit breaker state, retry failed emails      |
| Emails not arriving           | SMTP credentials invalid               | Verify BREVO_SMTP_USER and BREVO_SMTP_PASS            |
| Schedule didn't trigger       | SchedulerService checks every 1 minute | Ensure scheduled_for is in the past (cron catches it) |
| Campaign can't be paused      | Campaign not in 'sending' status       | Only sending campaigns can be paused                  |

### Checking System Health / Verificar Salud del Sistema

```bash
# Check recent campaign logs
GET /api/email-campaigns/:id/logs

# Check circuit breaker state (in service logs)
# Look for: "[BrevoEmailService] Circuit breaker: X/10 failures"

# Check email queue pending items
# Direct DB query:
SELECT status, COUNT(*) FROM email_queue GROUP BY status;
```

---

## Testing / Pruebas

### Integration Tests (10 tests)

```bash
cd backend
TEST_DB_NAME=mlm_test SKIP_COMMISSION_CALCULATION=true \
  node_modules/.bin/jest --config=jest.integration.config.cjs \
  --runInBand --testPathPattern=integration/email-campaigns
```

Test suites:

- Template CRUD (create with valid vars, reject unknown vars, reject non-admin)
- Campaign CRUD (create draft, reject bad template)
- Send Immediately (queue created, recipients, logs)
- Schedule (future date, reject past date)
- Queue Processing (item structure, status)
- Pause Campaign (pause sending, reject pause on draft)
- Retry Failed (re-queue, reset counts, log)
- Campaign Stats (counts, template info)
- Campaign Logs (event retrieval)
- List & Filter (pagination, status filter)

### E2E Tests (5 tests — requires running server)

```bash
cd frontend
npx playwright test e2e/email-campaigns.spec.ts
```

| Test ID    | Description                           |
| ---------- | ------------------------------------- |
| EC-E2E-001 | Admin navigates to campaigns page     |
| EC-E2E-002 | Admin accesses email template builder |
| EC-E2E-003 | Admin views campaign list and details |
| EC-E2E-004 | Admin uses dashboard tab filters      |
| EC-E2E-005 | Page handles empty state gracefully   |

---

**Document Version**: 1.0
**Created**: 2026-04-04
**Feature**: #22 — Email Automation
**Sprint**: Sprint 2 (v1.10.0)
