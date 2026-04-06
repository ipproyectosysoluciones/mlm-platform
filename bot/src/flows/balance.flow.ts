import { addKeyword } from '@builderbot/bot';
import { mlmApi } from '../services/mlm-api.service.js';

const BALANCE_KEYWORDS: [string, ...string[]] = [
  'saldo',
  'balance',
  'mi saldo',
  'ver saldo',
  'billetera',
  'wallet',
];

/**
 * Balance flow — responds with wallet balance + pending withdrawals.
 * Requires the user to be identified (stored in state by welcomeFlow).
 */
export const balanceFlow = addKeyword(BALANCE_KEYWORDS).addAction(
  async (ctx: any, { state, flowDynamic }: any) => {
    const user =
      state.get('user') ??
      (await (async () => {
        const u = await mlmApi.getUserByPhone(ctx.from);
        await state.update({ user: u });
        return u;
      })());

    if (!user) {
      await flowDynamic([
        {
          body: '❌ No encontré una cuenta asociada a tu número.\n\n🌐 Registrate en:\nhttps://mlm-platform-ip-proyectosysoluciones.vercel.app/register',
        },
      ]);
      return;
    }

    const wallet = await mlmApi.getWalletBalance(user.id);

    if (!wallet) {
      await flowDynamic([
        { body: '⚠️ No pude obtener tu saldo en este momento. Intentá de nuevo en unos minutos.' },
      ]);
      return;
    }

    const currency = wallet.currency ?? 'USD';
    const fmt = (n: number) =>
      n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    await flowDynamic([
      {
        body:
          `💰 *Tu Wallet — MLM Platform*\n\n` +
          `✅ Saldo disponible: *${currency} ${fmt(wallet.balance)}*\n` +
          `⏳ Retiros pendientes: ${currency} ${fmt(wallet.pendingWithdrawals)}\n` +
          `📈 Total ganado: ${currency} ${fmt(wallet.totalEarned)}\n\n` +
          `Para retirar fondos, ingresá a la plataforma web.\n` +
          `🌐 https://mlm-platform-ip-proyectosysoluciones.vercel.app`,
      },
    ]);
  }
);
