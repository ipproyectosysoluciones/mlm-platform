# Design: Playwright Visual Testing

## Overview

Add npm scripts to frontend/package.json for visual E2E testing execution.

## Changes

### 1. frontend/package.json

Agregar sección scripts:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:ui:headed": "playwright test --ui --headed"
  }
}
```

### 2. frontend/playwright.config.ts

Configuración existente verificada para headed mode.

### 3. docs/TESTING.md

Agregar sección de Visual Testing:

```markdown
## Visual Testing (Playwright)

### Running Tests

#### Headless (Default - CI)

\`\`\`bash
cd frontend && pnpm test:e2e
\`\`\`

#### Headed (Visual)

\`\`\`bash
cd frontend && pnpm test:e2e:headed
\`\`\`
Opens browser window where you can observe tests executing.

#### UI Mode (Interactive)

\`\`\`bash
cd frontend && pnpm test:e2e:ui
\`\`\`
Opens Playwright UI with step-by-step control.

#### Single File

\`\`\`bash
cd frontend && pnpm playwright test e2e/auth.spec.ts --headed
\`\`\`
```

## Implementation Steps

1. Read frontend/package.json
2. Add new scripts section
3. Update TESTING.md documentation
4. Verify scripts work

## Files to Modify

| File                  | Change            |
| --------------------- | ----------------- |
| frontend/package.json | Add scripts       |
| docs/TESTING.md       | Add documentation |
