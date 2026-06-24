# Binary Balance Migration Specification

## Purpose

Migración de deuda técnica que renombra el valor de enumeración `binary_balance` a `network_balance` en el modelo `Achievement`. El cambio refleja la arquitectura real del sistema (Unilevel, no Binario) y MUST preservar todos los registros existentes.

---

## Requirements

### Requirement: Migración Sequelize — Renombrar condition_type

El sistema MUST proveer una migración Sequelize que ejecute un `UPDATE` en la tabla `Achievements` cambiando todos los registros donde `condition_type = 'binary_balance'` a `condition_type = 'network_balance'`. La migración MUST tener una función `down()` que restaure el valor original.

#### Scenario: Migración up ejecutada exitosamente

- GIVEN existen registros en `Achievements` con `condition_type = 'binary_balance'`
- WHEN se ejecuta `pnpm sequelize db:migrate`
- THEN todos esos registros tienen `condition_type = 'network_balance'`
- AND no se eliminan registros ni se alteran otros campos

#### Scenario: Migración up en tabla sin registros binary_balance

- GIVEN no existen registros con `condition_type = 'binary_balance'`
- WHEN se ejecuta la migración
- THEN la migración completa sin errores y 0 filas son afectadas

#### Scenario: Rollback con migración down

- GIVEN la migración fue ejecutada y existen registros con `network_balance`
- WHEN se ejecuta `pnpm sequelize db:migrate:undo`
- THEN todos los registros con `condition_type = 'network_balance'` vuelven a `'binary_balance'`

#### Scenario: Migración idempotente en segunda ejecución

- GIVEN la migración ya fue ejecutada
- WHEN se intenta ejecutar nuevamente
- THEN Sequelize la omite (ya marcada como ejecutada) sin error

---

### Requirement: Actualización del Modelo Achievement

El modelo `Achievement.ts` MUST actualizar el enum de `condition_type` reemplazando `'binary_balance'` por `'network_balance'`. El modelo MUST NOT referenciar el valor `'binary_balance'` tras el cambio.

#### Scenario: Modelo usa network_balance

- GIVEN `Achievement.ts` define el enum de condition_type
- WHEN se lee el modelo actualizado
- THEN el valor `'network_balance'` está presente y `'binary_balance'` no existe en el enum

---

### Requirement: Actualización Frontend en achievementService.ts

El servicio `achievementService.ts` MUST actualizar el tipo TypeScript correspondiente de `'binary_balance'` a `'network_balance'`. El sistema MUST NOT compilar si queda alguna referencia a `'binary_balance'`.

#### Scenario: Tipo actualizado en achievementService

- GIVEN `achievementService.ts` tenía un tipo con `'binary_balance'`
- WHEN se aplica el cambio
- THEN el tipo incluye `'network_balance'` y TypeScript compila sin errores relacionados

#### Scenario: Grep de binary_balance en todo el proyecto

- GIVEN se aplican todos los cambios de esta migración
- WHEN se ejecuta `grep -r 'binary_balance' .` en el proyecto
- THEN no aparece ningún resultado en archivos de código fuente (solo en historial git o docs de migración)
