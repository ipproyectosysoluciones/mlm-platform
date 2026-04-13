/**
 * @fileoverview MisReservasPage button migration tests / Tests de migración de botones en MisReservasPage
 * @description Validates all raw <button> elements are replaced with shadcn <Button>
 *              Verifica que todos los <button> crudos se reemplazaron con <Button> de shadcn
 * @module __tests__/pages/MisReservasPage.buttons.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockFetchMyReservations = vi.fn();
const mockCancelReservation = vi.fn();

vi.mock('../../stores/reservationStore', () => ({
  useMyReservations: () => ({
    myReservations: [
      {
        id: 'res-1',
        status: 'pending',
        propertyId: 'prop-1',
        property: { title: 'Beach House', city: 'Mar del Plata' },
        tourPackage: null,
        checkIn: '2026-05-01',
        checkOut: '2026-05-05',
        guests: 2,
        totalAmount: 5000,
        currency: 'USD',
        createdAt: '2026-04-10',
      },
      {
        id: 'res-2',
        status: 'confirmed',
        propertyId: null,
        property: null,
        tourPackageId: 'tour-1',
        tourPackage: { title: 'Mendoza Wine Tour', destination: 'Mendoza' },
        checkIn: undefined,
        checkOut: undefined,
        guests: 4,
        totalAmount: 8000,
        currency: 'USD',
        createdAt: '2026-04-08',
      },
    ],
    reservationsPagination: { total: 20, page: 1, limit: 8, totalPages: 3 },
    isFetchingReservations: false,
    reservationsError: null,
    isCancelling: false,
    cancelError: null,
    fetchMyReservations: mockFetchMyReservations,
    cancelReservation: mockCancelReservation,
  }),
}));

import MisReservasPage from '../../pages/MisReservasPage';

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderMisReservasPage() {
  return render(
    <MemoryRouter>
      <MisReservasPage />
    </MemoryRouter>
  );
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('MisReservasPage — Button migration (T1.6)', () => {
  beforeEach(() => {
    mockFetchMyReservations.mockReset();
    mockCancelReservation.mockReset();
  });

  it('renders NO raw <button> — all buttons use shadcn Button component', () => {
    const { container } = renderMisReservasPage();

    const allButtons = container.querySelectorAll('button');
    const shadcnBaseFragment = 'ring-offset-background';

    expect(allButtons.length).toBeGreaterThan(0);
    allButtons.forEach((btn) => {
      expect(
        btn.className.includes(shadcnBaseFragment),
        `Button "${btn.textContent?.trim()}" is missing shadcn buttonVariants class`
      ).toBe(true);
    });
  });

  it('filter buttons are present (5 status filters)', () => {
    renderMisReservasPage();

    const filterButtons = screen
      .getAllByRole('button')
      .filter((btn) =>
        ['Todas', 'Pendientes', 'Confirmadas', 'Canceladas', 'Completadas'].includes(
          btn.textContent?.trim() ?? ''
        )
      );
    expect(filterButtons.length).toBe(5);
  });

  it('pagination buttons use outline variant (secondary action)', () => {
    renderMisReservasPage();

    const prevBtn = screen.getByRole('button', { name: /anterior/i });
    const nextBtn = screen.getByRole('button', { name: /siguiente/i });

    // outline variant has 'border' in class
    expect(prevBtn.className).toContain('border');
    expect(nextBtn.className).toContain('border');
  });

  it('cancel buttons on cancellable reservations use destructive variant', () => {
    renderMisReservasPage();

    // Both pending + confirmed reservations have cancel buttons
    const cancelBtns = screen.getAllByRole('button', { name: /cancelar/i });
    expect(cancelBtns.length).toBe(2);
    cancelBtns.forEach((btn) => {
      expect(btn.className).toContain('destructive');
    });
  });
});
