/**
 * @fileoverview CalendarService — Google Calendar sync via n8n webhook
 * @description Notifies n8n when a reservation is confirmed so n8n can
 *              create the Google Calendar event and notify the agent via WhatsApp.
 *              Notifica a n8n cuando una reserva es confirmada para que n8n pueda
 *              crear el evento en Google Calendar y notificar al agente por WhatsApp.
 * @module services/CalendarService
 * @author MLM Development Team
 *
 * @example
 * // English: Notify n8n on reservation confirmation
 * const calendarService = new CalendarService();
 * await calendarService.notifyReservationConfirmed({ reservationId: '123', ... });
 *
 * // Español: Notificar a n8n al confirmar una reserva
 * const calendarService = new CalendarService();
 * await calendarService.notifyReservationConfirmed({ reservationId: '123', ... });
 */

// ============================================
// TYPES / TIPOS
// ============================================

/**
 * Payload sent to the n8n webhook for calendar event creation
 * Payload enviado al webhook de n8n para la creación del evento de calendario
 */
export interface CalendarEventPayload {
  /** Reservation UUID / UUID de la reserva */
  reservationId: string;
  /** Reservation type / Tipo de reserva */
  type: 'property' | 'tour';
  /** Guest full name / Nombre completo del huésped */
  guestName: string;
  /** Guest email address / Correo electrónico del huésped */
  guestEmail: string;
  /** Guest phone number or null / Teléfono del huésped o null */
  guestPhone: string | null;
  /** Property title or tour title / Título de la propiedad o del tour */
  title: string;
  /** ISO date string — checkIn for property, tourDate for tour / Fecha ISO — checkIn para propiedad, tourDate para tour */
  startDate: string;
  /** ISO date string — checkOut for property, null for tours / Fecha ISO — checkOut para propiedad, null para tours */
  endDate: string | null;
  /** Optional notes / Notas opcionales */
  notes: string | null;
  /** Vendor ID or null / ID del vendedor o null */
  vendorId: string | null;
}

// ============================================
// SERVICE CLASS
// ============================================

/**
 * CalendarService — Handles Google Calendar sync via n8n webhook
 * CalendarService — Gestiona la sincronización con Google Calendar via webhook de n8n
 *
 * @description All errors are non-blocking: catch and log, never throw.
 *              Todos los errores son no bloqueantes: captura y registra, nunca lanza.
 */
export class CalendarService {
  /** n8n webhook URL for calendar sync / URL del webhook de n8n para sincronización de calendario */
  private readonly webhookUrl: string;

  /** Internal shared secret for webhook authentication / Secreto compartido interno para autenticación de webhook */
  private readonly secret: string;

  /**
   * Constructor — reads config from environment variables
   * Constructor — lee la configuración de las variables de entorno
   */
  constructor() {
    this.webhookUrl = process.env.N8N_CALENDAR_WEBHOOK_URL ?? '';
    this.secret = process.env.INTERNAL_WEBHOOK_SECRET ?? '';
  }

  /**
   * Notify n8n webhook to create a Google Calendar event
   * Notifica al webhook de n8n para crear un evento en Google Calendar
   *
   * @description Non-blocking — catches all errors and logs them.
   *              No bloqueante — captura todos los errores y los registra.
   * @param payload - Event payload to send to n8n / Payload del evento a enviar a n8n
   * @returns Promise<void> — always resolves, never rejects
   */
  async notifyReservationConfirmed(payload: CalendarEventPayload): Promise<void> {
    if (!this.webhookUrl) {
      console.warn('[CalendarService] N8N_CALENDAR_WEBHOOK_URL not set, skipping calendar sync');
      return;
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': this.secret,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`[CalendarService] n8n webhook returned ${response.status}`);
      }
    } catch (error) {
      // Non-blocking — log error but don't throw
      // (calendar sync failure should not break booking flow)
      // No bloqueante — registrar error pero no lanzar
      // (el fallo de sincronización no debe romper el flujo de reserva)
      console.error('[CalendarService] Failed to notify n8n webhook:', error);
    }
  }
}
