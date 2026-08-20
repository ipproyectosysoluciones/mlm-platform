/**
 * @fileoverview SchedulerService MercadoPago Token Refresh Job Unit Tests (B7)
 * @description Tests for the hourly MercadoPago vendor token refresh cron:
 *              registration in start(), execution when MARKETPLACE_ENABLED,
 *              skip when the flag is off, and stop() cleanup.
 *              Pruebas del job horario de refresco de tokens MercadoPago:
 *              registro en start(), ejecución con MARKETPLACE_ENABLED,
 *              salto con flag off y limpieza en stop().
 * @module __tests__/unit/SchedulerService.tokenRefresh
 */

// ============================================
// MOCKS — Deben ir ANTES de los imports
// ============================================

// Capture cron registrations so tests can invoke the callbacks
const mockJobs: Record<string, (...args: unknown[]) => unknown> = {};
const mockStops: Record<string, jest.Mock> = {};

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: (cron: string, cb: (...args: unknown[]) => unknown) => {
    mockJobs[cron] = cb;
    mockStops[cron] = jest.fn();
    return { stop: mockStops[cron] };
  },
}));

// Mock WalletService
jest.mock('../../services/WalletService', () => ({
  walletService: { processDailyPayouts: jest.fn().mockResolvedValue([]) },
}));

// Mock NotificationService
jest.mock('../../services/NotificationService', () => ({
  notificationService: {
    startWeeklyDigest: jest.fn(),
    stopWeeklyDigest: jest.fn(),
  },
}));

// Mock CartRecoveryEmailService
jest.mock('../../services/CartRecoveryEmailService', () => ({
  cartRecoveryEmailService: { sendRecoveryEmail: jest.fn() },
}));

// Mock CartService
jest.mock('../../services/CartService', () => ({
  cartService: {
    findAbandoned: jest.fn().mockResolvedValue([]),
    markAbandoned: jest.fn(),
    createRecoveryToken: jest.fn(),
  },
}));

// Mock EmailQueueService
jest.mock('../../services/EmailQueueService', () => ({
  emailQueueService: { processPendingEmails: jest.fn() },
}));

// Mock EmailCampaignService
jest.mock('../../services/EmailCampaignService', () => ({
  emailCampaignService: { sendCampaign: jest.fn() },
}));

// Mock EmailCampaign model
jest.mock('../../models', () => ({
  EmailCampaign: { findAll: jest.fn() },
}));

// Mock OAuthMercadoPagoService (B7)
const mockRefreshTokens = jest.fn().mockResolvedValue({ refreshed: 1, failed: 0 });
jest.mock('../../services/OAuthMercadoPagoService', () => ({
  oauthMercadoPagoService: { refreshTokens: mockRefreshTokens },
}));

// Mock config (mutable flag for the gate tests)
jest.mock('../../config/env', () => ({
  config: {
    wallet: { cronTime: '0 0 * * *' },
    brevo: { apiKey: 'test' },
    features: { cryptoWallet: true },
    marketplace: { enabled: true },
  },
}));

import { SchedulerService } from '../../services/SchedulerService';

// ============================================
// TESTS
// ============================================

describe('SchedulerService — MercadoPago Token Refresh Job (B7)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefreshTokens.mockResolvedValue({ refreshed: 1, failed: 0 });
  });

  it('registers an hourly cron for token refresh on start()', () => {
    const scheduler = new SchedulerService();
    scheduler.start();

    expect(typeof mockJobs['0 * * * *']).toBe('function');
  });

  it('runs refreshTokens when MARKETPLACE_ENABLED is true', async () => {
    const config = require('../../config/env').config as {
      marketplace: { enabled: boolean };
    };
    config.marketplace.enabled = true;

    const scheduler = new SchedulerService();
    scheduler.start();

    await (mockJobs['0 * * * *'] as () => Promise<void>)();

    expect(mockRefreshTokens).toHaveBeenCalledTimes(1);
  });

  it('skips refreshTokens when MARKETPLACE_ENABLED is false', async () => {
    const config = require('../../config/env').config as {
      marketplace: { enabled: boolean };
    };
    config.marketplace.enabled = false;

    const scheduler = new SchedulerService();
    scheduler.start();

    await (mockJobs['0 * * * *'] as () => Promise<void>)();

    expect(mockRefreshTokens).not.toHaveBeenCalled();
  });

  it('stops the token refresh job on stop()', () => {
    const scheduler = new SchedulerService();
    scheduler.start();
    scheduler.stop();

    expect(mockStops['0 * * * *']).toHaveBeenCalledTimes(1);
  });
});
