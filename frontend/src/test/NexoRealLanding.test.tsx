/**
 * @fileoverview NexoRealLanding unit tests
 * @description Tests for the public landing page: hero section, stats strip, CTA links,
 *               featured properties/tours loading states, and footer content.
 *               Tests de la landing pública: sección hero, tira de stats, links CTA,
 *               estados de carga de propiedades/tours destacados, y footer.
 * @module test/NexoRealLanding.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NexoRealLanding from '../pages/landing/NexoRealLanding';
import type { Property } from '../services/propertyService';
import type { TourPackage } from '../services/tourService';

// ============================================
// Mocks / Mocks
// ============================================

// Mock the stores so we control what they return
// Mockeamos los stores para controlar lo que devuelven
vi.mock('../stores/propertiesStore', () => ({
  useFeaturedProperties: vi.fn(),
  usePropertiesStore: vi.fn(),
}));

vi.mock('../stores/toursStore', () => ({
  useFeaturedTours: vi.fn(),
  useToursStore: vi.fn(),
}));

// After mocking the modules, import the named hooks to override their return values
import { useFeaturedProperties } from '../stores/propertiesStore';
import { useFeaturedTours } from '../stores/toursStore';

// ============================================
// Fixtures / Fixtures
// ============================================

const mockFetchFeatured = vi.fn();

const defaultPropertiesState = {
  featuredProperties: [] as Property[],
  isFetchingFeatured: false,
  featuredError: null as string | null,
  fetchFeatured: mockFetchFeatured,
};

const defaultToursState = {
  featuredTours: [] as TourPackage[],
  isFetchingFeatured: false,
  featuredError: null as string | null,
  fetchFeatured: mockFetchFeatured,
};

const mockProperty: Property = {
  id: 'prop-1',
  title: 'Depto en Recoleta',
  description: 'Lindo depto',
  type: 'sale',
  status: 'active',
  price: 120000,
  currency: 'USD',
  address: 'Av. Alvear 800',
  city: 'Buenos Aires',
  country: 'Argentina',
  images: [],
  amenities: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockTour: TourPackage = {
  id: 'tour-1',
  title: 'Salta Colonial',
  description: 'Tour cultural por el noroeste',
  type: 'cultural',
  destination: 'Salta, Argentina',
  durationDays: 4,
  price: '45000',
  currency: 'ARS',
  maxCapacity: 10,
  images: [],
  priceIncludes: [],
  priceExcludes: [],
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// ============================================
// Helpers / Helpers
// ============================================

function renderLanding() {
  return render(
    <MemoryRouter>
      <NexoRealLanding />
    </MemoryRouter>
  );
}

// ============================================
// Tests
// ============================================

describe('NexoRealLanding — Hero section', () => {
  beforeEach(() => {
    vi.mocked(useFeaturedProperties).mockReturnValue(defaultPropertiesState);
    vi.mocked(useFeaturedTours).mockReturnValue(defaultToursState);
    vi.clearAllMocks();
  });

  it('renders the hero badge', () => {
    renderLanding();
    expect(screen.getByText('Plataforma Inmobiliaria & Turística')).toBeInTheDocument();
  });

  it('renders the hero title', () => {
    renderLanding();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders the CTA "Ver Propiedades" button linking to /properties', () => {
    renderLanding();
    const link = screen.getByRole('link', { name: /ver propiedades/i });
    expect(link).toHaveAttribute('href', '/properties');
  });

  it('renders the CTA "Ver Tours" button linking to /tours', () => {
    renderLanding();
    const link = screen.getByRole('link', { name: /ver tours/i });
    expect(link).toHaveAttribute('href', '/tours');
  });

  it('renders all 4 stats in the stats strip', () => {
    renderLanding();
    // Stat values are hardcoded in the component
    expect(screen.getByText('1,200+')).toBeInTheDocument();
    expect(screen.getByText('340+')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('8,500+')).toBeInTheDocument();
  });
});

describe('NexoRealLanding — Featured Properties section', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner while fetching featured properties', () => {
    vi.mocked(useFeaturedProperties).mockReturnValue({
      ...defaultPropertiesState,
      isFetchingFeatured: true,
    });
    vi.mocked(useFeaturedTours).mockReturnValue(defaultToursState);

    renderLanding();
    expect(screen.getByText('Cargando propiedades...')).toBeInTheDocument();
  });

  it('shows error message when featured properties fetch fails', () => {
    vi.mocked(useFeaturedProperties).mockReturnValue({
      ...defaultPropertiesState,
      featuredError: 'No se pudo conectar al servidor',
    });
    vi.mocked(useFeaturedTours).mockReturnValue(defaultToursState);

    renderLanding();
    expect(screen.getByText('No se pudo conectar al servidor')).toBeInTheDocument();
  });

  it('shows empty state when no featured properties', () => {
    vi.mocked(useFeaturedProperties).mockReturnValue(defaultPropertiesState);
    vi.mocked(useFeaturedTours).mockReturnValue(defaultToursState);

    renderLanding();
    expect(screen.getByText('No hay propiedades destacadas.')).toBeInTheDocument();
  });

  it('renders PropertyCard items when featured properties are loaded', () => {
    vi.mocked(useFeaturedProperties).mockReturnValue({
      ...defaultPropertiesState,
      featuredProperties: [mockProperty],
    });
    vi.mocked(useFeaturedTours).mockReturnValue(defaultToursState);

    renderLanding();
    expect(screen.getByText('Depto en Recoleta')).toBeInTheDocument();
  });

  it('calls fetchFeatured on mount for properties', () => {
    const fetchProperties = vi.fn();
    vi.mocked(useFeaturedProperties).mockReturnValue({
      ...defaultPropertiesState,
      fetchFeatured: fetchProperties,
    });
    vi.mocked(useFeaturedTours).mockReturnValue(defaultToursState);

    renderLanding();
    expect(fetchProperties).toHaveBeenCalledOnce();
  });
});

describe('NexoRealLanding — Featured Tours section', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner while fetching featured tours', () => {
    vi.mocked(useFeaturedProperties).mockReturnValue(defaultPropertiesState);
    vi.mocked(useFeaturedTours).mockReturnValue({
      ...defaultToursState,
      isFetchingFeatured: true,
    });

    renderLanding();
    expect(screen.getByText('Cargando tours...')).toBeInTheDocument();
  });

  it('shows error message when featured tours fetch fails', () => {
    vi.mocked(useFeaturedProperties).mockReturnValue(defaultPropertiesState);
    vi.mocked(useFeaturedTours).mockReturnValue({
      ...defaultToursState,
      featuredError: 'Error de red en tours',
    });

    renderLanding();
    expect(screen.getByText('Error de red en tours')).toBeInTheDocument();
  });

  it('shows empty state when no featured tours', () => {
    vi.mocked(useFeaturedProperties).mockReturnValue(defaultPropertiesState);
    vi.mocked(useFeaturedTours).mockReturnValue(defaultToursState);

    renderLanding();
    expect(screen.getByText('No hay tours destacados.')).toBeInTheDocument();
  });

  it('renders TourCard items when featured tours are loaded', () => {
    vi.mocked(useFeaturedProperties).mockReturnValue(defaultPropertiesState);
    vi.mocked(useFeaturedTours).mockReturnValue({
      ...defaultToursState,
      featuredTours: [mockTour],
    });

    renderLanding();
    expect(screen.getByText('Salta Colonial')).toBeInTheDocument();
  });

  it('calls fetchFeatured on mount for tours', () => {
    const fetchTours = vi.fn();
    vi.mocked(useFeaturedProperties).mockReturnValue(defaultPropertiesState);
    vi.mocked(useFeaturedTours).mockReturnValue({
      ...defaultToursState,
      fetchFeatured: fetchTours,
    });

    renderLanding();
    expect(fetchTours).toHaveBeenCalledOnce();
  });
});

describe('NexoRealLanding — CTA section', () => {
  beforeEach(() => {
    vi.mocked(useFeaturedProperties).mockReturnValue(defaultPropertiesState);
    vi.mocked(useFeaturedTours).mockReturnValue(defaultToursState);
  });

  it('renders "Crear Cuenta Gratis" button linking to /register', () => {
    renderLanding();
    const link = screen.getByRole('link', { name: /crear cuenta gratis/i });
    expect(link).toHaveAttribute('href', '/register');
  });

  it('renders "Ya tengo cuenta" link to /login', () => {
    renderLanding();
    const link = screen.getByRole('link', { name: /ya tengo cuenta/i });
    expect(link).toHaveAttribute('href', '/login');
  });
});

describe('NexoRealLanding — Footer section', () => {
  beforeEach(() => {
    vi.mocked(useFeaturedProperties).mockReturnValue(defaultPropertiesState);
    vi.mocked(useFeaturedTours).mockReturnValue(defaultToursState);
  });

  it('renders Nexo Real brand name in footer', () => {
    renderLanding();
    // Brand name appears in both nav (if any) and footer
    const brandElements = screen.getAllByText('Nexo Real');
    expect(brandElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders footer navigation link to /properties', () => {
    renderLanding();
    const links = screen.getAllByRole('link', { name: /propiedades/i });
    const footerLink = links.find((l) => l.getAttribute('href') === '/properties');
    expect(footerLink).toBeDefined();
  });

  it('renders footer navigation link to /tours', () => {
    renderLanding();
    const links = screen.getAllByRole('link', { name: /tours/i });
    const footerLink = links.find((l) => l.getAttribute('href') === '/tours');
    expect(footerLink).toBeDefined();
  });

  it('renders current year in copyright', () => {
    renderLanding();
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });
});
