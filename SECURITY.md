# Security Policy

## Supported Versions

We currently support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 3.4.x   | :white_check_mark: |
| 3.3.x   | :white_check_mark: |
| 3.2.x   | :white_check_mark: |
| 2.6.x   | :x:                |
| 2.5.x   | :x:                |
| < 2.5   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

**Please report security vulnerabilities by:**

- Opening a private security advisory on GitHub
- Emailing us directly at **security@nexoreal.xyz**

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

### Sprint 5 Security Fixes (v2.1.0)

#### CodeQL Critical — Type Confusion (CWE-843)

Two critical type confusion vulnerabilities were identified and fixed in Sprint 5:

| Alert      | File                       | Issue                                                                          | Fix                                                                                                 |
| ---------- | -------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| CodeQL #39 | `TourPackageController.ts` | `(property.images as string[]) ?? []` — unsafe cast without runtime validation | `Array.isArray(rawImages) ? rawImages.filter((img): img is string => typeof img === 'string') : []` |
| CodeQL #40 | `PropertyController.ts`    | `(property.images as string[]) ?? []` — unsafe cast without runtime validation | `Array.isArray(rawImages) ? rawImages.filter((img): img is string => typeof img === 'string') : []` |

#### Dependabot Moderate — file-type DoS (CVE)

| Alert          | Package     | Severity                 | Fix                                                           |
| -------------- | ----------- | ------------------------ | ------------------------------------------------------------- |
| Dependabot #37 | `file-type` | Moderate (infinite loop) | Forced `>=21.3.1` via `pnpm.overrides` in root `package.json` |

---

### Sprint 6 — CodeQL Fixes (v2.2.0)

