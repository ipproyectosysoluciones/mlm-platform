# Build Docker Hardening Specification

## Purpose

Garantizar que el build de producción no incluya source maps en la imagen Docker. Los source maps exponen el código fuente en producción y aumentan el tamaño de la imagen innecesariamente.

---

## Requirements

### Requirement: Eliminación Explícita de Source Maps en Build de Producción

El script `backend/scripts/build.mjs` MUST ejecutar `rm -f dist/*.map` al finalizar el proceso de build cuando `NODE_ENV=production`. Ningún archivo `.map` MUST existir en `dist/` después del build de producción.

#### Scenario: Build de producción sin source maps

- GIVEN `NODE_ENV=production` y se ejecuta el script de build
- WHEN el build completa exitosamente
- THEN no existe ningún archivo `*.map` en el directorio `dist/`
- AND el archivo `dist/server.mjs` existe y es funcional

#### Scenario: Build de desarrollo mantiene source maps

- GIVEN `NODE_ENV=development` o no se especifica entorno
- WHEN se ejecuta el script de build
- THEN los source maps pueden existir en `dist/` para debugging local

#### Scenario: Verificación en CI

- GIVEN el pipeline de CI ejecuta el build de producción
- WHEN el build termina
- THEN una verificación `ls dist/*.map` retorna vacío o error (sin archivos .map)

---

### Requirement: Dockerfile Copia Solo dist/server.mjs

El `backend/Dockerfile` MUST copiar únicamente `dist/server.mjs` al contenedor final. La instrucción COPY en el stage de producción MUST NOT incluir patrones que copien archivos `.map`.

#### Scenario: Imagen Docker sin source maps

- GIVEN el Dockerfile está correctamente configurado
- WHEN se construye la imagen Docker de producción
- THEN la imagen NO contiene archivos `*.map` en ninguna capa

#### Scenario: Verificación de contenido de imagen

- GIVEN la imagen Docker fue construida
- WHEN se ejecuta `docker run --rm <image> ls /app/dist/`
- THEN solo aparece `server.mjs` (y archivos necesarios) sin ningún `*.map`

---

### Requirement: Build de Producción con Minificación Completa

El build de producción MUST aplicar minificación completa al bundle generado. El archivo `dist/server.mjs` resultante MUST estar minificado.

#### Scenario: Build minificado en producción

- GIVEN la configuración de build tiene minificación habilitada para producción
- WHEN se ejecuta el build de producción
- THEN `dist/server.mjs` está minificado (sin espacios/comentarios superfluos, tamaño reducido vs. no-minificado)
