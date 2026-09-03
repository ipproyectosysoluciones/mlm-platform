/**
 * @fileoverview WithdrawalForm Unit Tests
 * @description Tests for the withdrawal form with config-driven validation
 * @module __tests__/WithdrawalForm.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WithdrawalForm } from '../components/WithdrawalForm';

/** i18n mock - prevents translation loading errors */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: { children: unknown }) => children,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

vi.mock('../stores/walletStore', () => ({
  useWalletStore: vi.fn(),
  useWalletConfig: vi.fn(),
}));

import { useWalletStore, useWalletConfig } from '../stores/walletStore';

const mockUseWalletStore = useWalletStore as ReturnType<typeof vi.fn>;
const mockUseWalletConfig = useWalletConfig as ReturnType<typeof vi.fn>;

const mockBalance = { balance: 100.0 };
const mockConfig = { minimumWithdrawal: 20, maximumWithdrawal: 500, feePercentage: 5 };
const mockCreateWithdrawal = vi.fn();
const mockFetchConfig = vi.fn();
const mockClearError = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockUseWalletStore.mockReturnValue({
    balance: mockBalance,
    isLoadingWithdrawals: false,
    withdrawalError: null,
    isSuccess: false,
    createWithdrawal: mockCreateWithdrawal,
    clearError: mockClearError,
  });
  mockUseWalletConfig.mockReturnValue({ config: mockConfig, fetchConfig: mockFetchConfig });
});

describe('WithdrawalForm', () => {
  it('renders the withdrawal form', () => {
    render(<WithdrawalForm />);
    expect(screen.getAllByText('wallet.requestWithdrawal')).toBeTruthy();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/PayPal Email/i)).toBeInTheDocument();
  });

  it('fetches config on mount', () => {
    render(<WithdrawalForm />);
    expect(mockFetchConfig).toHaveBeenCalledTimes(1);
  });

  it('disables submit when form is invalid initially', () => {
    render(<WithdrawalForm />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading state during submission', () => {
    mockUseWalletStore.mockReturnValue({
      balance: mockBalance,
      isLoadingWithdrawals: true,
      withdrawalError: null,
      isSuccess: false,
      createWithdrawal: mockCreateWithdrawal,
      clearError: mockClearError,
    });
    render(<WithdrawalForm />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('enables submit when all fields are valid', async () => {
    render(<WithdrawalForm />);
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText(/PayPal Email/i), {
      target: { value: 'valid@example.com' },
    });
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled());
  });

  it('displays fee preview when amount is entered', async () => {
    render(<WithdrawalForm />);
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '100' } });
    expect(await screen.findByText(/\$5\.00/)).toBeInTheDocument();
  });

  it('creates withdrawal with valid form', async () => {
    mockCreateWithdrawal.mockResolvedValue({ id: 'w1', status: 'pending' });
    render(<WithdrawalForm />);
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText(/PayPal Email/i), {
      target: { value: 'valid@example.com' },
    });
    const submitButton = screen.getByRole('button');
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await fireEvent.click(submitButton);
    expect(mockCreateWithdrawal).toHaveBeenCalledWith(50, {
      method: 'paypal',
      email: 'valid@example.com',
    });
  });

  it('shows success message after successful withdrawal', async () => {
    mockCreateWithdrawal.mockResolvedValue({ id: 'w1', status: 'pending' });
    mockUseWalletStore.mockReturnValue({
      balance: mockBalance,
      isLoadingWithdrawals: false,
      withdrawalError: null,
      isSuccess: true,
      createWithdrawal: mockCreateWithdrawal,
      clearError: mockClearError,
    });
    render(<WithdrawalForm />);
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText(/PayPal Email/i), {
      target: { value: 'valid@example.com' },
    });
    const submitButton = screen.getByRole('button');
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await fireEvent.click(submitButton);
    expect(mockCreateWithdrawal).toHaveBeenCalledWith(50, {
      method: 'paypal',
      email: 'valid@example.com',
    });
  });
});
