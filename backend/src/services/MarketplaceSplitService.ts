/**
 * @fileoverview MarketplaceSplitService — marketplace split-payments core (B2 / D5 / D9)
 * @description Centralizes the split-payment orchestration: token resolution per
 *              vendor (SPLIT-1), marketplace fee calculation + persistence (SPLIT-4),
 *              reservation approval handling (RC-2) and proportional refund reversal
 *              (SPLIT-6 / RC-4).
 *
 *              Centraliza la orquestación de pagos divididos: selección de token por
 *              cobro, cálculo/persistencia del fee de marketplace, aprobación de
 *              reservas y reversa proporcional de reembolsos.
 * @module services/MarketplaceSplitService
 */

import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import {
  Vendor,
  VendorMercadoPagoAccount,
  Reservation,
  Order,
  VendorOrder,
} from '../models/index.js';
import { oauthMercadoPagoService } from './OAuthMercadoPagoService.js';
import { TwoFactorService } from './TwoFactorService.js';
import { CommissionService } from './CommissionService.js';
import type { PaymentResult } from './MercadoPagoService.js';
import type { FeeBreakdown } from '../types/index.js';

/** Prefix used in external_reference for reservation payments / Prefijo de reservas */
export const RESERVATION_REF_PREFIX = 'reservation:';

/** Order note marker used to find the Order for a MercadoPago payment */
export const MP_ORDER_NOTE_PREFIX = 'mercadopago:';

/**
 * Generate a human-readable order number (mirrors the webhook convention).
 * Generar un número de pedido legible.
 */
