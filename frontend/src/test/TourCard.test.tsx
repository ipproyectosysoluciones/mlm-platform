/**
 * @fileoverview TourCard unit tests
 * @description Tests for grid and list variants, category badge, specs display, and price formatting.
 *               Tests para variantes grid y lista, badge de categoría, specs y formato de precio.
 * @module test/TourCard.test
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TourCard } from '../components/tour/TourCard';
import type { TourPackage } from '../services/tourService';

// ============================================
// Fixtures / Fixtures
// ============================================

/** Tour base para tests / Base tour fixture */
const baseTour: TourPackage = {
  id: 'tour-1',
  title: 'Patagonia Extrema',
  description: 'Aventura en el fin del mundo',
  category: 'adventure',
  destination: 'Ushuaia, Argentina',
  duration: 7,
  price: 85000,
  currency: 'ARS',
  maxGuests: 12,
  images: [],
  includes: ['guía', 'traslados'],
  excludes: ['vuelos'],
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

/** Renders a TourCard wrapped in MemoryRouter */
function renderCard(tour: TourPackage = baseTour, variant: 'grid' | 'list' = 'grid') {
  return render(
    <MemoryRouter>
      <TourCard tour={tour} variant={variant} />
    </MemoryRouter>
  );
}

// ============================================
// Tests
// ============================================

describe('TourCard — grid variant', () => {
  it('renders the tour title', () => {
    renderCard();
    expect(screen.getByText('Patagonia Extrema')).toBeInTheDocument();
  });

  it('renders the destination', () => {
    renderCard();
    expect(screen.getByText('Ushuaia, Argentina')).toBeInTheDocument();
  });

  it('renders the "Aventura" badge for category adventure', () => {
    renderCard();
    expect(screen.getByText('Aventura')).toBeInTheDocument();
  });

  it('renders the "Cultural" badge for category cultural', () => {
    renderCard({ ...baseTour, category: 'cultural' });
    expect(screen.getByText('Cultural')).toBeInTheDocument();
  });

  it('renders the "Relajación" badge for category relaxation', () => {
    renderCard({ ...baseTour, category: 'relaxation' });
    expect(screen.getByText('Relajación')).toBeInTheDocument();
  });

  it('renders the "Gastronómico" badge for category gastronomic', () => {
    renderCard({ ...baseTour, category: 'gastronomic' });
    expect(screen.getByText('Gastronómico')).toBeInTheDocument();
  });

  it('renders the "Ecoturismo" badge for category ecotourism', () => {
    renderCard({ ...baseTour, category: 'ecotourism' });
    expect(screen.getByText('Ecoturismo')).toBeInTheDocument();
  });

  it('renders the "Lujo" badge for category luxury', () => {
    renderCard({ ...baseTour, category: 'luxury' });
    expect(screen.getByText('Lujo')).toBeInTheDocument();
  });

  it('renders duration in días', () => {
    renderCard();
    expect(screen.getByText(/7 días/i)).toBeInTheDocument();
  });

  it('renders max guests with Máx. prefix', () => {
    renderCard();
    expect(screen.getByText(/Máx\. 12/i)).toBeInTheDocument();
  });

  it('renders price with /persona suffix', () => {
    renderCard();
    expect(screen.getByText(/\/ persona/i)).toBeInTheDocument();
  });

  it('links to the tour detail page', () => {
    renderCard();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/tours/tour-1');
  });

  it('shows placeholder icon when images array is empty', () => {
    renderCard({ ...baseTour, images: [] });
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('shows image when images array has a URL', () => {
    renderCard({ ...baseTour, images: ['https://cdn.test/patagonia.jpg'] });
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://cdn.test/patagonia.jpg');
    expect(img).toHaveAttribute('alt', 'Patagonia Extrema');
  });
});

describe('TourCard — list variant', () => {
  it('renders the tour title in list layout', () => {
    renderCard(baseTour, 'list');
    expect(screen.getByText('Patagonia Extrema')).toBeInTheDocument();
  });

  it('renders destination in list layout', () => {
    renderCard(baseTour, 'list');
    expect(screen.getByText('Ushuaia, Argentina')).toBeInTheDocument();
  });

  it('renders duration in list layout', () => {
    renderCard(baseTour, 'list');
    expect(screen.getByText(/7 días/i)).toBeInTheDocument();
  });

  it('links to the tour detail page in list layout', () => {
    renderCard(baseTour, 'list');
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/tours/tour-1');
  });
});
