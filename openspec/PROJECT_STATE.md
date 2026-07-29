# Nexo Real — Estado del Proyecto

> **Archivo de referencia rápida para nuevas sesiones.** Refleja el estado real al 2026-07-22.

---

## Versión actual: v3.4.0

| Campo | Valor |
|-------|-------|
| Versión | **v3.4.0** (Sprint 19 — API Versioning `/api/v1/`) |
| Branch main | `main` — producción |
| Branch activo | `development` |
| Sprint completado | Sprint 19 — API Versioning |
| Próximo sprint | **Sprint 20** — Pendiente |
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
| CI Pipeline | ✅ GitHub Actions | Jest 3 shards + pnpm cache + path filters |
| CD Pipeline | ✅ GitHub Actions | `cd-backend.yml` + `cd-bot.yml` → Docker Hub |
| Docker Images | ✅ DockerHub | `ipproyectos/mlm-backend:latest` + `ipproyectos/mlm-bot:latest` |

---

## Tests

| Suite | Tests | Estado |
|-------|-------|--------|
| Backend (Jest) | 878 (65 suites) | ✅ 878 passed, 1 skipped |
| Frontend Unit (Vitest) | ~446 (34 files) | ✅ Pasan |
| E2E (Playwright) | ~262 (22 specs) | ✅ Pasan |
| Bot (Vitest) | 115 (18 files) | ✅ Pasan |
| **Total** | **~1,701** | ✅ |

**Coverage**: Threshold 90% configurado en vitest.config.ts.

---

## Sprints completados

| Sprint | Versión | Foco principal | Fecha |
|--------|---------|---------------|-------|
| Sprint 8 | v2.4.0 | Bot complet (FAQ, Calendar, CRM, Leads, Onboarding) | 2026-04-09 |
| Sprint 9 | v2.5.0 | Tech debt (orphaned routes, JWT/2FA, Pino Logger, explicit any) | 2026-04-12 |
| Sprint 10 | v3.0.0 | Payment webhooks, Invoices, Commission Unilevel, 2FA, Admin CRUD | 2026-04-13 |
| Sprint 11 | v3.0.1 | Push notification tests, centralized logger fix | 2026-06-16 |
| Sprint 12 | v3.1.0 | CRM Refactoring, Security Hardening (50 vulns) | 2026-06-17 |
| Sprint 13 | v3.2.0 | Order History, Frontend API Modularization, Test Coverage, E2E Fixes | 2026-06-25 |
| Sprint 14 | v3.2.0 | CI Pipeline Optimization + Security Hardening | 2026-07-18 |
| Sprint 15 | v3.2.0 | TypeScript Strict Error Elimination (979+ errors) | 2026-07-18 |
| Sprint 16-17 | v3.3.0 | Swagger docs, Rate limiting, Admin security | 2026-07-21 |
| Sprint 18 | v3.3.0 | Postman sync (126→255 endpoints), CI/CD auto-deploy | 2026-07-21 |
| Sprint 19 | v3.4.0 | API Versioning `/api/v1/` prefix, 307 redirects, Swagger UI | 2026-07-22 |

---

## Seguridad

| Paquete | Versión parcheada | Severidad resuelta |
|---------|-------------------|-------------------|
| tar | 7.5.21 | CRITICAL |
| sharp (bot) | 0.35.3 | HIGH |
| fast-uri | 4.1.1 | HIGH |
| js-yaml | 5.2.1 | HIGH |
| brace-expansion | 5.0.7 | HIGH |
| protobufjs | 8.7.1 | MODERATE |
| body-parser | 2.3.0 | LOW |
| axios | 1.18.0+ | MEDIUM (5 CVEs) |

**Dependabot**: 30 alertas → 0 abiertas (7 fixed + 23 dismissed)
**overrides**: Todos en `package.json` bajo `pnpm.overrides`

---

## Issues abiertos

| Issue | Título | Prioridad | Estado |
|-------|--------|-----------|--------|
| #276 | ci: configure deployment secrets for Azure servers | HIGH | Pendiente (bloqueado sin servidor Azure) |

---

## PRs pendientes

| PR | Branch | Target | Estado |
|----|--------|--------|--------|
| *(Ninguno)* | | | |

---

## Branches (3 ramas limpias)

| Branch | Último commit | Estado |
|--------|---------------|--------|
| `development` | `8e2e18e` fix(deps): Dependabot | HEAD activo |
| `main` | Synced | Producción |
| `release` | Synced | Release candidate |

---

## Convenciones críticas

```
GPG signing:    EXPIRADO → SIEMPRE usar --no-gpg-sign
Commits:        Conventional Commits (feat:, fix:, test:, etc.)
JSDoc:          ES+EN en todos los archivos nuevos/modificados
i18n:           todos los strings visibles via t() del sistema i18n
DB:             DB_NAME=mlm_platform (nombre legacy, no cambiar)
Branding:       SIEMPRE "Nexo Real" — NUNCA "mlm-platform" ni "IP Proyectos"
Bot code:       ESM TypeScript (lead-persistence.service.ts converted from CJS)
CI secrets:     Usar ${{ secrets.CI_* }} — NUNCA hardcodear en YAML
Jest sharding:  Llamar jest directo (npx jest --shard=X/Y), NO via pnpm test:integration --
Docker Hub:     Namespace ipproyectos/mlm-backend + mlm-bot
Docker login:   Interactivo desde terminal del usuario (token desde app.docker.com/settings)
API prefix:     /api/v1/ (canonical) + /api/ (legacy con 307 redirect)
```

---

## SDD Context

| Campo | Valor |
|-------|-------|
| Artifact store | `engram` (proyecto: `mlm-platform`) |
| Session preflight | interactive, engram, force-chained, 400-line budget |
| Sprint 19 change | `sprint19-api-versioning` — ✅ COMPLETADO |

---

## Deuda técnica conocida

- **#276**: Deployment secrets — bloqueado en Azure server provisioning
- **CommissionTierBreakdown.tsx**: 3 TODOs para reemplazar datos mock con API real

---

*Actualizado: 2026-07-22 | Post-Sprint 19 API Versioning + Dependabot security audit*