function generateOrderNumber(): string {
  return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

export class MarketplaceSplitService {
  /**
   * Resolve the access token to use for a charge (SPLIT-1 / NFR-6).
   * Resolver el access token a usar para un cobro.
   *
   * - vendorId null OR marketplace flag OFF → platform token, no fee (previous behavior)
   * - vendor without a connected account → CONNECT_MP_REQUIRED (no silent fallback)
   * - vendor connected → lazy token refresh (≤ 5 min margin) and decrypted token
   *
   * @param vendorId - Vendor id or null (platform charge)
   * @returns Access token for the MercadoPago client
   */
  async resolveToken(vendorId: string | null): Promise<string> {
    if (!vendorId || !config.marketplace.enabled) {
      return config.mercadopago.accessToken;
    }

    const account = await VendorMercadoPagoAccount.findOne({ where: { vendorId } });
    if (!account || account.status !== 'connected') {
      throw new Error('CONNECT_MP_REQUIRED: vendor must connect MercadoPago first');
    }

    const validAccount = await oauthMercadoPagoService.ensureValidToken(account);
    if (!validAccount.accessTokenEncrypted) {
      throw new Error('CONNECT_MP_REQUIRED: vendor must connect MercadoPago first');
    }

    return TwoFactorService.decryptSecretFromStorage(validAccount.accessTokenEncrypted);
  }

  /**
   * Calculate the marketplace fee breakdown for a vendor charge (SPLIT-4 / D4).
   * Calcular el desglose del fee de marketplace para un cobro de negocio.
   *
   * commission      = base × (1 − commissionRate)        [HALF_UP integer COP]
   * tax             = commission × VAT(country)          [HALF_UP integer COP]
   * fee             = commission + tax
   *
   * @param base - Gross amount paid (COP integer)
   * @param vendor - Vendor carrying commissionRate
   * @param country - ISO 3166-1 alpha-2 (CO)
   * @param externalReference - Reference persisted for reconciliation
   * @returns FeeBreakdown
   */
  createFeeBreakdown(
    base: number,
    vendor: { commissionRate: number },
    country: string,
    externalReference: string
  ): FeeBreakdown {
    const commissionRate = Number(vendor.commissionRate);
    const calc = CommissionService.calculateMarketplaceFee({ base, commissionRate, country });

    return {
      base,
      commissionRate,
      pctPlataforma: calc.pctPlataforma,
      commission: calc.commission,
      taxRate: calc.taxRate,
      tax: calc.tax,
      fee: calc.fee,
      externalReference,
      country,
      feeRefunded: 0,
    };
  }

  /**
   * Proportional fee reversal for a refund (SPLIT-6 / D9).
   * Reversa proporcional del fee para un reembolso.
   *
   * @param fee - Marketplace fee originally charged
   * @param refundAmount - Amount refunded
   * @param totalPaid - Gross amount originally paid
   * @returns Reversed fee, HALF_UP to integer COP
   */
  refundProportional(fee: number, refundAmount: number, totalPaid: number): number {
    return Math.round((fee * refundAmount) / totalPaid);
  }

  /**
   * Handle an approved reservation payment from the webhook (RC-2).
   * Procesar un pago de reserva aprobado desde el webhook.
   *
   * Resolves the reservation from external_reference (`reservation:<id>`), marks it
   * paid, persists the Order with the fee breakdown and creates the VendorOrder split.
   * Idempotent: a reservation already paid with the same paymentId is skipped.
   *
   * @param payment - MercadoPago payment (approved)
   */
  async handleApprovedReservation(payment: PaymentResult): Promise<void> {
    const externalReference = payment.external_reference ?? '';
    const match = externalReference.match(/^reservation:(.+)$/);
    if (!match) {
      throw new Error('Not a reservation payment');
    }

    const reservation = await Reservation.findByPk(match[1]);
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    // Idempotency: already paid with the same payment → skip
    if (reservation.paymentStatus === 'paid' && reservation.paymentId === payment.id) {
      logger.info(
        { service: 'MarketplaceSplitService', paymentId: payment.id },
        'Reservation already paid with this payment — skipping'
      );
      return;
    }

    if (!reservation.vendorId) {
      throw new Error('Reservation has no vendorId — platform flow handled elsewhere');
    }

    const vendor = await Vendor.findByPk(reservation.vendorId);
    if (!vendor) {
      throw new Error('Vendor not found for reservation');
    }

    const base = payment.transaction_amount ?? Number(reservation.totalPrice);
    const currency = payment.currency_id ?? reservation.currency ?? 'COP';
    const country = config.marketplace.country;
    const breakdown = this.createFeeBreakdown(base, vendor, country, externalReference);

    await reservation.update({ paymentStatus: 'paid', paymentId: payment.id });

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      userId: reservation.userId,
      productId: null,
      purchaseId: null,
      totalAmount: base,
      currency,
      status: 'completed',
      paymentMethod: 'mercadopago',
      notes: `${MP_ORDER_NOTE_PREFIX}${payment.id}`,
      vendorId: reservation.vendorId,
      country,
      marketplaceFee: breakdown.fee,
      feeBreakdown: breakdown,
      shippingAddressId: null,
      shippingCost: null,
      shippingStatus: 'not_required',
    });

    await VendorOrder.create({
      orderId: order.id,
      vendorId: reservation.vendorId,
      subtotal: base,
      commissionAmount: 0, // SPLIT-8: no MLM levels in the marketplace fee
      vendorAmount: Math.round(base * Number(vendor.commissionRate)),
      platformAmount: breakdown.fee,
      status: 'completed',
      notes: null,
      taxRate: breakdown.taxRate,
      taxAmount: breakdown.tax,
      country,
    });

    logger.info(
      { service: 'MarketplaceSplitService', paymentId: payment.id, orderId: order.id },
      'Reservation approved — Order + VendorOrder created'
    );
  }

  /**
   * Handle a refund from the webhook (SPLIT-6 / D9 / RC-4).
   * Procesar un reembolso desde el webhook.
   *
   * Reverses commission + tax proportionally on the Order feeBreakdown
   * (feeRefunded accumulated). A full refund additionally cancels the VendorOrder
   * and marks the reservation paymentStatus = refunded.
   *
   * @param payment - MercadoPago payment carrying the refunds array
   * @param refundId - MercadoPago refund id to process
   */
  async handleRefund(payment: PaymentResult, refundId: number): Promise<void> {
    const refund = payment.refunds?.find((r) => Number(r.id) === Number(refundId));
    if (!refund) {
      throw new Error('Refund not found in payment');
    }

    const refundAmount = refund.amount ?? payment.transaction_amount ?? 0;
    const totalPaid = payment.transaction_amount ?? 0;
    if (totalPaid <= 0) {
      throw new Error('Cannot compute proportional refund: missing total paid');
    }

    const order = await Order.findOne({ where: { notes: `${MP_ORDER_NOTE_PREFIX}${payment.id}` } });
    if (!order || !order.feeBreakdown) {
      throw new Error('Order or fee breakdown not found for payment');
    }

    const reverse = this.refundProportional(order.feeBreakdown.fee, refundAmount, totalPaid);
    const feeRefunded = Math.round((order.feeBreakdown.feeRefunded ?? 0) + reverse);

    await order.update({ feeBreakdown: { ...order.feeBreakdown, feeRefunded } });

    const isFullRefund = refundAmount >= totalPaid;
    if (isFullRefund) {
      await VendorOrder.update({ status: 'cancelled' }, { where: { orderId: order.id } });

      const externalReference = payment.external_reference ?? '';
      const match = externalReference.match(/^reservation:(.+)$/);
      if (match) {
        const reservation = await Reservation.findByPk(match[1]);
        if (reservation) {
          await reservation.update({ paymentStatus: 'refunded' });
        }
      }
    }

    logger.info(
      {
        service: 'MarketplaceSplitService',
        paymentId: payment.id,
        refundId,
        feeRefunded,
        isFullRefund,
      },
      'Refund processed — fee reversed proportionally'
    );
  }
}

export const marketplaceSplitService = new MarketplaceSplitService();

export default marketplaceSplitService;
