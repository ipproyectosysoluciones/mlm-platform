# Spec: Playwright Visual Testing

## Overview

Allow E2E tests execution with Playwright in visual mode (headed) so users can observe tests running in real-time.

## Functional Requirements

### FR1: Scripts de Ejecución

- `pnpm test:e2e` - Run all E2E tests (headless, default)
- `pnpm test:e2e:headed` - Run with visible browser
- `pnpm test:e2e:ui` - Run with Playwright UI mode
- `pnpm test:e2e:debug` - Run in debug mode
- `pnpm test:e2e:ui:headed` - Run UI mode with visible browser

### FR2: Configuración de Playwright

- Modo headless: default para CI
- Modo headed: `--headed` flag
- Modo UI: `--ui` flag
- Modo debug: `--debug` flag

### FR3: Documentación

- Actualizar TESTING.md con nuevos comandos
- Incluir ejemplos de uso para cada modo

## Non-Functional Requirements

### NFR1: Performance

- Headless: rápido para CI
- Headed: más lento pero visible

### NFR2: Compatibilidad

- Chrome, Firefox, Safari
- Modo headed requiere display

## Test Scenarios

### TS1: Ejecución Headless (Default - CI)

```bash
cd frontend && pnpm test:e2e
```

Expected: Tests run without visible browser

### TS2: Ejecución Headed (Visual)

```bash
cd frontend && pnpm test:e2e:headed
```

Expected: Browser opens, user can see tests executing

### TS3: Ejecución UI (Interactive)

```bash
cd frontend && pnpm test:e2e:ui
```

Expected: Playwright UI opens with step-by-step control

### TS4: Ejecución Debug

```bash
cd frontend && pnpm test:e2e:debug
```

Expected: Opens debug mode with auto-stepping

### TS5: UI Mode con Headed

```bash
cd frontend && pnpm test:e2e:ui:headed
```

Expected: Playwright UI with visible browser

### TS6: Archivo Específico con Headed

```bash
cd frontend && pnpm playwright test e2e/auth.spec.ts --headed
```

Expected: Single test file runs in visible browser

## Files to Modify

| File                  | Change            |
| --------------------- | ----------------- |
| frontend/package.json | Add scripts       |
| docs/TESTING.md       | Add documentation |

## Acceptance Criteria

- [ ] Scripts agregados a package.json
- [ ] Documentación actualizada en TESTING.md
- [ ] Tests verificables en modo headed
- [ ] Modo debug disponible
- [ ] Modo UI con headed disponible
