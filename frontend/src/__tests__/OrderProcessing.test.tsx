/**
 * @fileoverview Unit tests for OrderProcessing page component
 * @description Tests for the MercadoPago post-redirect landing page that reads
 *              `collection_status` query params and shows appropriate UI:
 *              - approved → success UI ("¡Pago exitoso!")
 *              - pending  → pending UI ("Procesando tu pago...")
 *              - failure/rejected → error UI ("Pago rechazado")
 *              - no param → redirect to home (unknown/generic state)
 * @module __tests__/OrderProcessing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ─── Mock react-router-dom's useSearchParams and useNavigate ─────────────────
// We keep MemoryRouter for <Link> rendering but control useSearchParams manually.
const mockNavigate = vi.fn();
let mockSearchParams: URLSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams, vi.fn()],
  };
});

// ─── Import component under test ─────────────────────────────────────────────
import OrderProcessing from '../pages/OrderProcessing';

// ─── Helper ──────────────────────────────────────────────────────────────────

function renderWithRouter(params: Record<string, string> = {}) {
  mockSearchParams = new URLSearchParams(params);

  return render(
    <MemoryRouter>
      <OrderProcessing />
    </MemoryRouter>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('OrderProcessing page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset pathname so inferStatusFromPath() doesn't interfere
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/orders/processing' },
    });
  });

  /**
   * Test 1: collection_status=approved → shows success UI
   */
  it('should show success UI when collection_status is "approved"', () => {
    renderWithRouter({ collection_status: 'approved' });

    // Title text from getStatusConfig('approved')
    expect(screen.getByText('¡Pago exitoso!')).toBeDefined();

    // Confirm description is present
    expect(screen.getByText(/Tu pago fue procesado correctamente/i)).toBeDefined();

    // Status badge shows the raw status
    expect(screen.getByText('approved')).toBeDefined();
  });

  /**
   * Test 2: collection_status=pending → shows pending UI with spinner
   */
  it('should show pending UI when collection_status is "pending"', () => {
    renderWithRouter({ collection_status: 'pending' });

    expect(screen.getByText('Procesando tu pago...')).toBeDefined();
    expect(screen.getByText(/Tu pago está siendo procesado/i)).toBeDefined();

    // PendingSpinner text is also rendered
    expect(screen.getByText(/Actualizando en tiempo real/i)).toBeDefined();

    expect(screen.getByText('pending')).toBeDefined();
  });

  /**
   * Test 3a: collection_status=failure → shows error UI
   */
  it('should show error UI when collection_status is "failure"', () => {
    renderWithRouter({ collection_status: 'failure' });

    expect(screen.getByText('Pago rechazado')).toBeDefined();
    expect(screen.getByText(/Tu pago no pudo ser procesado/i)).toBeDefined();
    expect(screen.getByText('failure')).toBeDefined();
  });

  /**
   * Test 3b: collection_status=rejected → shows error UI (same config as failure)
   */
  it('should show error UI when collection_status is "rejected"', () => {
    renderWithRouter({ collection_status: 'rejected' });

    expect(screen.getByText('Pago rechazado')).toBeDefined();
    expect(screen.getByText(/Tu pago no pudo ser procesado/i)).toBeDefined();
    expect(screen.getByText('rejected')).toBeDefined();
  });

  /**
   * Test 4: No query param (and path not /orders/success or /orders/pending)
   *         → triggers navigate('/') — unknown/generic state redirect
   */
  it('should call navigate("/") when no collection_status or status param is present', () => {
    renderWithRouter({});

    // useEffect fires → navigate should have been called with replace
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  /**
   * Test 5: payment_id present → shows payment detail section
   */
  it('should display payment ID when payment_id param is provided', () => {
    renderWithRouter({ collection_status: 'approved', payment_id: '123456789' });

    expect(screen.getByText('123456789')).toBeDefined();
    expect(screen.getByText('ID de pago')).toBeDefined();
  });

  /**
   * Test 6: external_reference present → shows reference section
   */
  it('should display external reference when external_reference param is provided', () => {
    renderWithRouter({ collection_status: 'approved', external_reference: 'user-xyz' });

    expect(screen.getByText('user-xyz')).toBeDefined();
    expect(screen.getByText('Referencia')).toBeDefined();
  });

  /**
   * Test 7: rejected status → shows "Intentar de nuevo" CTA button
   */
  it('should show "Intentar de nuevo" button for rejected status', () => {
    renderWithRouter({ collection_status: 'rejected' });

    expect(screen.getByText('Intentar de nuevo')).toBeDefined();
  });

  /**
   * Test 8: approved status → does NOT show "Intentar de nuevo" button
   */
  it('should NOT show "Intentar de nuevo" button for approved status', () => {
    renderWithRouter({ collection_status: 'approved' });

    expect(screen.queryByText('Intentar de nuevo')).toBeNull();
  });

  /**
   * Test 9: fallback generic status param (non-MP "status" query param)
   */
  it('should read generic "status" param as fallback when collection_status is absent', () => {
    renderWithRouter({ status: 'approved' });

    expect(screen.getByText('¡Pago exitoso!')).toBeDefined();
  });
});
