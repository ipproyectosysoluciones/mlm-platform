/**
 * @fileoverview Wallet Store - Zustand store for wallet state management
 * @description Manages wallet balance, transactions, and withdrawal requests
 *              Gestiona balance, transacciones y solicitudes de retiro del wallet
 * @module stores/walletStore
 * @author MLM Development Team
 */
import { create } from 'zustand';
import type {
  WalletBalance,
  WalletTransaction,
  WithdrawalRequest,
  WalletTransactionType,
} from '../types';
import { walletService } from '../services/api';

interface WalletState {
  // Data
  balance: WalletBalance | null;
  transactions: WalletTransaction[];
  withdrawalRequests: WithdrawalRequest[];

  // UI State
  isLoading: boolean;
  isLoadingTransactions: boolean;
  isLoadingWithdrawals: boolean;
  error: string | null;
  transactionError: string | null;
  withdrawalError: string | null;

  // Pagination
  transactionPage: number;
  transactionLimit: number;
  transactionTotal: number;
  hasMoreTransactions: boolean;

  // Filters
  transactionType: WalletTransactionType | null;
  startDate: string | null;
  endDate: string | null;

  // Actions
  fetchBalance: () => Promise<void>;
  fetchTransactions: (reset?: boolean) => Promise<void>;
  createWithdrawal: (amount: number) => Promise<WithdrawalRequest>;
  cancelWithdrawal: (id: string) => Promise<WithdrawalRequest>;
  fetchWithdrawalStatus: (id: string) => Promise<WithdrawalRequest>;

  // Setters
  setTransactionType: (type: WalletTransactionType | null) => void;
  setDateRange: (start: string | null, end: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  balance: null,
  transactions: [],
  withdrawalRequests: [],
  isLoading: false,
  isLoadingTransactions: false,
  isLoadingWithdrawals: false,
  error: null,
  transactionError: null,
  withdrawalError: null,
  transactionPage: 1,
  transactionLimit: 20,
  transactionTotal: 0,
  hasMoreTransactions: true,
  transactionType: null,
  startDate: null,
  endDate: null,
};

export const useWalletStore = create<WalletState>((set, get) => ({
  ...initialState,

  /**
   * Fetch wallet balance
   * Obtiene el balance del wallet
   */
  fetchBalance: async () => {
    set({ isLoading: true, error: null });
    try {
      const balance = await walletService.getBalance();
      set({ balance, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch balance';
      set({ error: message, isLoading: false });
    }
  },

  /**
   * Fetch wallet transactions
   * Obtiene transacciones del wallet
   */
  fetchTransactions: async (reset = false) => {
    const state = get();
    const page = reset ? 1 : state.transactionPage;

    set({ isLoadingTransactions: true, transactionError: null });
    try {
      const response = await walletService.getTransactions({
        page,
        limit: state.transactionLimit,
        type: state.transactionType || undefined,
        startDate: state.startDate || undefined,
        endDate: state.endDate || undefined,
      });

      const newTransactions = reset ? response.data : [...state.transactions, ...response.data];

      set({
        transactions: newTransactions,
        transactionPage: page + 1,
        transactionTotal: response.pagination?.total || 0,
        hasMoreTransactions: response.pagination ? page < response.pagination.totalPages : false,
        isLoadingTransactions: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch transactions';
      set({ transactionError: message, isLoadingTransactions: false });
    }
  },

  /**
   * Create withdrawal request
   * Crea solicitud de retiro
   */
  createWithdrawal: async (amount: number) => {
    set({ isLoadingWithdrawals: true, withdrawalError: null });
    try {
      const withdrawal = await walletService.createWithdrawal(amount);

      // Add to withdrawal requests list
      set((state) => ({
        withdrawalRequests: [withdrawal, ...state.withdrawalRequests],
        isLoadingWithdrawals: false,
      }));

      // Refresh balance after withdrawal
      get().fetchBalance();

      return withdrawal;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create withdrawal';
      set({ withdrawalError: message, isLoadingWithdrawals: false });
      throw error;
    }
  },

  /**
   * Cancel withdrawal request
   * Cancela solicitud de retiro
   */
  cancelWithdrawal: async (id: string) => {
    set({ isLoadingWithdrawals: true, withdrawalError: null });
    try {
      const withdrawal = await walletService.cancelWithdrawal(id);

      // Update in withdrawal requests list
      set((state) => ({
        withdrawalRequests: state.withdrawalRequests.map((w) => (w.id === id ? withdrawal : w)),
        isLoadingWithdrawals: false,
      }));

      // Refresh balance after cancellation
      get().fetchBalance();

      return withdrawal;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel withdrawal';
      set({ withdrawalError: message, isLoadingWithdrawals: false });
      throw error;
    }
  },

  /**
   * Fetch withdrawal status
   * Obtiene estado de solicitud de retiro
   */
  fetchWithdrawalStatus: async (id: string) => {
    set({ isLoadingWithdrawals: true, withdrawalError: null });
    try {
      const withdrawal = await walletService.getWithdrawalStatus(id);

      // Update in withdrawal requests list if exists
      set((state) => {
        const exists = state.withdrawalRequests.some((w) => w.id === id);
        return {
          withdrawalRequests: exists
            ? state.withdrawalRequests.map((w) => (w.id === id ? withdrawal : w))
            : [withdrawal, ...state.withdrawalRequests],
          isLoadingWithdrawals: false,
        };
      });

      return withdrawal;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch withdrawal status';
      set({ withdrawalError: message, isLoadingWithdrawals: false });
      throw error;
    }
  },

  /**
   * Set transaction type filter
   * Establece filtro de tipo de transacción
   */
  setTransactionType: (type) => {
    set({ transactionType: type });
    get().fetchTransactions(true);
  },

  /**
   * Set date range filter
   * Establece filtro de rango de fechas
   */
  setDateRange: (start, end) => {
    set({ startDate: start, endDate: end });
    get().fetchTransactions(true);
  },

  /**
   * Clear error
   * Limpia error
   */
  clearError: () => set({ error: null, transactionError: null, withdrawalError: null }),

  /**
   * Reset store to initial state
   * Resetea el store al estado inicial
   */
  reset: () => set(initialState),
}));

// Selector hooks
export const useWalletBalance = () =>
  useWalletStore((state) => ({
    balance: state.balance,
    isLoading: state.isLoading,
    error: state.error,
    fetchBalance: state.fetchBalance,
  }));

export const useWalletTransactions = () =>
  useWalletStore((state) => ({
    transactions: state.transactions,
    isLoading: state.isLoadingTransactions,
    error: state.transactionError,
    page: state.transactionPage,
    hasMore: state.hasMoreTransactions,
    fetchTransactions: state.fetchTransactions,
    transactionType: state.transactionType,
    setTransactionType: state.setTransactionType,
  }));

export const useWalletWithdrawals = () =>
  useWalletStore((state) => ({
    withdrawalRequests: state.withdrawalRequests,
    isLoading: state.isLoadingWithdrawals,
    error: state.withdrawalError,
    createWithdrawal: state.createWithdrawal,
    cancelWithdrawal: state.cancelWithdrawal,
    fetchWithdrawalStatus: state.fetchWithdrawalStatus,
  }));

export default useWalletStore;
