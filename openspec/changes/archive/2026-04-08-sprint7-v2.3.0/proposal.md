# Proposal — Sprint 7 v2.3.0

**Change**: sprint7-v2.3.0
**Fecha**: 2026-04-08
**Branch**: feature/sprint7-bot-stability

## Objetivo

Entregar tres fases encadenadas que completan la base estable del producto Nexo Real:

1. **Phase 1 — UI/UX Rebranding** del frontend (landing, cards de propiedades y tours)
2. **Phase 2 — Testing completo** (unit tests Vitest + E2E Playwright)
3. **Phase 3 — Bot Stability** (health endpoint, retry automático, reconnect handler)

## Scope

### Phase 1: UI/UX Rebranding

- Rebranding visual de `NexoRealLanding` con nueva identidad de marca
- Rediseño de `PropertyCard` con layout mejorado y nuevos campos
- Rediseño de `TourCard` con estados visuales diferenciados

### Phase 2: Testing

- 307 unit tests con Vitest cubriendo componentes, stores y utilities
- 51 tests E2E con Playwright (24 properties + 27 tours)
- Cobertura de rutas críticas, formularios y flujos de usuario

### Phase 3: Bot Stability

- Health endpoint para monitoreo del bot de WhatsApp
- `withRetry` — wrapper con reintentos automáticos y backoff exponencial
- Disconnect handler — reconexión automática ante caídas del cliente
- `DEMO_SCRIPT.md` — guía de demostración del bot

## Criterio de éxito

Todos los tests pasando, bot con estabilidad probada, documentación bilingüe completa.
