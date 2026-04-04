# Security Policy

## Supported Versions

We currently support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.8.x   | :white_check_mark: |
| 1.7.x   | :white_check_mark: |
| 1.6.x   | :white_check_mark: |
| < 1.6   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

**Please report security vulnerabilities by:**

- Opening a private security advisory on GitHub
- Emailing us directly at **security@mlm-platform.com**

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

| Feature                         | Implementation                                                 |
| ------------------------------- | -------------------------------------------------------------- |
| Webhook Notification Validation | Incoming MercadoPago notifications validated before processing |

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

_Last updated: 2026-04-03_
_Version: 1.8.0_
