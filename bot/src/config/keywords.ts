/**
 * @fileoverview Bot Keywords Configuration
 * @description Centralized keyword registry for all bot flows.
 *              Import from here instead of hardcoding strings in each flow.
 *              Registro centralizado de keywords para todos los flows del bot.
 *              Importar desde aquí en lugar de hardcodear strings en cada flow.
 * @module config/keywords
 */

/**
 * Tuple type helper — ensures addKeyword receives at least one string.
 * Helper de tipo tupla — asegura que addKeyword reciba al menos un string.
 */
type Keywords = [string, ...string[]];

/**
 * Keywords that trigger the balance / wallet flow.
 * Keywords que activan el flow de saldo / billetera.
 */
export const BALANCE_KEYWORDS: Keywords = [
  'saldo',
  'balance',
  'mi saldo',
  'ver saldo',
  'billetera',
  'wallet',
];

/**
 * Keywords that trigger the network / referrals flow.
 * Keywords que activan el flow de red / referidos.
 */
export const NETWORK_KEYWORDS: Keywords = [
  'mi red',
  'red',
  'referidos',
  'afiliados',
  'ver red',
  'equipo',
  'downline',
];

/**
 * Keywords that trigger the support / main menu flow.
 * Keywords que activan el flow de soporte / menú principal.
 */
export const SUPPORT_KEYWORDS: Keywords = [
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
 * Keywords that trigger the schedule visit flow.
 * Keywords que activan el flow de agendar visita.
 */
export const SCHEDULE_KEYWORDS: Keywords = [
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

/**
 * Keywords that trigger the human handoff flow.
 * Keywords que activan el flow de derivación a agente humano.
 */
export const HANDOFF_KEYWORDS: Keywords = [
  'hablar con alguien',
  'hablar con una persona',
  'hablar con un asesor',
  'quiero un asesor',
  'asesor humano',
  'agente humano',
  'persona real',
  'no quiero hablar con un bot',
  'speak to a human',
  'talk to a person',
  'human agent',
  'real person',
  'speak to agent',
  'talk to agent',
  'connect me with someone',
];

/**
 * Keywords that trigger the properties browsing flow.
 * Keywords que activan el flow de búsqueda de propiedades.
 */
export const PROPERTIES_KEYWORDS: Keywords = [
  'propiedades',
  'ver propiedades',
  'buscar propiedades',
  'inmuebles',
  'alquileres',
  'casas',
  'departamentos',
  'properties',
  'real estate',
  'houses',
  'apartments',
];

/**
 * Keywords that trigger the tours / travel packages flow.
 * Keywords que activan el flow de tours / paquetes turísticos.
 */
export const TOURS_KEYWORDS: Keywords = [
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
 * Keywords for the commissions alias flow (delegates to networkFlow).
 * Keywords para el flow alias de comisiones (delega a networkFlow).
 */
export const COMMISSIONS_KEYWORDS: Keywords = ['comisiones', 'mis comisiones', 'ver comisiones'];

/**
 * Keywords the welcome / onboarding flow accepts for language selection — Spanish.
 * Keywords que el flow de bienvenida / onboarding acepta para selección de idioma — Español.
 */
export const LANGUAGE_ES_KEYWORDS: string[] = ['1', 'español', 'espanol', 'es', 'castellano'];

/**
 * Keywords the welcome / onboarding flow accepts for language selection — English.
 * Keywords que el flow de bienvenida / onboarding acepta para selección de idioma — Inglés.
 */
export const LANGUAGE_EN_KEYWORDS: string[] = [
  '2',
  'english',
  'inglés',
  'ingles',
  'en',
  'english please',
];

/**
 * Keywords the welcome flow accepts to skip optional fields (email).
 * Keywords que el flow de bienvenida acepta para omitir campos opcionales (email).
 */
export const SKIP_KEYWORDS: string[] = ['omitir', 'skip', 'no', 'ninguno', 'none', '-'];

/**
 * Complete keywords registry — all flows grouped by feature.
 * Registro completo de keywords — todos los flows agrupados por funcionalidad.
 */
export const BOT_KEYWORDS = {
  balance: BALANCE_KEYWORDS,
  network: NETWORK_KEYWORDS,
  support: SUPPORT_KEYWORDS,
  schedule: SCHEDULE_KEYWORDS,
  handoff: HANDOFF_KEYWORDS,
  properties: PROPERTIES_KEYWORDS,
  tours: TOURS_KEYWORDS,
  commissions: COMMISSIONS_KEYWORDS,
  language: {
    es: LANGUAGE_ES_KEYWORDS,
    en: LANGUAGE_EN_KEYWORDS,
  },
  skip: SKIP_KEYWORDS,
} as const;
