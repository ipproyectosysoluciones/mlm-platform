/**
 * @fileoverview PropertiesPage content states tests / Tests de estados de contenido en PropertiesPage
 * @description Validates PropertiesPage uses ListingSkeleton for loading and EmptyState for empty data
 * @module __tests__/pages/PropertiesPage.states.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockGetProperties = vi.fn();
vi.mock('../../services/propertyService', () => ({
  propertyService: {
    getProperties: (...args: unknown[]) => mockGetProperties(...args),
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

import PropertiesPage from '../../pages/PropertiesPage';

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderPropertiesPage() {
  return render(
    <MemoryRouter>
      <PropertiesPage />
    </MemoryRouter>
  );
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('PropertiesPage — Content States (T2.5)', () => {
  beforeEach(() => {
    mockGetProperties.mockReset();
  });

  it('renders ListingSkeleton with article elements during loading', () => {
    // Never resolve — keeps the page in loading state
    mockGetProperties.mockReturnValue(new Promise(() => {}));
    const { container } = renderPropertiesPage();

    // ListingSkeleton renders <article> elements with skeleton data-testid zones
    const articles = container.querySelectorAll('article');
    expect(articles.length).toBeGreaterThanOrEqual(1);

    // Each article should have the skeleton-image testid (from PropertyCardSkeleton)
    const skeletonImages = container.querySelectorAll('[data-testid="skeleton-image"]');
    expect(skeletonImages.length).toBeGreaterThanOrEqual(1);
  });

  it('renders EmptyState with "search" type when properties array is empty', async () => {
    mockGetProperties.mockResolvedValue({
      data: [],
      pagination: { total: 0, page: 1, limit: 12, totalPages: 0 },
    });
    renderPropertiesPage();

    // EmptyState type="search" uses the i18n key tree.search.noResults
    const emptyTitle = await screen.findByText('tree.search.noResults');
    expect(emptyTitle).toBeInTheDocument();
  });
});
