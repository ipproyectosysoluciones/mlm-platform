/**
 * @fileoverview PropertyDetailPage mobile sticky CTA tests / Tests de CTA sticky en móvil
 * @description Validates mobile sticky CTA bar is present with correct structure,
 *              price display, and booking button for properties.
 *              Verifica barra CTA fija en móvil para propiedades.
 * @module __tests__/pages/PropertyDetailPage.mobile.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// ── Mocks ───────────────────────────────────────────────────────────────────

const { MOCK_PROPERTY } = vi.hoisted(() => ({
  MOCK_PROPERTY: {
    id: 'prop-1',
    slug: 'beach-villa',
    title: 'Beach Villa',
    description: 'A beautiful beach villa',
    price: 250000,
    currency: 'USD',
    type: 'sale' as const,
    bedrooms: 3,
    bathrooms: 2,
    area: 150,
    location: { city: 'Miami', country: 'USA', address: '123 Beach Rd' },
    images: ['https://example.com/img.jpg'],
    amenities: ['Pool', 'Garden'],
    isActive: true,
  },
}));

vi.mock('../../services/propertyService', () => ({
  propertyService: {
    getProperty: vi.fn().mockResolvedValue(MOCK_PROPERTY),
    getPropertyBySlug: vi.fn().mockResolvedValue(MOCK_PROPERTY),
  },
}));

vi.mock('../../stores/reservationStore', () => ({
  useReservationStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      startPropertyReservation: vi.fn(),
      openWizard: vi.fn(),
    }),
}));

vi.mock('../../lib/utils', () => ({
  cn: (...args: unknown[]) =>
    args
      .flat()
      .filter((a) => typeof a === 'string')
      .join(' '),
}));

vi.mock('../../config/app.config', () => ({
  APP_URL: 'https://test.com',
  APP_OG_DEFAULT_IMAGE: 'https://test.com/og.jpg',
}));

import PropertyDetailPage from '../../pages/PropertyDetailPage';

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderPropertyDetail() {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/properties/prop-1']}>
        <Routes>
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('PropertyDetailPage — Mobile sticky CTA (T3.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a mobile sticky CTA bar with lg:hidden class', async () => {
    renderPropertyDetail();

    const stickyCta = await screen.findByTestId('mobile-sticky-cta');
    expect(stickyCta).toBeTruthy();
    expect(stickyCta.className).toContain('lg:hidden');
    expect(stickyCta.className).toContain('fixed');
    expect(stickyCta.className).toContain('bottom-0');
  });

  it('mobile sticky CTA shows property price', async () => {
    renderPropertyDetail();

    const stickyCta = await screen.findByTestId('mobile-sticky-cta');
    expect(stickyCta.textContent).toContain('USD');
    expect(stickyCta.textContent).toContain('250.000');
  });

  it('mobile sticky CTA contains a booking button with Lock icon', async () => {
    renderPropertyDetail();

    const stickyCta = await screen.findByTestId('mobile-sticky-cta');
    const button = stickyCta.querySelector('button');
    expect(button).toBeTruthy();

    const lockIcon = stickyCta.querySelector('svg.lucide-lock');
    expect(lockIcon).toBeTruthy();
  });

  it('renders a spacer div with h-20 lg:h-0 for mobile bottom padding', async () => {
    const { container } = renderPropertyDetail();

    await screen.findByTestId('mobile-sticky-cta');

    const spacer = container.querySelector('.h-20.lg\\:h-0');
    expect(spacer).toBeTruthy();
  });
});
