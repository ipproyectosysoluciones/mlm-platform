/**
 * @fileoverview Lead Types — WhatsApp Bot
 * @description Type definitions for leads captured by the Nexo Real WhatsApp bot.
 *              Definiciones de tipos para leads capturados por el bot de WhatsApp de Nexo Real.
 * @module types/lead.types
 */

/**
 * Area of interest for a bot-captured lead.
 * Área de interés para un lead capturado por el bot.
 */
export type BotLeadAreaOfInterest = 'properties' | 'tours' | 'affiliates' | 'general' | 'other';

/**
 * Preferred language detected during bot conversation.
 * Idioma preferido detectado durante la conversación con el bot.
 */
export type BotLeadLanguage = 'es' | 'en';

/**
 * Data structure for a lead captured by the WhatsApp bot.
 * Estructura de datos para un lead capturado por el bot de WhatsApp.
 *
 * @property name           - Prospect's name as provided during onboarding / Nombre del prospecto
 * @property phone          - WhatsApp phone number in international format / Teléfono en formato internacional
 * @property email          - Optional email if provided during conversation / Email opcional si fue proporcionado
 * @property areaOfInterest - Topic the prospect showed interest in / Tema de interés del prospecto
 * @property agentName      - Bot agent that handled the conversation (Sophia or Max) / Agente bot que atendió
 * @property language       - Language used during the conversation / Idioma usado en la conversación
 * @property source         - Always 'whatsapp_bot' — identifies origin / Siempre 'whatsapp_bot'
 */
export interface BotLeadData {
  name: string;
  phone: string;
  email?: string;
  areaOfInterest?: BotLeadAreaOfInterest;
  agentName: string;
  language: BotLeadLanguage;
  source: 'whatsapp_bot';
}
