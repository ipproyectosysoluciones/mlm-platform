import { addKeyword, EVENTS } from '@builderbot/bot';
import type { Language } from '../services/ai.service.js';
import { LANGUAGE_ES_KEYWORDS, LANGUAGE_EN_KEYWORDS } from '../config/keywords.js';

/**
 * Language detection flow.
 *
 * Triggered on WELCOME — asks the user to choose Spanish or English.
 * Stores the choice in BuilderBot state as `lang: Language`.
 *
 * Keywords are centralized in config/keywords.ts:
 *   - LANGUAGE_ES_KEYWORDS → 'es'
 *   - LANGUAGE_EN_KEYWORDS → 'en'
 */

/**
 * Detects language from user input using centralized keyword lists.
 * Detecta el idioma del input del usuario usando las listas centralizadas de keywords.
 *
 * @param text - Raw user input / Texto crudo del usuario
 * @returns 'es' | 'en' | null
 */
function detectLanguageFromText(text: string): Language | null {
  const normalized = text.trim().toLowerCase();
  if (LANGUAGE_ES_KEYWORDS.includes(normalized)) return 'es';
  if (LANGUAGE_EN_KEYWORDS.includes(normalized)) return 'en';
  return null;
}

/**
 * Language selection prompt flow.
 * Called from welcome.flow.ts when no language is set in state.
 */
export const languageFlow = addKeyword(EVENTS.ACTION).addAction(
  async (ctx: any, { state, flowDynamic, gotoFlow }: any) => {
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
  }
);

/**
 * Language response handler.
 * Captures the user's language choice and stores it in state.
 * Returns the chosen Language or null if not recognized.
 */
export async function resolveLanguageFromInput(
  input: string,
  state: any,
  flowDynamic: any
): Promise<Language | null> {
  const lang = detectLanguageFromText(input);

  if (!lang) return null;

  await state.update({ lang, awaitingLanguage: false });

  const confirmation =
    lang === 'es'
      ? '¡Perfecto! Continuamos en español. 😊'
      : "Perfect! We'll continue in English. 😊";

  await flowDynamic([{ body: confirmation }]);

  return lang;
}
