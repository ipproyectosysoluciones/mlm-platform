import 'dotenv/config';
import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot';
import { BaileysProvider } from '@builderbot/provider-baileys';
import { PostgreSQLDB } from '@builderbot/database-postgres';

import { welcomeFlow } from './flows/welcome.flow';
import { balanceFlow } from './flows/balance.flow';
import { networkFlow } from './flows/network.flow';
import { supportFlow } from './flows/support.flow';

// ── Config ────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.BOT_PORT ?? 3002);
const PHONE_NUMBER = process.env.PHONE_NUMBER ?? '';

if (!PHONE_NUMBER) {
  console.error('[bot] ❌ PHONE_NUMBER env var is required (e.g. 5491122334455)');
  process.exit(1);
}

// ── Provider ──────────────────────────────────────────────────────────────────

const provider = createProvider(BaileysProvider, {
  usePairingCode: true,
  phoneNumber: PHONE_NUMBER,
  /**
   * experimentalStore + timeRelease: best-practice for production Baileys.
   * timeRelease = 3h — keeps the store in memory and flushes stale entries.
   */
  experimentalStore: true,
  timeRelease: 10800000,
});

// ── Database ──────────────────────────────────────────────────────────────────

const database = new PostgreSQLDB({
  host: process.env.DB_HOST ?? 'postgres',
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'mlm_platform',
  port: Number(process.env.DB_PORT ?? 5432),
});

// ── Flows ─────────────────────────────────────────────────────────────────────

/**
 * "comisiones" keyword — re-uses networkFlow logic (shows last commissions inline).
 * We create a thin alias flow here rather than duplicating network.flow.ts.
 */
const commissionsKeywordFlow = addKeyword([
  'comisiones',
  'mis comisiones',
  'ver comisiones',
]).addAction(async (ctx, utils) => {
  // Delegate to networkFlow which already includes commissions in its response
  await utils.gotoFlow(networkFlow);
});

const flow = createFlow([
  welcomeFlow,
  balanceFlow,
  networkFlow,
  supportFlow,
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
  console.log(`[bot] 📱 Paired to phone: ${PHONE_NUMBER}`);
};

main().catch((err) => {
  console.error('[bot] ❌ Fatal error:', err);
  process.exit(1);
});
