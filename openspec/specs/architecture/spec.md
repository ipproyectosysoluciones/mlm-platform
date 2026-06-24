# Spec: Architecture Docs & Release

## Overview

Especificaciones de documentación de arquitectura y proceso de release para v2.0.0.

**Versión origen**: v2.0.0 (sprint4-complete)

---

## 1. Documentación

**REQ-DOCS-010**: `docs/ARCHITECTURE.md` MUST incluir una sección de Sprint 4 documentando el bot,
las integraciones n8n, y los cambios de versión.

**REQ-DOCS-020**: La versión en la documentación MUST reflejar v2.0.0.

---

## 2. Release

**REQ-RELEASE-010**: El tag `v2.0.0` MUST estar creado en el branch `main` con un GitHub Release
publicado.

---

**Fuente**: openspec/changes/archive/2026-04-06-sprint4-complete/spec.md (Feature 4)
**Versión**: v2.0.0
**Archived**: 2026-04-06

---

## Sprint 6: Build & Docker Hardening (v2.2.0)

**Versión origen**: v2.2.0 (sprint6)

### Requirement: Eliminación Explícita de Source Maps en Build de Producción

El script `backend/scripts/build.mjs` MUST ejecutar `rm -f dist/*.map` al finalizar el proceso de build cuando `NODE_ENV=production`. Ningún archivo `.map` MUST existir en `dist/` después del build de producción.

**Scenario: Build de producción sin source maps**
```
Given NODE_ENV=production y se ejecuta el script de build
When el build completa exitosamente
Then no existe ningún archivo *.map en el directorio dist/
And el archivo dist/server.mjs existe y es funcional
```

### Requirement: Dockerfile Copia Solo dist/server.mjs

El `backend/Dockerfile` MUST copiar únicamente `dist/server.mjs` al contenedor final. La instrucción COPY en el stage de producción MUST NOT incluir patrones que copien archivos `.map`.

### Requirement: Build de Producción con Minificación Completa

El build de producción MUST aplicar minificación completa al bundle generado. El archivo `dist/server.mjs` resultante MUST estar minificado.

---

## Sprint 6: Documentación v2.2.0

**Versión origen**: v2.2.0 (sprint6)

**REQ-DOCS-610**: `backend/src/config/swagger.ts` MUST set API version to `"2.2.0"`.

**REQ-DOCS-611**: Swagger MUST document `GET /api/bot/properties` and `GET /api/bot/tours` endpoints with parameters, responses, and `BOT_SECRET` authentication scheme.

**REQ-DOCS-612**: Swagger MUST include global schemas `Property`, `Tour`, `Reservation`, `BotProperty`, and `BotTour`.

**REQ-DOCS-620**: All new or modified files in Sprint 6 MUST have bilingual JSDoc (`@description` in ES and EN) with `@param` and `@returns` where applicable.

**REQ-DOCS-630**: `docs/ROADMAP.md` MUST include a `## Sprint 6` section listing all 6 sprint areas and their status.

**REQ-DOCS-640**: `CHANGELOG.md` MUST have a `## [2.2.0]` entry with Added, Changed, and Fixed sections for Sprint 6.

**REQ-DOCS-650**: `frontend/README.md`, `backend/README.md`, and `bot/README.md` MUST exist and describe their respective packages.

---

**Fuente**: openspec/changes/archive/2026-04-07-sprint6/specs/build-docker-hardening/spec.md + specs/documentacion/spec.md
**Versión**: v2.2.0
**Archived**: 2026-04-07

---

## Sprint 7: Bot/WhatsApp Stability & Health (v2.3.0)

**Versión origen**: v2.3.0 (sprint7)
**Fecha**: 2026-04-08

### Requirement: Health Endpoint para Integración Bot

El backend MUST exponer `GET /api/bot/health` como endpoint de health check dedicado para la integración del bot. Esto permite al bot verificar la disponibilidad del backend antes de enviar notificaciones proactivas.

**REQ-ARCH-710**: El endpoint `GET /api/bot/health` MUST estar documentado en Swagger con el esquema de autenticación `BOT_SECRET`.

**REQ-ARCH-711**: `backend/src/config/swagger.ts` MUST actualizar la versión de la API a `"2.3.0"`.

**REQ-ARCH-712**: El response schema del health endpoint MUST incluir los campos: `status` (string), `timestamp` (ISO datetime), `service` (string), y `config` (objeto con flags booleanos).

### Requirement: Utilidad withRetry para Resiliencia

El bot MUST contar con una función utilitaria `withRetry<T>()` que envuelva llamadas asíncronas con lógica de reintento y backoff exponencial. Esta utilidad aumenta la resiliencia de todas las llamadas al backend y a webhooks externos (n8n, Google Calendar).

**REQ-ARCH-720**: `bot/src/utils/withRetry.ts` MUST exportar `withRetry<T>()` como función genérica con firma: `withRetry<T>(fn: () => Promise<T>, maxAttempts: number, baseDelay: number): Promise<T>`.

**REQ-ARCH-721**: La implementación MUST usar backoff exponencial: `delay = baseDelay * 2^(attempt-1)`.

**REQ-ARCH-722**: Todos los flows del bot que realizan llamadas HTTP externas SHOULD usar `withRetry` con al menos 3 intentos.

### Requirement: Disconnect Handler Robusto

El bot MUST implementar un handler de desconexión de Baileys que distingue entre desconexiones recuperables y permanentes (logout), y actúa en consecuencia. Esto es crítico para la disponibilidad del bot 24/7.

**REQ-ARCH-730**: El disconnect handler MUST estar implementado en `bot/src/connection/disconnectHandler.ts` (o equivalente).

**REQ-ARCH-731**: El número máximo de reconexiones (`MAX_RECONNECT_ATTEMPTS`) MUST ser configurable via variable de entorno con fallback a 5.

**REQ-ARCH-732**: El sistema de reconexión MUST usar `withRetry` internamente para mantener consistencia en la lógica de backoff.

**REQ-ARCH-733**: Toda transición de estado de conexión (conectado, desconectado, reconectando) MUST ser registrada con el logger estructurado del bot.

### Requirement: Documentación v2.3.0

**REQ-DOCS-710**: `CHANGELOG.md` MUST tener una entrada `## [2.3.0]` con secciones Added, Changed, y Fixed para Sprint 7.

**REQ-DOCS-711**: `docs/ROADMAP.md` MUST incluir una sección `## Sprint 7` con las áreas de estabilidad del bot y su estado.

**REQ-DOCS-712**: `docs/API.md` MUST documentar `GET /api/bot/health` con ejemplos de request/response para respuesta exitosa (200) y no autorizada (401).

---

**Fuente**: openspec/changes/sprint7-v2.3.0/specs/architecture/spec.md
**Versión**: v2.3.0
**Fecha**: 2026-04-08
