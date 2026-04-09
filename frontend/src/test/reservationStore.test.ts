/**
 * @fileoverview reservationStore unit tests
 * @description Tests for Zustand reservationStore: wizard actions, CRUD operations,
 *               error handling, and reset.
 *               Tests del store Zustand de reservaciones: acciones wizard, operaciones CRUD,
 *               manejo de errores y reset.
 * @module test/reservationStore.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useReservationStore } from '../stores/reservationStore';
import { reservationService } from '../services/reservationService';
import type { Property } from '../services/propertyService';
import type { TourPackage, TourAvailability } from '../services/tourService';
import type { Reservation, ReservationListResponse } from '../services/reservationService';

// ============================================
// Mocks / Mocks
// ============================================

vi.mock('../services/reservationService', () => ({
  reservationService: {
    getMyReservations: vi.fn(),
    createReservation: vi.fn(),
    cancelReservation: vi.fn(),
  },
}));

// ============================================
// Fixtures / Fixtures
// ============================================

const mockProperty: Property = {
  id: 'prop-1',
  title: 'Casa en Palermo',
  description: 'Hermosa casa',
  type: 'rental',
  status: 'active',
  price: 150000,
  currency: 'ARS',
  address: 'Av. Santa Fe 100',
  city: 'Buenos Aires',
  country: 'Argentina',
  bedrooms: 3,
  bathrooms: 2,
  area: 120,
  images: [],
  amenities: ['WiFi'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockTour: TourPackage = {
  id: 'tour-1',
  title: 'Tour Palermo',
  description: 'Tour por Palermo',
  type: 'city',
  price: 5000,
  currency: 'ARS',
  duration: 120,
  maxCapacity: 10,
  language: 'es',
  images: [],
  amenities: [],
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockAvailability: TourAvailability = {
  id: 'avail-1',
  tourPackageId: 'tour-1',
  date: '2025-06-15',
  availableSpots: 5,
  totalSpots: 10,
  status: 'available',
};

const mockReservation: Reservation = {
  id: 'res-1',
  userId: 'user-1',
  propertyId: 'prop-1',
  status: 'pending',
  guests: 2,
  checkIn: '2025-06-01',
  checkOut: '2025-06-07',
  notes: '',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockListResponse: ReservationListResponse = {
  data: [mockReservation],
  pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
};

// ============================================
// Tests
// ============================================

describe('reservationStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      useReservationStore.getState().reset();
    });
    vi.clearAllMocks();
  });

  // ── Initial state ─────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useReservationStore.getState();
      expect(state.wizardStep).toBe('dates');
      expect(state.wizardData).toBeNull();
      expect(state.isWizardOpen).toBe(false);
      expect(state.myReservations).toEqual([]);
      expect(state.isCreating).toBe(false);
      expect(state.createdReservation).toBeNull();
      expect(state.createError).toBeNull();
      expect(state.isCancelling).toBe(false);
      expect(state.cancelError).toBeNull();
    });
  });

  // ── Wizard — property ─────────────────────────────────────────────────────

  describe('startPropertyReservation', () => {
    it('should set wizard data for a property reservation', () => {
      act(() => {
        useReservationStore.getState().startPropertyReservation(mockProperty);
      });

      const state = useReservationStore.getState();
      expect(state.isWizardOpen).toBe(true);
      expect(state.wizardStep).toBe('dates');
      expect(state.wizardData).not.toBeNull();
      expect(state.wizardData?.type).toBe('property');
      if (state.wizardData?.type === 'property') {
        expect(state.wizardData.property.id).toBe('prop-1');
        expect(state.wizardData.checkIn).toBe('');
        expect(state.wizardData.checkOut).toBe('');
        expect(state.wizardData.guests).toBe(1);
        expect(state.wizardData.notes).toBe('');
      }
    });

    it('should reset createError when starting a new reservation', () => {
      // First set an error
      act(() => {
        useReservationStore.setState({ createError: 'previous error' });
      });

      act(() => {
        useReservationStore.getState().startPropertyReservation(mockProperty);
      });

      expect(useReservationStore.getState().createError).toBeNull();
    });
  });

  // ── Wizard — tour ─────────────────────────────────────────────────────────

  describe('startTourReservation', () => {
    it('should set wizard data for a tour reservation starting at guests step', () => {
      act(() => {
        useReservationStore.getState().startTourReservation(mockTour, mockAvailability);
      });

      const state = useReservationStore.getState();
      expect(state.isWizardOpen).toBe(true);
      expect(state.wizardStep).toBe('guests'); // tours skip dates
      expect(state.wizardData?.type).toBe('tour');
      if (state.wizardData?.type === 'tour') {
        expect(state.wizardData.tour.id).toBe('tour-1');
        expect(state.wizardData.availability.id).toBe('avail-1');
        expect(state.wizardData.guests).toBe(1);
      }
    });
  });

  // ── Wizard — setWizardStep ────────────────────────────────────────────────

  describe('setWizardStep', () => {
    it('should update the current wizard step', () => {
      act(() => {
        useReservationStore.getState().setWizardStep('guests');
      });
      expect(useReservationStore.getState().wizardStep).toBe('guests');
    });

    it('should advance from guests to confirm', () => {
      act(() => {
        useReservationStore.getState().setWizardStep('confirm');
      });
      expect(useReservationStore.getState().wizardStep).toBe('confirm');
    });
  });

  // ── Wizard — updateWizardData ─────────────────────────────────────────────

  describe('updateWizardData', () => {
    it('should update checkIn and checkOut for property wizard', () => {
      act(() => {
        useReservationStore.getState().startPropertyReservation(mockProperty);
        useReservationStore
          .getState()
          .updateWizardData({ checkIn: '2025-06-01', checkOut: '2025-06-07' });
      });

      const data = useReservationStore.getState().wizardData;
      if (data?.type === 'property') {
        expect(data.checkIn).toBe('2025-06-01');
        expect(data.checkOut).toBe('2025-06-07');
      }
    });

    it('should update guests count', () => {
      act(() => {
        useReservationStore.getState().startPropertyReservation(mockProperty);
        useReservationStore.getState().updateWizardData({ guests: 3 });
      });

      const data = useReservationStore.getState().wizardData;
      expect(data?.guests).toBe(3);
    });

    it('should do nothing when wizardData is null', () => {
      act(() => {
        // No wizard started — data is null
        useReservationStore.getState().updateWizardData({ guests: 5 });
      });
      expect(useReservationStore.getState().wizardData).toBeNull();
    });
  });

  // ── Wizard — closeWizard ──────────────────────────────────────────────────

  describe('closeWizard', () => {
    it('should reset wizard state to initial values', () => {
      act(() => {
        useReservationStore.getState().startPropertyReservation(mockProperty);
        useReservationStore.getState().setWizardStep('guests');
      });

      act(() => {
        useReservationStore.getState().closeWizard();
      });

      const state = useReservationStore.getState();
      expect(state.isWizardOpen).toBe(false);
      expect(state.wizardData).toBeNull();
      expect(state.wizardStep).toBe('dates');
      expect(state.createError).toBeNull();
    });
  });

  // ── fetchMyReservations ───────────────────────────────────────────────────

  describe('fetchMyReservations', () => {
    it('should fetch reservations and set state on success', async () => {
      vi.mocked(reservationService.getMyReservations).mockResolvedValue(mockListResponse);

      await act(async () => {
        await useReservationStore.getState().fetchMyReservations();
      });

      const state = useReservationStore.getState();
      expect(state.myReservations).toHaveLength(1);
      expect(state.myReservations[0].id).toBe('res-1');
      expect(state.isFetchingReservations).toBe(false);
      expect(state.reservationsError).toBeNull();
    });

    it('should set reservationsError on failure', async () => {
      vi.mocked(reservationService.getMyReservations).mockRejectedValue(new Error('Server error'));

      await act(async () => {
        await useReservationStore.getState().fetchMyReservations();
      });

      const state = useReservationStore.getState();
      expect(state.reservationsError).toBe('Server error');
      expect(state.isFetchingReservations).toBe(false);
    });

    it('should handle non-Error rejection with fallback message', async () => {
      vi.mocked(reservationService.getMyReservations).mockRejectedValue('network error');

      await act(async () => {
        await useReservationStore.getState().fetchMyReservations();
      });

      expect(useReservationStore.getState().reservationsError).toBe('Error al cargar las reservas');
    });
  });

  // ── confirmReservation ────────────────────────────────────────────────────

  describe('confirmReservation', () => {
    it('should throw when wizardData is null', async () => {
      await act(async () => {
        await expect(useReservationStore.getState().confirmReservation()).rejects.toThrow(
          'No hay datos de reserva en el wizard'
        );
      });
    });

    it('should create a property reservation and advance to confirm step', async () => {
      vi.mocked(reservationService.createReservation).mockResolvedValue(mockReservation);

      act(() => {
        useReservationStore.getState().startPropertyReservation(mockProperty);
        useReservationStore.getState().updateWizardData({
          checkIn: '2025-06-01',
          checkOut: '2025-06-07',
          guests: 2,
        });
      });

      await act(async () => {
        await useReservationStore.getState().confirmReservation();
      });

      const state = useReservationStore.getState();
      expect(state.createdReservation?.id).toBe('res-1');
      expect(state.wizardStep).toBe('confirm');
      expect(state.isCreating).toBe(false);
      expect(state.createError).toBeNull();
    });

    it('should create a tour reservation', async () => {
      vi.mocked(reservationService.createReservation).mockResolvedValue(mockReservation);

      act(() => {
        useReservationStore.getState().startTourReservation(mockTour, mockAvailability);
        useReservationStore.getState().updateWizardData({ guests: 3 });
      });

      await act(async () => {
        await useReservationStore.getState().confirmReservation();
      });

      expect(useReservationStore.getState().wizardStep).toBe('confirm');
      expect(reservationService.createReservation).toHaveBeenCalledWith(
        expect.objectContaining({
          tourPackageId: 'tour-1',
          tourAvailabilityId: 'avail-1',
          guests: 3,
        })
      );
    });

    it('should set createError on failure and rethrow', async () => {
      vi.mocked(reservationService.createReservation).mockRejectedValue(
        new Error('Reservation failed')
      );

      act(() => {
        useReservationStore.getState().startPropertyReservation(mockProperty);
      });

      await act(async () => {
        await expect(useReservationStore.getState().confirmReservation()).rejects.toThrow(
          'Reservation failed'
        );
      });

      const state = useReservationStore.getState();
      expect(state.createError).toBe('Reservation failed');
      expect(state.isCreating).toBe(false);
    });
  });

  // ── cancelReservation ─────────────────────────────────────────────────────

  describe('cancelReservation', () => {
    it('should cancel a reservation and update the list', async () => {
      const cancelled = { ...mockReservation, status: 'cancelled' as const };
      vi.mocked(reservationService.cancelReservation).mockResolvedValue(cancelled);

      // Pre-load reservations
      act(() => {
        useReservationStore.setState({ myReservations: [mockReservation] });
      });

      await act(async () => {
        await useReservationStore.getState().cancelReservation('res-1');
      });

      const state = useReservationStore.getState();
      expect(state.myReservations[0].status).toBe('cancelled');
      expect(state.isCancelling).toBe(false);
    });

    it('should set cancelError on failure and rethrow', async () => {
      vi.mocked(reservationService.cancelReservation).mockRejectedValue(new Error('Cancel failed'));

      await act(async () => {
        await expect(useReservationStore.getState().cancelReservation('res-1')).rejects.toThrow(
          'Cancel failed'
        );
      });

      expect(useReservationStore.getState().cancelError).toBe('Cancel failed');
    });
  });

  // ── reset ─────────────────────────────────────────────────────────────────

  describe('reset', () => {
    it('should restore all state to initial values', () => {
      act(() => {
        useReservationStore.getState().startPropertyReservation(mockProperty);
        useReservationStore.setState({ createError: 'some error', isCreating: true });
        useReservationStore.getState().reset();
      });

      const state = useReservationStore.getState();
      expect(state.wizardData).toBeNull();
      expect(state.isWizardOpen).toBe(false);
      expect(state.createError).toBeNull();
      expect(state.isCreating).toBe(false);
    });
  });
});
