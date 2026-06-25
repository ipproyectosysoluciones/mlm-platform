# Brevo Integration — Technical Reference

> Referencia técnica de la integración con Brevo (API REST + SMTP).

## Overview / Resumen

The MLM platform sends campaign emails via **Brevo** (formerly Sendinblue) using a dual-channel approach: REST API as primary with automatic SMTP relay fallback. A circuit breaker pattern protects against sustained API failures.

La plataforma MLM envía emails de campaña via **Brevo** (anteriormente Sendinblue) usando un enfoque de doble canal: API REST como primario con fallback automático a relay SMTP. Un patrón circuit breaker protege contra fallos sostenidos de la API.

---

## Architecture / Arquitectura

```
Campaign Send
    │
    ▼
EmailQueueService.processPendingEmails()
    │
    ├── For each pending email:
    │   └── BrevoEmailService.sendEmail(to, subject, html)
    │       │
    │       ├── Circuit breaker active? ──── YES ──► sendViaSMTP()
    │       │                                          │
    │       │                                          ▼
    │       │                                       SMTP relay
    │       │                                       (smtp-relay.brevo.com:587)
    │       │
    │       └── NO ──► sendViaREST()
    │                   │
    │                   ├── SUCCESS ──► Reset circuit breaker
    │                   │               Return messageId
    │                   │
    │                   └── FAILURE (timeout/5xx) ──► Increment failures
    │                       │                         Fallback to SMTP
    │                       │
    │                       └── failures >= 10? ──► Circuit breaker TRIPPED
    │                                               SMTP permanently active
    │
    └── Update queue item status (sent/deferred/failed)
        Update campaign stats (sentCount/failedCount)
```

### Components / Componentes

| Component            | File                                           | Role                                    |
| -------------------- | ---------------------------------------------- | --------------------------------------- |
| BrevoEmailService    | `backend/src/services/BrevoEmailService.ts`    | REST API + SMTP + circuit breaker       |
| EmailQueueService    | `backend/src/services/EmailQueueService.ts`    | Queue processor, retry logic            |
| EmailCampaignService | `backend/src/services/EmailCampaignService.ts` | Campaign orchestration, template render |
| SchedulerService     | `backend/src/services/SchedulerService.ts`     | Cron jobs (campaign trigger, queue)     |

---

## Brevo REST API / API REST de Brevo

### Endpoint

```
POST https://api.brevo.com/v3/smtp/email
```

### Request Body / Cuerpo de la solicitud

```json
{
  "to": [{ "email": "user@example.com" }],
  "sender": {
    "email": "noreply@nexoreal.xyz",
    "name": "Nexo Real"
  },
  "subject": "Hello John!",
  "htmlContent": "<h1>Welcome John</h1><p>Your code: ABC123</p>",
  "tags": ["email-campaign"]
}
```

### Headers

```
api-key: {BREVO_API_KEY}
Content-Type: application/json
Accept: application/json
```

### Success Response

```json
{
  "messageId": "<unique-message-id@smtp-relay.brevo.com>"
}
```

### Error Responses

| Status | Meaning                     | Action                           |
| ------ | --------------------------- | -------------------------------- |
| 200    | Email accepted for delivery | Return messageId, reset failures |
| 400    | Bad request (invalid email) | Fail permanently (no retry)      |
| 401    | Invalid API key             | Check BREVO_API_KEY env var      |
| 429    | Rate limited                | Retry after delay                |
| 5xx    | Server error                | Increment circuit breaker, SMTP  |

### Timeout

- **5 seconds** (`REST_TIMEOUT_MS = 5000`)
- Uses `AbortController` with `setTimeout` for precise timeout control
- On timeout: treated same as 5xx (increment circuit breaker, fallback to SMTP)

---

## SMTP Fallback / Fallback SMTP

### Connection

```
Host:     smtp-relay.brevo.com
Port:     587
Security: STARTTLS (secure: false in nodemailer)
Auth:     BREVO_SMTP_USER / BREVO_SMTP_PASS
```

### When SMTP Is Used / Cuándo se usa SMTP

