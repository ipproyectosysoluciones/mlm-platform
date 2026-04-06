# Security Policy

## Supported Versions

We currently support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.11.x  | :white_check_mark: |
| 1.10.x  | :white_check_mark: |
| 1.6.x   | :white_check_mark: |
| 1.5.x   | :x:                |
| < 1.5   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

**Please report security vulnerabilities by:**

- Opening a private security advisory on GitHub
- Emailing us directly at **security@nexoreal.com** <!-- TODO: domain pending -->

### Response Timeline

We will:

- **Acknowledge** receipt of your vulnerability report within **48 hours**
- Provide a detailed response within **5 business days** regarding how we are addressing the issue

If the vulnerability is accepted, we will:

- Acknowledge your contribution in our release notes (unless you wish to remain anonymous)
- Provide a fix in the next patch release
- Offer a CVE assignment if applicable

If the vulnerability is declined, we will provide a detailed explanation of our decision.

---

## Security Features

### Phase 0: Security Hardening (v1.11.0)

Implemented as part of Sprint 3 to address CodeQL findings (#29, #30 SSRF and #36 DOM XSS):

#### SSRF Protection

All external URL integrations (webhooks, email services, delivery providers) are validated before any outbound request:

| Check                   | Action                              |
| ----------------------- | ----------------------------------- |
| Private IP ranges       | Blocked (10.x, 172.16.x, 192.168.x) |
| Loopback addresses      | Blocked (127.0.0.1, ::1)            |
| Cloud metadata endpoint | Blocked (169.254.169.254)           |
| Protocol restriction    | Only HTTPS in production            |

#### XSS Sanitization

All user-supplied HTML content (email templates, landing pages) is sanitized before storage and rendering to prevent Cross-Site Scripting attacks.

#### Secure Logging with pino-http

Request/response logging is performed via `pino-http` with the following sensitive fields redacted from logs:

- `authorization` header
- `cookie` header
- `x-api-key` header
- Password fields in request bodies

#### Docker Hardening

| Measure              | Configuration                             |
| -------------------- | ----------------------------------------- |
| Non-root user        | Container runs as `node` (UID 1000)       |
| Read-only filesystem | `/tmp` mounted as tmpfs for writes        |
| No new privileges    | `--security-opt no-new-privileges:true`   |
| Health checks        | `HEALTHCHECK` with timeout and retries    |
| Minimal base image   | `node:24-alpine` (minimal attack surface) |

---

### Two-Factor Authentication (2FA)

Our platform implements TOTP-based 2FA for enhanced account security:

| Feature          | Implementation                      |
| ---------------- | ----------------------------------- |
| Algorithm        | TOTP (Time-based One-Time Password) |
| Library          | speakeasy                           |
| Period           | 30 seconds                          |
| Tolerance Window | ±1 period                           |

**Recovery Codes:**

- Quantity: 8 codes
- Format: XXXX-XXXX
- Hash: bcrypt (12 rounds)
- Usage: Only for disabling 2FA

**Encryption:**

- Algorithm: AES-256-GCM
- Key: TWO_FACTOR_SECRET_KEY environment variable

### Rate Limiting

To prevent brute-force attacks:

| Endpoint         | Limit                          |
| ---------------- | ------------------------------ |
| 2FA Verification | 10 attempts/minute             |
| Lockout          | 5 failed attempts = 15 minutes |

### Secret Scanning

- Secret scanning is enabled on all pushes
- Push protection blocks commits containing secrets

---

## Payment Security

### PayPal Integration

| Feature                        | Implementation                                                                                                 |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Webhook Signature Verification | PayPal-provided signature headers validated on every incoming webhook event                                    |
| Idempotency Keys               | Unique keys per request prevent duplicate payment captures and refunds                                         |
| SSRF Prevention (CWE-918)      | Certificate URL reconstructed from validated hostname — user-supplied URL never passed directly to HTTP client |

### MercadoPago Integration

| Feature                         | Implementation                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Webhook Notification Validation | HMAC-SHA256 signature verification using `MERCADOPAGO_WEBHOOK_SECRET` environment variable                         |
| Signature Verification          | Incoming webhook signature header (`X-Signature`) validated against computed hash before processing payment events |
| Idempotency Keys                | Webhook processing idempotent — duplicate notifications do NOT create multiple transactions                        |
| Request Validation              | Webhook URL only accepts POST requests; GET/HEAD requests rejected to prevent information disclosure               |

---

## Gamification & Leaderboards Security (v1.9.0)

### Redis Cache

| Feature         | Implementation                                                  |
| --------------- | --------------------------------------------------------------- |
| Data Caching    | Leaderboards cached in Redis with TTL (1 hour)                  |
| Cache Isolation | Each period (weekly/monthly/all-time) cached separately         |
| No PII Storage  | Only rank, revenue, referral count — no sensitive data in cache |

### Achievement & Badge System

| Feature           | Implementation                                      |
| ----------------- | --------------------------------------------------- |
| User Progress     | Achievement unlock events logged and timestamped    |
| Tamper Prevention | Achievement status stored server-side, not client   |
| Integrity Check   | Unlock requirements verified server-side on request |

---

## Dependencies Security

We use Dependabot for automated security updates:

- Security alerts are monitored weekly
- Critical vulnerabilities are prioritized
- Updates are applied via pull requests

---

## Security Best Practices

When contributing to this project:

1. Never commit secrets or credentials
2. Use environment variables for sensitive configuration
3. Follow the principle of least privilege
4. Report any security concerns immediately

---

_Last updated: 2026-04-04_
_Version: 1.11.0_
