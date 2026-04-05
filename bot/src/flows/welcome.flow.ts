import { addKeyword, EVENTS } from '@builderbot/bot';
import { mlmApi } from '../services/mlm-api.service';

/**
 * Welcome flow — triggered when a new message arrives from an unknown number.
 * Looks up the phone number in the MLM backend.
 * - If found: greets the affiliate by name with a menu
 * - If not found: prompts them to register on the web platform
 */
export const welcomeFlow = addKeyword(EVENTS.WELCOME).addAction(
  async (ctx, { state, flowDynamic, gotoFlow }) => {
    const phone = ctx.from;

    // Try to identify the user in the MLM platform
    const user = await mlmApi.getUserByPhone(phone);
    await state.update({ user });

    if (!user) {
      await flowDynamic([
        {
          body: `¡Hola! 👋 Soy el asistente de *MLM Platform*.\n\nNo encontré una cuenta asociada a tu número.\n\n🌐 Podés registrarte en:\nhttps://mlm-platform-ip-proyectosysoluciones.vercel.app/register`,
        },
      ]);
      return;
    }

    await flowDynamic([
      {
        body:
          `¡Hola, *${user.firstName}*! 👋 Bienvenido al asistente de *MLM Platform*.\n\n` +
          `¿Qué querés consultar hoy?\n\n` +
          `💰 *saldo* — Ver tu balance de wallet\n` +
          `🌐 *mi red* — Ver resumen de tu red\n` +
          `📋 *comisiones* — Ver tus últimas comisiones\n` +
          `❓ *ayuda* — Ver todas las opciones\n\n` +
          `Escribí cualquiera de esas palabras para comenzar.`,
      },
    ]);
  }
);
