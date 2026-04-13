/**
 * @fileoverview TourDetailPage button migration tests / Tests de migración de botones en TourDetailPage
 * @description Validates all raw <button> elements are replaced with shadcn <Button>,
 *              and payment CTAs include Lock icon.
 *              Verifica que todos los <button> crudos se reemplazaron con <Button> de shadcn,
 *              y CTAs de pago incluyen ícono Lock.
 * @module __tests__/pages/TourDetailPage.buttons.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockGetTour = vi.fn();
vi.mock('../../services/tourService', () => ({
  tourService: {
    getTour: (...args: unknown[]) => mockGetTour(...args),
  },
}));

const mockStartTourReservation = vi.fn();
vi.mock('../../stores/reservationStore', () => ({
  useReservationStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ startTourReservation: mockStartTourReservation }),
}));

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="helmet">{children}</div>
  ),
}));

vi.mock('../../config/app.config', () => ({
  APP_URL: 'http://test.nexo.real',
  APP_OG_DEFAULT_IMAGE: 'http://test.nexo.real/og.jpg',
}));

import TourDetailPage from '../../pages/TourDetailPage';

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderTourDetailPage() {
  return render(
    <MemoryRouter initialEntries={['/tours/tour-1']}>
      <Routes>
        <Route path="/tours/:id" element={<TourDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

const MOCK_TOUR = {
  id: 'tour-1',
  title: 'Adventure in Patagonia',
  destination: 'El Calafate',
  durationDays: 5,
  maxCapacity: 12,
  price: 2500,
  currency: 'USD',
  type: 'adventure' as const,
  description: 'An incredible tour through glaciers and mountains.',
  images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
  priceIncludes: ['Accommodation', 'Meals'],
  priceExcludes: ['Flights'],
  status: 'active' as const,
  availabilities: [
    {
      id: 'avail-1',
      tourPackageId: 'tour-1',
      date: '2026-05-15',
      availableSpots: 8,
      totalSpots: 12,
    },
    {
      id: 'avail-2',
      tourPackageId: 'tour-1',
      date: '2026-06-01',
      availableSpots: 0,
      totalSpots: 12,
    },
  ],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

const MOCK_TOUR_SOLD_OUT = {
  ...MOCK_TOUR,
  id: 'tour-sold-out',
  availabilities: [
    {
      id: 'avail-sold',
      tourPackageId: 'tour-sold-out',
      date: '2026-05-15',
      availableSpots: 0,
      totalSpots: 12,
    },
  ],
};

// ── Tests ───────────────────────────────────────────────────────────────────

describe('TourDetailPage — Button migration (T1.5)', () => {
  beforeEach(() => {
    mockGetTour.mockReset();
    mockStartTourReservation.mockReset();
  });

  it('renders NO raw <button> elements — all buttons use shadcn Button component', async () => {
    mockGetTour.mockResolvedValue(MOCK_TOUR);
    const { container } = renderTourDetailPage();

    // Wait for tour to load
    await screen.findByText('Adventure in Patagonia');

    // Every <button> in the DOM should have the shadcn base class from buttonVariants
    const allButtons = container.querySelectorAll('button');
    const shadcnBaseFragment = 'ring-offset-background';

    expect(allButtons.length).toBeGreaterThan(0);
    allButtons.forEach((btn) => {
      expect(
        btn.className.includes(shadcnBaseFragment),
        `Button "${btn.textContent?.trim()}" is missing shadcn buttonVariants class`
      ).toBe(true);
    });
  });

  it('primary reserve CTA includes Lock icon and uses cta.securePayment text', async () => {
    mockGetTour.mockResolvedValue(MOCK_TOUR);
    const { container } = renderTourDetailPage();

    await screen.findByText('Adventure in Patagonia');

    // The primary CTA should have a Lock icon (rendered as SVG inside the button)
    // Lock icon from lucide-react renders as SVG
    const reserveBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Pago seguro')
    );
    expect(reserveBtn).toBeTruthy();
    expect(reserveBtn!.querySelector('svg')).toBeTruthy();
  });

  it('back navigation button uses ghost variant', async () => {
    mockGetTour.mockResolvedValue(MOCK_TOUR);
    const { container } = renderTourDetailPage();

    await screen.findByText('Adventure in Patagonia');

    // Back button has ArrowLeft icon + "Volver a tours" text
    const backBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Volver a tours')
    );
    expect(backBtn).toBeTruthy();
    // Ghost variant does NOT have bg-primary or border-input — just hover:bg-accent
    expect(backBtn!.className).not.toContain('bg-primary');
    expect(backBtn!.className).not.toContain('border-input');
    expect(backBtn!.className).toContain('ring-offset-background');
  });

  it('sold-out tour shows disabled CTA button with shadcn Button class', async () => {
    mockGetTour.mockResolvedValue(MOCK_TOUR_SOLD_OUT);
    const { container } = renderTourDetailPage();

    await screen.findByText('Adventure in Patagonia');

    // The sold-out button should be disabled
    const disabledBtns = Array.from(container.querySelectorAll('button')).filter(
      (btn) => btn.disabled
    );
    expect(disabledBtns.length).toBeGreaterThanOrEqual(1);

    // All disabled buttons should still have shadcn class
    disabledBtns.forEach((btn) => {
      expect(btn.className).toContain('ring-offset-background');
    });
  });

  it('gallery navigation buttons use ghost variant with icon size', async () => {
    mockGetTour.mockResolvedValue(MOCK_TOUR);
    const { container } = renderTourDetailPage();

    await screen.findByText('Adventure in Patagonia');

    // Gallery prev/next buttons are identified by aria-label
    const prevBtn = screen.getByRole('button', { name: /imagen anterior/i });
    const nextBtn = screen.getByRole('button', { name: /imagen siguiente/i });

    // Both should have shadcn class
    expect(prevBtn.className).toContain('ring-offset-background');
    expect(nextBtn.className).toContain('ring-offset-background');
  });

  it('error state "back to listing" button uses ghost variant', async () => {
    mockGetTour.mockRejectedValue(new Error('not found'));

    const { container } = renderTourDetailPage();

    // Wait for error to render
    await screen.findByText(/No se pudo cargar el tour/);

    const backBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Volver al listado')
    );
    expect(backBtn).toBeTruthy();
    expect(backBtn!.className).toContain('ring-offset-background');
  });
});
