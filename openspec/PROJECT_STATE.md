# Nexo Real — Estado del Proyecto

> **Archivo de referencia rápida para nuevas sesiones.** Refleja el estado real al 2026-07-17.

---

## Versión actual: v3.2.0

| Campo | Valor |
|-------|-------|
| Versión | **v3.2.0** (Sprint 13 — Order History + Frontend API Modularization + Test Coverage) |
| Branch main | `main` — producción (synced 2026-06-25) |
| Branch activo | `development` |
| Sprint completado | Sprint 13 — Order History, CRM Refactoring, Test Coverage Expansion |
| Próximo sprint | **Sprint 14** — Planeado |
| Repositorio | `ipproyectosysoluciones/mlm-platform` |
| Root local | `/media/bladimir/Datos2/Datos/MLM` |

---

## Infraestructura activa

| Componente | Estado | URL |
|------------|--------|-----|
| Backend | ✅ Activo | `api.nexoreal.xyz` (Cloudflare Tunnel) |
| Frontend | ✅ Activo | `nexoreal.xyz` + `www.nexoreal.xyz` (Vercel) |
| Bot WhatsApp | ✅ Activo | Puerto 3002 (local) |
| Bot CI/CD | ✅ GitHub Actions | `ci-bot.yml` — Vitest en PRs |
| n8n | 🔧 Docker local | Pendiente migrar a cloud |
| DB | ✅ PostgreSQL | `DB_NAME=mlm_platform` (nombre legacy, **NO cambiar**) |

---

## Tests al cierre v3.2.0

| Suite | Tests | Estado |
|-------|-------|--------|
| Backend (Jest) | 887 (66 suites) | ✅ 886 passed, 1 skipped |
| Frontend Unit (Vitest) | ~446 (34 files) | ✅ Pasan |
| E2E (Playwright) | ~262 (22 specs) | ✅ Pasan |
| Bot (Vitest) | 115 (18 files) | ✅ Pasan |
| **Total** | **~1,298** | ✅ |

**Histórico v2.3.5**: Backend 535 / Frontend 432 / Total 967

**Coverage**: Threshold 90% configurado en vitest.config.ts. Baseline Sprint 7: ~52.82% stmts (docs/coverage-baseline.txt).

---

## PRs pendientes

| PR | Branch | Target | Estado |
|----|--------|--------|--------|

*(Ninguno pendiente)*

---

## Sprint 8 — Estado COMPLETADO ✅

**Change**: `sprint8-bot-complete` | **Version**: v2.4.0 | **Status**: ARCHIVED
**Released**: 2026-04-09 | **Main synced**: 2026-04-10

| Batch | Nombre | Estado | PR |
|-------|--------|--------|-----|
| 8.1 | Knowledge Base FAQ | ✅ complete | #107 |
| 8.2 | n8n Google Calendar (schedule-visit) | ✅ complete | #110 |
| 8.3 | n8n Notion CRM (human-handoff) | ✅ complete | #111 |
| 8.4 | Captación de Leads Completa | ✅ complete | #114 |
| 8.5 | Onboarding de Afiliados Flow | ✅ complete | #116 |

