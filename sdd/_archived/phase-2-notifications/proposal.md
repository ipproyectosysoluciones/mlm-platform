# Proposal: Phase 2 - Email & SMS Notifications

## Intent / Intención

Implementar sistema de notificaciones por email (SendGrid) y SMS 2FA (Twilio) para la plataforma MLM, mejorando la comunicación con distribuidores y fortaleciendo la seguridad del login.

Implement email notifications (SendGrid) and SMS 2FA (Twilio) for the MLM platform, improving distributor communication and strengthening login security.

## Scope / Alcance

### Email Notifications / Notificaciones por Email

| Type                  | Trigger                      | Recipient    | Priority |
| --------------------- | ---------------------------- | ------------ | -------- |
| Welcome               | User registration            | New user     | 🟡 Media |
| Commission Earned     | Purchase triggers commission | Distributor  | 🔴 High  |
| Downline Registration | Someone joins under them     | Sponsor      | 🔴 High  |
| Password Reset        | User requests reset          | User         | 🟡 Media |
| Weekly Digest         | Every Sunday 9am             | Active users | 🟢 Low   |

### SMS 2FA

| Type               | Trigger                      | Priority |
| ------------------ | ---------------------------- | -------- |
| Login Verification | User enables 2FA and logs in | 🔴 High  |

## Motivation / Motivación

1. **User Retention**: Notificaciones proactivas mantienen a los distribuidores comprometidos
2. **Security**: 2FA reduce el riesgo de accesos no autorizados
3. **Transparency**: Los distribuidores saben inmediatamente cuando ganan comisiones
4. **Trust**: Comunicación profesional aumenta la confianza en la plataforma

## Dependencies / Dependencias

- SendGrid account + API key
- Twilio account + SID + Auth Token + Phone Number

## Risks / Riesgos

| Risk                   | Probability | Impact | Mitigation                   |
| ---------------------- | ----------- | ------ | ---------------------------- |
| Email delivery to spam | Medium      | Medium | SPF/DKIM setup, good content |
| SMS delivery delays    | Low         | Low    | Retry logic, fallback email  |
| SendGrid/Twilio outage | Low         | High   | Queue system, status page    |
| Cost overrun (SMS)     | Medium      | Medium | Rate limiting, user opt-in   |

## Non-Goals / Objetivos Excluidos

- Push notifications (Firebase) - Phase 3
- WhatsApp integration - Phase 3
- Multi-language emails - Phase 2 (English only MVP)
- Custom email templates (admin) - Phase 3

## Success Metrics / Métricas de Éxito

- Email deliverability rate >= 95%
- 2FA adoption rate >= 30% of users
- SMS delivery time <= 30 seconds
- Zero failed notification incidents affecting > 100 users
