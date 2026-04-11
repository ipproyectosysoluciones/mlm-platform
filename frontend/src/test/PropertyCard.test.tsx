/**
 * @fileoverview PropertyCard unit tests
 * @description Tests for grid and list variants, badge rendering, specs display, and price formatting.
 *               Tests para variantes grid y lista, renderizado de badges, specs y formato de precio.
 * @module test/PropertyCard.test
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PropertyCard } from '../components/property/PropertyCard';
import type { Property } from '../services/propertyService';

// ============================================
// Fixtures / Fixtures
// ============================================

/** Propiedad base para tests / Base property fixture */
const baseProperty: Property = {
  id: 'prop-1',
  title: 'Departamento en Palermo',
  description: 'Hermoso depto con vista al parque',
  type: 'sale',
  status: 'active',
  price: 150000,
  currency: 'USD',
  address: 'Av. Santa Fe 3000',
  city: 'Buenos Aires',
  country: 'Argentina',
  bedrooms: 2,
  bathrooms: 1,
  areaM2: 65,
  images: [],
  amenities: ['wifi', 'garage'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

/** Renders a PropertyCard wrapped in MemoryRouter */
function renderCard(property: Property = baseProperty, variant: 'grid' | 'list' = 'grid') {
  return render(
    <MemoryRouter>
      <PropertyCard property={property} variant={variant} />
    </MemoryRouter>
  );
}

// ============================================
// Tests
// ============================================

describe('PropertyCard — grid variant', () => {
  it('renders the property title', () => {
    renderCard();
    expect(screen.getByText('Departamento en Palermo')).toBeInTheDocument();
  });

  it('renders city and country', () => {
    renderCard();
    expect(screen.getByText(/Buenos Aires.*Argentina/i)).toBeInTheDocument();
  });

  it('renders the "En Venta" badge for type sale', () => {
    renderCard();
    expect(screen.getByText('En Venta')).toBeInTheDocument();
  });

  it('renders the "En Alquiler" badge for type rental', () => {
    renderCard({ ...baseProperty, type: 'rental' });
    expect(screen.getByText('En Alquiler')).toBeInTheDocument();
  });

  it('renders the "Administración" badge for type management', () => {
    renderCard({ ...baseProperty, type: 'management' });
    expect(screen.getByText('Administración')).toBeInTheDocument();
  });

  it('renders bedrooms count', () => {
    renderCard();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders area in m²', () => {
    renderCard();
    expect(screen.getByText(/65 m²/i)).toBeInTheDocument();
  });

  it('renders formatted price', () => {
    renderCard();
    // Intl formats 150000 USD → "US$ 150.000" in es-AR locale
    expect(screen.getByText(/150/)).toBeInTheDocument();
  });

  it('links to the property detail page', () => {
    renderCard();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/properties/prop-1');
  });

  it('shows placeholder icon when images array is empty', () => {
    renderCard({ ...baseProperty, images: [] });
    // No img tag — the Tag icon placeholder renders instead
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('shows image when images array has a URL', () => {
    renderCard({ ...baseProperty, images: ['https://cdn.test/photo.jpg'] });
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://cdn.test/photo.jpg');
    expect(img).toHaveAttribute('alt', 'Departamento en Palermo');
  });

  it('does not render bedrooms when bedrooms is undefined', () => {
    renderCard({ ...baseProperty, bedrooms: undefined });
    // Only bathrooms (1) and area (65) badges should render
    // Bed icon should NOT be present; we rely on text absence
    expect(screen.queryByText('2')).toBeNull();
  });
});

describe('PropertyCard — list variant', () => {
  it('renders the property title in list layout', () => {
    renderCard(baseProperty, 'list');
    expect(screen.getByText('Departamento en Palermo')).toBeInTheDocument();
  });

  it('renders city and country in list layout', () => {
    renderCard(baseProperty, 'list');
    expect(screen.getByText(/Buenos Aires.*Argentina/i)).toBeInTheDocument();
  });

  it('renders badge in list layout', () => {
    renderCard(baseProperty, 'list');
    expect(screen.getByText('En Venta')).toBeInTheDocument();
  });

  it('links to the property detail page in list layout', () => {
    renderCard(baseProperty, 'list');
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/properties/prop-1');
  });
});
