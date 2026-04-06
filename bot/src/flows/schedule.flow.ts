import { addKeyword } from '@builderbot/bot';
import { n8nService } from '../services/n8n.service.js';
import type { Language } from '../services/ai.service.js';

/**
 * @file schedule.flow.ts
 * @description Flow para agendar visitas a propiedades o reuniones de afiliados.
 *
 * Conversation flow:
 *   1. User triggers with keyword (agendar, visita, reunión, etc.)
 *   2. Bot asks for property/service of interest
 *   3. Bot asks for preferred date/time
 *   4. Bot confirms and fires n8n webhook → Google Calendar + Notion CRM
 *   5. Bot confirms to user
 *
 * @author Nexo Real Development Team
 */

// ─── Keywords ────────────────────────────────────────────────────────────────

const SCHEDULE_KEYWORDS: [string, ...string[]] = [
  'agendar',
  'agenda',
  'visita',
  'visitar',
  'quiero ver',
  'ver propiedad',
  'reunión',
  'reunion',
  'cita',
  'schedule',
  'visit',
  'appointment',
  'book a visit',
  'book visit',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MSG = {
  askInterest: {
    es: '📅 ¡Perfecto! Con gusto te agendo una visita.\n\n¿Qué propiedad o servicio te interesa? Podés escribirme el nombre, la zona, o el tipo (ej: *apartamento en Bogotá*, *paquete turístico*, *reunión de afiliados*).',
    en: "📅 Great! I'd be happy to schedule a visit for you.\n\nWhat property or service are you interested in? You can tell me the name, area, or type (e.g. *apartment in Bogotá*, *tourism package*, *affiliate meeting*).",
  },
  askDate: {
    es: '🗓️ ¿Cuándo te queda bien? Indicame una fecha y hora aproximada (ej: *martes 15 a las 10am*, *este viernes por la tarde*).',
    en: '🗓️ When works best for you? Give me a preferred date and time (e.g. *Tuesday the 15th at 10am*, *this Friday afternoon*).',
  },
  confirming: {
    es: '⏳ Un momento, estoy registrando tu solicitud...',
    en: "⏳ One moment, I'm registering your request...",
  },
  success: {
    es: (interest: string, date: string) =>
      `✅ *¡Listo! Tu visita quedó agendada.*\n\n` +
      `📍 *Interés:* ${interest}\n` +
      `🗓️ *Fecha preferida:* ${date}\n\n` +
      `Un asesor de Nexo Real se va a poner en contacto con vos para confirmar los detalles.\n\n` +
      `¿Hay algo más en lo que te pueda ayudar?`,
    en: (interest: string, date: string) =>
      `✅ *Done! Your visit has been scheduled.*\n\n` +
      `📍 *Interest:* ${interest}\n` +
      `🗓️ *Preferred date:* ${date}\n\n` +
      `A Nexo Real advisor will reach out to confirm the details.\n\n` +
      `Is there anything else I can help you with?`,
  },
  error: {
    es: '⚠️ Hubo un problema al registrar tu solicitud. Por favor escribí *ayuda* para hablar con un asesor directamente.',
    en: '⚠️ There was a problem registering your request. Please type *help* to speak with an advisor directly.',
  },
} as const;

// ─── Flow ─────────────────────────────────────────────────────────────────────

export const scheduleFlow = addKeyword(SCHEDULE_KEYWORDS)
  // Step 1: Ask what they want to visit/schedule
  .addAction(async (ctx: any, { state, flowDynamic }: any) => {
    const currentState = state.getMyState() as { lang?: Language };
    const lang: Language = currentState?.lang || 'es';

    await state.update({ schedulingStep: 'awaiting_interest', schedulingLang: lang });
    await flowDynamic([{ body: MSG.askInterest[lang] }]);
  })

  // Step 2: Capture interest, ask for date
  .addAction({ capture: true }, async (ctx: any, { state, flowDynamic }: any) => {
    const interest = (ctx.body || '').trim();

    if (!interest || interest.length < 3) {
      const lang: Language = (state.getMyState() as any)?.schedulingLang || 'es';
      await flowDynamic([{ body: MSG.askInterest[lang] }]);
      return;
    }

    const lang: Language = (state.getMyState() as any)?.schedulingLang || 'es';
    await state.update({ schedulingInterest: interest, schedulingStep: 'awaiting_date' });
    await flowDynamic([{ body: MSG.askDate[lang] }]);
  })

  // Step 3: Capture date, fire webhook, confirm
  .addAction({ capture: true }, async (ctx: any, { state, flowDynamic }: any) => {
    const currentState = state.getMyState() as {
      schedulingLang?: Language;
      schedulingInterest?: string;
      lang?: Language;
      userName?: string;
      agent?: string;
    };

    const lang: Language = currentState?.schedulingLang || currentState?.lang || 'es';
    const interest = currentState?.schedulingInterest || '(no especificado)';
    const preferredDate = (ctx.body || '').trim() || '(no especificada)';
    const phone: string = ctx.from;
    const name: string = currentState?.userName || phone;

    // Acknowledge while we fire the webhook
    await flowDynamic([{ body: MSG.confirming[lang] }]);

    const result = await n8nService.triggerScheduleVisit({
      phone,
      name,
      preferredDate,
      interest,
      language: lang,
    });

    // Clean up scheduling state
    await state.update({
      schedulingStep: null,
      schedulingInterest: null,
      schedulingLang: null,
    });

    if (result.success) {
      const successMsg =
        lang === 'es'
          ? MSG.success.es(interest, preferredDate)
          : MSG.success.en(interest, preferredDate);
      await flowDynamic([{ body: successMsg }]);
    } else {
      console.error(`[scheduleFlow] n8n webhook failed for ${phone}:`, result.error);
      await flowDynamic([{ body: MSG.error[lang] }]);
    }
  });
