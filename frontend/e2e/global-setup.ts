/**
 * @fileoverview Playwright Global Setup — Authentication via direct API call
 * @description Authenticates by calling the backend API directly from Node.js
 *              (no CORS — Node doesn't enforce same-origin policy), then injects
 *              the JWT token into localStorage via a browser page visit.
 *
 *              Autentica llamando al backend API directamente desde Node.js
 *              (sin CORS — Node no aplica same-origin policy), luego inyecta
 *              el JWT en localStorage vía una visita de página del browser.
 *
 * @module e2e/global-setup
 */
import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname / __dirname compatible con ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Global setup: authenticates via Node.js fetch and injects token into localStorage.
 * Setup global: autentica vía fetch de Node.js e inyecta el token en localStorage.
 */
async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL ?? 'http://localhost:5173';

  // Ensure .auth directory exists / Asegurar que el directorio .auth exista
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // ─── 1. Login via Node.js fetch — NO CORS (Node doesn't enforce same-origin)
  //        Login vía fetch de Node.js — SIN CORS (Node no aplica same-origin)
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@mlm.com', password: 'admin123' }),
  });

  if (!loginRes.ok) {
    throw new Error(`Global setup: backend returned ${loginRes.status} for login`);
  }

  const json = (await loginRes.json()) as {
    success: boolean;
    data: { token: string; user: { id: string; email: string; role: string } };
  };

  if (!json.success || !json.data?.token) {
    throw new Error(`Global setup: unexpected payload: ${JSON.stringify(json)}`);
  }

  const { token, user } = json.data;
  console.log(`\n[global-setup] Authenticated via API as ${user.email} (${user.role})`);

  // ─── 2. Open browser, navigate to app, inject token into localStorage
  //        Abrir browser, navegar al app, inyectar token en localStorage
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  // Navigate to any valid app page to establish the origin in the browser context
  // Navegar a cualquier página del app para establecer el origen en el contexto del browser
  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });

  // Inject the JWT token (and user data for faster hydration) into localStorage
  // Inyectar el JWT token (y datos del user para hidratación rápida) en localStorage
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('token', token);
      // Also cache user to reduce /api/auth/me calls on hydration
      // También cachear user para reducir llamadas a /api/auth/me en hidratación
      localStorage.setItem('mlm_user_cache', JSON.stringify(user));
    },
    { token, user }
  );

  // ─── 3. Save the full storage state (localStorage + sessionStorage + cookies)
  //        Guardar el estado completo de storage (localStorage + sessionStorage + cookies)
  const storageStatePath = path.join(authDir, 'admin.json');
  await context.storageState({ path: storageStatePath });
  console.log(`[global-setup] ✓ Storage state saved → ${storageStatePath}`);

  await browser.close();
}

export default globalSetup;
