import { addKeyword } from '@builderbot/bot';

const SUPPORT_KEYWORDS: [string, ...string[]] = [
  'ayuda',
  'help',
  'soporte',
  'opciones',
  'menu',
  'menú',
  'que puedo hacer',
  'qué puedo hacer',
  'comandos',
];

/**
 * Support / FAQ flow — shows all available commands and a link to the platform.
 */
export const supportFlow = addKeyword(SUPPORT_KEYWORDS).addAnswer(
  `❓ *Opciones disponibles — Nexo Bot*\n\n` +
    `💰 *saldo* — Ver tu balance de wallet\n` +
    `🌐 *mi red* — Ver resumen de tu red y referidos\n` +
    `📋 *comisiones* — Ver tus últimas comisiones\n` +
    `📅 *agendar* — Agendar una visita o reunión\n` +
    `👤 *hablar con un asesor* — Conectarte con una persona real\n` +
    `❓ *ayuda* — Ver este menú\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🌐 *Plataforma web:*\nhttps://nexoreal.com\n\n` + // TODO: domain pending
    `Si tenés algún problema, podés escribirme en cualquier momento. 😊`
);
