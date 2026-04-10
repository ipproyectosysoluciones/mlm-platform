import { addKeyword } from '@builderbot/bot';
import { n8nService } from '../services/n8n.service.js';
import type { Language, AgentName } from '../services/ai.service.js';
import { HANDOFF_KEYWORDS } from '../config/keywords.js';

/**
 * @file handoff.flow.ts
 * @description Flow para escalar la conversación a un asesor humano.
 *
 * Triggers when:
 *   - User explicitly asks to speak with a human
 *   - User uses keywords like "hablar con persona", "asesor", "agente"
 *
 * What it does:
 *   1. Acknowledges the user warmly
 *   2. Fires n8n webhook → Notion CRM (mark lead as "Needs Human") +
 *      notifies the assigned agent via WhatsApp
 *   3. Sets handoff state so welcomeFlow stops routing to AI
 *
 * @author Nexo Real Development Team
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MSG = {
  acknowledging: {
    es: (agentName: string) =>
      `👤 Entendido. Voy a conectarte con *${agentName}*, uno de nuestros asesores de Nexo Real.\n\n` +
      `⏳ Un asesor se va a comunicar con vos a la brevedad. Nuestro horario de atención es *lunes a viernes de 8am a 6pm (Colombia)*.\n\n` +
      `Mientras tanto, si necesitás algo podés seguir escribiéndome. 😊`,
    en: (agentName: string) =>
      `👤 Got it. I'll connect you with *${agentName}*, one of our Nexo Real advisors.\n\n` +
      `⏳ An advisor will reach out to you shortly. Our support hours are *Monday to Friday, 8am to 6pm (Colombia time)*.\n\n` +
      `In the meantime, feel free to keep chatting with me. 😊`,
  },
  error: {
    es: '⚠️ No pude notificar al equipo ahora mismo, pero tu mensaje fue registrado. Un asesor te va a contactar pronto. 🙏',
    en: "⚠️ Couldn't notify the team right now, but your message was logged. An advisor will contact you soon. 🙏",
  },
} as const;

// Human agent display names (can be expanded to a lookup table later)
const AGENT_DISPLAY_NAMES: Record<AgentName, string> = {
  sophia: 'uno de nuestros asesores',
  max: 'una de nuestras asesoras',
};

const AGENT_DISPLAY_NAMES_EN: Record<AgentName, string> = {
  sophia: 'one of our advisors',
  max: 'one of our advisors',
};

// ─── Flow ─────────────────────────────────────────────────────────────────────

export const handoffFlow = addKeyword(HANDOFF_KEYWORDS).addAction(
  async (ctx: any, { state, flowDynamic }: any) => {
    const currentState = state.getMyState() as {
      lang?: Language;
      agent?: AgentName;
      userName?: string;
    };

    const lang: Language = currentState?.lang || 'es';
    const aiAgent: AgentName = currentState?.agent || 'sophia';
    const phone: string = ctx.from;
    const name: string = currentState?.userName || phone;

    // Pick a display name for the human advisor
    const humanAdvisorName =
      lang === 'es' ? AGENT_DISPLAY_NAMES[aiAgent] : AGENT_DISPLAY_NAMES_EN[aiAgent];

    // Acknowledge immediately — don't make them wait
    await flowDynamic([{ body: MSG.acknowledging[lang](humanAdvisorName) }]);

    // Mark as handed off so welcomeFlow stops routing to AI
    await state.update({ handedOff: true });

    // Fire n8n webhook asynchronously — don't block the user response
    n8nService
      .triggerHumanHandoff({
        phone,
        name,
        reason: (ctx.body || '').trim() || 'User requested human agent',
        agent: aiAgent,
        language: lang,
        escalatedAt: new Date().toISOString(),
      })
      .then((result) => {
        if (!result.success) {
          logger.error('handoff.webhook.failed', { phone, error: result.error });
          // We already sent the success message to user, so we send a soft error follow-up
          flowDynamic([{ body: MSG.error[lang] }]).catch(() => {});
        } else {
          logger.info('handoff.webhook.success', { phone, agent: aiAgent });
        }
      })
      .catch((err: unknown) => {
        logger.error('handoff.webhook.unexpected', {
          phone,
          error: err instanceof Error ? err.message : String(err),
        });
      });
  }
);
