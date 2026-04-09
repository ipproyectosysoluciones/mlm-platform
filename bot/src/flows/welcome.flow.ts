import { addKeyword, EVENTS } from '@builderbot/bot';
import { aiService, type AgentName, type Language } from '../services/ai.service.js';
import { logger } from '../services/logger.js';
import { resolveLanguageFromInput } from './language.flow.js';
import { assignAgent, getAgentIntro, getAgentTransitionMessage } from './agent.flow.js';

/**
 * Welcome flow — Nexo Real AI Bot
 *
 * Conversation lifecycle:
 *   1. New message arrives → check state
 *   2. No lang set → ask for language (ES/EN)
 *   3. Lang set, no agent → ask for name → assign Sophia or Max
 *   4. Agent assigned → forward all messages to AI service
 */
export const welcomeFlow = addKeyword(EVENTS.WELCOME).addAction(
  async (ctx: any, { state, flowDynamic }: any) => {
    const phone: string = ctx.from;
    const incomingText: string = (ctx.body || '').trim();

    const currentState = state.getMyState() as {
      lang?: Language;
      agent?: AgentName;
      awaitingLanguage?: boolean;
      awaitingName?: boolean;
      userName?: string;
    };

    // ── STEP 1: Language not set yet ─────────────────────────────────────────
    if (!currentState?.lang) {
      // If this is a first message (no awaitingLanguage flag), ask for language
      if (!currentState?.awaitingLanguage) {
        await flowDynamic([
          {
            body:
              '🌎 *Nexo Real* — Bienvenido / Welcome!\n\n' +
              'Por favor elegí tu idioma / Please choose your language:\n\n' +
              '1️⃣  Español\n' +
              '2️⃣  English',
          },
        ]);
        await state.update({ awaitingLanguage: true });
        return;
      }

      // Try to resolve language from their response
      const lang = await resolveLanguageFromInput(incomingText, state, flowDynamic);

      if (!lang) {
        // Could not detect language — ask again
        await flowDynamic([
          {
            body:
              'No entendí tu elección. Por favor escribí *1* para Español o *2* para English.\n' +
              "I didn't catch that. Please type *1* for Spanish or *2* for English.",
          },
        ]);
        return;
      }

      // Language confirmed — now ask for name
      const askName =
        lang === 'es'
          ? '¡Perfecto! 😊 Antes de empezar, ¿me decís tu nombre?'
          : 'Perfect! 😊 Before we start, could you tell me your name?';

      await flowDynamic([{ body: askName }]);
      await state.update({ awaitingName: true });
      return;
    }

    const lang: Language = currentState.lang;

    // ── STEP 2: Language set, waiting for name ───────────────────────────────
    if (!currentState?.agent) {
      if (!currentState?.awaitingName) {
        // Shouldn't happen, but recover gracefully
        const askName =
          lang === 'es' ? '¿Me decís tu nombre para presentarme?' : 'Could you tell me your name?';
        await flowDynamic([{ body: askName }]);
        await state.update({ awaitingName: true });
        return;
      }

      // Capture name and assign agent
      const userName = incomingText.length > 0 ? incomingText : 'amigo';
      const agent = await assignAgent(userName, state, flowDynamic, lang);

      await state.update({ userName, awaitingName: false });

      // Send agent intro
      const intro = getAgentIntro(agent, lang);
      await flowDynamic([{ body: intro }]);
      return;
    }

    const agent: AgentName = currentState.agent;
    const userName: string = currentState.userName || '';

    // ── STEP 3: Full AI conversation ─────────────────────────────────────────
    if (!incomingText) return;

    try {
      const response = await aiService.chat(phone, incomingText, agent, lang);

      // Check if agent should switch based on name mention mid-conversation
      // (e.g. user says "mi nombre es María" later)
      // For now we keep the assigned agent — can be enhanced later

      await flowDynamic([{ body: response.text }]);
    } catch (error) {
      const err = error as { message?: string };
      await logger.alert('openai.failed', { phone, agent, error: err?.message ?? String(error) });
      const errorMsg =
        lang === 'es'
          ? 'Tuve un problema técnico. ¿Podés repetir tu mensaje? Si el problema persiste, escribí *ayuda*. 🙏'
          : 'I had a technical issue. Could you repeat your message? If the problem persists, type *help*. 🙏';
      await flowDynamic([{ body: errorMsg }]);
    }
  }
);
