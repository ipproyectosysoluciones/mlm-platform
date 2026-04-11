/**
 * @fileoverview walletStore unit tests
 * @description Tests for Zustand walletStore: balance fetch, transactions, withdrawals,
 *               filters, error handling, and reset.
 *               Tests del store Zustand del wallet: balance, transacciones, retiros,
 *               filtros, manejo de errores y reset.
 * @module test/walletStore.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useWalletStore } from '../stores/walletStore';
import { walletService } from '../services/api';
import type { WalletBalance, WalletTransaction, WithdrawalRequest } from '../types';

// ============================================
// Mocks / Mocks
// ============================================

vi.mock('../services/api', () => ({
  walletService: {
    getBalance: vi.fn(),
    getTransactions: vi.fn(),
    createWithdrawal: vi.fn(),
    cancelWithdrawal: vi.fn(),
    getWithdrawalStatus: vi.fn(),
    getCryptoPrices: vi.fn(),
  },
  authService: { login: vi.fn(), logout: vi.fn(), getProfile: vi.fn() },
  networkService: { getNodes: vi.fn() },
  commissionService: { getCommissions: vi.fn() },
}));

// ============================================
// Fixtures / Fixtures
// ============================================

const mockBalance: WalletBalance = {
  id: 'wallet-1',
  userId: 'user-1',
  balance: 1000,
  currency: 'USD',
  lastUpdated: '2024-01-15T10:00:00Z',
};

const mockTransaction: WalletTransaction = {
  id: 'tx-1',
  walletId: 'wallet-1',
  type: 'commission',
  amount: 100,
  currency: 'USD',
  description: 'Comisión de venta',
  createdAt: new Date('2024-01-15T10:00:00Z'),
};

const mockTransactionResponse = {
  data: [mockTransaction],
  pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
};

const mockWithdrawal: WithdrawalRequest = {
  id: 'wd-1',
  userId: 'user-1',
  requestedAmount: 500,
  feeAmount: 5,
  netAmount: 495,
  status: 'pending',
  createdAt: new Date('2024-01-15T10:00:00Z'),
};

// ============================================
// Tests
// ============================================

describe('walletStore', () => {
  beforeEach(() => {
    act(() => {
      useWalletStore.getState().reset();
    });
    vi.clearAllMocks();
  });

  // ── Initial state ─────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useWalletStore.getState();
      expect(state.balance).toBeNull();
      expect(state.transactions).toEqual([]);
      expect(state.withdrawalRequests).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.transactionPage).toBe(1);
      expect(state.hasMoreTransactions).toBe(true);
      expect(state.transactionType).toBeNull();
      expect(state.startDate).toBeNull();
      expect(state.endDate).toBeNull();
      expect(state.cryptoPrices).toBeNull();
    });
  });

  // ── fetchBalance ──────────────────────────────────────────────────────────

  describe('fetchBalance', () => {
    it('should fetch balance and update state on success', async () => {
      vi.mocked(walletService.getBalance).mockResolvedValue(mockBalance);

      await act(async () => {
        await useWalletStore.getState().fetchBalance();
      });

      const state = useWalletStore.getState();
      expect(state.balance).toEqual(mockBalance);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should set error on failure', async () => {
      vi.mocked(walletService.getBalance).mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await useWalletStore.getState().fetchBalance();
      });

      const state = useWalletStore.getState();
      expect(state.balance).toBeNull();
      expect(state.error).toBe('Network error');
      expect(state.isLoading).toBe(false);
    });

    it('should use fallback message for non-Error rejection', async () => {
      vi.mocked(walletService.getBalance).mockRejectedValue('oops');

      await act(async () => {
        await useWalletStore.getState().fetchBalance();
      });

      expect(useWalletStore.getState().error).toBe('Failed to fetch balance');
    });
  });

  // ── fetchTransactions ─────────────────────────────────────────────────────

  describe('fetchTransactions', () => {
    it('should fetch transactions and update state on success', async () => {
      vi.mocked(walletService.getTransactions).mockResolvedValue(mockTransactionResponse);

      await act(async () => {
        await useWalletStore.getState().fetchTransactions();
      });

      const state = useWalletStore.getState();
      expect(state.transactions).toHaveLength(1);
      expect(state.transactions[0].id).toBe('tx-1');
      expect(state.isLoadingTransactions).toBe(false);
      expect(state.transactionError).toBeNull();
    });

    it('should append transactions when not resetting (pagination)', async () => {
      const existing: WalletTransaction = { ...mockTransaction, id: 'tx-0' };
      act(() => {
        useWalletStore.setState({ transactions: [existing], transactionPage: 2 });
      });

      vi.mocked(walletService.getTransactions).mockResolvedValue(mockTransactionResponse);

      await act(async () => {
        await useWalletStore.getState().fetchTransactions(false);
      });

      // Should append, not replace
      expect(useWalletStore.getState().transactions).toHaveLength(2);
    });

    it('should reset transactions when reset=true', async () => {
      const existing: WalletTransaction = { ...mockTransaction, id: 'tx-0' };
      act(() => {
        useWalletStore.setState({ transactions: [existing], transactionPage: 3 });
      });

      vi.mocked(walletService.getTransactions).mockResolvedValue(mockTransactionResponse);

      await act(async () => {
        await useWalletStore.getState().fetchTransactions(true);
      });

      // Should replace (reset)
      expect(useWalletStore.getState().transactions).toHaveLength(1);
      expect(useWalletStore.getState().transactions[0].id).toBe('tx-1');
    });

    it('should set transactionError on failure', async () => {
      vi.mocked(walletService.getTransactions).mockRejectedValue(new Error('Tx error'));

      await act(async () => {
        await useWalletStore.getState().fetchTransactions();
      });

      expect(useWalletStore.getState().transactionError).toBe('Tx error');
    });
  });

  // ── createWithdrawal ──────────────────────────────────────────────────────

  describe('createWithdrawal', () => {
    it('should create withdrawal, add to list, and return it', async () => {
      vi.mocked(walletService.createWithdrawal).mockResolvedValue(mockWithdrawal);
      vi.mocked(walletService.getBalance).mockResolvedValue(mockBalance);

      let result: WithdrawalRequest | undefined;
      await act(async () => {
        result = await useWalletStore.getState().createWithdrawal(500);
      });

      expect(result?.id).toBe('wd-1');
      expect(useWalletStore.getState().withdrawalRequests).toHaveLength(1);
      expect(useWalletStore.getState().isLoadingWithdrawals).toBe(false);
    });

    it('should set withdrawalError and rethrow on failure', async () => {
      vi.mocked(walletService.createWithdrawal).mockRejectedValue(new Error('Insufficient funds'));

      await act(async () => {
        await expect(useWalletStore.getState().createWithdrawal(9999)).rejects.toThrow(
          'Insufficient funds'
        );
      });

      expect(useWalletStore.getState().withdrawalError).toBe('Insufficient funds');
    });
  });

  // ── cancelWithdrawal ──────────────────────────────────────────────────────

  describe('cancelWithdrawal', () => {
    it('should cancel withdrawal and update in list', async () => {
      const cancelled = { ...mockWithdrawal, status: 'cancelled' as const };
      vi.mocked(walletService.cancelWithdrawal).mockResolvedValue(cancelled);
      vi.mocked(walletService.getBalance).mockResolvedValue(mockBalance);

      act(() => {
        useWalletStore.setState({ withdrawalRequests: [mockWithdrawal] });
      });

      await act(async () => {
        await useWalletStore.getState().cancelWithdrawal('wd-1');
      });

      expect(useWalletStore.getState().withdrawalRequests[0].status).toBe('cancelled');
    });

    it('should set withdrawalError and rethrow on failure', async () => {
      vi.mocked(walletService.cancelWithdrawal).mockRejectedValue(new Error('Cancel error'));

      await act(async () => {
        await expect(useWalletStore.getState().cancelWithdrawal('wd-1')).rejects.toThrow(
          'Cancel error'
        );
      });

      expect(useWalletStore.getState().withdrawalError).toBe('Cancel error');
    });
  });

  // ── fetchWithdrawalStatus ─────────────────────────────────────────────────

  describe('fetchWithdrawalStatus', () => {
    it('should fetch and add withdrawal if not in list', async () => {
      vi.mocked(walletService.getWithdrawalStatus).mockResolvedValue(mockWithdrawal);

      await act(async () => {
        await useWalletStore.getState().fetchWithdrawalStatus('wd-1');
      });

      expect(useWalletStore.getState().withdrawalRequests).toHaveLength(1);
    });

    it('should update withdrawal if already in list', async () => {
      const updated = { ...mockWithdrawal, status: 'completed' as const };
      vi.mocked(walletService.getWithdrawalStatus).mockResolvedValue(updated);
      act(() => {
        useWalletStore.setState({ withdrawalRequests: [mockWithdrawal] });
      });

      await act(async () => {
        await useWalletStore.getState().fetchWithdrawalStatus('wd-1');
      });

      expect(useWalletStore.getState().withdrawalRequests[0].status).toBe('completed');
    });

    it('should set withdrawalError and rethrow on failure', async () => {
      vi.mocked(walletService.getWithdrawalStatus).mockRejectedValue(new Error('Status error'));

      await act(async () => {
        await expect(useWalletStore.getState().fetchWithdrawalStatus('wd-1')).rejects.toThrow(
          'Status error'
        );
      });

      expect(useWalletStore.getState().withdrawalError).toBe('Status error');
    });
  });

  // ── fetchCryptoPrices ─────────────────────────────────────────────────────

  describe('fetchCryptoPrices', () => {
    it('should fetch and set crypto prices', async () => {
      const mockPrices = { BTC: 60000, ETH: 3000 };
      vi.mocked(walletService.getCryptoPrices).mockResolvedValue(mockPrices);

      await act(async () => {
        await useWalletStore.getState().fetchCryptoPrices();
      });

      expect(useWalletStore.getState().cryptoPrices).toEqual(mockPrices);
      expect(useWalletStore.getState().isLoadingCryptoPrices).toBe(false);
    });

    it('should set isLoadingCryptoPrices false on error (graceful)', async () => {
      vi.mocked(walletService.getCryptoPrices).mockRejectedValue(new Error('Price error'));

      await act(async () => {
        await useWalletStore.getState().fetchCryptoPrices();
      });

      // Should NOT throw — errors are swallowed for crypto prices
      expect(useWalletStore.getState().isLoadingCryptoPrices).toBe(false);
      expect(useWalletStore.getState().cryptoPrices).toBeNull();
    });
  });

  // ── Filter setters ────────────────────────────────────────────────────────

  describe('setTransactionType', () => {
    it('should set transaction type and trigger refetch', async () => {
      vi.mocked(walletService.getTransactions).mockResolvedValue(mockTransactionResponse);

      await act(async () => {
        useWalletStore.getState().setTransactionType('commission');
      });

      expect(useWalletStore.getState().transactionType).toBe('commission');
      expect(walletService.getTransactions).toHaveBeenCalled();
    });

    it('should accept null to clear the filter', async () => {
      vi.mocked(walletService.getTransactions).mockResolvedValue(mockTransactionResponse);

      await act(async () => {
        useWalletStore.getState().setTransactionType(null);
      });

      expect(useWalletStore.getState().transactionType).toBeNull();
    });
  });

  describe('setDateRange', () => {
    it('should set date range and trigger refetch', async () => {
      vi.mocked(walletService.getTransactions).mockResolvedValue(mockTransactionResponse);

      await act(async () => {
        useWalletStore.getState().setDateRange('2025-01-01', '2025-01-31');
      });

      expect(useWalletStore.getState().startDate).toBe('2025-01-01');
      expect(useWalletStore.getState().endDate).toBe('2025-01-31');
      expect(walletService.getTransactions).toHaveBeenCalled();
    });
  });

  // ── clearError ────────────────────────────────────────────────────────────

  describe('clearError', () => {
    it('should clear all error fields', () => {
      act(() => {
        useWalletStore.setState({
          error: 'err1',
          transactionError: 'err2',
          withdrawalError: 'err3',
        });
        useWalletStore.getState().clearError();
      });

      const state = useWalletStore.getState();
      expect(state.error).toBeNull();
      expect(state.transactionError).toBeNull();
      expect(state.withdrawalError).toBeNull();
    });
  });

  // ── reset ─────────────────────────────────────────────────────────────────

  describe('reset', () => {
    it('should restore all state to initial values', () => {
      act(() => {
        useWalletStore.setState({
          balance: mockBalance,
          transactions: [mockTransaction],
          error: 'some error',
          transactionType: 'commission',
        });
        useWalletStore.getState().reset();
      });

      const state = useWalletStore.getState();
      expect(state.balance).toBeNull();
      expect(state.transactions).toEqual([]);
      expect(state.error).toBeNull();
      expect(state.transactionType).toBeNull();
    });
  });
});
