/**
 * @fileoverview PropertyDetailPage button migration tests / Tests de migración de botones en PropertyDetailPage
 * @description Validates all raw <button> elements are replaced with shadcn <Button>,
 *              and primary CTA includes Lock icon.
 *              Verifica que todos los <button> crudos se reemplazaron con <Button> de shadcn,
 *              y CTA principal incluye ícono Lock.
 * @module __tests__/pages/PropertyDetailPage.buttons.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockGetProperty = vi.fn();
vi.mock('../../services/propertyService', () => ({
  propertyService: {
    getProperty: (...args: unknown[]) => mockGetProperty(...args),
  },
}));

const mockStartPropertyReservation = vi.fn();
vi.mock('../../stores/reservationStore', () => ({
  useReservationStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ startPropertyReservation: mockStartPropertyReservation }),
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

import PropertyDetailPage from '../../pages/PropertyDetailPage';

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderPropertyDetailPage() {
  return render(
    <MemoryRouter initialEntries={['/propiedades/prop-1']}>
      <Routes>
        <Route path="/propiedades/:id" element={<PropertyDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

const MOCK_PROPERTY_RENTAL = {
  id: 'prop-1',
  title: 'Modern Apartment Palermo',
  address: 'Av. Libertador 1234',
  city: 'Buenos Aires',
  country: 'AR',
  price: 1500,
  currency: 'USD',
  type: 'rental' as const,
  description: 'A stunning apartment with city views.',
  images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
  bedrooms: 2,
  bathrooms: 1,
  areaM2: 85,
  amenities: ['Pool', 'Gym', 'Parking'],
  status: 'active' as const,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

const MOCK_PROPERTY_SALE = {
  ...MOCK_PROPERTY_RENTAL,
  id: 'prop-2',
  title: 'Villa in Mendoza',
  type: 'sale' as const,
  price: 350000,
};

// ── Tests ───────────────────────────────────────────────────────────────────

describe('PropertyDetailPage — Button migration (T1.5)', () => {
  beforeEach(() => {
    mockGetProperty.mockReset();
    mockStartPropertyReservation.mockReset();
  });

  it('renders NO raw <button> elements — all buttons use shadcn Button component', async () => {
    mockGetProperty.mockResolvedValue(MOCK_PROPERTY_RENTAL);
    const { container } = renderPropertyDetailPage();

    await screen.findByText('Modern Apartment Palermo');

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

  it('primary CTA includes Lock icon and uses cta.securePayment text', async () => {
    mockGetProperty.mockResolvedValue(MOCK_PROPERTY_RENTAL);
    const { container } = renderPropertyDetailPage();

    await screen.findByText('Modern Apartment Palermo');

    // The primary CTA should include cta.securePayment text and a Lock SVG icon
    const ctaBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Pago seguro')
    );
    expect(ctaBtn).toBeTruthy();
    expect(ctaBtn!.querySelector('svg')).toBeTruthy();
  });

  it('back navigation button uses ghost variant', async () => {
    mockGetProperty.mockResolvedValue(MOCK_PROPERTY_RENTAL);
    const { container } = renderPropertyDetailPage();

    await screen.findByText('Modern Apartment Palermo');

    const backBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Volver a propiedades')
    );
    expect(backBtn).toBeTruthy();
    // Ghost variant: no bg-primary, no border-input
    expect(backBtn!.className).not.toContain('bg-primary');
    expect(backBtn!.className).not.toContain('border-input');
    expect(backBtn!.className).toContain('ring-offset-background');
  });

  it('gallery navigation buttons use shadcn Button classes', async () => {
    mockGetProperty.mockResolvedValue(MOCK_PROPERTY_RENTAL);
    const { container } = renderPropertyDetailPage();

    await screen.findByText('Modern Apartment Palermo');

    const prevBtn = screen.getByRole('button', { name: /imagen anterior/i });
    const nextBtn = screen.getByRole('button', { name: /imagen siguiente/i });

    expect(prevBtn.className).toContain('ring-offset-background');
    expect(nextBtn.className).toContain('ring-offset-background');
  });

  it('error state "back to listing" button uses shadcn Button', async () => {
    mockGetProperty.mockRejectedValue(new Error('not found'));

    const { container } = renderPropertyDetailPage();

    await screen.findByText(/No se pudo cargar la propiedad/);

    const backBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Volver al listado')
    );
    expect(backBtn).toBeTruthy();
    expect(backBtn!.className).toContain('ring-offset-background');
  });

  it('sale property CTA also includes Lock icon', async () => {
    mockGetProperty.mockResolvedValue(MOCK_PROPERTY_SALE);
    const { container } = renderPropertyDetailPage();

    await screen.findByText('Villa in Mendoza');

    const ctaBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Pago seguro')
    );
    expect(ctaBtn).toBeTruthy();
    expect(ctaBtn!.querySelector('svg')).toBeTruthy();
  });
});
