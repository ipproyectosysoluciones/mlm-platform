# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are
currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

Use this section to tell people how to report a vulnerability.

Please report security vulnerabilities by opening a private issue or emailing <security@mlm-platform.com> directly.

We will acknowledge receipt of your vulnerability report within 48 hours and provide a detailed response within 5 business days regarding how we are addressing the issue.

If the vulnerability is accepted, we will:

- Acknowledge your contribution in our release notes (unless you wish to remain anonymous)
- Provide a fix in the next patch release
- Offer a CVE assignment if applicable

If the vulnerability is declined, we will provide a detailed explanation of our decision.

---

## Two-Factor Authentication (2FA)

### Implementación

- Algoritmo TOTP (Time-based One-Time Password)
- Biblioteca: speakeasy
- Período: 30 segundos
- Ventana de tolerancia: ±1 período

### Códigos de Recuperación

- Cantidad: 8 códigos
- Formato: XXXX-XXXX
- Hash: bcrypt (12 rondas)
- Uso: Solo para deshabilitar 2FA

### Cifrado

- Algoritmo: AES-256-GCM
- Clave: Variable de entorno TWO_FACTOR_SECRET_KEY

### Rate Limiting

- Verificación: 10 intentos/minuto
- Bloqueo: 5 intentos fallidos = 15 minutos de lockout
