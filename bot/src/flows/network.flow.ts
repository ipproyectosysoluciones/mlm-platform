import { addKeyword } from '@builderbot/bot';
import { mlmApi } from '../services/mlm-api.service.js';
import { NETWORK_KEYWORDS } from '../config/keywords.js';

/**
 * Network flow — shows the user's downline summary: total referrals,
 * active members, binary legs (left/right), and current level.
 */
export const networkFlow = addKeyword(NETWORK_KEYWORDS).addAction(
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
          body: '❌ No encontré una cuenta asociada a tu número.\n\n🌐 Registrate en:\nhttps://nexoreal.com/register', // TODO: domain pending
        },
      ]);
      return;
    }

    const network = await mlmApi.getNetworkSummary(user.id);

    if (!network) {
      await flowDynamic([
        { body: '⚠️ No pude obtener tu red en este momento. Intentá de nuevo en unos minutos.' },
      ]);
      return;
    }

    const commissions = await mlmApi.getRecentCommissions(user.id);

    let commissionsText = '';
    if (commissions.length > 0) {
      commissionsText =
        '\n\n📋 *Últimas comisiones:*\n' +
        commissions
          .map((c: any) => {
            const date = new Date(c.createdAt).toLocaleDateString('es-AR');
            const amount = c.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 });
            return `• ${date} — $${amount} (${c.type})`;
          })
          .join('\n');
    }

    await flowDynamic([
      {
        body:
          `🌐 *Tu Red — Nexo Real*\n\n` +
          `👥 Total referidos: *${network.totalReferrals}*\n` +
          `✅ Referidos activos: *${network.activeReferrals}*\n` +
          `⬅️ Pierna izquierda: ${network.leftLeg}\n` +
          `➡️ Pierna derecha: ${network.rightLeg}\n` +
          `🏆 Nivel actual: *${network.level}*` +
          commissionsText +
          `\n\n🌐 Ver árbol completo:\nhttps://nexoreal.com/tree`, // TODO: domain pending
      },
    ]);
  }
);
