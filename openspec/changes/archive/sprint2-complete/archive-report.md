# Sprint 2 (v1.10.0) — Archive Report

## Status: ARCHIVED ✅

**Fecha de cierre**: 2026-04-04
**PR**: #39 (merged commit e73ee7c)
**Tag**: v1.10.0 en main (commit 2bb5fcc)
**GitHub Release**: https://github.com/ipproyectosysoluciones/mlm-platform/releases/tag/v1.10.0

---

## Features Entregados

### 1. Gift Cards (#23)
- **Tasks**: 11 | **Story Points**: 18
- CRUD completo, redimir, validar, balance
- Backend: GiftCard model, GiftCardService, GiftCardController, routes
- Frontend: GiftCardCreateForm, GiftCardRedeem, store, service
- Tests: unit + 13 integration + 4 E2E

### 2. Abandoned Cart Recovery (#21)
- **Tasks**: 10 | **Story Points**: 19.5
- Cart persistence, recovery tokens, email notifications
- Backend: Cart/CartItem/CartRecoveryToken models, CartService, scheduler
- Frontend: CartRecovery UI, store
- Tests: unit + 21 integration

### 3. Email Automation (#22)
- **Tasks**: 10 | **Story Points**: 28
- Templates CRUD, campaigns, scheduling, queue processor
- Backend: 5 models, BrevoEmailService, EmailCampaignService, queue processor
- Frontend: EmailBuilder, CampaignDashboard, store, service
- Tests: unit (75) + integration (15) + E2E (5) + frontend (132)

---

## Verificación (sdd-verify)

- **Resultado**: PASS WITH WARNINGS
- **Spec compliance**: 52/54 scenarios (96.3%)
- **2 deviations**:
  - Cart recovery uses simpler 1-email instead of 3-step sequence
  - CSV export for gift cards designed but not implemented

---

## Documentación Actualizada

| Archivo | Qué se actualizó |
|---------|-------------------|
| `README.md` | +59 lines: features, env vars, 14 API endpoints, support section |
| `docs/TASKS-Sprint2.md` | 49 checkboxes + 189 acceptance criteria marked ✅ |
| `docs/INDEX.md` | Sprint 2 section + archive entry |
| `docs/ROADMAP.md` | v1.10.0, Sprint 1/2 ✅, 382 tests, Sprint 3 backlog |
| `backend/src/config/swagger.ts` | v1.10.0, +22 schemas, +4 tags (1257→2267 lines) |
| `postman/MLM-API.postman_collection.json` | v1.10.0, +25 requests en 4 folders (910→1451 lines) |
| `.github/FUNDING.yml` | GitHub Sponsors + PayPal |
| `.github/assets/paypal-qr.png` | PayPal QR code |

---

## Merge Chain

```
development (b00014e) → release (554aa64) → main (2bb5fcc) → tag v1.10.0
Cherry-picks to main: 8bce3df (FUNDING), 5e5a60a (QR), 274823c (docs)
```

---

## Environment Variables (New in Sprint 2)

```env
# Gift Cards
GIFT_CARD_DEFAULT_EXPIRY_DAYS=365

# Email Automation (Brevo)
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=MLM Platform

# Cart Recovery
CART_ABANDONMENT_THRESHOLD_HOURS=24
CART_RECOVERY_TOKEN_EXPIRY_HOURS=72
```
