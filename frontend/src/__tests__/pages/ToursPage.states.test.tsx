/**
 * @fileoverview ToursPage content states tests / Tests de estados de contenido en ToursPage
 * @description Validates ToursPage uses ListingSkeleton for loading and EmptyState for empty data
 * @module __tests__/pages/ToursPage.states.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockGetTours = vi.fn();
vi.mock('../../services/tourService', () => ({
  tourService: {
    getTours: (...args: unknown[]) => mockGetTours(...args),
  },
}));

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="helmet">{children}</div>
  ),
}));

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

// ── Tests ───────────────────────────────────────────────────────────────────

describe('ToursPage — Content States (T2.5)', () => {
  beforeEach(() => {
    mockGetTours.mockReset();
  });

  it('renders ListingSkeleton with article elements during loading', () => {
    // Never resolve — keeps the page in loading state
    mockGetTours.mockReturnValue(new Promise(() => {}));
    const { container } = renderToursPage();

    // ListingSkeleton renders <article> elements with skeleton data-testid zones
    const articles = container.querySelectorAll('article');
    expect(articles.length).toBeGreaterThanOrEqual(1);

    // Each article should have the skeleton-image testid (from TourCardSkeleton)
    const skeletonImages = container.querySelectorAll('[data-testid="skeleton-image"]');
    expect(skeletonImages.length).toBeGreaterThanOrEqual(1);
  });

  it('renders EmptyState with "search" type when tours array is empty', async () => {
    mockGetTours.mockResolvedValue({
      data: [],
      pagination: { total: 0, page: 1, limit: 12, totalPages: 0 },
    });
    renderToursPage();

    // EmptyState type="search" uses the i18n key tree.search.noResults
    // The mockT returns the raw key: 'tree.search.noResults'
    const emptyTitle = await screen.findByText('tree.search.noResults');
    expect(emptyTitle).toBeInTheDocument();
  });
});
