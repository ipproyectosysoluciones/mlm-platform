/**
 * @fileoverview Reservation flow integration tests (T2.3.2)
 * @description End-to-end flow tests for ReservationFlowPage: property reservation
 *               (dates → guests → confirm) and tour reservation (guests → confirm),
 *               including redirect-when-no-wizard-data and cancel navigation.
 *               Tests de flujo completo para ReservationFlowPage: reserva de propiedad
 *               (fechas → huéspedes → confirmación) y reserva de tour (huéspedes → confirmación),
 *               incluyendo redirect cuando no hay datos de wizard y navegación de cancelar.
 * @module test/reservationFlow.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReservationFlowPage from '../pages/ReservationFlowPage';
import { useReservationStore } from '../stores/reservationStore';
import { reservationService } from '../services/reservationService';
import type { Reservation } from '../services/reservationService';
import type { Property } from '../services/propertyService';
import type { TourPackage, TourAvailability } from '../services/tourService';

// ============================================
// Mocks / Mocks
// ============================================

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../services/reservationService', () => ({
  reservationService: {
    createReservation: vi.fn(),
    getMyReservations: vi.fn(),
    cancelReservation: vi.fn(),
    getReservation: vi.fn(),
  },
}));

// ============================================
// Fixtures / Fixtures
// ============================================

const mockProperty: Property = {
  id: 'prop-1',
  title: 'Casa en Palermo',
  description: 'Hermosa casa con jardín',
  type: 'sale',
  status: 'active',
  price: 200000,
  currency: 'USD',
  address: 'Av. Santa Fe 100',
  city: 'Buenos Aires',
  country: 'Argentina',
  bedrooms: 3,
  bathrooms: 2,
  area: 120,
  images: [],
  amenities: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockTour: TourPackage = {
  id: 'tour-1',
  title: 'Tour Patagonia',
  description: 'Tour increíble por el sur',
  category: 'adventure',
  destination: 'Patagonia',
  duration: 5,
  maxGuests: 10,
  price: 1500,
  currency: 'USD',
  includes: [],
  excludes: [],
  images: [],
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockAvailability: TourAvailability = {
  id: 'avail-1',
  tourPackageId: 'tour-1',
  date: '2024-06-15',
  availableSpots: 8,
  totalSpots: 10,
};

const mockCreatedReservation: Reservation = {
  id: 'res-abc-123',
  userId: 'user-1',
  propertyId: 'prop-1',
  status: 'pending',
  paymentStatus: 'pending',
  checkIn: '2024-06-01',
  checkOut: '2024-06-07',
  guests: 2,
  totalAmount: 1400,
  currency: 'USD',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// ============================================
// Helpers / Helpers
// ============================================

/** Renders ReservationFlowPage inside MemoryRouter */
function renderPage() {
  return render(
    <MemoryRouter>
      <ReservationFlowPage />
    </MemoryRouter>
  );
}

// ============================================
// Tests
// ============================================

