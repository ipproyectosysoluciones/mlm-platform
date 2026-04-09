import { addKeyword } from '@builderbot/bot';
import { mlmApi, type BotProperty } from '../services/mlm-api.service.js';
import { PROPERTIES_KEYWORDS } from '../config/keywords.js';

/**
 * Formats a list of properties into a human-readable WhatsApp message.
 * Formatea una lista de propiedades en un mensaje legible para WhatsApp.
 *
 * @param lang - Language code ('es' | 'en') / Código de idioma ('es' | 'en')
 * @param properties - Array of simplified property objects / Array de propiedades simplificadas
 * @returns Formatted message string / Cadena de mensaje formateada
 */
function formatPropertiesMessage(lang: string, properties: BotProperty[]): string {
  const isEs = lang !== 'en';

  if (properties.length === 0) {
    return isEs
      ? '🏠 No hay propiedades disponibles en este momento.\n\nVisitá la plataforma para más información:\n🌐 https://nexoreal.com/properties'
      : '🏠 No properties available at the moment.\n\nVisit the platform for more info:\n🌐 https://nexoreal.com/properties';
  }

  const header = isEs
    ? `🏠 *Propiedades Disponibles — Nexo Real*\n\nAquí tenés las últimas ${properties.length} opciones:\n`
    : `🏠 *Available Properties — Nexo Real*\n\nHere are the latest ${properties.length} options:\n`;

  const lines = properties.map((p, i) => {
    const typeLabel = isEs
      ? p.type === 'rental'
        ? 'Alquiler'
        : p.type === 'sale'
          ? 'Venta'
          : 'Gestión'
      : p.type === 'rental'
        ? 'Rental'
        : p.type === 'sale'
          ? 'Sale'
          : 'Management';

    const price = p.price.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const details: string[] = [];
    if (p.bedrooms != null) details.push(isEs ? `${p.bedrooms} hab.` : `${p.bedrooms} bed.`);
    if (p.bathrooms != null) details.push(isEs ? `${p.bathrooms} baños` : `${p.bathrooms} bath.`);
    if (p.areaM2 != null) details.push(`${p.areaM2} m²`);

    const detailStr = details.length > 0 ? ` | ${details.join(' · ')}` : '';

    return (
      `*${i + 1}. ${p.title}*\n` +
      `📍 ${p.city} — ${typeLabel}\n` +
      `💰 ${p.currency} ${price}${detailStr}`
    );
  });

  const footer = isEs
    ? `\n\n🔍 Ver todas las propiedades:\n🌐 https://nexoreal.com/properties`
    : `\n\n🔍 View all properties:\n🌐 https://nexoreal.com/properties`;

  return header + lines.join('\n\n') + footer;
}

/**
 * Properties flow — responds with a list of up to 5 active properties.
 * Flujo de propiedades — responde con una lista de hasta 5 propiedades activas.
 *
 * Triggered by keywords like "propiedades", "alquileres", "real estate".
 * Activado por palabras clave como "propiedades", "alquileres", "real estate".
 *
 * Flow steps / Pasos del flujo:
 * 1. Read user language from state (set by welcomeFlow) / Lee el idioma del state (definido por welcomeFlow)
 * 2. Call mlmApi.searchProperties({ limit: 5 }) / Llama a mlmApi.searchProperties({ limit: 5 })
 * 3. Format and send the response / Formatea y envía la respuesta
 */
export const propertiesFlow = addKeyword(PROPERTIES_KEYWORDS).addAction(
  async (_ctx: any, { state, flowDynamic }: any) => {
    const lang: string = state.get('lang') ?? 'es';

    let properties: BotProperty[] = [];

    try {
      properties = await mlmApi.searchProperties({ limit: 5 });
    } catch {
      const errorMsg =
        lang !== 'en'
          ? '⚠️ No pude obtener las propiedades en este momento. Intentá de nuevo en unos minutos.'
          : '⚠️ Could not fetch properties right now. Please try again in a few minutes.';

      await flowDynamic([{ body: errorMsg }]);
      return;
    }

    const message = formatPropertiesMessage(lang, properties);
    await flowDynamic([{ body: message }]);
  }
);
