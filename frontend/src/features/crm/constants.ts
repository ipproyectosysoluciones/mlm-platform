/**
 * @fileoverview CRM shared constants — status colors, email templates, tab definitions
 * @description Centralized constants extracted from CRM.tsx to avoid duplication.
 *              Used by hooks, components, and the main CRM page.
 *
 * ES: Constantes compartidas de CRM — colores de estado, plantillas de email, definiciones de tabs.
 * EN: CRM shared constants — status colors, email templates, tab definitions.
 *
 * @module features/crm/constants
 */

import type { i18n as I18nInstance } from 'i18next';

// ============================================================================
// Status Colors
// ============================================================================

/**
 * Tailwind color classes for each lead status.
 * Duplicated in LeadCard.tsx — both should import from here.
 * Clases de color Tailwind para cada estado de lead.
 */
export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: 'bg-blue-100', text: 'text-blue-700' },
  contacted: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  qualified: { bg: 'bg-purple-100', text: 'text-purple-700' },
  proposal: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  negotiation: { bg: 'bg-orange-100', text: 'text-orange-700' },
  won: { bg: 'bg-green-100', text: 'text-green-700' },
  lost: { bg: 'bg-red-100', text: 'text-red-700' },
};

// ============================================================================
// Email Templates
// ============================================================================

export interface EmailTemplate {
  id: string;
  name: { es: string; en: string };
  subject: { es: string; en: string };
  content: { es: string; en: string };
}

/**
 * Predefined email templates for quick-send from the lead detail panel.
 * Each template is bilingual (es/en) and uses {{name}} and {{myName}} placeholders.
 * Plantillas de email predefinidas para envío rápido desde el panel de detalle de lead.
 */
export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome',
    name: { es: 'Bienvenida', en: 'Welcome' },
    subject: { es: '¡Bienvenido a nuestra plataforma!', en: 'Welcome to our platform!' },
    content: {
      es: 'Hola {{name}},\n\n¡Gracias por tu interés en nuestra plataforma! Nos encantaría mostrarte cómo funciona y cómo puedes empezar a ganar comisiones.\n\n¿Tienes alguna pregunta?\n\nSaludos,\n{{myName}}',
      en: 'Hi {{name}},\n\nThank you for your interest in our platform! We would love to show you how it works and how you can start earning commissions.\n\nDo you have any questions?\n\nBest regards,\n{{myName}}',
    },
  },
  {
    id: 'followup',
    name: { es: 'Seguimiento', en: 'Follow-up' },
    subject: { es: '¿Cómo va tu experiencia?', en: 'How is your experience going?' },
    content: {
      es: 'Hola {{name}},\n\nSolo quería hacer seguimiento para ver cómo va tu experiencia con nuestra plataforma.\n\n¿Hay algo en lo que pueda ayudarte?\n\nSaludos,\n{{myName}}',
      en: 'Hi {{name}},\n\nJust wanted to follow up on how your experience with our platform is going.\n\nIs there anything I can help you with?\n\nBest regards,\n{{myName}}',
    },
  },
  {
    id: 'presentation',
    name: { es: 'Presentación de producto', en: 'Product Presentation' },
    subject: { es: 'Conoce más sobre nuestro producto', en: 'Learn more about our product' },
    content: {
      es: 'Hola {{name}},\n\nTe envío información sobre nuestro producto/servicio que creo que puede interesarte.\n\n[Descripción del producto]\n\n¿Te gustaría agendar una llamada para explicar más detalles?\n\nSaludos,\n{{myName}}',
      en: "Hi {{name}},\n\nI'm sending you information about our product/service that I think might interest you.\n\n[Product description]\n\nWould you like to schedule a call to explain more details?\n\nBest regards,\n{{myName}}",
    },
  },
  {
    id: 'closing',
    name: { es: 'Cierre de venta', en: 'Closing Sale' },
    subject: { es: 'Último paso para unirte', en: 'Last step to join' },
    content: {
      es: 'Hola {{name}},\n\n¡Nos alegra que hayas decidido unirte a nuestra comunidad!\n\nPara completar tu registro, solo necesitas [acción requerida].\n\nSi tienes cualquier duda, estoy aquí para ayudarte.\n\nSaludos,\n{{myName}}',
      en: "Hi {{name}},\n\nWe are glad you decided to join our community!\n\nTo complete your registration, you just need to [required action].\n\nIf you have any questions, I'm here to help.\n\nBest regards,\n{{myName}}",
    },
  },
  {
    id: 'support',
    name: { es: 'Soporte técnico', en: 'Technical Support' },
    subject: { es: 'Estoy aquí para ayudarte', en: "I'm here to help you" },
    content: {
      es: 'Hola {{name}},\n\nRecibí tu mensaje sobre [tema]. Estoy aquí para ayudarte.\n\n[Solución o siguiente paso]\n\n¿Necesitas algo más?\n\nSaludos,\n{{myName}}',
      en: "Hi {{name}},\n\nI received your message about [topic]. I'm here to help you.\n\n[Solution or next step]\n\nDo you need anything else?\n\nBest regards,\n{{myName}}",
    },
  },
];

/**
 * Resolve the appropriate localized value from a bilingual { es, en } object.
 * Resuelve el valor localizado apropiado de un objeto bilingüe { es, en }.
 */
export function getLocalizedValue(value: { es: string; en: string }, i18n: I18nInstance): string {
  return value[i18n.language as 'es' | 'en'] || value.en;
}

// ============================================================================
// Tab Definitions
// ============================================================================

/** Available CRM tabs / Tabs disponibles de CRM */
export const CRM_TABS = ['leads', 'kanban', 'tasks', 'stats'] as const;
export type CRMTab = (typeof CRM_TABS)[number];

// ============================================================================
// Lead Constants
// ============================================================================

/** All possible lead statuses / Todos los estados posibles de lead */
export const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** All possible lead sources / Todas las fuentes posibles de lead */
export const LEAD_SOURCES = [
  'website',
  'referral',
  'social',
  'landing_page',
  'manual',
  'other',
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];