1. **Single failure fallback**: REST API fails → immediate SMTP retry for that email
2. **Circuit breaker tripped**: After 10+ consecutive REST failures → all emails go through SMTP
3. **Manual activation**: If REST API is known to be down, circuit breaker can be pre-tripped

---

## Circuit Breaker / Circuit Breaker

### Behavior / Comportamiento

| State   | Failures | Behavior                                 |
| ------- | -------- | ---------------------------------------- |
| Normal  | 0-9      | Try REST first, SMTP fallback on failure |
| Tripped | ≥ 10     | Skip REST entirely, go directly to SMTP  |

### Internal State

```typescript
interface CircuitBreakerState {
  failures: number; // Consecutive REST API failure count
  threshold: number; // 10 (CIRCUIT_BREAKER_THRESHOLD)
  fallbackToSMTP: boolean; // true when failures >= threshold
}
```

### Reset

```typescript
// Automatic: On any successful REST API call
brevoEmailService.sendEmail(params); // success → failures = 0

// Manual: Via service method
brevoEmailService.resetCircuitBreaker(); // failures = 0, fallbackToSMTP = false

// Monitoring: Check current state
const state = brevoEmailService.getCircuitBreakerState();
// { failures: 3, threshold: 10, fallbackToSMTP: false }
```

---

## Email Queue / Cola de Email

### Queue Processing / Procesamiento de Cola

```
EmailQueueService.processPendingEmails()
    │
    ├── SELECT FROM email_queue
    │   WHERE status IN ('pending', 'deferred')
    │   AND (next_retry_at IS NULL OR next_retry_at <= NOW())
    │   LIMIT 100
    │   ORDER BY created_at ASC
    │
    ├── For each item:
    │   ├── Mark as 'processing' (prevent double-processing)
    │   ├── Send via BrevoEmailService
    │   │
    │   ├── SUCCESS:
    │   │   ├── status = 'sent'
    │   │   ├── brevo_message_id = result.messageId
    │   │   ├── processed_at = NOW()
    │   │   └── campaign.sentCount++
    │   │
    │   └── FAILURE:
    │       ├── retryCount++
    │       │
    │       ├── retryCount >= 5 (MAX_RETRIES):
    │       │   ├── status = 'failed'
    │       │   ├── processed_at = NOW()
    │       │   └── campaign.failedCount++
    │       │
    │       └── retryCount < 5:
    │           ├── status = 'deferred'
    │           ├── backoff = 2^(retryCount-1) seconds
    │           └── next_retry_at = NOW() + backoff
    │
    └── After batch:
        ├── Update deferred counts for affected campaigns
        └── Check campaign completion (no pending/deferred/processing left)
```

### Exponential Backoff Schedule / Programa de Backoff Exponencial

| Retry # | Backoff (seconds) | Total wait (cumulative) |
| ------- | ----------------- | ----------------------- |
| 1       | 1s (2⁰)           | 1s                      |
| 2       | 2s (2¹)           | 3s                      |
| 3       | 4s (2²)           | 7s                      |
| 4       | 8s (2³)           | 15s                     |
| 5       | FAILED            | Permanent failure       |

### Queue Status Lifecycle / Ciclo de vida del estado de cola

```
pending ──► processing ──► sent       (success)
                │
                └──► deferred ──► processing ──► sent
                     (retry)       (next attempt)
                │
                └──► failed        (max retries reached)
```

---

## Scheduler Configuration / Configuración del Scheduler

### Cron Jobs / Trabajos Cron

| Job                | Schedule       | Service                       |
| ------------------ | -------------- | ----------------------------- |
| Campaign Scheduler | Every 1 minute | `emailCampaignSchedulerJob()` |
| Queue Processor    | Every 1 minute | `emailQueueProcessorJob()`    |

- **Campaign Scheduler**: Finds campaigns with `status='scheduled'` and `scheduled_for <= NOW()`, triggers `sendCampaign()`
- **Queue Processor**: Calls `processPendingEmails()` to process up to 100 pending/deferred emails per batch

