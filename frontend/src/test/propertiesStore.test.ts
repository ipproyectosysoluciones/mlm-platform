/**
 * @fileoverview propertiesStore unit tests
 * @description Tests for Zustand propertiesStore: initial state, fetchFeatured happy path,
 *               fetchFeatured error handling, and reset action.
 *               Tests del store Zustand de propiedades: estado inicial, fetchFeatured happy path,
 *               manejo de errores y acción reset.
 * @module test/propertiesStore.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { usePropertiesStore } from '../stores/propertiesStore';
import { propertyService } from '../services/propertyService';
import type { PropertyListResponse } from '../services/propertyService';

// ============================================
// Mocks / Mocks
// ============================================

vi.mock('../services/propertyService', () => ({
  propertyService: {
    getProperties: vi.fn(),
    getProperty: vi.fn(),
  },
}));

// ============================================
// Fixtures / Fixtures
// ============================================

const mockResponse: PropertyListResponse = {
  data: [
    {
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
    },
  ],
  pagination: { total: 1, page: 1, limit: 6, totalPages: 1 },
};

// ============================================
// Tests
// ============================================

describe('propertiesStore', () => {
  beforeEach(() => {
    // Reset store state and mocks before each test
    // Reseteamos el store y los mocks antes de cada test
    act(() => {
      usePropertiesStore.getState().reset();
    });
    vi.clearAllMocks();
  });

  it('has correct initial state', () => {
    const { featuredProperties, isFetchingFeatured, featuredError } = usePropertiesStore.getState();

    expect(featuredProperties).toEqual([]);
    expect(isFetchingFeatured).toBe(false);
    expect(featuredError).toBeNull();
  });

  it('sets isFetchingFeatured to true while loading', async () => {
    // Use a deferred promise to pause mid-fetch
    // Usamos una promesa diferida para pausar a mitad de la carga
    let resolve!: (value: PropertyListResponse) => void;
    const deferred = new Promise<PropertyListResponse>((res) => {
      resolve = res;
    });
    vi.mocked(propertyService.getProperties).mockReturnValue(deferred);

    act(() => {
      usePropertiesStore.getState().fetchFeatured();
    });

    expect(usePropertiesStore.getState().isFetchingFeatured).toBe(true);

    // Resolve to avoid open handles
    // Resolvemos para no dejar handles abiertos
    await act(async () => {
      resolve(mockResponse);
    });
  });

  it('loads featured properties on success', async () => {
    vi.mocked(propertyService.getProperties).mockResolvedValue(mockResponse);

    await act(async () => {
      await usePropertiesStore.getState().fetchFeatured();
    });

    const { featuredProperties, isFetchingFeatured, featuredError } = usePropertiesStore.getState();

    expect(featuredProperties).toHaveLength(1);
    expect(featuredProperties[0].title).toBe('Casa en Palermo');
    expect(isFetchingFeatured).toBe(false);
    expect(featuredError).toBeNull();
  });

  it('calls getProperties with page=1 and limit=6', async () => {
    vi.mocked(propertyService.getProperties).mockResolvedValue(mockResponse);

    await act(async () => {
      await usePropertiesStore.getState().fetchFeatured();
    });

    expect(propertyService.getProperties).toHaveBeenCalledWith({ page: 1, limit: 6 });
  });

  it('sets featuredError on fetch failure', async () => {
    vi.mocked(propertyService.getProperties).mockRejectedValue(new Error('Network error'));

    await act(async () => {
      await usePropertiesStore.getState().fetchFeatured();
    });

    const { featuredProperties, isFetchingFeatured, featuredError } = usePropertiesStore.getState();

    expect(featuredError).toBe('Network error');
    expect(isFetchingFeatured).toBe(false);
    expect(featuredProperties).toEqual([]);
  });

  it('uses fallback error message when error is not an Error instance', async () => {
    vi.mocked(propertyService.getProperties).mockRejectedValue('unexpected string error');

    await act(async () => {
      await usePropertiesStore.getState().fetchFeatured();
    });

    expect(usePropertiesStore.getState().featuredError).toBe(
      'Error al cargar propiedades destacadas'
    );
  });

  it('resets store to initial state', async () => {
    vi.mocked(propertyService.getProperties).mockResolvedValue(mockResponse);

    await act(async () => {
      await usePropertiesStore.getState().fetchFeatured();
    });

    expect(usePropertiesStore.getState().featuredProperties).toHaveLength(1);

    act(() => {
      usePropertiesStore.getState().reset();
    });

    const { featuredProperties, isFetchingFeatured, featuredError } = usePropertiesStore.getState();
    expect(featuredProperties).toEqual([]);
    expect(isFetchingFeatured).toBe(false);
    expect(featuredError).toBeNull();
  });
});