**CWE-843 Type Confusion — req.files normalization** (CodeQL #39, #40):

Files fixed:

- `backend/src/controllers/PropertyController.ts`
- `backend/src/controllers/TourPackageController.ts`

Fix applied:

```typescript
// Before (unsafe)
const files = req.files as Express.Multer.File[];

// After (safe — normalized)
const files = Array.isArray(req.files) ? req.files : Object.values(req.files ?? {}).flat();
```

This prevents type confusion attacks where an attacker could manipulate the `files` parameter structure to bypass validation.

---

### Security Patches (v3.4.1)

#### Dependabot High — react-router CSRF Bypass (Dependabot #181)

| Alert           | Package      | Severity | Vulnerable Range   | Fix                             |
| --------------- | ------------ | -------- | ------------------ | ------------------------------- |
| Dependabot #181 | react-router | High     | >= 7.12.0, < 8.3.0 | Upgraded to react-router v8.3.0 |

**What changed**: `react-router-dom` v7.18.0 replaced with `react-router` v8.3.0. v8 merges packages — import path changed from `react-router-dom` to `react-router` across 78 frontend files. Legacy BrowserRouter pattern maintained (no behavioral changes).

#### CodeQL High — Missing Rate Limiting (CodeQL #48)

| Alert      | Issue                 | Fix                                               |
| ---------- | --------------------- | ------------------------------------------------- |
| CodeQL #48 | Missing rate limiting | Added 4 new rate limiters in `backend/src/app.ts` |

**Endpoints protected**:

| Endpoint                  | Limiter               | Window | Max Requests | Key Source |
| ------------------------- | --------------------- | ------ | ------------ | ---------- |
| POST /auth/register/guest | guestAuthLimiter      | 15 min | 10           | IP         |
| POST /vendors/register    | vendorRegisterLimiter | 15 min | 5            | IP         |
| POST/PUT/DELETE /carts    | cartLimiter           | 1 min  | 30           | User ID    |
| POST /crm/\*              | crmWriteLimiter       | 1 min  | 20           | User ID    |

#### Dependency Bumps (Dependabot)

| Package         | Before | After  | Fix                                        |
| --------------- | ------ | ------ | ------------------------------------------ |
| brace-expansion | 5.0.7  | 5.0.8  | DoS via unbounded expansion (#183)         |
| js-yaml         | 5.2.1  | 5.2.2  | Exponential parsing time DoS (#182)        |
| postcss         | 8.5.15 | 8.5.23 | Path traversal via sourceMappingURL (#180) |

---

### Security Hardening (v3.5.1) — 2026-09-05

#### All Dependabot Alerts Resolved via pnpm.overrides

30 Dependabot alerts across 30+ transitive dependencies resolved by adding `pnpm.overrides` in root `package.json`:

| Advisory                           | Severity       | Package                            | Patched Version |
| ---------------------------------- | -------------- | ---------------------------------- | --------------- |
| DOMPurify                          | XSS            | dompurify                          | >=3.4.13        |
| ip-address                         | SSRF           | ip-address                         | >=10.4.0        |
| brace-expansion                    | DoS            | brace-expansion                    | >=5.0.9         |
| qs                                 | DoS            | qs                                 | >=6.16.0        |
| nanoid                             | DoS            | nanoid                             | >=3.3.18        |
| browserslist                       | XSS            | browserslist                       | >=4.28.7        |
| @humanfs/node                      | RCE            | @humanfs/node                      | >=0.16.8        |
| superagent                         | DoS            | superagent                         | >=9.0.0         |
| undici (5 alerts)                  | Various        | undici                             | >=7.29.0        |
| fast-uri (3 alerts)                | SSRF/Confusion | fast-uri                           | >=4.1.2         |
| tar                                | DoS            | tar                                | >=7.5.21        |
| ws                                 | DoS            | ws                                 | >=8.21.0        |
| js-cookie                          | XSS            | js-cookie                          | >=3.0.7         |
| fast-xml-parser                    | XSS            | fast-xml-parser                    | >=5.7.0         |
| body-parser                        | DoS            | body-parser                        | >=2.3.0         |
| uuid                               | DoS            | uuid                               | >=11.1.1        |
| js-yaml                            | DoS            | js-yaml                            | >=5.2.2         |
| sharp                              | DoS            | sharp                              | >=0.35.0        |
| lodash                             | DoS            | lodash                             | >=4.17.21       |
| serialize-javascript               | RCE            | serialize-javascript               | >=7.0.5         |
| protobufjs                         | DoS            | protobufjs                         | >=7.6.5         |
| @protobufjs/utf8                   | DoS            | @protobufjs/utf8                   | >=1.1.1         |
| fast-xml-builder                   | XSS            | fast-xml-builder                   | >=1.1.7         |
| nodemailer                         | SSRF           | nodemailer                         | >=9.0.1         |
| follow-redirects                   | SSRF           | follow-redirects                   | >=1.16.0        |
| @babel/core                        | DoS            | @babel/core                        | >=7.29.6        |
| esbuild                            | DoS            | esbuild                            | >=0.28.1        |
| sharp                              | DoS            | sharp                              | >=0.35.0        |
| @conventional-changelog/git-client | DoS            | @conventional-changelog/git-client | >=2.0.0         |

**Fix method**: `pnpm.overrides` in root `package.json` forces patched versions of all transitive dependencies. `pnpm install` regenerated `pnpn-lock.yaml`. `pnpm audit` confirms **0 vulnerabilities**.

#### Code Quality Improvements

| Change                                 | Description                                                                 | Files                                                |
| -------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------- |
| WalletService now() helper             | Replaced `const now = new Date()` pattern with `private now()` method       | `backend/src/services/WalletService.ts`              |
| PayoutWebhookController status mapping | Extracted `getPayPalPayoutStatus()` helper for explicit batch_status/status | `backend/src/controllers/PayoutWebhookController.ts` |
| Removed supertest from root            | Duplicate dependency already in backend/package.json                        | `package.json`                                       |

---

_Last updated: 2026-09-05_
_Version: 3.5.1_
