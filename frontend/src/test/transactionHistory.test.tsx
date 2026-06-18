/**
 * @fileoverview TransactionHistory unit tests
 * @description Tests for the TransactionHistory component: loading, error, empty,
 *              populated states, pagination (Load More), and filter select.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionHistory } from '../components/TransactionHistory';
import type { WalletTransaction, WalletTransactionType } from '../types';

// Mock the walletStore module — TransactionHistory uses useWalletTransactions
vi.mock('../stores/walletStore', () => ({
  useWalletTransactions: vi.fn(),
}));

import { useWalletTransactions } from '../stores/walletStore';

const mockTx = (
  id: string,
  type: WalletTransactionType,
  amount: number,
  overrides: Partial<WalletTransaction> = {}
): WalletTransaction => ({
  id,
  walletId: 'wallet-1',
  type,
  amount,
  currency: 'USD',
  description: `${type} description`,
  createdAt: new Date(`2025-01-${String(Number(id.slice(-1)) + 1).padStart(2, '0')}T10:00:00Z`),
  ...overrides,
});

const defaultMockTx: WalletTransaction = mockTx('tx-1', 'commission', 150);
const multiTxs: WalletTransaction[] = [
  mockTx('tx-1', 'commission', 150),
  mockTx('tx-2', 'withdrawal', 50),
  mockTx('tx-3', 'refund', 25),
];

function mockStoreState(overrides: Partial<ReturnType<typeof useWalletTransactions>>) {
  const defaults = {
    transactions: [],
    isLoading: false,
    error: null,
    hasMore: false,
    transactionType: null as WalletTransactionType | null,
    fetchTransactions: vi.fn(),
    setTransactionType: vi.fn(),
  };
  vi.mocked(useWalletTransactions).mockReturnValue({ ...defaults, ...overrides });
}

describe('TransactionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // Loading state
  // ==========================================

  it('shows spinner when loading and no transactions exist', () => {
    mockStoreState({ isLoading: true, transactions: [] });
    const { container } = render(<TransactionHistory />);
    // The spinner is a Loader2 component (SVG with animate-spin class)
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  // ==========================================
  // Error state
  // ==========================================

  it('displays error message when error state', () => {
    mockStoreState({ error: 'Error al cargar transacciones' });
    render(<TransactionHistory />);
    expect(screen.getByText('Error al cargar transacciones')).toBeInTheDocument();
  });

  // ==========================================
  // Empty state
  // ==========================================

  it('shows empty state message when no transactions', () => {
    mockStoreState({ transactions: [] });
    render(<TransactionHistory />);
    // The component uses t('wallet.noTransactions') which falls back to the key
    expect(screen.getByText('wallet.noTransactions')).toBeInTheDocument();
  });

  // ==========================================
  // With data
  // ==========================================

  it('renders transaction list with items', () => {
    mockStoreState({ transactions: multiTxs });
    render(<TransactionHistory />);

    // Each transaction type description should be rendered
    for (const tx of multiTxs) {
      expect(screen.getByText(tx.description!)).toBeInTheDocument();
    }
  });

  it('formats positive amounts with + sign and green color', () => {
    mockStoreState({ transactions: [defaultMockTx] });
    render(<TransactionHistory />);

    // Commission is positive — format shows +$150.00
    expect(screen.getByText('+$150.00')).toBeInTheDocument();
  });

  it('formats withdrawal amounts with - sign', () => {
    const withdrawal: WalletTransaction = mockTx('tx-2', 'withdrawal', 50);
    mockStoreState({ transactions: [withdrawal] });
    render(<TransactionHistory />);

    expect(screen.getByText('-$50.00')).toBeInTheDocument();
  });

  // ==========================================
  // Pagination — Load More
  // ==========================================

  it('shows Load More button when hasMore is true', () => {
    mockStoreState({ transactions: multiTxs, hasMore: true });
    render(<TransactionHistory />);

    expect(screen.getByText('Cargar más')).toBeInTheDocument();
  });

  it('does NOT show Load More button when hasMore is false', () => {
    mockStoreState({ transactions: multiTxs, hasMore: false });
    render(<TransactionHistory />);

    expect(screen.queryByText('Cargar más')).not.toBeInTheDocument();
  });

  it('calls fetchTransactions(false) on Load More click', () => {
    const fetchTransactions = vi.fn();
    mockStoreState({
      transactions: multiTxs,
      hasMore: true,
      isLoading: false,
      fetchTransactions,
    });
    render(<TransactionHistory />);

    fireEvent.click(screen.getByText('Cargar más'));
    expect(fetchTransactions).toHaveBeenCalledWith(false);
  });

  it('disables Load More button while loading', () => {
    const fetchTransactions = vi.fn();
    mockStoreState({
      transactions: multiTxs,
      hasMore: true,
      isLoading: true,
      fetchTransactions,
    });
    render(<TransactionHistory />);

    const loadMoreBtn = screen.getByRole('button', { name: /Cargar más/ });
    expect(loadMoreBtn).toBeDisabled();
  });

  // ==========================================
  // Filter select
  // ==========================================

  it('renders type filter select with options', () => {
    mockStoreState({ transactions: multiTxs });
    render(<TransactionHistory />);

    // The select lists wallet.allTypes, wallet.commissions, wallet.withdrawals, wallet.refunds
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Comisiones')).toBeInTheDocument();
    expect(screen.getByText('Retiros')).toBeInTheDocument();
    expect(screen.getByText('Reembolsos')).toBeInTheDocument();
  });

  it('calls setTransactionType when filter changes', () => {
    const setTransactionType = vi.fn();
    mockStoreState({
      transactions: multiTxs,
      setTransactionType,
    });
    render(<TransactionHistory />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'commission' } });

    expect(setTransactionType).toHaveBeenCalledWith('commission');
  });

  // ==========================================
  // Calls fetchTransactions on mount
  // ==========================================

  it('calls fetchTransactions(true) on mount', () => {
    const fetchTransactions = vi.fn();
    mockStoreState({ transactions: [], fetchTransactions });
    render(<TransactionHistory />);

    expect(fetchTransactions).toHaveBeenCalledWith(true);
  });

  // ==========================================
  // Applies limit prop
  // ==========================================

  it('respects limit prop to cap displayed transactions', () => {
    const manyTxs: WalletTransaction[] = Array.from({ length: 10 }, (_, i) =>
      mockTx(`tx-${i + 1}`, 'commission', 100 + i)
    );
    mockStoreState({ transactions: manyTxs });
    render(<TransactionHistory limit={3} />);

    // Should render 3 items, not 10
    const descriptions = screen.getAllByText(/commission description/);
    expect(descriptions).toHaveLength(3);
  });
});
