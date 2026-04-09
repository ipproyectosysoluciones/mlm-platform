import { addKeyword, EVENTS } from '@builderbot/bot';
import { aiService, type AgentName, type Language } from '../services/ai.service.js';
import { resolveLanguageFromInput } from './language.flow.js';
import { assignAgent, getAgentIntro, getAgentTransitionMessage } from './agent.flow.js';
import { leadPersistenceService } from '../services/lead-persistence.service.js';
import type { BotLeadAreaOfInterest } from '../types/lead.types.js';
import { SKIP_KEYWORDS } from '../config/keywords.js';

/**
 * Welcome flow — Nexo Real AI Bot
 *
 * Conversation lifecycle:
 *   1. New message arrives → check state
 *   2. No lang set → ask for language (ES/EN)
 *   3. Lang set, no agent → ask for name → assign Sophia or Max
 *   4. Agent assigned → ask for email (optional, skippable)
 *   5. Email captured → ask for area of interest → save lead (fire & forget)
 *   6. Lead saved → full AI conversation
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
      awaitingEmail?: boolean;
      awaitingAreaOfInterest?: boolean;
      userName?: string;
      userEmail?: string;
      areaOfInterest?: BotLeadAreaOfInterest;
      leadSaved?: boolean;
    };

    // ── STEP 1: Language not set yet ─────────────────────────────────────────
    if (!currentState?.lang) {
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

      const lang = await resolveLanguageFromInput(incomingText, state, flowDynamic);

      if (!lang) {
        await flowDynamic([
          {
            body:
              'No entendí tu elección. Por favor escribí *1* para Español o *2* para English.\n' +
              "I didn't catch that. Please type *1* for Spanish or *2* for English.",
          },
        ]);
        return;
      }

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
        const askName =
          lang === 'es' ? '¿Me decís tu nombre para presentarme?' : 'Could you tell me your name?';
        await flowDynamic([{ body: askName }]);
        await state.update({ awaitingName: true });
        return;
      }

      const userName = incomingText.length > 0 ? incomingText : 'amigo';
      const agent = await assignAgent(userName, state, flowDynamic, lang);

      await state.update({ userName, awaitingName: false });

      const intro = getAgentIntro(agent, lang);
      await flowDynamic([{ body: intro }]);

      // Ask for email (optional)
      // Pedir email (opcional)
      const askEmail =
        lang === 'es'
          ? '¿Me compartís tu email? (Opcional — escribí *omitir* si preferís no darlo 😊)'
          : "What's your email? (Optional — type *skip* if you'd prefer not to share it 😊)";

      await flowDynamic([{ body: askEmail }]);
      await state.update({ awaitingEmail: true });
      return;
    }

    const agent: AgentName = currentState.agent;
    const userName: string = currentState.userName || '';

    // ── STEP 3: Waiting for email ────────────────────────────────────────────
    if (currentState?.awaitingEmail) {
      const isSkip = SKIP_KEYWORDS.some((k) => incomingText.toLowerCase().includes(k));
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmail = emailRegex.test(incomingText);
      const userEmail = isSkip || !isEmail ? undefined : incomingText;

      await state.update({ userEmail, awaitingEmail: false });

      // Ask for area of interest
      // Pedir área de interés
      const askArea =
        lang === 'es'
          ? '¿Qué es lo que más te interesa de Nexo Real?\n\n' +
            '1️⃣  Propiedades\n' +
            '2️⃣  Paquetes turísticos\n' +
            '3️⃣  Programa de afiliados\n' +
            '4️⃣  Información general'
          : 'What interests you most about Nexo Real?\n\n' +
            '1️⃣  Properties\n' +
            '2️⃣  Tour packages\n' +
            '3️⃣  Affiliate program\n' +
            '4️⃣  General information';

      await flowDynamic([{ body: askArea }]);
      await state.update({ awaitingAreaOfInterest: true });
      return;
    }

    // ── STEP 4: Waiting for area of interest → save lead ────────────────────
    if (currentState?.awaitingAreaOfInterest && !currentState?.leadSaved) {
      const areaMap: Record<string, BotLeadAreaOfInterest> = {
        '1': 'properties',
        propiedad: 'properties',
        propiedades: 'properties',
        properties: 'properties',
        property: 'properties',
        '2': 'tours',
        tour: 'tours',
        tours: 'tours',
        turistico: 'tours',
        turístico: 'tours',
        '3': 'affiliates',
        afiliado: 'affiliates',
        afiliados: 'affiliates',
        affiliate: 'affiliates',
        affiliates: 'affiliates',
        '4': 'general',
        general: 'general',
      };

      const key = incomingText.toLowerCase().trim();
      const areaOfInterest: BotLeadAreaOfInterest = areaMap[key] ?? 'other';

      await state.update({ areaOfInterest, awaitingAreaOfInterest: false, leadSaved: true });

      // Persist lead — fire and forget (errors are caught inside the service)
      // Persistir lead — fire and forget (los errores se capturan dentro del servicio)
      void leadPersistenceService.saveLead({
        name: userName,
        phone,
        email: currentState.userEmail,
        areaOfInterest,
        agentName: agent,
        language: lang,
        source: 'whatsapp_bot',
      });

      // Transition to AI conversation
      // Transición a conversación con IA
      const readyMsg =
        lang === 'es'
          ? `¡Perfecto, ${userName}! Ahora sí, contame — ¿en qué puedo ayudarte hoy? 😊`
          : `Perfect, ${userName}! Now tell me — how can I help you today? 😊`;

      await flowDynamic([{ body: readyMsg }]);
      return;
    }

    // ── STEP 5: Full AI conversation ─────────────────────────────────────────
    if (!incomingText) return;

    try {
      const response = await aiService.chat(phone, incomingText, agent, lang);

      // Check if agent should switch based on name mention mid-conversation
      // (e.g. user says "mi nombre es María" later)
      // For now we keep the assigned agent — can be enhanced later

      await flowDynamic([{ body: response.text }]);
    } catch (error) {
      console.error('[welcomeFlow] AI error:', error);
      const errorMsg =
        lang === 'es'
          ? 'Tuve un problema técnico. ¿Podés repetir tu mensaje? Si el problema persiste, escribí *ayuda*. 🙏'
          : 'I had a technical issue. Could you repeat your message? If the problem persists, type *help*. 🙏';
      await flowDynamic([{ body: errorMsg }]);
    }
  }
);
