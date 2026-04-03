# Testing Documentation / Documentación de Testing

## Español

Esta guía explica cómo ejecutar y escribir tests para la plataforma MLM.

### Tipos de Tests

| Tipo                    | Herramienta      | Propósito                       |
| ----------------------- | ---------------- | ------------------------------- |
| Unit/Unitarios          | Jest             | Funciones individuales aisladas |
| Integration/Integración | Jest + Supertest | Endpoints API con base de datos |
| E2E                     | Playwright       | Flujos completos en navegador   |

---

## English

This guide explains how to run and write tests for the MLM platform.

### Test Types

| Type        | Tool             | Purpose                       |
| ----------- | ---------------- | ----------------------------- |
| Unit        | Jest             | Isolated individual functions |
| Integration | Jest + Supertest | API endpoints with database   |
| E2E         | Playwright       | Complete browser flows        |

---

## Running Tests / Ejecutar Tests

### Backend - Integration Tests

```bash
cd backend

# All integration tests / Todos los tests de integración
pnpm test:integration

# Specific test file / Archivo específico
npx jest --config=jest.integration.config.js src/__tests__/integration/auth.test.ts

# With coverage / Con cobertura
pnpm test:integration --coverage
```

### Backend - Unit Tests

```bash
cd backend
pnpm test
```

### Frontend - E2E Tests

```bash
cd frontend

# Ensure servers are running / Asegurar que los servidores estén corriendo
# Backend on port 3000
# Frontend on port 5173

# Run all E2E tests / Ejecutar todos los E2E
pnpm test:e2e

# With browser visible / Con navegador visible
pnpm test:e2e:headed

# With Playwright UI / Con interfaz de Playwright
pnpm test:e2e:ui

# With UI and browser visible / Con interfaz y navegador visible
pnpm test:e2e:ui:headed

# Debug mode / Modo depuración
pnpm test:e2e:debug

# Specific test file / Archivo específico
pnpm test:e2e e2e/auth.spec.ts
```

---

## Writing Integration Tests / Escribir Tests de Integración

### Test Structure / Estructura de Tests

```typescript
/**
 * @fileoverview Auth Integration Tests
 * @description Tests for authentication endpoints
 *              Tests para endpoints de autenticación
 */

import { testAgent } from '../setup';
import { createTestUser, getAuthHeaders } from '../fixtures';

describe('Auth Integration Tests', () => {
  /**
   * Test: should login with valid credentials
   * Prueba: debe iniciar sesión con credenciales válidas
   */
  it('should login with valid credentials', async () => {
    const res = await testAgent
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'ValidPass123!' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });
});
```

### Test Fixtures / Fijaciones de Test

```typescript
// src/__tests__/fixtures.ts

/**
 * Create a test user with valid credentials
 * Crea un usuario de prueba con credenciales válidas
 */
export async function createTestUser(overrides = {}): Promise<User> {
  const passwordHash = await bcrypt.hash('TestPass123!', 12);
  return User.create({
    email: `test_${Date.now()}@mlm.test`,
    passwordHash,
    referralCode: `REF${Math.random().toString(36).toUpperCase()}`,
    ...overrides,
  });
}

/**
 * Get auth headers for a user
 * Obtiene headers de autenticación para un usuario
 */
export function getAuthHeaders(user: User): Record<string, string> {
  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  return { Authorization: `Bearer ${token}` };
}
```

### Test Setup / Configuración de Tests

```typescript
// src/__tests__/setup.ts

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  const { sequelize } = require('../config/database');
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  // Clean tables / Limpiar tablas
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await sequelize.query('DELETE FROM `commissions`');
  await sequelize.query('DELETE FROM `purchases`');
  await sequelize.query('DELETE FROM `users`');
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
});
```

---

## Test Database / Base de Datos de Tests

### MySQL Test Container

```bash
# Start MySQL container / Iniciar contenedor MySQL
docker run -d \
  --name mlm-test-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=mlm_test \
  -p 3306:3306 \
  mysql:8.0

# Or use existing / O usar existente
mysql -h 127.0.0.1 -u root -prootpassword -e "CREATE DATABASE IF NOT EXISTS mlm_test;"
```

### Environment Variables / Variables de Entorno

```bash
# .env.test
NODE_ENV=test
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=mlm_test
DB_USER=root
DB_PASSWORD=rootpassword
```

---

## Writing E2E Tests / Escribir Tests E2E

### Test Structure / Estructura

```typescript
// e2e/auth.spec.ts

import { test, expect } from '@playwright/test';
import { baseURL, testUser, login, logout } from './helpers';

test.describe('Auth Flow', () => {
  /**
   * Test: should login with valid credentials
   * Prueba: debe iniciar sesión con credenciales válidas
   */
  test('should login with valid credentials', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.locator('input[type="email"]').fill(testUser.email);
    await page.locator('input[type="password"]').fill(testUser.password);
    await page.getByRole('button', { name: /iniciar sesión|sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/bienvenido|welcome/i)).toBeVisible();
  });
});
```

### Bilingual Selectors / Selectores Bilingües

Since the UI supports both Spanish (ES) and English (EN), use flexible selectors:

```typescript
// ❌ Don't use hardcoded language
await page.getByRole('button', { name: 'Sign In' });
await page.getByText('Welcome');

// ✅ Use flexible patterns (ES first, then EN)
await page.getByRole('button', { name: /iniciar sesión|sign in/i });
await page.getByText(/bienvenido|welcome/i);

// ✅ For placeholders, use case-insensitive patterns
await page.getByPlaceholder(/email/i);
await page.getByPlaceholder(/contraseña|password/i);

// ✅ For logout button
await page.getByRole('button', { name: /cerrar sesión|logout/i });
```

