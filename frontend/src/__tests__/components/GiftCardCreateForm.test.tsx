/**
 * @fileoverview GiftCardCreateForm Component Tests
 * @description Unit tests for the gift card creation form component
 *              Tests unitarios del componente formulario de creación de gift cards
 * @module __tests__/components/GiftCardCreateForm.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GiftCardCreateForm } from '../../components/GiftCards/GiftCardCreateForm';
import type { GiftCardResponse } from '../../types';

// Mock the gift card store
const mockCreateCard = vi.fn();
const mockClearErrors = vi.fn();

vi.mock('../../stores/giftCardStore', () => ({
  useGiftCardCreate: () => ({
    selectedCard: null,
    isCreating: false,
    createError: null,
    createCard: mockCreateCard,
    clearErrors: mockClearErrors,
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockCreatedCard: GiftCardResponse = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  code: 'GC-ABC123XYZ',
  balance: 50,
  status: 'active',
  isActive: true,
  expiresAt: '2026-05-03T00:00:00.000Z',
  qrCodeData: 'data:image/png;base64,fakeQrData',
  createdAt: '2026-04-03T00:00:00.000Z',
};

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('GiftCardCreateForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the form with amount, currency, and expiry fields', () => {
    render(
      <TestWrapper>
        <GiftCardCreateForm />
      </TestWrapper>
    );

    // The i18n mock returns the key as text, so aria-label is the i18n key
    expect(screen.getByLabelText('giftCards.amountLabel')).toBeInTheDocument();
    expect(screen.getByLabelText('giftCards.currencyLabel')).toBeInTheDocument();
    expect(screen.getByLabelText('giftCards.expiryLabel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /giftCards\.createCard/i })).toBeInTheDocument();
  });

  it('should show validation error when submitting with empty amount', async () => {
    render(
      <TestWrapper>
        <GiftCardCreateForm />
      </TestWrapper>
    );

    // The button is disabled when amount is empty (canSubmit = parseFloat('') > 0 = false)
    // We need to set a value that's invalid (e.g., 0) but also triggers validation
    // Actually, with empty amount the button is disabled. Let's set amount to "0"
    const amountInput = screen.getByLabelText('giftCards.amountLabel');
    fireEvent.change(amountInput, { target: { value: '0' } });

    // Button is still disabled because canSubmit checks parseFloat(amount) > 0
    // So we can't click submit. But we can test by setting a positive value then clearing it.
    // Actually, 0 is not > 0 so canSubmit is false. Let's test with the form directly.
    // We need to submit the form via form submit event instead
    const form = screen.getByRole('button', { name: /giftCards\.createCard/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('should call createCard and show success panel on successful submission', async () => {
    mockCreateCard.mockResolvedValue(mockCreatedCard);

    render(
      <TestWrapper>
        <GiftCardCreateForm />
      </TestWrapper>
    );

    const amountInput = screen.getByLabelText('giftCards.amountLabel');
    fireEvent.change(amountInput, { target: { value: '50' } });

    const submitButton = screen.getByRole('button', { name: /giftCards\.createCard/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateCard).toHaveBeenCalledWith(50, 30);
    });

    await waitFor(() => {
      expect(screen.getByTestId('card-details')).toBeInTheDocument();
    });
  });

  it('should show QR image and action buttons after card creation', async () => {
    mockCreateCard.mockResolvedValue(mockCreatedCard);

    render(
      <TestWrapper>
        <GiftCardCreateForm />
      </TestWrapper>
    );

    const amountInput = screen.getByLabelText('giftCards.amountLabel');
    fireEvent.change(amountInput, { target: { value: '50' } });

    const submitButton = screen.getByRole('button', { name: /giftCards\.createCard/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('card-details')).toBeInTheDocument();
    });

    // QR image should be present (alt text from i18n returns the key)
    expect(screen.getByAltText('giftCards.qrCode')).toBeInTheDocument();

    // Action buttons (aria-label is the i18n key)
    expect(screen.getByLabelText('giftCards.downloadQR')).toBeInTheDocument();
    expect(screen.getByLabelText('giftCards.copyLink')).toBeInTheDocument();
    expect(screen.getByText('giftCards.createAnother')).toBeInTheDocument();
  });
});