### Throughput / Rendimiento

| Metric                     | Target             |
| -------------------------- | ------------------ |
| Emails per batch           | Up to 100          |
| Processing time per email  | 1-2 seconds        |
| Effective throughput       | ~100 emails/min    |
| Campaign send (5000 users) | <2s (batch INSERT) |

---

## Environment Variables / Variables de Entorno

```env
# Brevo REST API
BREVO_API_KEY=xkeysib-xxx                  # Brevo API key (v3)

# Brevo SMTP Relay (fallback)
BREVO_SMTP_USER=xxx@smtp-brevo.com         # SMTP login
BREVO_SMTP_PASS=xxx                        # SMTP password

# Sender Identity
BREVO_SENDER_EMAIL=noreply@nexoreal.xyz     # From email (TODO: domain pending)
BREVO_SENDER_NAME=Nexo Real                # From name
```

### Required Setup / Configuración Requerida

1. **Create Brevo account** at [brevo.com](https://www.brevo.com)
2. **Generate API key**: Settings → SMTP & API → API Keys
3. **Verify sender domain**: Settings → Senders, Domains & Dedicated IPs
4. **Get SMTP credentials**: Settings → SMTP & API → SMTP
5. **Set env vars** in `.env` file (never commit to git)

---

## Rate Limits & Quotas / Límites de Tasa y Cuotas

### Brevo Limits

| Plan     | Daily limit | Per-hour limit |
| -------- | ----------- | -------------- |
| Free     | 300/day     | 100/hour       |
| Starter  | Unlimited\* | Based on plan  |
| Business | Unlimited\* | Based on plan  |

\*Subject to reputation and warm-up period.

### Our Safeguards / Nuestras Protecciones

| Safeguard              | Value    | Purpose                            |
| ---------------------- | -------- | ---------------------------------- |
| Batch limit            | 100      | Emails processed per scheduler run |
| REST timeout           | 5s       | Prevent hanging requests           |
| Circuit breaker        | 10 fails | Protect against sustained outage   |
| Max retries            | 5        | Prevent infinite retry loops       |
| Campaign creation rate | 10/min   | Prevent spam campaign creation     |

---

## Error Codes / Códigos de Error

| Code                      | HTTP | Description                               |
| ------------------------- | ---- | ----------------------------------------- |
| TEMPLATE_VALIDATION_ERROR | 400  | Unknown variable in template              |
| TEMPLATE_CREATE_ERROR     | 400  | Template creation failed                  |
| CAMPAIGN_NOT_FOUND        | 404  | Campaign ID not found                     |
| CAMPAIGN_ALREADY_SENDING  | 409  | Campaign is already in sending state      |
| CAMPAIGN_INVALID_STATUS   | 400  | Invalid status transition                 |
| TEMPLATE_NOT_FOUND        | 400  | Template referenced by campaign not found |
| SCHEDULE_PAST_DATE        | 400  | Scheduled date is in the past             |
| EMAIL_SEND_FAILED         | 500  | Both REST and SMTP failed                 |

---

## Monitoring Checklist / Lista de Monitoreo

### Daily Checks / Verificaciones Diarias

- [ ] Campaign send success rate (target: >95%)
- [ ] Circuit breaker state (should be: failures=0, fallbackToSMTP=false)
- [ ] Queue backlog (deferred count should trend to 0)
- [ ] Failed email count (investigate if >5% of total)
- [ ] Brevo API response times (should be <2s p95)

### Alerts / Alertas

| Condition               | Severity | Action                          |
| ----------------------- | -------- | ------------------------------- |
| Circuit breaker tripped | Critical | Check Brevo status, verify keys |
| Failed rate > 10%       | High     | Review errors, retry if needed  |
| Queue backlog > 1000    | Medium   | Check scheduler, increase batch |
| REST timeout rate > 20% | Medium   | Check network, Brevo latency    |

---

**Document Version**: 1.0
**Created**: 2026-04-04
**Feature**: #22 — Email Automation
**Sprint**: Sprint 2 (v1.10.0)
