/**
 * @fileoverview Reservations Flow — "mis reservas" WhatsApp bot flow
 * @description Allows users to query their recent property and tour reservations
 *              via the WhatsApp bot. Handles both property and tour reservation types
 *              with bilingual status and type labels.
 *
 *              Permite a los usuarios consultar sus reservas recientes de propiedades
 *              y tours a través del bot de WhatsApp. Maneja ambos tipos con etiquetas
 *              bilingües de estado y tipo.
 * @module flows/reservations.flow
 */

import { addKeyword } from '@builderbot/bot';
import { mlmApi, BotReservation } from '../services/mlm-api.service.js';

// ── Keywords ──────────────────────────────────────────────────────────────────

/**
 * Keywords that trigger the reservations flow.
 * Palabras clave que activan el flujo de reservas.
 */
const RESERVATIONS_KEYWORDS: [string, ...string[]] = [
  'mis reservas',
  'reservas',
  'reserva',
  'ver reservas',
  'mis bookings',
  'bookings',
  'mis turnos',
  'my reservations',
  'my bookings',
];

// ── Label maps ────────────────────────────────────────────────────────────────

/**
 * Human-readable labels for reservation statuses.
 * Etiquetas legibles para los estados de reserva.
 */
const STATUS_LABELS: Record<BotReservation['status'], string> = {
  pending: '⏳ Pendiente',
  confirmed: '✅ Confirmada',
  cancelled: '❌ Cancelada',
  completed: '🏁 Completada',
  no_show: '🚫 No se presentó',
};

/**
 * Human-readable labels for reservation types.
 * Etiquetas legibles para los tipos de reserva.
 */
const TYPE_LABELS: Record<BotReservation['type'], string> = {
  property: '🏠 Propiedad',
  tour: '✈️ Tour',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Formats a single reservation as a text block for WhatsApp.
 * Formatea una reserva individual como bloque de texto para WhatsApp.
 *
 * @param r     - Reservation object / Objeto de reserva
 * @param index - 1-based index for display / Índice base-1 para mostrar
 * @returns Formatted text block / Bloque de texto formateado
 */
function formatReservation(r: BotReservation, index: number): string {
  const typeLabel = TYPE_LABELS[r.type] ?? r.type;
  const statusLabel = STATUS_LABELS[r.status] ?? r.status;
  const fmt = (n: number) =>
    n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const lines: string[] = [
    `*${index}. ${typeLabel}*`,
    `   Estado: ${statusLabel}`,
    `   Pago: ${r.paymentStatus === 'paid' ? '💰 Pagado' : r.paymentStatus === 'pending' ? '⏳ Pendiente' : r.paymentStatus}`,
    `   Total: ${r.currency} ${fmt(r.totalPrice)}`,
  ];

  if (r.type === 'property') {
    if (r.checkIn) lines.push(`   Check-in: ${r.checkIn}`);
    if (r.checkOut) lines.push(`   Check-out: ${r.checkOut}`);
  } else if (r.type === 'tour') {
    if (r.tourDate) lines.push(`   Fecha: ${r.tourDate}`);
    if (r.groupSize > 1) lines.push(`   Personas: ${r.groupSize}`);
  }

  const date = new Date(r.createdAt).toLocaleDateString('es-AR');
  lines.push(`   Creada: ${date}`);

  return lines.join('\n');
}

// ── Flow ──────────────────────────────────────────────────────────────────────

/**
 * Reservations flow — shows the user's last 5 reservations (property + tour).
 * Requires the user to be identified (phone lookup via welcomeFlow or inline).
 *
 * Flujo de reservas — muestra las últimas 5 reservas del usuario (propiedad + tour).
 * Requiere que el usuario esté identificado (lookup por teléfono vía welcomeFlow o inline).
 */
export const reservationsFlow = addKeyword(RESERVATIONS_KEYWORDS).addAction(
  async (ctx: any, { state, flowDynamic }: any) => {
    // Resolve user from state or lookup by phone
    // Resuelve el usuario desde el estado o lookup por teléfono
    const user: { id: string; username?: string } | null =
      state.get('user') ??
      (await (async () => {
        const u = await mlmApi.getUserByPhone(ctx.from);
        if (u) await state.update({ user: u });
        return u;
      })());

    if (!user) {
      await flowDynamic([
        {
          body:
            '❌ No encontré una cuenta asociada a tu número.\n\n' +
            '🌐 Registrate en:\nhttps://nexoreal.xyz/register', // TODO: domain pending
        },
      ]);
      return;
    }

    const reservations = await mlmApi.getReservations(user.id, { limit: 5 });

    if (reservations.length === 0) {
      await flowDynamic([
        {
          body:
            '📋 *Tus Reservas — Nexo Real*\n\n' +
            'No tenés reservas registradas todavía.\n\n' +
            '🏠 Para reservar una propiedad o tour, visitá:\nhttps://nexoreal.xyz', // TODO: domain pending
        },
      ]);
      return;
    }

    const items = reservations.map((r, i) => formatReservation(r, i + 1)).join('\n\n');

    await flowDynamic([
      {
        body:
          `📋 *Tus últimas reservas — Nexo Real*\n\n` +
          items +
          `\n\n🌐 Ver todas tus reservas:\nhttps://nexoreal.xyz/reservations`, // TODO: domain pending
      },
    ]);
  }
);
