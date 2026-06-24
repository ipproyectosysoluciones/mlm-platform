# Documentación Specification

## Purpose

Actualización de la documentación técnica del proyecto: versión Swagger bumped a v2.2.0 con schemas de los endpoints del bot, JSDoc bilingüe en archivos nuevos/modificados, ROADMAP.md con Sprint 6 y preparación de CHANGELOG.md v2.2.0.

---

## Requirements

### Requirement: Swagger Actualizado a v2.2.0 con Schemas del Bot

El archivo `backend/src/config/swagger.ts` MUST actualizar la versión de la API a `2.2.0`. MUST incluir documentación de los endpoints `GET /api/bot/properties` y `GET /api/bot/tours` con sus parámetros, respuestas y esquema de autenticación por `BOT_SECRET`.

#### Scenario: Swagger header en v2.2.0

- GIVEN `swagger.ts` tiene el header de versión
- WHEN se lee la configuración
- THEN el campo `version` o `info.version` es `"2.2.0"`

#### Scenario: Endpoint /api/bot/properties documentado

- GIVEN Swagger está actualizado
- WHEN se accede a la UI de Swagger
- THEN aparece el endpoint `GET /api/bot/properties` con descripción, parámetros de filtro y autenticación por `BOT_SECRET`

#### Scenario: Endpoint /api/bot/tours documentado

- GIVEN Swagger está actualizado
- WHEN se accede a la UI de Swagger
- THEN aparece el endpoint `GET /api/bot/tours` con descripción y autenticación por `BOT_SECRET`

#### Scenario: Schemas globales Property, Tour, Reservation

- GIVEN los schemas globales están definidos en swagger.ts
- WHEN se consulta la definición Swagger
- THEN existen schemas `Property`, `Tour` y `Reservation` referenciados por los endpoints correspondientes

---

### Requirement: JSDoc Bilingüe en Archivos Nuevos y Modificados

Todos los archivos nuevos o modificados en este sprint MUST tener JSDoc con descripciones en español e inglés. El JSDoc MUST incluir `@description` (bilingüe), `@param` y `@returns` donde aplique.

#### Scenario: Archivo nuevo con JSDoc bilingüe

- GIVEN se crea un nuevo archivo (ej. `properties.flow.ts`)
- WHEN se revisa el archivo
- THEN cada función exportada tiene un bloque JSDoc con `@description` en ES y EN, y `@param`/`@returns` tipados

#### Scenario: Archivo modificado con JSDoc actualizado

- GIVEN se modifica un archivo existente
- WHEN se agrega o modifica una función
- THEN el JSDoc de esa función es actualizado o creado con el formato bilingüe

---

### Requirement: ROADMAP.md con Sección Sprint 6

El archivo `docs/ROADMAP.md` MUST incluir una sección para Sprint 6 con las áreas trabajadas y su estado (completado/en progreso).

#### Scenario: Sprint 6 en ROADMAP

- GIVEN `docs/ROADMAP.md` existe con sprints anteriores documentados
- WHEN se lee el archivo actualizado
- THEN existe una sección `## Sprint 6` con las 6 áreas del sprint listadas

---

### Requirement: CHANGELOG.md con Entrada v2.2.0

El archivo `CHANGELOG.md` MUST tener una entrada para la versión `2.2.0` preparada con las secciones Added, Changed y Fixed correspondientes al Sprint 6.

#### Scenario: Entrada v2.2.0 en CHANGELOG

- GIVEN el CHANGELOG tiene entradas de versiones anteriores
- WHEN se lee el archivo
- THEN existe una sección `## [2.2.0]` con la fecha del release y los cambios del sprint 6 organizados por tipo (Added, Changed, Fixed)
