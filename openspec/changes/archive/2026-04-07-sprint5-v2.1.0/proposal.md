# Proposal: Sprint 5 — Real Estate & Tourism Frontend (v2.1.0)

**Change**: sprint5-v2.1.0
**Status**: Applied ✅
**Date**: 2026-04-06

## Intent

Implementar el módulo frontend de Real Estate y Tourism para Nexo Real, completando el ciclo full-stack iniciado en el backend (Sprint 5 backend, issues #59-#67). Incluye corrección de vulnerabilidades de seguridad detectadas por CodeQL y Dependabot.

## Scope

### Frontend (nuevas páginas y servicios)
- 6 páginas React: PropertiesPage, PropertyDetailPage, ToursPage, TourDetailPage, ReservationFlowPage, MisReservasPage
- 3 servicios HTTP: propertyService, tourService, reservationService
- 1 Zustand store: reservationStore (wizard 3 pasos)
- 2 archivos de tests: sprint5-services.test.ts, sprint5-store.test.ts
- Rutas en App.tsx: /properties, /properties/:id, /tours, /tours/:id, /reservations/new, /mis-reservas

### Security Fixes
- CodeQL Critical #39 (#40): CWE-843 Type Confusion en PropertyController + TourPackageController
- Dependabot Moderate #37: file-type infinite loop (pnpm.overrides)

### CI Fix
- playwright.config.ts: webServer corregido para CI (pnpm preview --port 4173)

## Approach

- React 19 + Vite + TypeScript strict
- Tailwind CSS 4 + Radix UI para componentes
- Zustand 5 con useShallow para el reservation wizard
- React Router DOM 7 para rutas
- Vitest 4 + Testing Library para tests
- JSDoc bilingüe (ES/EN) en todos los archivos

## PRs

- PR #77: feature/sprint5-frontend-pages (mergeado)
- PR #78: fix/security-type-confusion-codeql (mergeado)
- PR #79: fix/dependabot-37-file-type (mergeado)
