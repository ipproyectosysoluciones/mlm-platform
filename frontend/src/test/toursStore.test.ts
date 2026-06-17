/**
 * @fileoverview toursStore unit tests
 * @description Tests for Zustand toursStore: initial state, fetchFeatured happy path,
 *               fetchFeatured error handling, and reset action.
 *               Tests del store Zustand de tours: estado inicial, fetchFeatured happy path,
 *               manejo de errores y acción reset.
 * @module test/toursStore.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useToursStore } from '../stores/toursStore';
import { tourService } from '../services/tourService';
import type { TourListResponse } from '../services/tourService';

// ============================================
// Mocks / Mocks
// ============================================

vi.mock('../services/tourService', () => ({
  tourService: {
    getTours: vi.fn(),
    getTour: vi.fn(),
  },
}));

// ============================================
// Fixtures / Fixtures
// ============================================

const mockResponse: TourListResponse = {
  data: [
    {
      id: 'tour-1',
      title: 'Patagonia Extrema',
      description: 'Aventura en el sur',
      type: 'adventure',
      destination: 'Ushuaia, Argentina',
      durationDays: 7,
      price: '85000',
      currency: 'ARS',
      maxCapacity: 12,
      images: [],
      priceIncludes: ['guía'],
      priceExcludes: ['vuelos'],
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
  pagination: { total: 1, page: 1, limit: 6, totalPages: 1 },
};

// ============================================
// Tests
// ============================================

describe('toursStore', () => {
  beforeEach(() => {
    // Reset store state and mocks before each test
    // Reseteamos el store y los mocks antes de cada test
    act(() => {
      useToursStore.getState().reset();
    });
    vi.clearAllMocks();
  });

  it('has correct initial state', () => {
    const { featuredTours, isFetchingFeatured, featuredError } = useToursStore.getState();

    expect(featuredTours).toEqual([]);
    expect(isFetchingFeatured).toBe(false);
    expect(featuredError).toBeNull();
  });

  it('sets isFetchingFeatured to true while loading', async () => {
    let resolve!: (value: TourListResponse) => void;
    const deferred = new Promise<TourListResponse>((res) => {
      resolve = res;
    });
    vi.mocked(tourService.getTours).mockReturnValue(deferred);

    act(() => {
      useToursStore.getState().fetchFeatured();
    });

    expect(useToursStore.getState().isFetchingFeatured).toBe(true);

    await act(async () => {
      resolve(mockResponse);
    });
  });

  it('loads featured tours on success', async () => {
    vi.mocked(tourService.getTours).mockResolvedValue(mockResponse);

    await act(async () => {
      await useToursStore.getState().fetchFeatured();
    });

    const { featuredTours, isFetchingFeatured, featuredError } = useToursStore.getState();

    expect(featuredTours).toHaveLength(1);
    expect(featuredTours[0].title).toBe('Patagonia Extrema');
    expect(isFetchingFeatured).toBe(false);
    expect(featuredError).toBeNull();
  });

  it('calls getTours with page=1 and limit=6', async () => {
    vi.mocked(tourService.getTours).mockResolvedValue(mockResponse);

    await act(async () => {
      await useToursStore.getState().fetchFeatured();
    });

    expect(tourService.getTours).toHaveBeenCalledWith({ page: 1, limit: 6 });
  });

  it('sets featuredError on fetch failure', async () => {
    vi.mocked(tourService.getTours).mockRejectedValue(new Error('Timeout'));

    await act(async () => {
      await useToursStore.getState().fetchFeatured();
    });

    const { featuredTours, isFetchingFeatured, featuredError } = useToursStore.getState();

    expect(featuredError).toBe('Timeout');
    expect(isFetchingFeatured).toBe(false);
    expect(featuredTours).toEqual([]);
  });

  it('uses fallback error message when error is not an Error instance', async () => {
    vi.mocked(tourService.getTours).mockRejectedValue(42);

    await act(async () => {
      await useToursStore.getState().fetchFeatured();
    });

    expect(useToursStore.getState().featuredError).toBe('Error al cargar tours destacados');
  });

  it('resets store to initial state', async () => {
    vi.mocked(tourService.getTours).mockResolvedValue(mockResponse);

    await act(async () => {
      await useToursStore.getState().fetchFeatured();
    });

    expect(useToursStore.getState().featuredTours).toHaveLength(1);

    act(() => {
      useToursStore.getState().reset();
    });

    const { featuredTours, isFetchingFeatured, featuredError } = useToursStore.getState();
    expect(featuredTours).toEqual([]);
    expect(isFetchingFeatured).toBe(false);
    expect(featuredError).toBeNull();
  });
});
