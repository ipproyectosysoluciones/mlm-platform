/**
 * @fileoverview GiftCardRedeem Component Tests
 * @description Unit tests for the gift card redemption component
 *              Tests unitarios del componente de canje de gift cards
 * @module __tests__/components/GiftCardRedeem.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GiftCardRedeem } from '../../components/Checkout/GiftCardRedeem';
import type { GiftCardValidateResponse, GiftCardTransactionResponse } from '../../types';

// Store mock state — overridable per-test
let mockStoreState = {
  validationResult: null as GiftCardValidateResponse | null,
  lastTransaction: null as GiftCardTransactionResponse | null,
  isValidating: false,
  isRedeeming: false,
  validateError: null as string | null,
  redeemError: null as string | null,
  validateCode: vi.fn(),
  redeemCard: vi.fn(),
  clearValidation: vi.fn(),
  clearErrors: vi.fn(),
};

vi.mock('../../stores/giftCardStore', () => ({
  useGiftCardRedeem: () => mockStoreState,
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockValidCard: GiftCardValidateResponse = {
  isValid: true,
  card: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    code: 'GC-ABC123XYZ',
    balance: 100,
    status: 'active',
    isActive: true,
    expiresAt: '2026-06-01T00:00:00.000Z',
    qrCodeData: null,
    createdAt: '2026-04-03T00:00:00.000Z',
  },
};

const mockInvalidCard: GiftCardValidateResponse = {
  isValid: false,
  reason: 'EXPIRED',
};

const mockTransaction: GiftCardTransactionResponse = {
  id: '660e8400-e29b-41d4-a716-446655440001',
  giftCardId: '550e8400-e29b-41d4-a716-446655440000',
  amountRedeemed: 100,
  transactionType: 'redemption',
  status: 'completed',
  createdAt: '2026-04-03T12:00:00.000Z',
};

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('GiftCardRedeem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state to defaults
    mockStoreState = {
      validationResult: null,
      lastTransaction: null,
      isValidating: false,
      isRedeeming: false,
      validateError: null,
      redeemError: null,
      validateCode: vi.fn(),
      redeemCard: vi.fn(),
      clearValidation: vi.fn(),
      clearErrors: vi.fn(),
    };
  });

  it('should render the code input and validate button', () => {
    render(
      <TestWrapper>
        <GiftCardRedeem />
      </TestWrapper>
    );

    // i18n mock returns the key as text
    expect(screen.getByLabelText('giftCards.codeInputLabel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /giftCards\.validateCard/i })).toBeInTheDocument();
  });

  it('should show input error when validating with empty code', async () => {
    render(
      <TestWrapper>
        <GiftCardRedeem />
      </TestWrapper>
    );

    // The validate button is disabled when code is empty (disabled={!code || isValidating}),
    // so we trigger validation via Enter key on the input instead
    const codeInput = screen.getByLabelText('giftCards.codeInputLabel');
    fireEvent.keyDown(codeInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('should call validateCode when clicking validate with a code', async () => {
    render(
      <TestWrapper>
        <GiftCardRedeem />
      </TestWrapper>
    );

    const codeInput = screen.getByLabelText('giftCards.codeInputLabel');
    fireEvent.change(codeInput, { target: { value: 'GC-ABC123XYZ' } });

    const validateButton = screen.getByRole('button', { name: /giftCards\.validateCard/i });
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(mockStoreState.validateCode).toHaveBeenCalledWith('GC-ABC123XYZ');
    });
  });

  it('should show valid card preview when validation succeeds', () => {
    mockStoreState.validationResult = mockValidCard;

    render(
      <TestWrapper>
        <GiftCardRedeem />
      </TestWrapper>
    );

    expect(screen.getByTestId('validation-valid')).toBeInTheDocument();
    expect(screen.getByText('GC-ABC123XYZ')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('giftCards.redeemNow')).toBeInTheDocument();
  });

  it('should show invalid card message when validation fails', () => {
    mockStoreState.validationResult = mockInvalidCard;

    render(
      <TestWrapper>
        <GiftCardRedeem />
      </TestWrapper>
    );

    expect(screen.getByTestId('validation-invalid')).toBeInTheDocument();
    // The reason message uses t('giftCards.expired') which returns the key
    expect(screen.getByText('giftCards.expired')).toBeInTheDocument();
  });

  it('should show success state after redemption', () => {
    mockStoreState.lastTransaction = mockTransaction;

    render(
      <TestWrapper>
        <GiftCardRedeem />
      </TestWrapper>
    );

    expect(screen.getByTestId('redeem-success')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('giftCards.redeemAnother')).toBeInTheDocument();
  });

  it('should call redeemCard when clicking redeem on a valid card', async () => {
    mockStoreState.validationResult = mockValidCard;
    mockStoreState.redeemCard.mockResolvedValue(mockTransaction);

    render(
      <TestWrapper>
        <GiftCardRedeem orderId="order-123" />
      </TestWrapper>
    );

    const redeemButton = screen.getByRole('button', { name: /giftCards\.redeemNow/i });
    fireEvent.click(redeemButton);

    await waitFor(() => {
      expect(mockStoreState.redeemCard).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
        'order-123'
      );
    });
  });
});
