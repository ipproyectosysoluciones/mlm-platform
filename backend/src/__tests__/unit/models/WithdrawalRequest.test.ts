/**
 * @fileoverview Unit tests for WithdrawalRequest model — payout destination fields
 * @description Verifies the model maps the new payout-destination / gateway-tracking
 *              columns added by migration 20260801000001: destination JSONB,
 *              gatewayPayoutId, gatewayStatus, lastGatewaySyncAt, lastNotifiedStatus,
 *              lastNotifiedAt — all NULL-able (legacy rows stay valid).
 *
 * @module __tests__/unit/models/WithdrawalRequest
 */

import { WithdrawalRequest } from '../../../models/WithdrawalRequest';

function attribute(name: string) {
  const attrs = WithdrawalRequest.getAttributes();
  expect(attrs[name]).toBeDefined();
  return attrs[name];
}

describe('WithdrawalRequest model — payout destination fields', () => {
  it('should map destination as nullable JSONB (field destination)', () => {
    const dest = attribute('destination');
    expect(dest.field).toBe('destination');
    expect(dest.allowNull).toBe(true);
    expect(dest.type.key).toBe('JSONB');
  });

  it('should map gatewayPayoutId as nullable VARCHAR(191) (field gateway_payout_id)', () => {
    const attr = attribute('gatewayPayoutId');
    expect(attr.field).toBe('gateway_payout_id');
    expect(attr.allowNull).toBe(true);
    expect(attr.type.key).toBe('STRING');
    expect((attr.type as { options?: { length?: number } }).options?.length).toBe(191);
  });

  it('should map gatewayStatus as nullable VARCHAR(50) (field gateway_status)', () => {
    const attr = attribute('gatewayStatus');
    expect(attr.field).toBe('gateway_status');
    expect(attr.allowNull).toBe(true);
    expect(attr.type.key).toBe('STRING');
    expect((attr.type as { options?: { length?: number } }).options?.length).toBe(50);
  });

  it('should map lastGatewaySyncAt as nullable DATE (field last_gateway_sync_at)', () => {
    const attr = attribute('lastGatewaySyncAt');
    expect(attr.field).toBe('last_gateway_sync_at');
    expect(attr.allowNull).toBe(true);
    expect(attr.type.key).toBe('DATE');
  });

  it('should map lastNotifiedStatus as nullable VARCHAR(50) (field last_notified_status)', () => {
    const attr = attribute('lastNotifiedStatus');
    expect(attr.field).toBe('last_notified_status');
    expect(attr.allowNull).toBe(true);
    expect(attr.type.key).toBe('STRING');
    expect((attr.type as { options?: { length?: number } }).options?.length).toBe(50);
  });

  it('should map lastNotifiedAt as nullable DATE (field last_notified_at)', () => {
    const attr = attribute('lastNotifiedAt');
    expect(attr.field).toBe('last_notified_at');
    expect(attr.allowNull).toBe(true);
    expect(attr.type.key).toBe('DATE');
  });
});
