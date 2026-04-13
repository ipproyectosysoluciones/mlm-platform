/**
 * @fileoverview TourDetailPage mobile sticky CTA tests / Tests de CTA sticky en móvil
 * @description Validates mobile sticky CTA bar is present with correct structure,
 *              price display, and booking button.
 *              Verifica barra CTA fija en móvil con estructura correcta, precio y botón.
 * @module __tests__/pages/TourDetailPage.mobile.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// ── Mocks ───────────────────────────────────────────────────────────────────

const { MOCK_TOUR } = vi.hoisted(() => ({
  MOCK_TOUR: {
    id: 'tour-1',
    slug: 'beach-tour',
    title: 'Beach Tour',
    description: 'A great beach tour',
    price: 150,
    currency: 'USD',
    category: 'adventure' as const,
    maxParticipants: 20,
    durationDays: 3,
    location: { city: 'Cancún', country: 'México' },
    images: ['https://example.com/img.jpg'],
    priceIncludes: ['Transport'],
    priceExcludes: ['Food'],
    itinerary: [],
    availabilities: [{ id: 'av-1', date: '2026-07-01', availableSpots: 10 }],
    isActive: true,
  },
}));

vi.mock('../../services/tourService', () => ({
  tourService: {
    getTour: vi.fn().mockResolvedValue(MOCK_TOUR),
    getTourBySlug: vi.fn().mockResolvedValue(MOCK_TOUR),
  },
}));

vi.mock('../../stores/reservationStore', () => ({
  useReservationStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      startTourReservation: vi.fn(),
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

import TourDetailPage from '../../pages/TourDetailPage';

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderTourDetail() {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/tours/tour-1']}>
        <Routes>
          <Route path="/tours/:id" element={<TourDetailPage />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('TourDetailPage — Mobile sticky CTA (T3.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a mobile sticky CTA bar with lg:hidden class', async () => {
    renderTourDetail();

    const stickyCta = await screen.findByTestId('mobile-sticky-cta');
    expect(stickyCta).toBeTruthy();
    expect(stickyCta.className).toContain('lg:hidden');
    expect(stickyCta.className).toContain('fixed');
    expect(stickyCta.className).toContain('bottom-0');
  });

  it('mobile sticky CTA shows tour price', async () => {
    renderTourDetail();

    const stickyCta = await screen.findByTestId('mobile-sticky-cta');
    expect(stickyCta.textContent).toContain('USD');
    expect(stickyCta.textContent).toContain('150');
  });

  it('mobile sticky CTA contains a booking button with Lock icon', async () => {
    renderTourDetail();

    const stickyCta = await screen.findByTestId('mobile-sticky-cta');
    const button = stickyCta.querySelector('button');
    expect(button).toBeTruthy();

    // Button should have the Lock icon
    const lockIcon = stickyCta.querySelector('svg.lucide-lock');
    expect(lockIcon).toBeTruthy();
  });

  it('renders a spacer div with h-20 lg:h-0 for mobile bottom padding', async () => {
    const { container } = renderTourDetail();

    await screen.findByTestId('mobile-sticky-cta');

    const spacer = container.querySelector('.h-20.lg\\:h-0');
    expect(spacer).toBeTruthy();
  });
});
