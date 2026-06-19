/**
 * @fileoverview Playwright Global Setup — Offline Authentication
 * @description Injects a mock JWT token and user data directly into localStorage
 *              via a browser page visit. No backend server required.
 *
 *              Inyecta un mock JWT token y datos de usuario directamente en
 *              localStorage vía una visita de página del browser. No requiere
 *              servidor backend.
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
 * Global setup: injects mock auth data into localStorage and saves storage state.
 * Setup global: inyecta datos de autenticación mock en localStorage y guarda el estado.
 */
async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL ?? 'http://localhost:5173';

  // Ensure .auth directory exists / Asegurar que el directorio .auth exista
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // ─── 1. Use hardcoded mock credentials — no backend call needed
  //        Usar credenciales mock hardcodeadas — no requiere llamada al backend
  const token = 'mock-jwt-token';
  const user = { id: '1', email: 'admin@mlm.com', role: 'admin' };

  console.log(`[global-setup] Using mock auth as ${user.email} (${user.role})`);

  // ─── 2. Open browser, navigate to app, inject token into localStorage
  //        Abrir browser, navegar al app, inyectar token en localStorage
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  // Navigate to any valid app page to establish the origin in the browser context
  // Navegar a cualquier página del app para establecer el origen en el contexto del browser
  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });

  // Inject the mock JWT token and user data into localStorage
  // Inyectar el mock JWT token y datos del usuario en localStorage
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
