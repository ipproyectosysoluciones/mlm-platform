/**
 * @fileoverview propertiesFlow.test — Properties listing → detail flow integration tests
 * @description Tests the user journey: browse PropertiesPage → navigate to PropertyDetailPage → reserve.
 *              Cubre el flujo: navegar PropertiesPage → detalle de propiedad → iniciar reserva.
 *
 * @module test/propertiesFlow
 * @author Nexo Real Development Team
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HelmetProvider } from 'react-helmet-async';

import PropertiesPage from '../pages/PropertiesPage';
import PropertyDetailPage from '../pages/PropertyDetailPage';
import { propertyService } from '../services/propertyService';
import { useReservationStore } from '../stores/reservationStore';
import type { Property, PropertyListResponse } from '../services/propertyService';

// ============================================
// Mocks / Mocks de dependencias
// ============================================

vi.mock('../services/propertyService', () => ({
  propertyService: {
    getProperties: vi.fn(),
    getProperty: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ============================================
// Fixtures / Datos de prueba
// ============================================

/** A minimal property fixture that satisfies the full Property interface */
const mockProperty: Property = {
  id: 'prop-123',
  title: 'Departamento en Palermo',
  description: 'Luminoso depto en pleno Palermo. Ideal para familia.',
  type: 'rental',
  status: 'active',
  price: 850000,
  currency: 'ARS',
  address: 'Thames 1234',
  city: 'Buenos Aires',
  country: 'AR',
  bedrooms: 2,
  bathrooms: 1,
  areaM2: 65,
  images: ['https://img.nexoreal.xyz/prop-123-1.jpg'],
  amenities: ['WiFi', 'Cochera', 'Balcón'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

/** A sale property (no "por mes" label, CTA says "Consultar") */
const mockSaleProperty: Property = {
  ...mockProperty,
  id: 'prop-456',
  title: 'Casa en venta en San Isidro',
  type: 'sale',
  status: 'active',
  price: 250000,
  currency: 'USD',
  city: 'San Isidro',
  amenities: [],
};

/** A property without optional fields (no bedrooms / bathrooms / area) */
const mockMinimalProperty: Property = {
  id: 'prop-789',
  title: 'Local comercial',
  description: 'Local en zona céntrica.',
  type: 'management',
  status: 'active',
  price: 100000,
  currency: 'ARS',
  address: 'Corrientes 5678',
  city: 'Rosario',
  country: 'AR',
  images: [],
  amenities: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

/** Paginated response with two properties */
const mockListResponse: PropertyListResponse = {
  data: [mockProperty, mockSaleProperty],
  pagination: {
    total: 2,
    page: 1,
    limit: 12,
    totalPages: 1,
  },
};

// ============================================
// Helpers de renderizado / Render helpers
// ============================================

/**
 * Renders PropertiesPage inside MemoryRouter at /properties
 * Renderiza PropertiesPage dentro de MemoryRouter en /properties
 */
function renderListingPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/properties']}>
        <Routes>
          <Route path="/properties" element={<PropertiesPage />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
}

/**
 * Renders PropertyDetailPage inside MemoryRouter at /properties/:id
 * Renderiza PropertyDetailPage dentro de MemoryRouter en /properties/:id
 */
function renderDetailPage(id: string = 'prop-123') {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[`/properties/${id}`]}>
        <Routes>
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
}

// ============================================
// Tests
// ============================================

describe('Properties flow (listing → detail)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
    act(() => {
      useReservationStore.getState().reset();
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ------------------------------------------
  // PropertiesPage (listing)
  // ------------------------------------------

  describe('PropertiesPage — listing', () => {
    it('shows a loading state initially', () => {
      vi.mocked(propertyService.getProperties).mockReturnValue(new Promise(() => {}));
      renderListingPage();

      // Page heading is always visible
      expect(screen.getByText('Propiedades')).toBeInTheDocument();
    });

    it('renders property cards after loading', async () => {
      vi.mocked(propertyService.getProperties).mockResolvedValueOnce(mockListResponse);
      renderListingPage();

      await waitFor(() => {
        expect(screen.getByText('Departamento en Palermo')).toBeInTheDocument();
      });

      expect(screen.getByText('Casa en venta en San Isidro')).toBeInTheDocument();
    });

    it('shows total count from pagination', async () => {
      vi.mocked(propertyService.getProperties).mockResolvedValueOnce(mockListResponse);
      renderListingPage();

      await waitFor(() => {
        expect(screen.getByText(/2 propiedades disponibles/i)).toBeInTheDocument();
      });
    });

    it('shows error message when getProperties fails', async () => {
      vi.mocked(propertyService.getProperties).mockRejectedValueOnce(new Error('Network error'));
      renderListingPage();

      await waitFor(() => {
        expect(screen.getByText(/No se pudieron cargar las propiedades/i)).toBeInTheDocument();
      });
    });

    it('navigates to property detail when clicking a card', async () => {
      vi.mocked(propertyService.getProperties).mockResolvedValueOnce(mockListResponse);
      renderListingPage();

      await waitFor(() => {
        expect(screen.getByText('Departamento en Palermo')).toBeInTheDocument();
      });

      // Click on the property card article
      const cards = screen.getAllByRole('article');
      fireEvent.click(cards[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/properties/prop-123');
    });

    it('calls getProperties with correct default params', async () => {
      vi.mocked(propertyService.getProperties).mockResolvedValueOnce(mockListResponse);
      renderListingPage();

      await waitFor(() => {
        expect(propertyService.getProperties).toHaveBeenCalledWith(
          expect.objectContaining({ page: 1, limit: 12 })
        );
      });
    });

    it('shows "Limpiar filtros" button when filters are active', async () => {
      vi.mocked(propertyService.getProperties).mockResolvedValue(mockListResponse);
      renderListingPage();

      // Type in the search box
      const searchInput = await screen.findByPlaceholderText(/buscar/i);
      fireEvent.change(searchInput, { target: { value: 'Palermo' } });

      expect(screen.getByRole('button', { name: /limpiar/i })).toBeInTheDocument();
    });

    it('does NOT show "Limpiar filtros" when no filters are active', async () => {
      vi.mocked(propertyService.getProperties).mockResolvedValueOnce(mockListResponse);
      renderListingPage();

      await waitFor(() => {
        expect(propertyService.getProperties).toHaveBeenCalled();
      });

      expect(screen.queryByRole('button', { name: /limpiar/i })).not.toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // PropertyDetailPage — detail
  // ------------------------------------------

  describe('PropertyDetailPage — detail', () => {
    it('shows skeleton while loading', () => {
      vi.mocked(propertyService.getProperty).mockReturnValue(new Promise(() => {}));
      renderDetailPage();

      // Skeleton renders divs with animate-pulse — page should not show any heading
      expect(
        screen.queryByRole('heading', { name: /Departamento en Palermo/i })
      ).not.toBeInTheDocument();
    });

    it('renders property title after loading', async () => {
      vi.mocked(propertyService.getProperty).mockResolvedValueOnce(mockProperty);
      renderDetailPage();

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Departamento en Palermo' })
        ).toBeInTheDocument();
      });
    });

    it('shows address and city', async () => {
      vi.mocked(propertyService.getProperty).mockResolvedValueOnce(mockProperty);
      renderDetailPage();

      await waitFor(() => {
        expect(screen.getByText(/Thames 1234/)).toBeInTheDocument();
      });
      expect(screen.getByText(/Buenos Aires/)).toBeInTheDocument();
    });

    it('shows bedroom, bathroom and area specs', async () => {
      vi.mocked(propertyService.getProperty).mockResolvedValueOnce(mockProperty);
      renderDetailPage();

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // bedrooms
      });
      expect(screen.getByText(/dormitorios/)).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // bathrooms
      expect(screen.getByText(/baño/)).toBeInTheDocument();
      expect(screen.getByText('65')).toBeInTheDocument(); // area
      expect(screen.getByText(/m²/)).toBeInTheDocument();
    });

    it('shows amenities list', async () => {
      vi.mocked(propertyService.getProperty).mockResolvedValueOnce(mockProperty);
      renderDetailPage();

      await waitFor(() => {
        expect(screen.getByText('Comodidades')).toBeInTheDocument();
      });
      expect(screen.getByText('WiFi')).toBeInTheDocument();
      expect(screen.getByText('Cochera')).toBeInTheDocument();
      expect(screen.getByText('Balcón')).toBeInTheDocument();
    });

    it('shows "por mes" label for rental properties', async () => {
      vi.mocked(propertyService.getProperty).mockResolvedValueOnce(mockProperty);
      renderDetailPage();

      await waitFor(() => {
        expect(screen.getByText('por mes')).toBeInTheDocument();
      });
    });

    it('does NOT show "por mes" for sale properties', async () => {
      vi.mocked(propertyService.getProperty).mockResolvedValueOnce(mockSaleProperty);
      renderDetailPage('prop-456');

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Casa en venta en San Isidro' })
        ).toBeInTheDocument();
      });

      expect(screen.queryByText('por mes')).not.toBeInTheDocument();
    });

    it('shows "Solicitar visita" CTA for rental properties', async () => {
      vi.mocked(propertyService.getProperty).mockResolvedValueOnce(mockProperty);
      renderDetailPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /solicitar visita/i })).toBeInTheDocument();
      });
    });

    it('shows "Consultar" CTA for sale properties', async () => {
      vi.mocked(propertyService.getProperty).mockResolvedValueOnce(mockSaleProperty);
      renderDetailPage('prop-456');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /consultar/i })).toBeInTheDocument();
      });
    });

    it('calls startPropertyReservation and navigates on CTA click', async () => {
      vi.mocked(propertyService.getProperty).mockResolvedValueOnce(mockProperty);
      renderDetailPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /solicitar visita/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /solicitar visita/i }));

      const storeWizardData = useReservationStore.getState().wizardData;
      expect(storeWizardData?.type).toBe('property');
      expect(
        (storeWizardData as { type: 'property'; property: Property } | null)?.property.id
      ).toBe('prop-123');
      expect(mockNavigate).toHaveBeenCalledWith('/reservations/new');
    });

    it('shows error state when getProperty fails', async () => {
      vi.mocked(propertyService.getProperty).mockRejectedValueOnce(new Error('Not found'));
      renderDetailPage('bad-id');

      await waitFor(() => {
        expect(screen.getByText(/No se pudo cargar la propiedad/i)).toBeInTheDocument();
      });
    });

    it('shows "Volver al listado" link on error state', async () => {
      vi.mocked(propertyService.getProperty).mockRejectedValueOnce(new Error('Not found'));
      renderDetailPage('bad-id');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /volver al listado/i })).toBeInTheDocument();
      });
    });

    it('navigates to /properties when clicking "Volver a propiedades"', async () => {
      vi.mocked(propertyService.getProperty).mockResolvedValueOnce(mockProperty);
      renderDetailPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /volver a propiedades/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /volver a propiedades/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/properties');
    });

    it('navigates to /properties when clicking error state back button', async () => {
      vi.mocked(propertyService.getProperty).mockRejectedValueOnce(new Error('Not found'));
      renderDetailPage('bad-id');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /volver al listado/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /volver al listado/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/properties');
    });

    it('renders without optional fields (no bedrooms/area)', async () => {
      vi.mocked(propertyService.getProperty).mockResolvedValueOnce(mockMinimalProperty);
      renderDetailPage('prop-789');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Local comercial' })).toBeInTheDocument();
      });

      // No bedroom/bathroom/area specs should appear
      expect(screen.queryByText(/dormitorio/)).not.toBeInTheDocument();
      expect(screen.queryByText(/baño/)).not.toBeInTheDocument();
      expect(screen.queryByText(/m²/)).not.toBeInTheDocument();
    });

    it('shows placeholder gallery when no images', async () => {
      vi.mocked(propertyService.getProperty).mockResolvedValueOnce(mockMinimalProperty);
      renderDetailPage('prop-789');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Local comercial' })).toBeInTheDocument();
      });

      // The empty gallery renders an SVG placeholder (MapPin icon)
      // No img tag should appear
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });
});
