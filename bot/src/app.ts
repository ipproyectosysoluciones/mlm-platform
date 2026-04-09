import 'dotenv/config';
import {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
  EVENTS,
  MemoryDB,
} from '@builderbot/bot';
// @ts-ignore — BaileysProvider is exported at runtime but TS NodeNext resolver
// fails to resolve the re-export chain in provider-baileys' .d.ts files.
import { BaileysProvider } from '@builderbot/provider-baileys';

import { welcomeFlow } from './flows/welcome.flow.js';
import { balanceFlow } from './flows/balance.flow.js';
import { networkFlow } from './flows/network.flow.js';
import { supportFlow } from './flows/support.flow.js';
import { scheduleFlow } from './flows/schedule.flow.js';
import { handoffFlow } from './flows/handoff.flow.js';
import { propertiesFlow } from './flows/properties.flow.js';
import { toursFlow } from './flows/tours.flow.js';
import { reservationsFlow } from './flows/reservations.flow.js';

// ── Config ────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.BOT_PORT ?? 3002);

/**
 * Maximum number of automatic reconnection attempts before the process exits.
 * BaileysProvider handles the first few retries internally; this counter guards
 * against infinite loops at the application level.
 *
 * Número máximo de intentos de reconexión automática antes de que el proceso salga.
 * BaileysProvider maneja los primeros reintentos internamente; este contador protege
 * contra loops infinitos a nivel de aplicación.
 */
const MAX_RECONNECT_ATTEMPTS = Number(process.env.BOT_MAX_RECONNECT ?? 5);

// ── Provider ──────────────────────────────────────────────────────────────────

const provider = createProvider(BaileysProvider, {
  /**
   * QR mode — more reliable than pairing code for initial setup.
   * Scan the QR printed in logs with WhatsApp > Linked Devices > Link a Device.
   * Once connected the session is persisted in the bot_sessions volume.
   *
   * browser: spoof as WhatsApp Desktop to avoid 405 connection rejections.
   */
  experimentalStore: true,
  timeRelease: 10800000,
  browser: ['Nexo Bot', 'Desktop', '3.0.0'],
});

// ── Database ──────────────────────────────────────────────────────────────────
// Using MemoryDB for MVP — conversation state is managed in ai.service.ts.
// Can be upgraded to PostgreSQLDB in a future sprint for persistence across restarts.

const database = new MemoryDB();

// ── Flows ─────────────────────────────────────────────────────────────────────

/**
 * "comisiones" keyword — re-uses networkFlow logic (shows last commissions inline).
 * We create a thin alias flow here rather than duplicating network.flow.ts.
 */
const commissionsKeywordFlow = addKeyword(['comisiones', 'mis comisiones', 'ver comisiones'] as [
  string,
  ...string[],
]).addAction(async (ctx: any, utils: any) => {
  // Delegate to networkFlow which already includes commissions in its response
  await utils.gotoFlow(networkFlow);
});

const flow = createFlow([
  welcomeFlow,
  balanceFlow,
  networkFlow,
  supportFlow,
  scheduleFlow,
  handoffFlow,
  commissionsKeywordFlow,
  propertiesFlow,
  toursFlow,
  reservationsFlow,
]);

// ── Bootstrap ─────────────────────────────────────────────────────────────────

const main = async () => {
  const { httpServer } = await createBot({
    flow,
    provider,
    database,
  });

  /**
   * Start the built-in HTTP server on BOT_PORT.
   * This exposes:
   *   POST /v1/messages  — send a message to a number (proactive notification)
   *   GET  /v1/chats     — list active chats (debug)
   *
   * The MLM backend uses POST /v1/messages to send proactive notifications:
   *   - Commission earned
   *   - Welcome after registration
   *   - Withdrawal status update
   *
   * Example payload:
   *   { "number": "5491122334455", "message": "Tu comisión de $50 fue acreditada 🎉" }
   */
  httpServer(PORT);

  console.log(`[bot] ✅ WhatsApp bot running on port ${PORT}`);
  console.log(`[bot] 📱 Scan the QR code above with WhatsApp > Linked Devices > Link a Device`);

  // ── WhatsApp Disconnect Handler ──────────────────────────────────────────────

  /**
   * Listens to connection state changes emitted by the underlying Baileys socket.
   * BaileysProvider already attempts automatic reconnection internally, but we
   * need application-level awareness to:
   *   1. Log the disconnection with timestamp and reason.
   *   2. Alert ops (stdout here; hook into PagerDuty / Slack in production).
   *   3. Exit the process after MAX_RECONNECT_ATTEMPTS so the container/supervisor
   *      can perform a clean restart and re-auth.
   *
   * Escucha cambios de estado de conexión emitidos por el socket Baileys subyacente.
   * BaileysProvider ya intenta reconexión automática internamente, pero necesitamos
   * conciencia a nivel de aplicación para:
   *   1. Loguear la desconexión con timestamp y razón.
   *   2. Alertar a ops (stdout aquí; conectar a PagerDuty / Slack en producción).
   *   3. Salir del proceso después de MAX_RECONNECT_ATTEMPTS para que el contenedor/supervisor
   *      pueda hacer un reinicio limpio y re-autenticarse.
   */
  let reconnectCount = 0;

  // @ts-ignore — vendor is the raw Baileys WASocket; ev is typed in @whiskeysockets/baileys
  provider.vendor?.ev?.on(
    'connection.update',
    (update: {
      connection?: 'close' | 'open' | 'connecting';
      lastDisconnect?: { error?: Error & { output?: { statusCode?: number } } };
      qr?: string;
    }) => {
      const { connection, lastDisconnect } = update;

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const reason = lastDisconnect?.error?.message ?? 'unknown';

        console.warn(
          `[bot] ⚠️  WhatsApp disconnected at ${new Date().toISOString()} — reason: ${reason} (status: ${statusCode ?? 'n/a'})`
        );

        // 401 = logged out by WhatsApp (e.g. device removed). No point in retrying.
        // 401 = cerrado de sesión por WhatsApp (ej: dispositivo eliminado). No tiene sentido reintentar.
        if (statusCode === 401) {
          console.error(
            '[bot] ❌ Session invalidated by WhatsApp (401). Manual re-scan required. Exiting.'
          );
          process.exit(1);
        }

        reconnectCount++;
        if (reconnectCount >= MAX_RECONNECT_ATTEMPTS) {
          console.error(
            `[bot] ❌ Reached max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}). Exiting for clean restart.`
          );
          process.exit(1);
        }

        console.info(
          `[bot] 🔄 Reconnect attempt ${reconnectCount}/${MAX_RECONNECT_ATTEMPTS} — BaileysProvider will retry automatically.`
        );
      }

      if (connection === 'open') {
        if (reconnectCount > 0) {
          console.info(`[bot] ✅ Reconnected successfully after ${reconnectCount} attempt(s).`);
        }
        reconnectCount = 0;
      }
    }
  );
};

main().catch((err) => {
  console.error('[bot] ❌ Fatal error:', err);
  process.exit(1);
});
