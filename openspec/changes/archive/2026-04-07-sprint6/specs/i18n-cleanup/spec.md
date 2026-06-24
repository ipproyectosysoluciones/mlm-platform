# i18n Cleanup Specification

## Purpose

Limpieza de deuda técnica en los archivos de internacionalización. Elimina claves duplicadas, corrige nombres semánticamente incorrectos y elimina un archivo huérfano.

---

## Requirements

### Requirement: Eliminación de Claves Duplicadas en es.json y en.json

El sistema MUST eliminar todas las claves duplicadas de los namespaces `nav`, `twoFactor` y `common` en `es.json` y `en.json`. Cuando existan dos versiones de una clave, MUST conservarse la versión más completa (mayor número de keys).

#### Scenario: Duplicado en namespace `common` — conservar versión extendida

- GIVEN `es.json` tiene dos definiciones del namespace `common`
- WHEN se aplica la limpieza
- THEN queda una única definición de `common` con todas las keys de la versión más extendida (18 keys aprox.)
- AND ninguna key de la versión corta se pierde si es única en ella

#### Scenario: Duplicado en namespace `nav`

- GIVEN `es.json` tiene claves `nav` duplicadas
- WHEN se aplica la limpieza
- THEN queda una única sección `nav` con las keys unificadas

#### Scenario: Duplicado en `en.json`

- GIVEN `en.json` tiene los mismos namespaces duplicados que `es.json`
- WHEN se aplica la limpieza
- THEN ambos archivos quedan sin duplicados y son JSON válidos

#### Scenario: Componente existente no rompe

- GIVEN un componente usa una key del namespace `common`
- WHEN se aplica la limpieza (conservando la key)
- THEN el componente sigue renderizando correctamente sin error de traducción

---

### Requirement: Renombrar Clave admin.ratio → admin.networkDistribution

El sistema MUST reemplazar la clave `admin.ratio` por `admin.networkDistribution` en `es.json` y `en.json`. Los valores MUST ser "Distribución de Red" (es) y "Network Distribution" (en).

#### Scenario: Clave renombrada en es.json

- GIVEN `es.json` tiene `admin.ratio`
- WHEN se aplica el cambio
- THEN `admin.ratio` no existe más y `admin.networkDistribution` tiene valor "Distribución de Red"

#### Scenario: Clave renombrada en en.json

- GIVEN `en.json` tiene `admin.ratio`
- WHEN se aplica el cambio
- THEN `admin.networkDistribution` tiene valor "Network Distribution"

#### Scenario: Componente que usa admin.ratio actualizado

- GIVEN un componente referencia `t('admin.ratio')`
- WHEN se aplica el cambio y el componente es actualizado a `t('admin.networkDistribution')`
- THEN el componente renderiza "Distribución de Red" o "Network Distribution" según el locale activo

---

### Requirement: Eliminación de DashboardStreaming.tsx

El sistema MUST eliminar el archivo `frontend/src/pages/DashboardStreaming.tsx`. Este archivo MUST NOT tener ninguna ruta activa, import, ni referencia en el codebase al momento de su eliminación.

#### Scenario: Archivo eliminado sin referencias activas

- GIVEN `DashboardStreaming.tsx` no tiene ruta registrada ni imports activos
- WHEN se elimina el archivo
- THEN el build de producción no genera errores por el archivo faltante

#### Scenario: Verificación previa de referencias

- GIVEN se va a eliminar el archivo
- WHEN se hace grep de `DashboardStreaming` en todo el proyecto
- THEN no aparecen referencias activas en rutas, imports, ni tests antes de proceder con la eliminación
