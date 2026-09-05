/**
 * @fileoverview Wallet Store - Zustand store for wallet state management
 * @description Manages wallet balance, transactions, and withdrawal requests with payout config
 *              Gestiona balance, transacciones y solicitudes de retiro del wallet
 * @module stores/walletStore
 * @author Nexo Real Development Team
 */
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type {
  WalletBalance,
  WalletConfig,
  WalletTransaction,
  WithdrawalRequest,
  WithdrawalDestination,
  WalletTransactionType,
  CryptoPrices,
} from '../types';
import { walletService } from '../services/api';

interface WalletState {
  // Data
  balance: WalletBalance | null;
  config: WalletConfig | null;
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

  // Crypto Prices
  cryptoPrices: CryptoPrices | null;
  isLoadingCryptoPrices: boolean;

  // Actions
  fetchBalance: () => Promise<void>;
  fetchConfig: () => Promise<void>;
  fetchTransactions: (reset?: boolean) => Promise<void>;
  createWithdrawal: (
    amount: number,
    destination: WithdrawalDestination
  ) => Promise<WithdrawalRequest>;
  cancelWithdrawal: (id: string) => Promise<WithdrawalRequest>;
  fetchWithdrawalStatus: (id: string) => Promise<WithdrawalRequest>;
  fetchCryptoPrices: () => Promise<void>;

  // Setters
  setTransactionType: (type: WalletTransactionType | null) => void;
  setDateRange: (start: string | null, end: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  balance: null,
  config: null,
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
  cryptoPrices: null,
  isLoadingCryptoPrices: false,
};

export const useWalletStore = create<WalletState>((set, get) => ({
  ...initialState,

  /**
   * Fetch wallet balance
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
   * Fetch wallet config (min/max/payoutMode)
   */
  fetchConfig: async () => {
    try {
      const config = await walletService.getConfig();
      set({ config });
    } catch (error) {
      console.error('Failed to fetch wallet config:', error);
    }
  },

  /**
   * Fetch wallet transactions
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
   * Create withdrawal request with destination
   */
  createWithdrawal: async (amount: number, destination: WithdrawalDestination) => {
    set({ isLoadingWithdrawals: true, withdrawalError: null });
    try {
      const withdrawal = await walletService.createWithdrawal(amount, destination);

      set((state) => ({
        withdrawalRequests: [withdrawal, ...state.withdrawalRequests],
        isLoadingWithdrawals: false,
      }));

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
   */
  cancelWithdrawal: async (id: string) => {
    set({ isLoadingWithdrawals: true, withdrawalError: null });
    try {
      const withdrawal = await walletService.cancelWithdrawal(id);

      set((state) => ({
        withdrawalRequests: state.withdrawalRequests.map((w) => (w.id === id ? withdrawal : w)),
        isLoadingWithdrawals: false,
      }));

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
   */
  fetchWithdrawalStatus: async (id: string) => {
    set({ isLoadingWithdrawals: true, withdrawalError: null });
    try {
      const withdrawal = await walletService.getWithdrawalStatus(id);

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
   * Fetch cryptocurrency prices
   */
  fetchCryptoPrices: async () => {
    set({ isLoadingCryptoPrices: true });
    try {
      const prices = await walletService.getCryptoPrices();
      set({ cryptoPrices: prices, isLoadingCryptoPrices: false });
    } catch (error) {
      set({ isLoadingCryptoPrices: false });
      console.error('Failed to fetch crypto prices:', error);
    }
  },

  /**
   * Set transaction type filter
   */
  setTransactionType: (type) => {
    set({ transactionType: type });
    get().fetchTransactions(true);
  },

  /**
   * Set date range filter
   */
  setDateRange: (start, end) => {
    set({ startDate: start, endDate: end });
    get().fetchTransactions(true);
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null, transactionError: null, withdrawalError: null }),

  /**
   * Reset store to initial state
   */
  reset: () => set(initialState),
}));

// Selector hooks
export const useWalletBalance = () =>
  useWalletStore(
    useShallow((state) => ({
      balance: state.balance,
      isLoading: state.isLoading,
      error: state.error,
      fetchBalance: state.fetchBalance,
    }))
  );

export const useWalletConfig = () =>
  useWalletStore(
    useShallow((state) => ({
      config: state.config,
      fetchConfig: state.fetchConfig,
    }))
  );

export const useWalletTransactions = () =>
  useWalletStore(
    useShallow((state) => ({
      transactions: state.transactions,
      isLoading: state.isLoadingTransactions,
      error: state.transactionError,
      page: state.transactionPage,
      hasMore: state.hasMoreTransactions,
      fetchTransactions: state.fetchTransactions,
      transactionType: state.transactionType,
      setTransactionType: state.setTransactionType,
    }))
  );

export const useWalletWithdrawals = () =>
  useWalletStore(
    useShallow((state) => ({
      withdrawalRequests: state.withdrawalRequests,
      isLoading: state.isLoadingWithdrawals,
      error: state.withdrawalError,
      createWithdrawal: state.createWithdrawal,
      cancelWithdrawal: state.cancelWithdrawal,
      fetchWithdrawalStatus: state.fetchWithdrawalStatus,
    }))
  );

export default useWalletStore;