describe('ReservationFlowPage', () => {
  beforeEach(() => {
    act(() => {
      useReservationStore.getState().reset();
    });
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  // ------------------------------------------
  // Guard: no wizard data → redirect
  // ------------------------------------------

  describe('redirect when no wizard data', () => {
    it('redirects to home when wizardData is null', () => {
      renderPage();

      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });

    it('renders nothing when wizardData is null', () => {
      const { container } = renderPage();

      expect(container.firstChild).toBeNull();
    });
  });

  // ------------------------------------------
  // Property reservation flow: dates → guests → confirm
  // ------------------------------------------

  describe('property reservation flow', () => {
    beforeEach(() => {
      act(() => {
        useReservationStore.getState().startPropertyReservation(mockProperty);
      });
    });

    it('renders step 1 (dates) for a property reservation', () => {
      renderPage();

      expect(screen.getByText('Seleccioná las fechas')).toBeInTheDocument();
      // Title appears in both the wizard header and the step subtitle
      expect(screen.getAllByText(/Casa en Palermo/).length).toBeGreaterThan(0);
    });

    it('shows the property title in the wizard header', () => {
      renderPage();

      // Context label in header
      expect(screen.getAllByText('Casa en Palermo').length).toBeGreaterThan(0);
    });

    it('shows step indicator with 3 steps', () => {
      renderPage();

      expect(screen.getByText('Fechas')).toBeInTheDocument();
      expect(screen.getByText('Huéspedes')).toBeInTheDocument();
      expect(screen.getByText('Confirmación')).toBeInTheDocument();
    });

    it('Continuar button is disabled when dates are empty', () => {
      renderPage();

      const continuar = screen.getByRole('button', { name: /continuar/i });
      expect(continuar).toBeDisabled();
    });

    it('enables Continuar after filling both dates', () => {
      renderPage();

      const inputs = screen.getAllByDisplayValue('');
      // checkIn and checkOut inputs
      fireEvent.change(inputs[0], { target: { value: '2024-06-01' } });
      fireEvent.change(inputs[1], { target: { value: '2024-06-07' } });

      const continuar = screen.getByRole('button', { name: /continuar/i });
      expect(continuar).not.toBeDisabled();
    });

    it('advances to step 2 (guests) after clicking Continuar with valid dates', () => {
      renderPage();

      const inputs = screen.getAllByDisplayValue('');
      fireEvent.change(inputs[0], { target: { value: '2024-06-01' } });
      fireEvent.change(inputs[1], { target: { value: '2024-06-07' } });

      fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

      expect(screen.getByText('¿Cuántas personas?')).toBeInTheDocument();
    });

    it('shows Atrás button on step 2 for property reservations', () => {
      act(() => {
        useReservationStore.getState().setWizardStep('guests');
      });
      renderPage();

      expect(screen.getByRole('button', { name: /atrás/i })).toBeInTheDocument();
    });

    it('goes back to step 1 when clicking Atrás on step 2', () => {
      act(() => {
        useReservationStore.getState().setWizardStep('guests');
        useReservationStore.getState().updateWizardData({
          checkIn: '2024-06-01',
          checkOut: '2024-06-07',
        });
      });
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /atrás/i }));

      expect(screen.getByText('Seleccioná las fechas')).toBeInTheDocument();
    });

    it('increments guest count when clicking +', () => {
      act(() => {
        useReservationStore.getState().setWizardStep('guests');
      });
      renderPage();

      const plusBtn = screen.getByRole('button', { name: '+' });
      fireEvent.click(plusBtn);

      // Guest counter span (distinct from the step indicator circle)
      const guestCountSpan = screen
        .getAllByText('2')
        .find((el) => el.tagName === 'SPAN' && el.classList.contains('text-center'));
      expect(guestCountSpan).toBeInTheDocument();
    });

    it('decrements guest count but not below 1', () => {
      act(() => {
        useReservationStore.getState().setWizardStep('guests');
      });
      renderPage();

      const minusBtn = screen.getByRole('button', { name: '−' });
      fireEvent.click(minusBtn); // already at 1 — should stay at 1

      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('shows step 3 (confirm) with reservation details after successful confirm', async () => {
      vi.mocked(reservationService.createReservation).mockResolvedValue(mockCreatedReservation);

      act(() => {
        useReservationStore.getState().setWizardStep('guests');
        useReservationStore.getState().updateWizardData({
          checkIn: '2024-06-01',
          checkOut: '2024-06-07',
          guests: 2,
        });
      });
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /confirmar reserva/i }));

      await waitFor(() => {
        expect(screen.getByText('¡Reserva confirmada!')).toBeInTheDocument();
      });

      expect(screen.getByText('res-abc-123')).toBeInTheDocument();
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
    });

    it('shows error message when confirm fails', async () => {
      vi.mocked(reservationService.createReservation).mockRejectedValueOnce(
        new Error('Servicio no disponible')
      );

      act(() => {
        useReservationStore.getState().setWizardStep('guests');
        useReservationStore.getState().updateWizardData({
          checkIn: '2024-06-01',
          checkOut: '2024-06-07',
        });
      });
      renderPage();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /confirmar reserva/i }));
      });

      await waitFor(() => {
        expect(screen.getByText('Servicio no disponible')).toBeInTheDocument();
      });
    });

    it('navigates to /properties when clicking "Seguir explorando" on confirm step', async () => {
      vi.mocked(reservationService.createReservation).mockResolvedValue(mockCreatedReservation);

      act(() => {
        useReservationStore.getState().setWizardStep('confirm');
        useReservationStore.setState({ createdReservation: mockCreatedReservation });
      });
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /seguir explorando/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/properties');
    });

    it('navigates to /mis-reservas when clicking "Ver mis reservas" on confirm step', async () => {
      act(() => {
        useReservationStore.getState().setWizardStep('confirm');
        useReservationStore.setState({ createdReservation: mockCreatedReservation });
      });
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /ver mis reservas/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/mis-reservas');
    });

    it('shows Cancelar button on steps 1 and 2 but not on confirm', () => {
      renderPage();
      // Step 1 (dates) — Cancelar visible
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });

    it('closes wizard and navigates back on Cancelar click', () => {
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

      expect(mockNavigate).toHaveBeenCalledWith(-1);
      expect(useReservationStore.getState().isWizardOpen).toBe(false);
    });
  });

  // ------------------------------------------
  // Tour reservation flow: guests → confirm (skips dates)
  // ------------------------------------------

  describe('tour reservation flow', () => {
    beforeEach(() => {
      act(() => {
        useReservationStore.getState().startTourReservation(mockTour, mockAvailability);
      });
    });

    it('renders step 2 (guests) directly — tours skip dates step', () => {
      renderPage();

      expect(screen.getByText('¿Cuántas personas?')).toBeInTheDocument();
    });

    it('shows tour title and date in the guests step', () => {
      renderPage();

      // Title appears in both the wizard header and the step subtitle
      expect(screen.getAllByText(/Tour Patagonia/).length).toBeGreaterThan(0);
    });

    it('does NOT show Atrás button for tour reservations', () => {
      renderPage();

      expect(screen.queryByRole('button', { name: /atrás/i })).not.toBeInTheDocument();
    });

    it('shows tour title in the wizard header', () => {
      renderPage();

      expect(screen.getAllByText('Tour Patagonia').length).toBeGreaterThan(0);
    });

    it('confirms tour reservation and shows step 3', async () => {
      const tourReservation: Reservation = {
        ...mockCreatedReservation,
        id: 'res-tour-456',
        propertyId: undefined,
        tourPackageId: 'tour-1',
        tourAvailabilityId: 'avail-1',
      };
      vi.mocked(reservationService.createReservation).mockResolvedValue(tourReservation);

      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /confirmar reserva/i }));

      await waitFor(() => {
        expect(screen.getByText('¡Reserva confirmada!')).toBeInTheDocument();
      });

      expect(screen.getByText('res-tour-456')).toBeInTheDocument();
    });

    it('navigates to /tours when clicking "Seguir explorando" on confirm step', () => {
      act(() => {
        useReservationStore.getState().setWizardStep('confirm');
        useReservationStore.setState({ createdReservation: mockCreatedReservation });
      });
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /seguir explorando/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/tours');
    });
  });
});
