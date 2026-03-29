# Tasks: Playwright Visual Testing

## Phase 1: Scripts de Package.json

- [x] **1.1** Agregar script `test:e2e`
  - Archivo: `frontend/package.json`
  - Comando: `playwright test`
  - AC: Script existe y funciona

- [x] **1.2** Agregar script `test:e2e:headed`
  - Archivo: `frontend/package.json`
  - Comando: `playwright test --headed`
  - AC: Abre navegador visible

- [x] **1.3** Agregar script `test:e2e:ui`
  - Archivo: `frontend/package.json`
  - Comando: `playwright test --ui`
  - AC: Abre UI interactiva

- [x] **1.4** Agregar script `test:e2e:debug`
  - Archivo: `frontend/package.json`
  - Comando: `playwright test --debug`
  - AC: Modo debug funciona

## Phase 2: Documentación

- [x] **2.1** Actualizar TESTING.md
  - Archivo: `docs/TESTING.md`
  - AC: Incluye sección de Visual Testing con comandos

## Phase 3: Verificación

- [x] **3.1** Verificar scripts funcionan
  - Comando: `pnpm test:e2e --list`
  - AC: Lista de tests visible

- [ ] **3.2** Verificar modo headed
  - Comando: `pnpm test:e2e:headed`
  - AC: Navegador abre y tests ejecutan
