# Sprint 3 Backlog — MLM Platform

> Próximo sprint después de Sprint 2 (v1.10.0) completado y archivado.
> Para iniciar: `/sdd-new sprint3-security-hardening`

---

## 🔴 CRITICAL — Security Hardening (Hacer PRIMERO)

### CodeQL Alerts

| # | Severity | Issue | File | Line | Description |
|---|----------|-------|------|------|-------------|
| 1 | **CRITICAL** | #29 | `backend/src/services/PayPalService.ts` | 155 | SSRF — Server-side request forgery |
| 2 | **CRITICAL** | #30 | `backend/src/services/PayPalService.ts` | 202 | SSRF — Server-side request forgery |
| 3 | **HIGH** | #36 | `frontend/src/components/EmailBuilder/EmailBuilder.tsx` | 428 | DOM XSS — Cross-site scripting |

### Enfoque recomendado:
- #29/#30: Validar URLs de PayPal contra allowlist antes de fetch. No usar user input directo en URLs.
- #36: Sanitizar HTML en EmailBuilder antes de insertar en DOM. Usar DOMPurify o similar.

---

## 🟡 MEDIUM — Tech Debt

### Sentry Issues (producción)

| # | Severity | Description | File |
|---|----------|-------------|------|
| 4 | MEDIUM | `CartService.recoverCart` locks entire table under concurrency (should be row lock) | `backend/src/services/CartService.ts` |
| 5 | MEDIUM | Campaign with 0 recipients gets stuck in SENDING status forever | `backend/src/services/EmailCampaignService.ts` |

### Test Debt

| # | Severity | Description |
|---|----------|-------------|
| 6 | LOW | 5 pre-existing test failures (skipped with `it.skip`) — need investigation and fix |
| 7 | LOW | 610 pre-existing TypeScript strict mode errors — incremental fix strategy needed |
| 8 | LOW | Missing unit tests for 9 frontend components |
| 9 | LOW | CSV export for Gift Cards — designed but not implemented (Sprint 2 deviation) |

---

## 🟢 Features — Sprint 3

### 3.1 Marketplace Multi-vendor
```
□ Vendor model (name, logo, commission_rate, status)
□ Vendor dashboard (sales, products, earnings)
□ Admin: approve/reject vendors
□ Vendor-product relationship
□ Estados: pending, approved, rejected
```

### 3.2 Productos Genéricos
```
Tipos de producto:
├── Streaming subscriptions (ya existe)
├── Physical products (nuevo)
├── Digital downloads (nuevo)
└── Services (nuevo)

Features:
├── Variantes (talla, color)
├── Inventario
├── Imágenes múltiples
├── Reviews y ratings
└── Categorías jerárquicas
```

### 3.3 Delivery Integration
```
Providers:
├── Pickup en tienda
├── DiDi delivery API
├── Uber delivery API
└── InDriver delivery API

Features:
├── Estimación de costo
├── Tracking en tiempo real
├── Webhook status updates
└── Zona de cobertura
```

---

## Project Context (para próxima sesión)

| Key | Value |
|-----|-------|
| **Repo** | https://github.com/ipproyectosysoluciones/mlm-platform |
| **GitHub user** | ipproyectosysoluciones |
| **Branch** | development |
| **Package manager** | pnpm |
| **Backend build** | esbuild → .mjs |
| **Backend tests** | Jest (unit + integration separate config) |
| **Frontend tests** | Vitest (`pnpm test -- --run`) |
| **E2E tests** | Playwright |
| **GPG** | EXPIRED — use `--no-gpg-sign` |
| **Commits** | Conventional commits, NO Co-Authored-By |
| **Language** | Rioplatense Spanish for discussion, bilingual ES/EN for docs |
| **Postman** | In .gitignore but tracked — needs `git add -f` |
| **PayPal donate** | https://www.paypal.com/donate/?hosted_button_id=EHHNLEUMEMK6L |
| **SDD backend** | engram (primary) + openspec (file backup) |
