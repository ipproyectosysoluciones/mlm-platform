# Archive Report — Sprint 7 Patch v2.3.5

**Change**: sprint7-patch-v2.3.5  
**Status**: ✅ ARCHIVED  
**Date**: 2026-04-09  
**Version**: v2.3.5  
**Type**: Patch (estabilización post-Sprint 7)

---

## Resumen Ejecutivo

Patch de cierre del Sprint 7. Se corrigieron 3 bugs encontrados durante la sesión de testing integral,
se actualizó toda la documentación del proyecto a v2.3.5, y se validó el pipeline de CD completo.

**Tests totales al cierre**: 967 (535 backend + 432 frontend)  
**CI/CD**: ✅ Pipeline ejecutado exitosamente — Docker Hub actualizado  
**GitHub Release**: [v2.3.5](https://github.com/ipproyectosysoluciones/mlm-platform/releases/tag/v2.3.5)

---

## Fixes Incluidos

### FIX-001 — ReservationFlowPage unhandled promise rejection

**Archivo**: `frontend/src/pages/ReservationFlowPage.tsx`  
**Síntoma**: Test `reservationFlow.test.tsx:296` fallaba con unhandled promise rejection  
**Causa raíz**: `confirmReservation()` del store re-lanza el error INTENCIONALMENTE después de
setearlo en `createError`. El componente hacía `await confirmReservation()` sin try/catch.  
**Fix**: Wrapped en `try { await confirmReservation() } catch (_) {}` en `handleConfirm`.  
**⚠️ Importante**: No eliminar el try/catch — el store está diseñado así intencionalmente.

### FIX-002 — pushService.test.ts lint

**Archivo**: `frontend/src/test/pushService.test.ts`  
**Síntoma**: ESLint warnings — variable declarada pero nunca leída  
**Fix**: Eliminada `mockPermission`, `mockOnLine` cambiada de `let` a `const`.

### FIX-003 — CD Backend Docker context

**Archivo**: `.github/workflows/cd-backend.yml`  
**Síntoma**: Docker build fallaba porque no encontraba `dist/server.mjs` con `context: .`  
**Fix**: Cambiado a `context: ./backend` para que el COPY sea relativo al Dockerfile del backend.

---

## Documentación Actualizada

| Archivo | Cambio |
|---------|--------|
| `CHANGELOG.md` | Entrada `[2.3.5] - 2026-04-09` |
| `README.md` | Versión → v2.3.5, fecha → 2026-04-09 |
| `SECURITY.md` | Tabla v2.3.x supported, footer v2.3.5 |
| `backend/src/config/swagger.ts` | `version: '2.3.5'` |
| `docs/ARCHITECTURE.md` | v2.3.5 en secciones ES + EN |
| `docs/ROADMAP.md` | Sprint 7 cerrado, tests 967 total |
| `docs/TESTING.md` | Fila v2.3.5 (967 tests) |
| `docs/PRD.md` | Version/Status/LastUpdated → 2.3.5 / 2026-04-09 |

---

## Estado de Tests al Cierre

| Suite | Suites | Tests | Estado |
|-------|--------|-------|--------|
| Backend (Jest) | 39 | 535 | ✅ PASS |
| Frontend (Vitest) | 33 | 432 | ✅ PASS |
| **Total** | **72** | **967** | ✅ |

### Issues preexistentes (fuera de scope, backlog Sprint 8)

| Archivo | Tests | Descripción |
|---------|-------|-------------|
| `PayPalService.test.ts` | 2 | verifyWebhookSignature mocks inconsistentes |
| `propertiesFlow.test.tsx` | 1 | navigate mock no se resetea entre tests |

---

## Git

| Branch | HEAD |
|--------|------|
| `development` | `0ed36ae` |
| `main` | `dfa7260` |
| `release` | `c0d0584` |
| Tag `v2.3.5` | `c0d0584` |

---

## Próximo: Sprint 8 — v2.4.0

**Branch previsto**: `feature/sprint8-bot-complete`  
**Foco**: Bot WhatsApp completo + n8n workflows + captación de leads + onboarding afiliados  
Ver detalles en `docs/ROADMAP.md` sección Sprint 8.
