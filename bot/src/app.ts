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

// ── Config ────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.BOT_PORT ?? 3002);

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
};

main().catch((err) => {
  console.error('[bot] ❌ Fatal error:', err);
  process.exit(1);
});
