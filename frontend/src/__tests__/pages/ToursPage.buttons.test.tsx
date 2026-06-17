/**
 * @fileoverview ToursPage button migration tests / Tests de migración de botones en ToursPage
 * @description Validates all raw <button> elements are replaced with shadcn <Button>
 *              Verifica que todos los <button> crudos se reemplazaron con <Button> de shadcn
 * @module __tests__/pages/ToursPage.buttons.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mocks ───────────────────────────────────────────────────────────────────

// Mock tourService to return test data
const mockGetTours = vi.fn();
vi.mock('../../services/tourService', () => ({
  tourService: {
    getTours: (...args: unknown[]) => mockGetTours(...args),
  },
}));

// Mock react-helmet-async
vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="helmet">{children}</div>
  ),
}));

// Mock app config
vi.mock('../../config/app.config', () => ({
  APP_URL: 'http://test.nexo.real',
}));

import ToursPage from '../../pages/ToursPage';

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderToursPage() {
  return render(
    <MemoryRouter>
      <ToursPage />
    </MemoryRouter>
  );
}

const MOCK_TOURS = [
  {
    id: 'tour-1',
    title: 'Test Tour Alpha',
    destination: 'Buenos Aires',
    durationDays: 3,
    maxCapacity: 10,
    price: '1500',
    currency: 'USD',
    type: 'adventure',
    images: ['https://example.com/img.jpg'],
    availabilities: [{ availableSpots: 8 }],
  },
  {
    id: 'tour-2',
    title: 'Test Tour Beta',
    destination: 'Mendoza',
    durationDays: 5,
    maxCapacity: 6,
    price: '2500',
    currency: 'USD',
    type: 'cultural',
    images: [],
    availabilities: [{ availableSpots: 0 }],
  },
];

const MOCK_RESPONSE = {
  data: MOCK_TOURS,
  pagination: { total: 2, page: 1, limit: 12, totalPages: 1 },
};

const MOCK_PAGINATED_RESPONSE = {
  data: MOCK_TOURS,
  pagination: { total: 30, page: 1, limit: 12, totalPages: 3 },
};

// ── Tests ───────────────────────────────────────────────────────────────────

describe('ToursPage — Button migration (T1.4)', () => {
  beforeEach(() => {
    mockGetTours.mockReset();
  });

  it('renders NO raw <button> elements — all buttons use shadcn Button component', async () => {
    mockGetTours.mockResolvedValue(MOCK_PAGINATED_RESPONSE);
    const { container } = renderToursPage();

    // Wait for tours to load
    await screen.findByText('Test Tour Alpha');

    // Every <button> in the DOM should have the shadcn base class from buttonVariants
    const allButtons = container.querySelectorAll('button');
    const shadcnBaseFragment = 'ring-offset-background';

    allButtons.forEach((btn) => {
      expect(
        btn.className.includes(shadcnBaseFragment),
        `Button "${btn.textContent?.trim()}" is missing shadcn buttonVariants class`
      ).toBe(true);
    });
  });

  it('filter button uses default variant (primary action)', async () => {
    mockGetTours.mockResolvedValue(MOCK_RESPONSE);
    const { container } = renderToursPage();

    await screen.findByText('Test Tour Alpha');

    // The filter submit button should have bg-primary (default variant)
    const filterBtn = container.querySelector('form button[type="submit"]');
    expect(filterBtn).not.toBeNull();
    expect(filterBtn!.className).toContain('bg-primary');
  });

  it('pagination buttons use outline variant (secondary action)', async () => {
    mockGetTours.mockResolvedValue(MOCK_PAGINATED_RESPONSE);
    const { container } = renderToursPage();

    await screen.findByText('Test Tour Alpha');

    // Find pagination buttons by text
    const prevBtn = screen.getByRole('button', { name: /anterior/i });
    const nextBtn = screen.getByRole('button', { name: /siguiente/i });

    // Outline variant has border-input
    expect(prevBtn.className).toContain('border');
    expect(nextBtn.className).toContain('border');
  });

  it('sold out tour card CTA is disabled with outline variant', async () => {
    mockGetTours.mockResolvedValue(MOCK_RESPONSE);
    renderToursPage();

    await screen.findByText('Test Tour Alpha');

    // tour-2 has 0 available spots — its CTA should be disabled
    const disabledButtons = screen.getAllByRole('button').filter((btn) => btn.disabled);
    expect(disabledButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('"Book Now" CTA on available tour card uses default variant with sm size', async () => {
    mockGetTours.mockResolvedValue(MOCK_RESPONSE);
    const { container } = renderToursPage();

    await screen.findByText('Test Tour Alpha');

    // catalog.bookNow key returns 'catalog.bookNow' (mockT returns the key when not mapped)
    // The button should exist and have shadcn classes
    const bookBtns = Array.from(container.querySelectorAll('button')).filter((btn) =>
      btn.textContent?.includes('catalog.bookNow')
    );
    expect(bookBtns.length).toBeGreaterThanOrEqual(1);
    // Should use size="sm" → h-9 class
    bookBtns.forEach((btn) => {
      expect(btn.className).toContain('h-9');
    });
  });
});
