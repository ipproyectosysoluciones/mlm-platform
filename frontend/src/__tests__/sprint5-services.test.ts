/**
 * @fileoverview Sprint 5 - Services Unit Tests (propertyService, tourService, reservationService)
 * @description Tests for API service methods of the Real Estate & Tourism module
 *               Tests para métodos de servicio API del módulo Inmobiliario y Turismo
 * @module __tests__/sprint5-services
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// Mocks / Mocks
// ============================================

const mockApiGet = vi.fn();
const mockApiPost = vi.fn();
const mockApiPatch = vi.fn();

vi.mock('../services/api', () => ({
  default: {
    get: mockApiGet,
    post: mockApiPost,
    patch: mockApiPatch,
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
  type: 'adventure' as const,
  destination: 'Bariloche',
  country: 'Argentina',
  durationDays: 5,
  maxCapacity: 12,
  price: 800,
  currency: 'USD',
  images: ['tour1.jpg'],
  priceIncludes: ['hotel', 'meals'],
  priceExcludes: ['flights'],
  status: 'active' as const,
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
// propertyService Tests
// ============================================

describe('propertyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getProperties — returns paginated list', async () => {
    const { propertyService } = await import('../services/propertyService');
    mockApiGet.mockResolvedValue({
      data: { success: true, data: [mockProperty], pagination: paginationMeta },
    });

    const result = await propertyService.getProperties();

    expect(mockApiGet).toHaveBeenCalledWith('/properties', { params: undefined });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('prop-1');
    expect(result.pagination.total).toBe(1);
  });

  it('getProperties — passes query params', async () => {
    const { propertyService } = await import('../services/propertyService');
    mockApiGet.mockResolvedValue({
      data: { success: true, data: [], pagination: { ...paginationMeta, total: 0 } },
    });

    await propertyService.getProperties({ city: 'Buenos Aires', page: 2, limit: 5 });

    expect(mockApiGet).toHaveBeenCalledWith('/properties', {
      params: { city: 'Buenos Aires', page: 2, limit: 5 },
    });
  });

  it('getProperty — returns single property by id', async () => {
    const { propertyService } = await import('../services/propertyService');
    mockApiGet.mockResolvedValue({
      data: { success: true, data: mockProperty },
    });

    const result = await propertyService.getProperty('prop-1');

    expect(mockApiGet).toHaveBeenCalledWith('/properties/prop-1');
    expect(result.id).toBe('prop-1');
    expect(result.title).toBe('Casa en Palermo');
  });

  it('getProperty — throws on API error', async () => {
    const { propertyService } = await import('../services/propertyService');
    mockApiGet.mockRejectedValue(new Error('Not found'));

    await expect(propertyService.getProperty('bad-id')).rejects.toThrow('Not found');
  });
});

// ============================================
// tourService Tests
// ============================================

describe('tourService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getTours — returns paginated list', async () => {
    const { tourService } = await import('../services/tourService');
    mockApiGet.mockResolvedValue({
      data: { success: true, data: [mockTourPackage], pagination: paginationMeta },
    });

    const result = await tourService.getTours();

    expect(mockApiGet).toHaveBeenCalledWith('/tours', { params: undefined });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].destination).toBe('Bariloche');
  });

  it('getTours — passes category filter', async () => {
    const { tourService } = await import('../services/tourService');
    mockApiGet.mockResolvedValue({
      data: { success: true, data: [mockTourPackage], pagination: paginationMeta },
    });

    await tourService.getTours({ category: 'adventure', page: 1 });

    expect(mockApiGet).toHaveBeenCalledWith('/tours', {
      params: { category: 'adventure', page: 1 },
    });
  });

  it('getTour — returns single tour by id', async () => {
    const { tourService } = await import('../services/tourService');
    mockApiGet.mockResolvedValue({
      data: { success: true, data: mockTourPackage },
    });

    const result = await tourService.getTour('tour-1');

    expect(mockApiGet).toHaveBeenCalledWith('/tours/tour-1');
    expect(result.id).toBe('tour-1');
    expect(result.durationDays).toBe(5);
  });

  it('getTour — throws on network error', async () => {
    const { tourService } = await import('../services/tourService');
    mockApiGet.mockRejectedValue(new Error('Network error'));

    await expect(tourService.getTour('tour-1')).rejects.toThrow('Network error');
  });
});

// ============================================
// reservationService Tests
// ============================================

describe('reservationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMyReservations — returns paginated list', async () => {
    const { reservationService } = await import('../services/reservationService');
    mockApiGet.mockResolvedValue({
      data: { success: true, data: { data: [mockReservation], pagination: paginationMeta } },
    });

    const result = await reservationService.getMyReservations();

    expect(mockApiGet).toHaveBeenCalledWith('/reservations', { params: undefined });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('res-1');
  });

  it('getMyReservations — passes status filter', async () => {
    const { reservationService } = await import('../services/reservationService');
    mockApiGet.mockResolvedValue({
      data: { success: true, data: { data: [], pagination: { ...paginationMeta, total: 0 } } },
    });

    await reservationService.getMyReservations({ status: 'pending', page: 1 });

    expect(mockApiGet).toHaveBeenCalledWith('/reservations', {
      params: { status: 'pending', page: 1 },
    });
  });

  it('createReservation — posts payload and returns reservation', async () => {
    const { reservationService } = await import('../services/reservationService');
    mockApiPost.mockResolvedValue({
      data: { success: true, data: mockReservation },
    });

    const payload = {
      propertyId: 'prop-1',
      checkIn: '2024-06-10',
      checkOut: '2024-06-15',
      guests: 2,
    };
    const result = await reservationService.createReservation(payload);

    expect(mockApiPost).toHaveBeenCalledWith('/reservations', payload);
    expect(result.id).toBe('res-1');
    expect(result.status).toBe('pending');
  });

  it('cancelReservation — sends PATCH and returns updated reservation', async () => {
    const { reservationService } = await import('../services/reservationService');
    const cancelledReservation = { ...mockReservation, status: 'cancelled' as const };
    mockApiPatch.mockResolvedValue({
      data: { success: true, data: cancelledReservation },
    });

    const result = await reservationService.cancelReservation('res-1');

    expect(mockApiPatch).toHaveBeenCalledWith('/reservations/res-1/cancel');
    expect(result.status).toBe('cancelled');
  });

  it('cancelReservation — throws on failure', async () => {
    const { reservationService } = await import('../services/reservationService');
    mockApiPatch.mockRejectedValue(new Error('Already cancelled'));

    await expect(reservationService.cancelReservation('res-1')).rejects.toThrow(
      'Already cancelled'
    );
  });
});
