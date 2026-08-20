/**
 * @fileoverview MercadoPago webhook integration tests (B8)
 * @description Full integration coverage of the MercadoPago webhook endpoint
 *              with supertest + mocked getPayment, against the real test DB:
 *              - approved reservation → paid + paymentId + Order/VendorOrder + fee
 *              - duplicate delivery → skipped (no double rows)
 *              - partial refund → proportional fee reversal
 *              - full refund → VendorOrder cancelled + reservation refunded
 *              - approved without vendor (platform flow) → previous exact flow
 *
 *              Cobertura de integración del webhook de MercadoPago con supertest
 *              + getPayment mockeado contra la DB real de test.
 * @module __tests__/integration/mercadopago-webhook
 */

import { testAgent } from '../setup';
import { createTestUser } from '../fixtures';
import {
  User,
  Vendor,
  Reservation,
  Order,
  VendorOrder,
  WebhookEvent,
  Purchase,
  Product,
} from '../../models';
import { config } from '../../config/env.js';

// Mock only the external MercadoPago API (getPayment) — everything else is real
const mockGetPayment = jest.fn();
jest.mock('../../services/MercadoPagoService.js', () => ({
  mercadoPagoService: {
    getPayment: mockGetPayment,
    // The test env has a webhook secret set — accept the signature (mocked external)
    verifyWebhookSignature: jest.fn(() => true),
  },
}));

const WEBHOOK_URL = '/api/v1/payment/mercadopago/webhook';

/**
 * POST a webhook notification with a valid-looking signature header.
 * The external signature verification is mocked — the header just satisfies
 * the controller's x-signature presence check.
 */
const postWebhook = (body: Record<string, unknown>) =>
  testAgent.post(WEBHOOK_URL).set('x-signature', 'ts=1735689600,v1=deadbeef').send(body);

/** Approved reservation payment payload (mocked MP API response) */
const approvedReservationPayment = (id: string, reservationId: string) => ({
  id,
  status: 'approved',
  external_reference: `reservation:${reservationId}`,
  transaction_amount: 1000000,
  currency_id: 'COP',
  date_approved: new Date().toISOString(),
  additional_info: { items: [] },
  refunds: [],
});

/** Refunded payment payload (mocked MP API response) */
const refundedPayment = (
  id: string,
  reservationId: string,
  refunds: Array<{ id: number; amount: number }>
) => ({
  id,
  status: 'refunded',
  external_reference: `reservation:${reservationId}`,
  transaction_amount: 1000000,
  currency_id: 'COP',
  date_approved: new Date().toISOString(),
  additional_info: { items: [] },
  refunds,
});

/** Approved platform payment (external_reference = userId, no reservation prefix) */
const approvedPlatformPayment = (id: string, userId: string, productId: string) => ({
  id,
  status: 'approved',
  external_reference: userId,
  transaction_amount: 100000,
  currency_id: 'COP',
  date_approved: new Date().toISOString(),
  additional_info: { items: [{ id: productId }] },
  refunds: [],
});