**Additional PRs (scope expansion)**: #112, #117–#125 (env examples, bug fixes, RBAC, seed, docs, Docker)
**Total PRs merged**: 19 (#107–#125)

---

## Sprint 9 — Estado COMPLETADO ✅

**Change**: `sprint9-tech-debt` | **Status**: ARCHIVED
**Completed**: 2026-04-12

| # | Issue | Descripción | PR |
|---|-------|-------------|-----|
| 1 | #126 | Mount 6 orphaned routes + relocate commission-config | #133 |
| 2 | #127 | JWT/2FA fail-fast on missing secrets | #134 |
| 3 | #128 | Pino Logger Migration (Winston → Pino) | #145 |
| 4 | #129 | PLATFORM_DOMAIN env var (remove hardcoded) | #148 |
| 5 | #130 | Eliminate all explicit `any` types (39 files) | #146 |
| 6 | #131 | Bot Vitest Test Infrastructure (18 files, 115 tests) | #227–#229 |
| 7 | #132 | Controller Test Coverage Expansion (9 new test files) | #149 |
| 8 | #218 | Bot CI/CD GitHub Actions (`ci-bot.yml`) | #234 |
| 9 | — | fix-service-error-handling: R2Service, QRService, MercadoPagoService try/catch | #232 |
| 10 | — | docs: Sprint 9 roadmap corrections | #231 |
| 11 | — | MercadoPagoService test coverage | #233 |

**Total PRs merged**: 12 (#133, #134, #145, #146, #148, #149, #227–#229, #231–#234)

---

## Sprints 10–13 — Estado COMPLETADO ✅

| Sprint | Versión | Foco principal | Fecha |
|--------|---------|---------------|-------|
| Sprint 10 | v3.0.0 | Payment webhooks, Invoices DB, Commission Unilevel, 2FA frontend, Admin CRUD, UX Polish, n8n CRM | 2026-04-13 |
| Sprint 11 | v3.0.1 | Push notification tests habilitados, centralized logger fix | 2026-06-16 |
| Sprint 12 | v3.1.0 | CRM Refactoring (7 sub-componentes), Security Hardening (50 vulns resueltas) | 2026-06-17 |
| Sprint 13 | v3.2.0 | Order History, Frontend API Modularization, Test Coverage Expansion, CI/CD Fixes, E2E Fixes | 2026-06-25 |

---

## Convenciones críticas

```
GPG signing:    EXPIRADO → SIEMPRE usar git -c commit.gpgsign=false
Commits:        Conventional Commits (feat:, fix:, test:, etc.)
JSDoc:          ES+EN en todos los archivos nuevos/modificados
i18n:           todos los strings visibles via t() del sistema i18n
DB:             DB_NAME=mlm_platform (nombre legacy, no cambiar)
Branding:       SIEMPRE "Nexo Real" — NUNCA "mlm-platform" ni "IP Proyectos"
Bot code:       SIEMPRE CommonJS (sin "type": "module") — BuilderBot + Baileys requieren CJS
```

---

## Estructura de stores Zustand (frontend)

| Store | Archivo | Gotchas |
|-------|---------|---------|
| `propertiesStore` | `frontend/src/stores/propertiesStore.ts` | — |
| `toursStore` | `frontend/src/stores/toursStore.ts` | — |
| `reservationStore` | `frontend/src/stores/reservationStore.ts` | `wizardData: null` → redirect `/` |
| `walletStore` | `frontend/src/stores/walletStore.ts` | Ver gotchas ↓ |

**walletStore gotchas:**
- `WalletTransaction`: `walletId: string`, `createdAt: Date` (no string)
- `WalletBalance`: campos `id`, `userId`, `balance`, `currency`, `lastUpdated` — **NO** `availableBalance`
- `WithdrawalRequest`: `requestedAmount`, `feeAmount`, `netAmount` — **NO** `amount`
- `WithdrawalStatus`: incluye `'cancelled'` (valor válido)

---

## Auth E2E (Playwright)

```
Helper: frontend/e2e/helpers.ts
Login:  admin@mlm.com / admin123
```

---

## SDD Context

| Campo | Valor |
|-------|-------|
| Artifact store | `engram` (proyecto: `bladimir`) |
| Sprint 8 change | `sprint8-bot-complete` — ✅ ARCHIVED (archive report: obs #711) |
| Sprint 9 change | `sprint9-tech-debt` — ✅ ARCHIVED |
| Sprint 9 fix | `fix-service-error-handling` — ✅ ARCHIVED |
| Sprint 10 change | `sprint10-stabilization` — ✅ ARCHIVED |
| Archived to | `openspec/changes/archive/2026-04-11-sprint8-bot-complete/` |
| Next sprint | Sprint 14 — planeado (SDD contexto a actualizar) |
| sdd-init | Reejecutar si se inicia Sprint 14 |

---

## Deuda técnica conocida

*(Sin items críticos pendientes)*

---

*Actualizado: 2026-07-17 | Post-auditoría v3.2.0*
