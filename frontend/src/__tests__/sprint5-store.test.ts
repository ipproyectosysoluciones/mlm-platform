/**
 * @fileoverview Sprint 5 - reservationStore Unit Tests
 * @description Tests for Zustand reservation store: wizard state and CRUD actions
 *               Tests para el store Zustand de reservas: estado del wizard y acciones CRUD
 * @module __tests__/sprint5-store
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ============================================
// Mocks / Mocks
// ============================================

vi.mock('../services/reservationService', () => ({
  reservationService: {
    getMyReservations: vi.fn(),
    getReservation: vi.fn(),
    createReservation: vi.fn(),
    cancelReservation: vi.fn(),
  },
}));

// ============================================
// Test data / Datos de prueba
// ============================================

const mockProperty = {
  id: 'prop-1',
  title: 'Casa en Palermo',
  description: 'Hermosa casa',
  type: 'house' as const,
  address: 'Av. Santa Fe 1234',
  city: 'Buenos Aires',
  country: 'Argentina',
  price: 1500,
  currency: 'USD',
  bedrooms: 3,
  bathrooms: 2,
  area: 120,
  images: ['img1.jpg'],
  amenities: ['wifi', 'pool'],
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockTourPackage = {
  id: 'tour-1',
  title: 'Tour Patagonia',
  description: 'Expedición increíble',
  category: 'adventure' as const,
  destination: 'Bariloche',
  country: 'Argentina',
  duration: 5,
  maxParticipants: 12,
  price: 800,
  currency: 'USD',
  images: ['tour1.jpg'],
  includes: ['hotel', 'meals'],
  excludes: ['flights'],
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockAvailability = {
  id: 'avail-1',
  tourPackageId: 'tour-1',
  date: '2024-06-15T00:00:00.000Z',
  availableSpots: 8,
  bookedSpots: 4,
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockReservation = {
  id: 'res-1',
  userId: 'user-1',
  propertyId: 'prop-1',
  status: 'pending' as const,
  paymentStatus: 'pending' as const,
  checkIn: '2024-06-10',
  checkOut: '2024-06-15',
  guests: 2,
  totalAmount: 7500,
  currency: 'USD',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  property: {
    id: 'prop-1',
    title: 'Casa en Palermo',
    address: 'Av. Santa Fe 1234',
    city: 'Buenos Aires',
    images: [],
  },
};

const paginationMeta = { total: 1, page: 1, limit: 10, totalPages: 1 };

// ============================================
// reservationStore Tests
// ============================================

describe('reservationStore', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { default: useReservationStore } = await import('../stores/reservationStore');
    useReservationStore.getState().reset();
  });

  it('startPropertyReservation — opens wizard with property data at dates step', async () => {
    const { useReservationStore } = await import('../stores/reservationStore');
    const { result } = renderHook(() => useReservationStore());

    act(() => {
      result.current.startPropertyReservation(mockProperty as any);
    });

    expect(result.current.isWizardOpen).toBe(true);
    expect(result.current.wizardStep).toBe('dates');
    expect(result.current.wizardData?.type).toBe('property');
  });

  it('startTourReservation — opens wizard at guests step (skip dates)', async () => {
    const { useReservationStore } = await import('../stores/reservationStore');
    const { result } = renderHook(() => useReservationStore());

    act(() => {
      result.current.startTourReservation(mockTourPackage as any, mockAvailability as any);
    });

    expect(result.current.isWizardOpen).toBe(true);
    expect(result.current.wizardStep).toBe('guests');
    expect(result.current.wizardData?.type).toBe('tour');
  });

  it('setWizardStep — changes the active step', async () => {
    const { useReservationStore } = await import('../stores/reservationStore');
    const { result } = renderHook(() => useReservationStore());

    act(() => {
      result.current.startPropertyReservation(mockProperty as any);
      result.current.setWizardStep('guests');
    });

    expect(result.current.wizardStep).toBe('guests');
  });

  it('updateWizardData — merges partial data into existing wizard data', async () => {
    const { useReservationStore } = await import('../stores/reservationStore');
    const { result } = renderHook(() => useReservationStore());

    act(() => {
      result.current.startPropertyReservation(mockProperty as any);
      result.current.updateWizardData({ checkIn: '2024-06-10', guests: 3 });
    });

    const data = result.current.wizardData as any;
    expect(data.checkIn).toBe('2024-06-10');
    expect(data.guests).toBe(3);
    // Property reference should remain untouched
    expect(data.property.id).toBe('prop-1');
  });

  it('closeWizard — resets wizard to closed state', async () => {
    const { useReservationStore } = await import('../stores/reservationStore');
    const { result } = renderHook(() => useReservationStore());

    act(() => {
      result.current.startPropertyReservation(mockProperty as any);
      result.current.closeWizard();
    });

    expect(result.current.isWizardOpen).toBe(false);
    expect(result.current.wizardData).toBeNull();
    expect(result.current.wizardStep).toBe('dates');
    expect(result.current.createError).toBeNull();
  });

  it('fetchMyReservations — populates myReservations on success', async () => {
    const { useReservationStore } = await import('../stores/reservationStore');
    const { reservationService } = await import('../services/reservationService');
    const mockSvc = reservationService as any;

    mockSvc.getMyReservations.mockResolvedValue({
      data: [mockReservation],
      pagination: paginationMeta,
    });

    const { result } = renderHook(() => useReservationStore());

    await act(async () => {
      await result.current.fetchMyReservations();
    });

    expect(result.current.myReservations).toHaveLength(1);
    expect(result.current.myReservations[0].id).toBe('res-1');
    expect(result.current.isFetchingReservations).toBe(false);
    expect(result.current.reservationsError).toBeNull();
    expect(result.current.reservationsPagination?.total).toBe(1);
  });

  it('fetchMyReservations — sets reservationsError on failure', async () => {
    const { useReservationStore } = await import('../stores/reservationStore');
    const { reservationService } = await import('../services/reservationService');
    const mockSvc = reservationService as any;

    mockSvc.getMyReservations.mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHook(() => useReservationStore());

    await act(async () => {
      await result.current.fetchMyReservations();
    });

    expect(result.current.reservationsError).toBe('Unauthorized');
    expect(result.current.isFetchingReservations).toBe(false);
    expect(result.current.myReservations).toHaveLength(0);
  });

  it('cancelReservation — updates matching reservation status in list', async () => {
    const { useReservationStore } = await import('../stores/reservationStore');
    const { reservationService } = await import('../services/reservationService');
    const mockSvc = reservationService as any;

    const cancelledReservation = { ...mockReservation, status: 'cancelled' as const };
    mockSvc.cancelReservation.mockResolvedValue(cancelledReservation);

    const { result } = renderHook(() => useReservationStore());

    // Pre-load reservations into store
    act(() => {
      useReservationStore.setState({ myReservations: [mockReservation] });
    });

    await act(async () => {
      await result.current.cancelReservation('res-1');
    });

    expect(result.current.myReservations[0].status).toBe('cancelled');
    expect(result.current.isCancelling).toBe(false);
    expect(result.current.cancelError).toBeNull();
  });

  it('cancelReservation — sets cancelError and re-throws on failure', async () => {
    const { useReservationStore } = await import('../stores/reservationStore');
    const { reservationService } = await import('../services/reservationService');
    const mockSvc = reservationService as any;

    mockSvc.cancelReservation.mockRejectedValue(new Error('Cannot cancel'));

    const { result } = renderHook(() => useReservationStore());

    await act(async () => {
      try {
        await result.current.cancelReservation('res-1');
      } catch {
        // expected — store re-throws
      }
    });

    expect(result.current.cancelError).toBe('Cannot cancel');
    expect(result.current.isCancelling).toBe(false);
  });

  it('reset — returns store to initial state', async () => {
    const { useReservationStore } = await import('../stores/reservationStore');
    const { result } = renderHook(() => useReservationStore());

    act(() => {
      result.current.startPropertyReservation(mockProperty as any);
      useReservationStore.setState({ myReservations: [mockReservation] });
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.isWizardOpen).toBe(false);
    expect(result.current.wizardData).toBeNull();
    expect(result.current.myReservations).toEqual([]);
    expect(result.current.reservationsError).toBeNull();
  });
});
