/**
 * @fileoverview WalletBalance unit tests
 * @description Tests for the WalletBalance component: loading, error, no balance,
 *              balance with details, and balance without details.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletBalance } from '../components/WalletBalance';
import type { WalletBalance as WalletBalanceType } from '../types';

// Mock the walletStore module — WalletBalance uses useWalletBalance
vi.mock('../stores/walletStore', () => ({
  useWalletBalance: vi.fn(),
}));

import { useWalletBalance } from '../stores/walletStore';

const mockBalance: WalletBalanceType = {
  id: 'wallet-1',
  userId: 'user-1',
  balance: 1500.5,
  currency: 'USD',
  lastUpdated: '2025-01-15T10:30:00Z',
};

function mockStoreState(overrides: Partial<ReturnType<typeof useWalletBalance>>) {
  const defaults = {
    balance: null as WalletBalanceType | null,
    isLoading: false,
    error: null as string | null,
    fetchBalance: vi.fn(),
  };
  vi.mocked(useWalletBalance).mockReturnValue({ ...defaults, ...overrides });
}

describe('WalletBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // Loading state
  // ==========================================

  it('shows spinner when loading', () => {
    mockStoreState({ isLoading: true });
    const { container } = render(<WalletBalance />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  // ==========================================
  // Error state
  // ==========================================

  it('shows error message and retry button', () => {
    const fetchBalance = vi.fn();
    mockStoreState({ error: 'Error al cargar balance', fetchBalance });
    render(<WalletBalance />);

    expect(screen.getByText('Error al cargar balance')).toBeInTheDocument();

    // Retry button renders with common.retry key (fallback) or 'Retry'
    const retryBtn = screen.getByRole('button');
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    expect(fetchBalance).toHaveBeenCalled();
  });

  // ==========================================
  // No balance state
  // ==========================================

  it('shows no wallet message when balance is null', () => {
    mockStoreState({ balance: null });
    render(<WalletBalance />);

    // mockT returns 'Sin wallet' for 'wallet.noWallet'
    expect(screen.getByText('Sin wallet')).toBeInTheDocument();
  });

  // ==========================================
  // With balance — showDetails = true (default)
  // ==========================================

  it('renders formatted balance with details when showDetails is true', () => {
    mockStoreState({ balance: mockBalance });
    render(<WalletBalance />);

    // Formatted balance: $1,500.50
    expect(screen.getByText('$1,500.50')).toBeInTheDocument();

    // Currency badge
    expect(screen.getByText('USD')).toBeInTheDocument();

    // Available balance label (mockT returns 'Balance Disponible')
    expect(screen.getByText('Balance Disponible')).toBeInTheDocument();

    // Ready status indicator (mockT returns 'Listo')
    expect(screen.getByText('Listo')).toBeInTheDocument();

    // Last updated text (mockT returns 'Actualizado')
    expect(screen.getByText(/Actualizado/)).toBeInTheDocument();
  });

  it('handles zero balance correctly', () => {
    const zeroBalance: WalletBalanceType = { ...mockBalance, balance: 0 };
    mockStoreState({ balance: zeroBalance });
    render(<WalletBalance />);

    // Should show $0.00
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  it('handles large balance values correctly', () => {
    const largeBalance: WalletBalanceType = { ...mockBalance, balance: 9999999.99 };
    mockStoreState({ balance: largeBalance });
    render(<WalletBalance />);

    expect(screen.getByText('$9,999,999.99')).toBeInTheDocument();
  });

  // ==========================================
  // With balance — showDetails = false
  // ==========================================

  it('hides details when showDetails is false', () => {
    mockStoreState({ balance: mockBalance });
    render(<WalletBalance showDetails={false} />);

    // Balance amount still shows
    expect(screen.getByText('$1,500.50')).toBeInTheDocument();

    // Details (ready status, last updated) should NOT be present
    expect(screen.queryByText('Listo')).not.toBeInTheDocument();
    expect(screen.queryByText(/Actualizado/)).not.toBeInTheDocument();
  });

  // ==========================================
  // Custom className
  // ==========================================

  it('applies custom className', () => {
    mockStoreState({ balance: mockBalance });
    const { container } = render(<WalletBalance className="custom-class" />);
    // The root div should have the custom class
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('custom-class');
  });
});
