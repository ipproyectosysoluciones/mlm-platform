# Nexo Real — Estado del Proyecto

> **Archivo de referencia rápida para nuevas sesiones.** Refleja el estado real al 2026-04-11.

---

## Versión actual: v2.4.0

| Campo | Valor |
|-------|-------|
| Versión | **v2.4.0** (Sprint 8 — Bot production-ready) |
| Branch main | `main` — producción (synced 2026-04-10) |
| Branch activo | `development` |
| Sprint completado | Sprint 8 — Bot Completo + n8n Workflows |
| Próximo sprint | **Sprint 9** — Planeado |
| Repositorio | `ipproyectosysoluciones/mlm-platform` |
| Root local | `/media/bladimir/Datos1/Datos/MLM` |

---

## Infraestructura activa

| Componente | Estado | URL |
|------------|--------|-----|
| Backend | ✅ Activo | `api.nexoreal.xyz` (Cloudflare Tunnel) |
| Frontend | ✅ Activo | `nexoreal.xyz` + `www.nexoreal.xyz` (Vercel) |
| Bot WhatsApp | ✅ Activo | Puerto 3002 (local) |
| n8n | 🔧 Docker local | Pendiente migrar a cloud |
| DB | ✅ PostgreSQL | `DB_NAME=mlm_platform` (nombre legacy, **NO cambiar**) |

---

## Tests al cierre v2.4.0

| Suite | Tests | Estado |
|-------|-------|--------|
| Backend (Jest) | 528 (39 suites) | ✅ 527 passed, 1 skipped |
| Frontend Unit (Vitest) | ~446 (34 files) | ✅ Pasan |
| E2E (Playwright) | ~262 (22 specs) | ✅ Pasan |
| Bot | 0 | ⚠️ Sin tests |
| **Total** | **~1,236** | ✅ |

**Histórico v2.3.5**: Backend 535 / Frontend 432 / Total 967

**Coverage**: Threshold 90% configurado en vitest.config.ts. Baseline Sprint 7: ~52.82% stmts (docs/coverage-baseline.txt).

---

## PRs pendientes

| PR | Branch | Target | Estado |
|----|--------|--------|--------|
| #105 | `feature/sprint7-testing` | `development` | ⚠️ **OPEN — pendiente merge manual** |

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
| Archived to | `openspec/changes/archive/2026-04-11-sprint8-bot-complete/` |
| Next sprint | Sprint 9 — planeado (SDD contexto a actualizar) |
| sdd-init | Reejecutar si se inicia Sprint 9 |

---

## Deuda técnica conocida

1. PR #105 pendiente merge (`feature/sprint7-testing` → `development`)
2. Coverage real no medida — puede no llegar al 90% gate
3. `api/services/api.ts` — 7.56% coverage (difícil de cubrir, bajo en prioritario)
4. `components/tree/*` — 0.92% (legacy MLM, excluir de coverage)
5. `pages/Profile.tsx` — 21.66% coverage

---

*Actualizado: 2026-04-11 | Post-auditoría v2.4.0*
