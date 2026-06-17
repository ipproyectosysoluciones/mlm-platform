/**
 * @fileoverview PropertiesPage button migration tests / Tests de migración de botones en PropertiesPage
 * @description Validates all raw <button> elements are replaced with shadcn <Button>
 *              Verifica que todos los <button> crudos se reemplazaron con <Button> de shadcn
 * @module __tests__/pages/PropertiesPage.buttons.test
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

const MOCK_PROPERTIES = [
  {
    id: 'prop-1',
    title: 'Test Property Alpha',
    address: 'Av. Libertador 1234',
    city: 'Buenos Aires',
    price: '250000',
    currency: 'USD',
    type: 'sale',
    bedrooms: 3,
    bathrooms: 2,
    areaM2: 120,
    images: ['https://example.com/img.jpg'],
  },
  {
    id: 'prop-2',
    title: 'Test Property Beta',
    address: 'Calle San Martín 567',
    city: 'Córdoba',
    price: '1500',
    currency: 'USD',
    type: 'rental',
    bedrooms: 2,
    bathrooms: 1,
    areaM2: 80,
    images: [],
  },
];

const MOCK_RESPONSE = {
  data: MOCK_PROPERTIES,
  pagination: { total: 2, page: 1, limit: 12, totalPages: 1 },
};

const MOCK_PAGINATED_RESPONSE = {
  data: MOCK_PROPERTIES,
  pagination: { total: 30, page: 1, limit: 12, totalPages: 3 },
};

// ── Tests ───────────────────────────────────────────────────────────────────

describe('PropertiesPage — Button migration (T1.4)', () => {
  beforeEach(() => {
    mockGetProperties.mockReset();
  });

  it('renders NO raw <button> elements — all buttons use shadcn Button component', async () => {
    mockGetProperties.mockResolvedValue(MOCK_PAGINATED_RESPONSE);
    const { container } = renderPropertiesPage();

    await screen.findByText('Test Property Alpha');

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
    mockGetProperties.mockResolvedValue(MOCK_RESPONSE);
    const { container } = renderPropertiesPage();

    await screen.findByText('Test Property Alpha');

    const filterBtn = container.querySelector('form button[type="submit"]');
    expect(filterBtn).not.toBeNull();
    expect(filterBtn!.className).toContain('bg-primary');
  });

  it('pagination buttons use outline variant (secondary action)', async () => {
    mockGetProperties.mockResolvedValue(MOCK_PAGINATED_RESPONSE);
    renderPropertiesPage();

    await screen.findByText('Test Property Alpha');

    const prevBtn = screen.getByRole('button', { name: /anterior/i });
    const nextBtn = screen.getByRole('button', { name: /siguiente/i });

    expect(prevBtn.className).toContain('border');
    expect(nextBtn.className).toContain('border');
  });

  it('"Book Now" CTA on property card uses default variant with sm size', async () => {
    mockGetProperties.mockResolvedValue(MOCK_RESPONSE);
    const { container } = renderPropertiesPage();

    await screen.findByText('Test Property Alpha');

    const bookBtns = Array.from(container.querySelectorAll('button')).filter((btn) =>
      btn.textContent?.includes('catalog.bookNow')
    );
    expect(bookBtns.length).toBeGreaterThanOrEqual(1);
    bookBtns.forEach((btn) => {
      expect(btn.className).toContain('h-9');
    });
  });
});