### Helper Functions / Funciones Auxiliares

```typescript
// e2e/helpers.ts

import { Page } from '@playwright/test';

export const baseURL = 'http://localhost:5173';

export async function login(page: Page) {
  await page.goto(`${baseURL}/login`);
  await page.waitForLoadState('networkidle');

  // Flexible selectors for bilingual UI
  const emailInput = page.getByPlaceholder(/email/i);
  const passwordInput = page.getByPlaceholder(/contraseña|password/i);
  const submitButton = page.getByRole('button', { name: /iniciar sesión|sign in/i });

  await emailInput.fill(testUser.email);
  await passwordInput.fill(testUser.password);
  await submitButton.click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}

export async function logout(page: Page) {
  // Click user menu first
  const userMenuButton = page
    .locator('button')
    .filter({
      has: page.locator('[class*="rounded-full"]'),
    })
    .first();

  await userMenuButton.click();
  await page.waitForTimeout(300);

  // Try ES first, fallback to EN
  const logoutButton = page
    .getByRole('button', { name: /cerrar sesión|logout/i })
    .or(page.getByText(/cerrar sesión|logout/i));

  await logoutButton.click();
  await page.waitForURL(/\/login/, { timeout: 5000 });
}
```

---

## Test Best Practices / Mejores Prácticas

### DO ✅

- Use descriptive test names in both languages
- Clean up test data in `beforeEach`
- Use fixtures for reusable test data
- Test both success and error cases
- Keep tests independent and isolated

### DON'T ❌

- Don't share state between tests
- Don't hardcode IDs or specific data
- Don't test multiple things in one test
- Don't skip cleanup after tests

---

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: rootpassword
          MYSQL_DATABASE: mlm_test
        ports:
          - 3306:3306

    steps:
      - uses: actions/checkout@v4

      - name: Run Integration Tests
        run: |
          cd backend
          pnpm install
          pnpm test:integration

      - name: Run E2E Tests
        run: |
          cd frontend
          pnpm install
          pnpm test:e2e
```

---

## Test Coverage Summary / Resumen de Cobertura de Tests

### Overall Test Count / Cantidad Total de Tests

| Version | Unit | Integration | E2E | Total   |
| ------- | ---- | ----------- | --- | ------- |
| v1.8.x  | 93   | 178         | 37  | 308     |
| v1.9.0  | 93   | 208         | 37  | **338** |

### v1.9.0 New Tests / Nuevos Tests en v1.9.0

#### Achievements Tests (7 tests)

```bash
# Run achievement tests / Ejecutar tests de logros
cd backend
npx jest src/__tests__/integration/achievements.test.ts
```

**Coverage:**

- Get all achievements with user progress ✅
- Get user's unlocked achievements ✅
- Get achievement summary ✅
- Auto-unlock achievement on login ✅
- Auto-unlock achievement on first order ✅
- Progress tracking for multi-step achievements ✅
- Tier progression calculation ✅

#### Leaderboards Tests (14 tests)

```bash
# Run leaderboard tests / Ejecutar tests del leaderboard
cd backend
npx jest src/__tests__/integration/leaderboards.test.ts
```

**Coverage:**

- Get top sellers weekly ✅
- Get top sellers monthly ✅
- Get top sellers all-time ✅
- Get top referrers weekly ✅
- Get top referrers monthly ✅
- Get top referrers all-time ✅
- Get user rank as seller ✅
- Get user rank as referrer ✅
- Leaderboard Redis caching ✅
- Cache invalidation on new order ✅
- Cache invalidation on new referral ✅
- Rank calculation with ties ✅
- Percentile calculation accuracy ✅
- Limit parameter validation (max 50) ✅

#### MercadoPago Webhook Tests (9 tests)

```bash
# Run MercadoPago tests / Ejecutar tests de MercadoPago
cd backend
npx jest src/__tests__/integration/mercadopago.test.ts
```

**Coverage:**

- Webhook signature verification (HMAC-SHA256) ✅
- Invalid webhook signature rejection ✅
- Webhook idempotency (duplicate handling) ✅
- Payment status update from webhook ✅
- Commission calculation after payment ✅
- Achievement auto-unlock on order ✅
- Leaderboard update on new order ✅
- Currency conversion on international orders ✅
- Webhook rate limiting ✅

---

## Coverage Reports / Reportes de Cobertura

```bash
# Generate coverage report / Generar reporte de cobertura
cd backend
pnpm test:integration --coverage

# View HTML report / Ver reporte HTML
open coverage/lcov-report/index.html
```

---

## Troubleshooting / Solución de Problemas

### Tests are slow / Tests lentos

```bash
# Run tests in parallel / Ejecutar tests en paralelo
pnpm test:integration --maxWorkers=4

# Run only changed files / Solo archivos modificados
pnpm test:integration --onlyChanged
```

### Database connection errors / Errores de conexión a DB

```bash
# Ensure MySQL is running / Asegurar que MySQL esté corriendo
docker ps | grep mysql

# Check connection / Verificar conexión
mysql -h 127.0.0.1 -u root -prootpassword -e "SELECT 1"
```

### Playwright browser issues / Problemas de navegador Playwright

```bash
# Install browsers / Instalar navegadores
npx playwright install chromium

# Update browsers / Actualizar navegadores
npx playwright install --force
```
