import { addKeyword } from '@builderbot/bot';
import { mlmApi, type BotTour } from '../services/mlm-api.service.js';

/**
 * Keywords that trigger the tours flow in Spanish and English.
 * Palabras clave que activan el flujo de tours en español e inglés.
 */
const TOURS_KEYWORDS: [string, ...string[]] = [
  'tours',
  'tours disponibles',
  'ver tours',
  'buscar tours',
  'paquetes',
  'paquetes turísticos',
  'viajes',
  'excursiones',
  'travel packages',
  'available tours',
  'tour packages',
];

/**
 * Formats a list of tour packages into a human-readable WhatsApp message.
 * Formatea una lista de paquetes turísticos en un mensaje legible para WhatsApp.
 *
 * @param lang - Language code ('es' | 'en') / Código de idioma ('es' | 'en')
 * @param tours - Array of simplified tour objects / Array de tours simplificados
 * @returns Formatted message string / Cadena de mensaje formateada
 */
function formatToursMessage(lang: string, tours: BotTour[]): string {
  const isEs = lang !== 'en';

  if (tours.length === 0) {
    return isEs
      ? '✈️ No hay tours disponibles en este momento.\n\nVisitá la plataforma para más información:\n🌐 https://nexoreal.com/tours'
      : '✈️ No tours available at the moment.\n\nVisit the platform for more info:\n🌐 https://nexoreal.com/tours';
  }

  const header = isEs
    ? `✈️ *Tours Disponibles — Nexo Real*\n\nAquí tenés los últimos ${tours.length} paquetes:\n`
    : `✈️ *Available Tours — Nexo Real*\n\nHere are the latest ${tours.length} packages:\n`;

  const lines = tours.map((t, i) => {
    const price = t.price.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const durationLabel = isEs
      ? `${t.durationDays} día${t.durationDays !== 1 ? 's' : ''}`
      : `${t.durationDays} day${t.durationDays !== 1 ? 's' : ''}`;

    const capacityLabel = isEs
      ? `hasta ${t.maxCapacity} personas`
      : `up to ${t.maxCapacity} people`;

    return (
      `*${i + 1}. ${t.title}*\n` +
      `📍 ${t.destination} — ${t.type}\n` +
      `💰 ${t.currency} ${price} | 📅 ${durationLabel} | 👥 ${capacityLabel}`
    );
  });

  const footer = isEs
    ? `\n\n🔍 Ver todos los tours:\n🌐 https://nexoreal.com/tours`
    : `\n\n🔍 View all tours:\n🌐 https://nexoreal.com/tours`;

  return header + lines.join('\n\n') + footer;
}

/**
 * Tours flow — responds with a list of up to 5 active tour packages.
 * Flujo de tours — responde con una lista de hasta 5 paquetes turísticos activos.
 *
 * Triggered by keywords like "tours", "paquetes", "viajes", "travel packages".
 * Activado por palabras clave como "tours", "paquetes", "viajes", "travel packages".
 *
 * Flow steps / Pasos del flujo:
 * 1. Read user language from state (set by welcomeFlow) / Lee el idioma del state (definido por welcomeFlow)
 * 2. Call mlmApi.searchTours({ limit: 5 }) / Llama a mlmApi.searchTours({ limit: 5 })
 * 3. Format and send the response / Formatea y envía la respuesta
 */
export const toursFlow = addKeyword(TOURS_KEYWORDS).addAction(
  async (_ctx: any, { state, flowDynamic }: any) => {
    const lang: string = state.get('lang') ?? 'es';

    let tours: BotTour[] = [];

    try {
      tours = await mlmApi.searchTours({ limit: 5 });
    } catch {
      const errorMsg =
        lang !== 'en'
          ? '⚠️ No pude obtener los tours en este momento. Intentá de nuevo en unos minutos.'
          : '⚠️ Could not fetch tours right now. Please try again in a few minutes.';

      await flowDynamic([{ body: errorMsg }]);
      return;
    }

    const message = formatToursMessage(lang, tours);
    await flowDynamic([{ body: message }]);
  }
);
