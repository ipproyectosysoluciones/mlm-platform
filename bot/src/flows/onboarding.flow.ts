/**
 * @fileoverview Onboarding Flow — Nexo Real WhatsApp Bot
 * @description Sequential welcome flow for new users arriving at the bot for the first time.
 *              Shows the main menu and options available, then routes to specific flows.
 *              Flujo de bienvenida secuencial para nuevos usuarios que llegan al bot por primera vez.
 *              Muestra el menú principal y las opciones disponibles, luego enruta a flows específicos.
 *
 * This flow is triggered manually (via gotoFlow from welcomeFlow or support commands).
 * Este flow se activa manualmente (via gotoFlow desde welcomeFlow o comandos de soporte).
 *
 * @module flows/onboarding.flow
 */

import { addKeyword, EVENTS } from '@builderbot/bot';
import type { Language } from '../services/ai.service.js';

// ─── Menu Messages ────────────────────────────────────────────────────────────

/**
 * Main menu message per language.
 * Mensaje del menú principal por idioma.
 */
const MENU = {
  es:
    `🏡 *Bienvenido a Nexo Real*\n\n` +
    `Soy tu asistente virtual. Puedo ayudarte con:\n\n` +
    `1️⃣  *Propiedades* — buscar casas, departamentos, alquileres\n` +
    `2️⃣  *Tours* — paquetes turísticos y viajes\n` +
    `3️⃣  *Mi cuenta* — saldo, red de referidos, comisiones\n` +
    `4️⃣  *Agendar visita* — reservar una reunión o visita\n` +
    `5️⃣  *Hablar con asesor* — conectarte con una persona real\n\n` +
    `Escribí el número o el nombre de la opción. También podés preguntarme directamente lo que necesitás. 😊`,

  en:
    `🏡 *Welcome to Nexo Real*\n\n` +
    `I'm your virtual assistant. I can help you with:\n\n` +
    `1️⃣  *Properties* — search houses, apartments, rentals\n` +
    `2️⃣  *Tours* — tourism packages and travel\n` +
    `3️⃣  *My account* — balance, referral network, commissions\n` +
    `4️⃣  *Schedule a visit* — book a meeting or property visit\n` +
    `5️⃣  *Talk to an advisor* — connect with a real person\n\n` +
    `Type the number or name of the option. You can also ask me directly what you need. 😊`,
} as const;

// ─── Flow ─────────────────────────────────────────────────────────────────────

/**
 * Onboarding flow — shows the main menu to the user.
 * Can be triggered from support keywords or re-entered at any time.
 *
 * Flujo de onboarding — muestra el menú principal al usuario.
 * Puede ser activado desde keywords de soporte o re-ingresado en cualquier momento.
 *
 * @remarks
 * This flow uses EVENTS.ACTION to make it invokable via gotoFlow from other flows.
 * The welcomeFlow handles initial greeting + language + name — onboarding takes over after setup.
 * Este flow usa EVENTS.ACTION para ser invocable via gotoFlow desde otros flows.
 * El welcomeFlow maneja el saludo inicial + idioma + nombre — onboarding toma el control después del setup.
 */
export const onboardingFlow = addKeyword(EVENTS.ACTION).addAction(
  async (_ctx: any, { state, flowDynamic }: any) => {
    const currentState = state.getMyState() as { lang?: Language };
    const lang: Language = currentState?.lang ?? 'es';

    await flowDynamic([{ body: MENU[lang] }]);
  }
);
