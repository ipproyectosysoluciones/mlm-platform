/**
 * @fileoverview PropertyCardSkeleton tests / Tests del esqueleto de PropertyCard
 * @description Validates PropertyCardSkeleton mirrors PropertyCard layout structure
 *              with Skeleton primitives (image, title, location, specs, price+cta)
 * @module __tests__/components/skeletons/PropertyCardSkeleton.test
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PropertyCardSkeleton } from '../../../components/ui/skeletons/PropertyCardSkeleton';

describe('PropertyCardSkeleton (T2.3)', () => {
  it('renders an article element matching PropertyCard outer structure', () => {
    render(<PropertyCardSkeleton />);

    const article = screen.getByRole('article');
    expect(article).toBeInTheDocument();
  });

  it('renders skeleton zones for image, title, location, specs, and price areas', () => {
    const { container } = render(<PropertyCardSkeleton />);

    // Image skeleton
    const imageSkeleton = container.querySelector('[data-testid="skeleton-image"]');
    expect(imageSkeleton).toBeInTheDocument();

    // Title skeleton
    const titleSkeleton = container.querySelector('[data-testid="skeleton-title"]');
    expect(titleSkeleton).toBeInTheDocument();

    // Location skeleton
    const locationSkeleton = container.querySelector('[data-testid="skeleton-location"]');
    expect(locationSkeleton).toBeInTheDocument();

    // Specs row skeleton (bedrooms, bathrooms, area for properties)
    const specsSkeleton = container.querySelector('[data-testid="skeleton-specs"]');
    expect(specsSkeleton).toBeInTheDocument();

    // Price skeleton
    const priceSkeleton = container.querySelector('[data-testid="skeleton-price"]');
    expect(priceSkeleton).toBeInTheDocument();
  });

  it('accepts and applies className prop', () => {
    render(<PropertyCardSkeleton className="custom-class" />);

    const article = screen.getByRole('article');
    expect(article.className).toContain('custom-class');
  });
});
