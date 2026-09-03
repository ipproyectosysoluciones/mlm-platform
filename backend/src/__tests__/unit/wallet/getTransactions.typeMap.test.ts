/**
 * @fileoverview getTransactions type mapping unit tests
 * @description Tests for backend transparent type mapping:
 *   commission → commission_earned, refund → adjustment,
 *   commission_earned and adjustment pass through, no type → no filter
 *
 * @module __tests__/unit/wallet/getTransactions.typeMap
 */

jest.mock('../../../config/env', () => ({
  config: { wallet: { feePercentage: 5 } },
}));

jest.mock('../../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../config/database', () => ({
  sequelize: { transaction: jest.fn() },
}));

jest.mock('../../../services/payouts', () => ({
  getPayoutGateway: jest.fn(),
}));

const mockFindAndCountAll = jest.fn();
const mockFindOne = jest.fn();

jest.mock('../../../models/index', () => ({
  get Wallet() {
    return { findOne: mockFindOne, create: jest.fn() };
  },
  get WalletTransaction() {
    return { findAndCountAll: mockFindAndCountAll };
  },
  get WithdrawalRequest() {
    return { findAll: jest.fn(), findByPk: jest.fn() };
  },
  get User() {
    return { findByPk: jest.fn() };
  },
}));

import { WalletService } from '../../../services/WalletService';

const walletService = new WalletService();

describe('WalletService.getTransactions — type mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindOne.mockResolvedValue({
      id: 'wallet-1',
      userId: 'user-1',
      balance: 100,
      currency: 'USD',
    });
    mockFindAndCountAll.mockResolvedValue({ rows: [], count: 0 });
  });

  it('maps commission → commission_earned', async () => {
    await walletService.getTransactions('user-1', { type: 'commission', page: 1, limit: 20 });

    const where = mockFindAndCountAll.mock.calls[0][0].where;
    expect(where.type).toBe('commission_earned');
  });

  it('maps refund → adjustment', async () => {
    await walletService.getTransactions('user-1', { type: 'refund', page: 1, limit: 20 });

    const where = mockFindAndCountAll.mock.calls[0][0].where;
    expect(where.type).toBe('adjustment');
  });

  it('passes commission_earned through unchanged', async () => {
    await walletService.getTransactions('user-1', {
      type: 'commission_earned',
      page: 1,
      limit: 20,
    });

    const where = mockFindAndCountAll.mock.calls[0][0].where;
    expect(where.type).toBe('commission_earned');
  });

  it('passes adjustment through unchanged', async () => {
    await walletService.getTransactions('user-1', { type: 'adjustment', page: 1, limit: 20 });

    const where = mockFindAndCountAll.mock.calls[0][0].where;
    expect(where.type).toBe('adjustment');
  });

  it('does not filter by type when no type provided', async () => {
    await walletService.getTransactions('user-1', { page: 1, limit: 20 });

    const where = mockFindAndCountAll.mock.calls[0][0].where;
    expect(where.type).toBeUndefined();
  });
});
