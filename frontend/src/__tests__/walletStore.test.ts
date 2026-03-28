/**
 * @fileoverview Wallet Store Unit Tests
 * @description Tests for Zustand wallet store state management
 * @module stores/walletStore.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useWalletStore,
  useWalletBalance,
  useWalletTransactions,
  useWalletWithdrawals,
} from '../stores/walletStore';
import type { WalletBalance, WalletTransaction, WithdrawalRequest } from '../types';

// Mock the API service
vi.mock('../services/api', () => ({
  walletService: {
    getBalance: vi.fn(),
    getTransactions: vi.fn(),
    createWithdrawal: vi.fn(),
    cancelWithdrawal: vi.fn(),
    getWithdrawalStatus: vi.fn(),
  },
}));

import { walletService } from '../services/api';

const mockWalletService = walletService as ReturnType<typeof vi.fn>;

// Test data
const mockBalance: WalletBalance = {
  balance: '100.00',
  currency: 'USD',
  availableBalance: '100.00',
  pendingBalance: '0.00',
};

const mockTransactions: WalletTransaction[] = [
  {
    id: 'tx-1',
    type: 'commission',
    amount: 50.0,
    balanceAfter: 150.0,
    description: 'Test commission',
    createdAt: new Date(),
  },
  {
    id: 'tx-2',
    type: 'withdrawal',
    amount: -20.0,
    balanceAfter: 130.0,
    description: 'Test withdrawal',
    createdAt: new Date(),
  },
];

const mockWithdrawal: WithdrawalRequest = {
  id: 'withdraw-1',
  userId: 'user-1',
  requestedAmount: '30.00',
  feeAmount: '1.50',
  netAmount: '28.50',
  status: 'pending',
  paymentMethod: 'bank_transfer',
  createdAt: new Date(),
};

describe('useWalletStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    const { result } = renderHook(() => useWalletStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('fetchBalance', () => {
    it('should fetch and set wallet balance', async () => {
      mockWalletService.getBalance.mockResolvedValue(mockBalance);

      const { result } = renderHook(() => useWalletStore());

      await act(async () => {
        await result.current.fetchBalance();
      });

      expect(mockWalletService.getBalance).toHaveBeenCalledTimes(1);
      expect(result.current.balance).toEqual(mockBalance);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch error', async () => {
      mockWalletService.getBalance.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useWalletStore());

      await act(async () => {
        await result.current.fetchBalance();
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('fetchTransactions', () => {
    it('should fetch transactions and append to list (pagination)', async () => {
      mockWalletService.getTransactions.mockResolvedValue({
        data: mockTransactions,
        pagination: { total: 2, page: 1, limit: 20, totalPages: 1 },
      });

      const { result } = renderHook(() => useWalletStore());

      await act(async () => {
        await result.current.fetchTransactions();
      });

      expect(mockWalletService.getTransactions).toHaveBeenCalledTimes(1);
      expect(result.current.transactions).toEqual(mockTransactions);
      expect(result.current.transactionTotal).toBe(2);
    });

    it('should reset and fetch when reset=true', async () => {
      const { result } = renderHook(() => useWalletStore());

      // First fetch
      mockWalletService.getTransactions.mockResolvedValueOnce({
        data: mockTransactions,
        pagination: { total: 2, page: 1, limit: 20, totalPages: 1 },
      });

      await act(async () => {
        await result.current.fetchTransactions();
      });

      // Second fetch with reset
      mockWalletService.getTransactions.mockResolvedValueOnce({
        data: [mockTransactions[0]],
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      await act(async () => {
        await result.current.fetchTransactions(true);
      });

      expect(result.current.transactions).toHaveLength(1);
      expect(result.current.transactionPage).toBe(2); // Incremented after fetch
    });
  });

  describe('createWithdrawal', () => {
    it('should create withdrawal and refresh balance', async () => {
      mockWalletService.createWithdrawal.mockResolvedValue(mockWithdrawal);
      mockWalletService.getBalance.mockResolvedValue(mockBalance);

      const { result } = renderHook(() => useWalletStore());

      await act(async () => {
        await result.current.createWithdrawal(30);
      });

      expect(mockWalletService.createWithdrawal).toHaveBeenCalledWith(30);
      expect(result.current.withdrawalRequests).toContainEqual(mockWithdrawal);
      expect(mockWalletService.getBalance).toHaveBeenCalled(); // Balance refresh
    });

    it('should throw error and set withdrawalError on failure', async () => {
      mockWalletService.createWithdrawal.mockRejectedValue(new Error('Insufficient balance'));

      const { result } = renderHook(() => useWalletStore());

      await expect(
        act(async () => {
          await result.current.createWithdrawal(30);
        })
      ).rejects.toThrow('Insufficient balance');

      expect(result.current.withdrawalError).toBe('Insufficient balance');
    });
  });

  describe('cancelWithdrawal', () => {
    it('should cancel withdrawal and refresh balance', async () => {
      const cancelledWithdrawal = { ...mockWithdrawal, status: 'CANCELLED' as const };
      mockWalletService.cancelWithdrawal.mockResolvedValue(cancelledWithdrawal);
      mockWalletService.getBalance.mockResolvedValue(mockBalance);

      const { result } = renderHook(() => useWalletStore());

      // Pre-populate withdrawal requests
      act(() => {
        result.current.withdrawalRequests = [mockWithdrawal];
      });

      await act(async () => {
        await result.current.cancelWithdrawal('withdraw-1');
      });

      expect(mockWalletService.cancelWithdrawal).toHaveBeenCalledWith('withdraw-1');
      expect(result.current.withdrawalRequests[0].status).toBe('CANCELLED');
    });
  });

  describe('filters', () => {
    it('should set transaction type filter and refetch', async () => {
      mockWalletService.getTransactions.mockResolvedValue({
        data: mockTransactions.filter((t) => t.type === 'commission'),
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const { result } = renderHook(() => useWalletStore());

      await act(async () => {
        result.current.setTransactionType('commission');
      });

      expect(result.current.transactionType).toBe('commission');
      expect(mockWalletService.getTransactions).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'commission' })
      );
    });

    it('should set date range filter and refetch', async () => {
      mockWalletService.getTransactions.mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });

      const { result } = renderHook(() => useWalletStore());

      await act(async () => {
        result.current.setDateRange('2024-01-01', '2024-01-31');
      });

      expect(result.current.startDate).toBe('2024-01-01');
      expect(result.current.endDate).toBe('2024-01-31');
    });
  });

  describe('clearError', () => {
    it('should clear all error states', () => {
      const { result } = renderHook(() => useWalletStore());

      act(() => {
        result.current.error = 'Test error';
        result.current.transactionError = 'Tx error';
        result.current.withdrawalError = 'Withdraw error';
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.transactionError).toBeNull();
      expect(result.current.withdrawalError).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useWalletStore());

      // Modify state
      act(() => {
        result.current.balance = mockBalance;
        result.current.transactions = mockTransactions;
        result.current.error = 'Some error';
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.balance).toBeNull();
      expect(result.current.transactions).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });
});

describe('useWalletBalance hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose balance-related state and actions', async () => {
    // Test the hook by using it directly from the store
    const storeState = useWalletStore.getState();

    expect(storeState).toHaveProperty('balance');
    expect(storeState).toHaveProperty('isLoading');
    expect(storeState).toHaveProperty('error');
    expect(storeState).toHaveProperty('fetchBalance');
  });
});

describe('useWalletTransactions hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose transactions-related state and actions', () => {
    const storeState = useWalletStore.getState();

    expect(storeState).toHaveProperty('transactions');
    expect(storeState).toHaveProperty('isLoadingTransactions');
    expect(storeState).toHaveProperty('transactionPage');
    expect(storeState).toHaveProperty('hasMoreTransactions');
    expect(storeState).toHaveProperty('fetchTransactions');
  });
});

describe('useWalletWithdrawals hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose withdrawals-related state and actions', () => {
    const storeState = useWalletStore.getState();

    expect(storeState).toHaveProperty('withdrawalRequests');
    expect(storeState).toHaveProperty('isLoadingWithdrawals');
    expect(storeState).toHaveProperty('createWithdrawal');
    expect(storeState).toHaveProperty('cancelWithdrawal');
    expect(storeState).toHaveProperty('fetchWithdrawalStatus');
  });
});
