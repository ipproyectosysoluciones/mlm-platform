/**
 * @fileoverview reservationStore unit tests
 * @description Tests for Zustand reservationStore: initial state, wizard actions,
 *               CRUD actions (fetch, confirm, cancel) and error handling.
 *               Tests del store Zustand de reservas: estado inicial, acciones del wizard,
 *               acciones CRUD (fetch, confirm, cancel) y manejo de errores.
 * @module test/reservationStore.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useReservationStore } from '../stores/reservationStore';
import { reservationService } from '../services/reservationService';
import type { Reservation } from '../services/reservationService';
import type { Property } from '../services/propertyService';
import type { TourPackage, TourAvailability } from '../services/tourService';

// ============================================
// Mocks / Mocks
// ============================================

vi.mock('../services/reservationService', () => ({
  reservationService: {
    getMyReservations: vi.fn(),
    createReservation: vi.fn(),
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
  description: 'Hermosa casa',
  type: 'sale',
  status: 'active',
  price: 200000,
  currency: 'USD',
  address: 'Av. Santa Fe 100',
  city: 'Buenos Aires',
  country: 'Argentina',
  bedrooms: 3,
  bathrooms: 2,
  areaM2: 120,
  images: [],
  amenities: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockTour: TourPackage = {
  id: 'tour-1',
  title: 'Tour Patagonia',
  description: 'Tour increíble',
  type: 'adventure',
  destination: 'Patagonia',
  durationDays: 5,
  maxCapacity: 10,
  price: '1500',
  currency: 'USD',
  priceIncludes: [],
  priceExcludes: [],
  images: [],
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockAvailability: TourAvailability = {
  id: 'avail-1',
  tourPackageId: 'tour-1',
  date: '2024-06-01',
  availableSpots: 8,
  totalSpots: 10,
};

const mockReservation: Reservation = {
  id: 'res-1',
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

const mockTourReservation: Reservation = {
  id: 'res-2',
  userId: 'user-1',
  tourPackageId: 'tour-1',
  tourAvailabilityId: 'avail-1',
  status: 'pending',
  paymentStatus: 'pending',
  guests: 2,
  totalAmount: 3000,
  currency: 'USD',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// ============================================
// Tests
// ============================================

describe('reservationStore', () => {
  beforeEach(() => {
    // Reset store state and mocks before each test
    // Reseteamos el store y los mocks antes de cada test
    act(() => {
      useReservationStore.getState().reset();
    });
    vi.clearAllMocks();
  });

  // ------------------------------------------
  // Initial State / Estado inicial
  // ------------------------------------------

  describe('initial state', () => {
    it('has correct default wizard state', () => {
      const state = useReservationStore.getState();

      expect(state.wizardStep).toBe('dates');
      expect(state.wizardData).toBeNull();
      expect(state.isWizardOpen).toBe(false);
    });

    it('has correct default reservations state', () => {
      const state = useReservationStore.getState();

      expect(state.myReservations).toEqual([]);
      expect(state.reservationsPagination).toBeNull();
      expect(state.isFetchingReservations).toBe(false);
      expect(state.reservationsError).toBeNull();
    });

    it('has correct default creation state', () => {
      const state = useReservationStore.getState();

      expect(state.isCreating).toBe(false);
      expect(state.createdReservation).toBeNull();
      expect(state.createError).toBeNull();
    });

    it('has correct default cancellation state', () => {
      const state = useReservationStore.getState();

      expect(state.isCancelling).toBe(false);
      expect(state.cancelError).toBeNull();
    });
  });

  // ------------------------------------------
  // Wizard Actions / Acciones del wizard
  // ------------------------------------------

  describe('startPropertyReservation', () => {
    it('opens the wizard with property data at dates step', () => {
      act(() => {
        useReservationStore.getState().startPropertyReservation(mockProperty);
      });

      const state = useReservationStore.getState();

      expect(state.isWizardOpen).toBe(true);
      expect(state.wizardStep).toBe('dates');
      expect(state.wizardData).not.toBeNull();
      expect(state.wizardData?.type).toBe('property');
    });

    it('initializes property wizard data with empty dates and 1 guest', () => {
      act(() => {
        useReservationStore.getState().startPropertyReservation(mockProperty);
      });

      const data = useReservationStore.getState().wizardData;
      if (!data || data.type !== 'property') throw new Error('Wrong wizard type');

      expect(data.property.id).toBe('prop-1');
      expect(data.checkIn).toBe('');
      expect(data.checkOut).toBe('');
      expect(data.guests).toBe(1);
      expect(data.notes).toBe('');
    });

    it('clears previous createError when starting new reservation', () => {
      // Simulate an existing error
      // Simulamos un error existente
      act(() => {
        useReservationStore.setState({ createError: 'error anterior' });
      });

      act(() => {
        useReservationStore.getState().startPropertyReservation(mockProperty);
      });

      expect(useReservationStore.getState().createError).toBeNull();
    });
  });

  describe('startTourReservation', () => {
    it('opens the wizard with tour data at guests step', () => {
      act(() => {
        useReservationStore.getState().startTourReservation(mockTour, mockAvailability);
      });

      const state = useReservationStore.getState();

      expect(state.isWizardOpen).toBe(true);
      expect(state.wizardStep).toBe('guests');
      expect(state.wizardData?.type).toBe('tour');
    });

    it('initializes tour wizard data with correct tour and availability', () => {
      act(() => {
        useReservationStore.getState().startTourReservation(mockTour, mockAvailability);
      });

      const data = useReservationStore.getState().wizardData;
      if (!data || data.type !== 'tour') throw new Error('Wrong wizard type');

      expect(data.tour.id).toBe('tour-1');
      expect(data.availability.id).toBe('avail-1');
      expect(data.guests).toBe(1);
      expect(data.notes).toBe('');
    });
  });

  describe('setWizardStep', () => {
    it('updates the wizard step', () => {
      act(() => {
        useReservationStore.getState().setWizardStep('guests');
      });

      expect(useReservationStore.getState().wizardStep).toBe('guests');
    });

    it('can set step to confirm', () => {
      act(() => {
        useReservationStore.getState().setWizardStep('confirm');
      });

      expect(useReservationStore.getState().wizardStep).toBe('confirm');
    });
  });

  describe('updateWizardData', () => {
    it('updates wizard data fields partially', () => {
      act(() => {
        useReservationStore.getState().startPropertyReservation(mockProperty);
      });

      act(() => {
        useReservationStore.getState().updateWizardData({ checkIn: '2024-06-01', guests: 3 });
      });

      const data = useReservationStore.getState().wizardData;
      if (!data || data.type !== 'property') throw new Error('Wrong wizard type');

      expect(data.checkIn).toBe('2024-06-01');
      expect(data.guests).toBe(3);
      // Other fields should remain unchanged
      // El resto de los campos debe mantenerse igual
      expect(data.checkOut).toBe('');
    });

    it('does nothing when wizardData is null', () => {
      // wizardData is null by default after reset
      // wizardData es null por defecto después del reset
      act(() => {
        useReservationStore.getState().updateWizardData({ guests: 5 } as never);
      });

      expect(useReservationStore.getState().wizardData).toBeNull();
    });
  });

  describe('closeWizard', () => {
    it('closes wizard and resets wizard-related state', () => {
      act(() => {
        useReservationStore.getState().startPropertyReservation(mockProperty);
      });

      act(() => {
        useReservationStore.getState().closeWizard();
      });

      const state = useReservationStore.getState();

      expect(state.isWizardOpen).toBe(false);
      expect(state.wizardStep).toBe('dates');
      expect(state.wizardData).toBeNull();
      expect(state.createError).toBeNull();
    });
  });

  // ------------------------------------------
  // CRUD Actions / Acciones CRUD
  // ------------------------------------------

  describe('fetchMyReservations', () => {
    it('sets isFetchingReservations to true while loading', async () => {
      let resolve!: (v: {
        data: Reservation[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      }) => void;
      const deferred = new Promise<{
        data: Reservation[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      }>((res) => {
        resolve = res;
      });
      vi.mocked(reservationService.getMyReservations).mockReturnValue(deferred);

      act(() => {
        useReservationStore.getState().fetchMyReservations();
      });

      expect(useReservationStore.getState().isFetchingReservations).toBe(true);

      // Resolve to avoid open handles
      // Resolvemos para no dejar handles abiertos
      await act(async () => {
        resolve({ data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
      });
    });

    it('loads reservations and pagination on success', async () => {
      const mockResponse = {
        data: [mockReservation],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      vi.mocked(reservationService.getMyReservations).mockResolvedValue(mockResponse);

      await act(async () => {
        await useReservationStore.getState().fetchMyReservations();
      });

      const state = useReservationStore.getState();

      expect(state.myReservations).toHaveLength(1);
      expect(state.myReservations[0].id).toBe('res-1');
      expect(state.reservationsPagination?.total).toBe(1);
      expect(state.isFetchingReservations).toBe(false);
      expect(state.reservationsError).toBeNull();
    });

    it('passes query params to the service', async () => {
      vi.mocked(reservationService.getMyReservations).mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 2, limit: 5, totalPages: 0 },
      });

      await act(async () => {
        await useReservationStore
          .getState()
          .fetchMyReservations({ page: 2, limit: 5, status: 'confirmed' });
      });

      expect(reservationService.getMyReservations).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        status: 'confirmed',
      });
    });

    it('sets reservationsError on fetch failure', async () => {
      vi.mocked(reservationService.getMyReservations).mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await useReservationStore.getState().fetchMyReservations();
      });

      const state = useReservationStore.getState();

      expect(state.reservationsError).toBe('Network error');
      expect(state.isFetchingReservations).toBe(false);
      expect(state.myReservations).toEqual([]);
    });

    it('uses fallback error message when error is not an Error instance', async () => {
      vi.mocked(reservationService.getMyReservations).mockRejectedValue('unexpected');

      await act(async () => {
        await useReservationStore.getState().fetchMyReservations();
      });

      expect(useReservationStore.getState().reservationsError).toBe('Error al cargar las reservas');
    });
  });

  describe('confirmReservation', () => {
    it('creates a property reservation and transitions to confirm step', async () => {
      act(() => {
        useReservationStore.getState().startPropertyReservation(mockProperty);
        useReservationStore.getState().updateWizardData({
          checkIn: '2024-06-01',
          checkOut: '2024-06-07',
          guests: 2,
        });
      });

      vi.mocked(reservationService.createReservation).mockResolvedValue(mockReservation);

      await act(async () => {
        await useReservationStore.getState().confirmReservation();
      });

      const state = useReservationStore.getState();

      expect(state.createdReservation?.id).toBe('res-1');
      expect(state.wizardStep).toBe('confirm');
      expect(state.isCreating).toBe(false);
      expect(state.createError).toBeNull();
    });

    it('sends correct property payload to the service', async () => {
      act(() => {
        useReservationStore.getState().startPropertyReservation(mockProperty);
        useReservationStore.getState().updateWizardData({
          checkIn: '2024-06-01',
          checkOut: '2024-06-07',
          guests: 2,
          notes: 'Llegamos tarde',
        });
      });

      vi.mocked(reservationService.createReservation).mockResolvedValue(mockReservation);

      await act(async () => {
        await useReservationStore.getState().confirmReservation();
      });

      expect(reservationService.createReservation).toHaveBeenCalledWith({
        propertyId: 'prop-1',
        checkIn: '2024-06-01',
        checkOut: '2024-06-07',
        guests: 2,
        notes: 'Llegamos tarde',
      });
    });

    it('creates a tour reservation with correct payload', async () => {
      act(() => {
        useReservationStore.getState().startTourReservation(mockTour, mockAvailability);
        useReservationStore.getState().updateWizardData({ guests: 3 });
      });

      vi.mocked(reservationService.createReservation).mockResolvedValue(mockTourReservation);

      await act(async () => {
        await useReservationStore.getState().confirmReservation();
      });

      expect(reservationService.createReservation).toHaveBeenCalledWith({
        tourPackageId: 'tour-1',
        tourAvailabilityId: 'avail-1',
        guests: 3,
        notes: undefined,
      });
    });

    it('sets createError and throws on failure', async () => {
      act(() => {
        useReservationStore.getState().startPropertyReservation(mockProperty);
      });

      vi.mocked(reservationService.createReservation).mockRejectedValue(
        new Error('Payment failed')
      );

      await expect(
        act(async () => {
          await useReservationStore.getState().confirmReservation();
        })
      ).rejects.toThrow('Payment failed');

      const state = useReservationStore.getState();

      expect(state.createError).toBe('Payment failed');
      expect(state.isCreating).toBe(false);
    });

    it('throws when wizardData is null', async () => {
      // wizardData is null after reset — no wizard started
      // wizardData es null tras el reset — no se inició wizard
      await expect(
        act(async () => {
          await useReservationStore.getState().confirmReservation();
        })
      ).rejects.toThrow('No hay datos de reserva en el wizard');
    });

    it('omits notes from payload when notes is empty string', async () => {
      act(() => {
        useReservationStore.getState().startPropertyReservation(mockProperty);
        useReservationStore.getState().updateWizardData({
          checkIn: '2024-06-01',
          checkOut: '2024-06-07',
          guests: 1,
          notes: '',
        });
      });

      vi.mocked(reservationService.createReservation).mockResolvedValue(mockReservation);

      await act(async () => {
        await useReservationStore.getState().confirmReservation();
      });

      const call = vi.mocked(reservationService.createReservation).mock.calls[0][0];
      expect(call.notes).toBeUndefined();
    });
  });

  describe('cancelReservation', () => {
    it('updates the reservation in the list on successful cancel', async () => {
      const cancelledReservation: Reservation = { ...mockReservation, status: 'cancelled' };

      act(() => {
        useReservationStore.setState({ myReservations: [mockReservation] });
      });

      vi.mocked(reservationService.cancelReservation).mockResolvedValue(cancelledReservation);

      await act(async () => {
        await useReservationStore.getState().cancelReservation('res-1');
      });

      const state = useReservationStore.getState();

      expect(state.myReservations[0].status).toBe('cancelled');
      expect(state.isCancelling).toBe(false);
      expect(state.cancelError).toBeNull();
    });

    it('sets isCancelling to true while cancelling', async () => {
      let resolve!: (v: Reservation) => void;
      const deferred = new Promise<Reservation>((res) => {
        resolve = res;
      });
      vi.mocked(reservationService.cancelReservation).mockReturnValue(deferred);

      act(() => {
        useReservationStore.setState({ myReservations: [mockReservation] });
        useReservationStore.getState().cancelReservation('res-1');
      });

      expect(useReservationStore.getState().isCancelling).toBe(true);

      await act(async () => {
        resolve({ ...mockReservation, status: 'cancelled' });
      });
    });

    it('sets cancelError and throws on failure', async () => {
      act(() => {
        useReservationStore.setState({ myReservations: [mockReservation] });
      });

      vi.mocked(reservationService.cancelReservation).mockRejectedValue(new Error('Cannot cancel'));

      await expect(
        act(async () => {
          await useReservationStore.getState().cancelReservation('res-1');
        })
      ).rejects.toThrow('Cannot cancel');

      const state = useReservationStore.getState();

      expect(state.cancelError).toBe('Cannot cancel');
      expect(state.isCancelling).toBe(false);
    });

    it('uses fallback error message when error is not an Error instance', async () => {
      act(() => {
        useReservationStore.setState({ myReservations: [mockReservation] });
      });

      vi.mocked(reservationService.cancelReservation).mockRejectedValue('unexpected');

      await expect(
        act(async () => {
          await useReservationStore.getState().cancelReservation('res-1');
        })
      ).rejects.toThrow();

      expect(useReservationStore.getState().cancelError).toBe('Error al cancelar la reserva');
    });
  });

  // ------------------------------------------
  // Reset / Reset
  // ------------------------------------------

  describe('reset', () => {
    it('resets all state to initial values', async () => {
      vi.mocked(reservationService.getMyReservations).mockResolvedValue({
        data: [mockReservation],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });

      act(() => {
        useReservationStore.getState().startPropertyReservation(mockProperty);
      });
      await act(async () => {
        await useReservationStore.getState().fetchMyReservations();
      });

      act(() => {
        useReservationStore.getState().reset();
      });

      const state = useReservationStore.getState();

      expect(state.wizardStep).toBe('dates');
      expect(state.wizardData).toBeNull();
      expect(state.isWizardOpen).toBe(false);
      expect(state.myReservations).toEqual([]);
      expect(state.reservationsPagination).toBeNull();
      expect(state.isFetchingReservations).toBe(false);
      expect(state.reservationsError).toBeNull();
      expect(state.isCreating).toBe(false);
      expect(state.createdReservation).toBeNull();
      expect(state.createError).toBeNull();
      expect(state.isCancelling).toBe(false);
      expect(state.cancelError).toBeNull();
    });
  });
});
