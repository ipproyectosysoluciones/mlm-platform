/**
 * @fileoverview Unit tests for Order / VendorOrder marketplace attributes (B1 / BE-2 / SPLIT-4)
 * @description Verifies that the Order model exposes the marketplace split fields
 *              (vendorId, country, marketplaceFee, feeBreakdown) and the VendorOrder
 *              model exposes the tax fields (taxRate, taxAmount, country) added by
 *              migration 2026080200000{2,3}. Real models are loaded (no DB queries —
 *              only build()/toJSON()).
 * @module __tests__/unit/OrderVendorOrderModels
 */

import { Order } from '../../models/Order.js';
import { VendorOrder } from '../../models/VendorOrder.js';

describe('Order — marketplace split attributes (B1 / BE-2)', () => {
  it('builds an Order carrying vendorId, country, marketplaceFee and feeBreakdown', () => {
    const feeBreakdown = {
      base: 1000000,
      commissionRate: 0.7,
      pctPlataforma: 0.3,
      commission: 300000,
      taxRate: 0.19,
      tax: 57000,
      fee: 357000,
      externalReference: 'reservation:res-1',
      country: 'CO',
      feeRefunded: 0,
    };

    const order = Order.build({
      orderNumber: 'ORD-MP-1',
      userId: 'user-1',
      productId: null,
      purchaseId: null,
      totalAmount: 1000000,
      currency: 'COP',
      status: 'completed',
      paymentMethod: 'mercadopago',
      notes: 'mercadopago:123',
      shippingAddressId: null,
      shippingCost: null,
      shippingStatus: 'not_required',
      vendorId: 'vendor-1',
      country: 'CO',
      marketplaceFee: 357000,
      feeBreakdown,
    });

    const json = order.toJSON();
    expect(json.vendorId).toBe('vendor-1');
    expect(json.country).toBe('CO');
    expect(json.marketplaceFee).toBe(357000);
    expect(json.feeBreakdown).toEqual(expect.objectContaining(feeBreakdown));
  });

  it('allows a reservation order with productId null (D6)', () => {
    const order = Order.build({
      orderNumber: 'ORD-RES-1',
      userId: 'user-1',
      productId: null,
      purchaseId: null,
      totalAmount: 500000,
      currency: 'COP',
      status: 'pending',
      paymentMethod: 'mercadopago',
      notes: null,
      shippingAddressId: null,
      shippingCost: null,
      shippingStatus: 'not_required',
      vendorId: 'vendor-1',
      country: 'CO',
    });

    expect(order.toJSON().productId).toBeNull();
    expect(order.toJSON().vendorId).toBe('vendor-1');
  });
});

describe('VendorOrder — tax attributes (B1 / BE-2)', () => {
  it('builds a VendorOrder carrying taxRate, taxAmount and country', () => {
    const vendorOrder = VendorOrder.build({
      orderId: 'order-1',
      vendorId: 'vendor-1',
      subtotal: 1000000,
      commissionAmount: 0,
      vendorAmount: 700000,
      platformAmount: 300000,
      status: 'pending',
      notes: null,
      taxRate: 0.19,
      taxAmount: 57000,
      country: 'CO',
    });

    const json = vendorOrder.toJSON();
    expect(json.taxRate).toBe(0.19);
    expect(json.taxAmount).toBe(57000);
    expect(json.country).toBe('CO');
  });
});
