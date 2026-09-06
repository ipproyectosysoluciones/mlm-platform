import 'dotenv/config';
import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot';
// @ts-ignore — BaileysProvider is exported at runtime but TS NodeNext resolver
// fails to resolve the re-export chain in provider-baileys' .d.ts files.
import { BaileysProvider } from '@builderbot/provider-baileys';
// @ts-ignore — PostgreSQLAdapter ships as CJS (index.cjs) with "type":"module" in its package.json,
// which confuses NodeNext moduleResolution. The adapter works correctly at runtime.
import { PostgreSQLAdapter } from '@builderbot/database-postgres';

import { welcomeFlow } from './flows/welcome.flow.js';
import { balanceFlow } from './flows/balance.flow.js';
import { networkFlow } from './flows/network.flow.js';
import { supportFlow } from './flows/support.flow.js';
import { scheduleFlow } from './flows/schedule.flow.js';
import { handoffFlow } from './flows/handoff.flow.js';
import { propertiesFlow } from './flows/properties.flow.js';
import { toursFlow } from './flows/tours.flow.js';
import { onboardingFlow } from './flows/onboarding.flow.js';
import { reservationsFlow } from './flows/reservations.flow.js';
import { COMMISSIONS_KEYWORDS } from './config/keywords.js';
import { BOT_PHONE_NUMBER } from './config/platform.js';

// ── Config ────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.BOT_PORT ?? 3002);

const MAX_RECONNECT_ATTEMPTS = Number(process.env.BOT_MAX_RECONNECT ?? 5);

// ── Provider ──────────────────────────────────────────────────────────────────

const provider = createProvider(BaileysProvider, {
  experimentalStore: true,
  timeRelease: 10800000,
});
// @ts-ignore — BaileysProvider stores options in globalVendorArgs; browser must be set after construction
// because @builderbot/provider-baileys@1.4.2 ignores the browser option in createProvider
// Status 405 fix: use a valid Chrome user agent since WhatsApp rejects the default
if (provider.globalVendorArgs) {
  provider.globalVendorArgs.browser = ['Windows', 'Chrome', '120.0.6099.109'];
}

// ── Database ──────────────────────────────────────────────────────────────────

const database = new PostgreSQLAdapter({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? 'mlm_db',
  user: process.env.DB_USER ?? 'mlm',
  password: process.env.DB_PASSWORD ?? '',
});

// ── Flows ─────────────────────────────────────────────────────────────────────

const commissionsKeywordFlow = addKeyword(COMMISSIONS_KEYWORDS).addAction(
  async (ctx: any, utils: any) => {
    await utils.gotoFlow(networkFlow);
  }
);

const flow = createFlow([
  welcomeFlow,
  onboardingFlow,
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

  httpServer(PORT);

  console.log(`[bot] ✅ WhatsApp bot running on port ${PORT}`);
  if (BOT_PHONE_NUMBER) {
    console.log(`[bot] 📱 Phone: ${BOT_PHONE_NUMBER}`);
  }
  console.log(`[bot] 📱 Scan the QR code above with WhatsApp > Linked Devices > Link a Device`);

  // ── WhatsApp Disconnect Handler ──────────────────────────────────────────────

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