describe('MercadoPago Webhook Integration (B8)', () => {
  let user: User;
  let vendor: Vendor;
  let reservation: Reservation;
  let product: Product;

  beforeAll(() => {
    // Enable the marketplace flag for the split reservation flow (NFR-4)
    (config.marketplace as { enabled: boolean }).enabled = true;
  });

  afterAll(() => {
    (config.marketplace as { enabled: boolean }).enabled = false;
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    user = await createTestUser();
    vendor = await Vendor.create({
      userId: user.id,
      businessName: `Vendor ${Date.now()}`,
      slug: `vendor-${Date.now()}`,
      contactEmail: `vendor-${Date.now()}@example.com`,
      status: 'approved',
      commissionRate: 0.7,
    } as any);
    reservation = await Reservation.create({
      type: 'property',
      status: 'pending',
      userId: user.id,
      vendorId: vendor.id,
      guestName: 'Guest',
      guestEmail: user.email,
      totalPrice: 1000000,
      currency: 'COP',
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    product = await Product.create({
      name: `MP Test Product ${Date.now()}`,
      platform: 'netflix',
      price: 100000,
      currency: 'COP',
      durationDays: 30,
      isActive: true,
    } as any);
  });

  afterEach(async () => {
    await WebhookEvent.destroy({ where: {} });
    await VendorOrder.destroy({ where: {} });
    await Reservation.destroy({ where: {} });
    await Order.destroy({ where: {} });
    await Purchase.destroy({ where: {} });
    await Vendor.destroy({ where: {} });
    await Product.destroy({ where: {} });
    await User.destroy({ where: {} });
    mockGetPayment.mockReset();
  });

  it('approved reservation → reservation paid + paymentId + Order + VendorOrder with split fee', async () => {
    mockGetPayment.mockResolvedValue(approvedReservationPayment('pay-1', reservation.id));

    const res = await postWebhook({ topic: 'payment', id: 'pay-1' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });

    await reservation.reload();
    expect(reservation.paymentStatus).toBe('paid');
    expect(reservation.paymentId).toBe('pay-1');

    const order = await Order.findOne({ where: { notes: 'mercadopago:pay-1' } });
    expect(order).not.toBeNull();
    expect(order!.vendorId).toBe(vendor.id);
    expect(Number(order!.totalAmount)).toBe(1000000);
    expect(order!.currency).toBe('COP');
    expect(Number(order!.marketplaceFee)).toBe(357000);
    expect((order!.feeBreakdown as any).fee).toBe(357000);
    expect((order!.feeBreakdown as any).commission).toBe(300000);
    expect((order!.feeBreakdown as any).tax).toBe(57000);
    expect((order!.feeBreakdown as any).country).toBe('CO');

    const vendorOrder = await VendorOrder.findOne({ where: { orderId: order!.id } });
    expect(vendorOrder).not.toBeNull();
    expect(vendorOrder!.vendorId).toBe(vendor.id);
    expect(Number(vendorOrder!.subtotal)).toBe(1000000);
    expect(Number(vendorOrder!.platformAmount)).toBe(357000);
    expect(Number(vendorOrder!.vendorAmount)).toBe(700000);
    expect(Number(vendorOrder!.taxAmount)).toBe(57000);
    expect(vendorOrder!.status).toBe('completed');

    const event = await WebhookEvent.findOne({
      where: { eventId: 'pay-1', provider: 'mercadopago' },
    });
    expect(event).not.toBeNull();
    expect(event!.eventType).toBe('payment.approved.reservation');
  });

  it('duplicate delivery of the same reservation payment is skipped (no double rows)', async () => {
    mockGetPayment.mockResolvedValue(approvedReservationPayment('pay-1', reservation.id));

    // First delivery
    const first = await postWebhook({ topic: 'payment', id: 'pay-1' });
    expect(first.status).toBe(200);

    const orderCountAfterFirst = await Order.count({ where: { notes: 'mercadopago:pay-1' } });
    const eventCountAfterFirst = await WebhookEvent.count({
      where: { eventId: 'pay-1', provider: 'mercadopago' },
    });
    expect(orderCountAfterFirst).toBe(1);
    expect(eventCountAfterFirst).toBe(1);

    // Duplicate delivery (MP retries)
    const second = await postWebhook({ topic: 'payment', id: 'pay-1' });
    expect(second.status).toBe(200);

    const orderCountAfterSecond = await Order.count({ where: { notes: 'mercadopago:pay-1' } });
    const eventCountAfterSecond = await WebhookEvent.count({
      where: { eventId: 'pay-1', provider: 'mercadopago' },
    });
    expect(orderCountAfterSecond).toBe(1);
    expect(eventCountAfterSecond).toBe(1);

    const reservations = await Reservation.findAll({ where: { paymentId: 'pay-1' } });
    expect(reservations).toHaveLength(1);
  });

  it('partial refund → proportional fee reversal (feeRefunded 178500)', async () => {
    // Seed the approved payment first (Order + VendorOrder + event)
    mockGetPayment.mockResolvedValue(approvedReservationPayment('pay-1', reservation.id));
    const approvedRes = await postWebhook({ topic: 'payment', id: 'pay-1' });
    expect(approvedRes.status).toBe(200);

    // Now MP delivers the refunded payment with a partial refund (500k of 1M)
    mockGetPayment.mockResolvedValue(
      refundedPayment('pay-1', reservation.id, [{ id: 1, amount: 500000 }])
    );
    const refundRes = await postWebhook({ topic: 'payment', id: 'pay-1' });
    expect(refundRes.status).toBe(200);

    const order = await Order.findOne({ where: { notes: 'mercadopago:pay-1' } });
    expect(order).not.toBeNull();
    expect((order!.feeBreakdown as any).feeRefunded).toBe(178500);

    // Partial refund: VendorOrder stays completed, reservation stays paid
    const vendorOrder = await VendorOrder.findOne({ where: { orderId: order!.id } });
    expect(vendorOrder!.status).toBe('completed');

    await reservation.reload();
    expect(reservation.paymentStatus).toBe('paid');

    const event = await WebhookEvent.findOne({
      where: { eventId: 'pay-1:1', provider: 'mercadopago' },
    });
    expect(event).not.toBeNull();
    expect(event!.eventType).toBe('payment.refunded');
  });

  it('full refund → feeRefunded full, VendorOrder cancelled, reservation refunded', async () => {
    mockGetPayment.mockResolvedValue(approvedReservationPayment('pay-1', reservation.id));
    await postWebhook({ topic: 'payment', id: 'pay-1' });

    mockGetPayment.mockResolvedValue(
      refundedPayment('pay-1', reservation.id, [{ id: 1, amount: 1000000 }])
    );
    const refundRes = await postWebhook({ topic: 'payment', id: 'pay-1' });
    expect(refundRes.status).toBe(200);

    const order = await Order.findOne({ where: { notes: 'mercadopago:pay-1' } });
    expect((order!.feeBreakdown as any).feeRefunded).toBe(357000);

    const vendorOrder = await VendorOrder.findOne({ where: { orderId: order!.id } });
    expect(vendorOrder!.status).toBe('cancelled');

    await reservation.reload();
    expect(reservation.paymentStatus).toBe('refunded');
  });

  it('approved without vendor (platform flow) → previous exact flow (Purchase + Order + event)', async () => {
    mockGetPayment.mockResolvedValue(approvedPlatformPayment('pay-plat-1', user.id, product.id));

    const res = await postWebhook({ topic: 'payment', id: 'pay-plat-1' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });

    const purchase = await Purchase.findOne({ where: { userId: user.id } });
    expect(purchase).not.toBeNull();
    expect(purchase!.productId).toBe(product.id);
    expect(Number(purchase!.amount)).toBe(100000);
    expect(purchase!.status).toBe('completed');

    const order = await Order.findOne({ where: { notes: 'mercadopago:pay-plat-1' } });
    expect(order).not.toBeNull();
    expect(order!.vendorId).toBeNull();
    expect(order!.productId).toBe(product.id);
    expect(order!.purchaseId).toBe(purchase!.id);

    const event = await WebhookEvent.findOne({
      where: { eventId: 'pay-plat-1', provider: 'mercadopago' },
    });
    expect(event).not.toBeNull();
    expect(event!.eventType).toBe('payment.approved');

    // No VendorOrder for platform payments
    const vendorOrderCount = await VendorOrder.count({ where: {} });
    expect(vendorOrderCount).toBe(0);
  });
});
