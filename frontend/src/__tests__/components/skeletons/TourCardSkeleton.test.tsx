/**
 * @fileoverview TourCardSkeleton tests / Tests del esqueleto de TourCard
 * @description Validates TourCardSkeleton mirrors TourCard layout structure
 *              with Skeleton primitives (image, title, location, specs, price+cta)
 * @module __tests__/components/skeletons/TourCardSkeleton.test
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TourCardSkeleton } from '../../../components/ui/skeletons/TourCardSkeleton';

describe('TourCardSkeleton (T2.3)', () => {
  it('renders an article element matching TourCard outer structure', () => {
    render(<TourCardSkeleton />);

    const article = screen.getByRole('article');
    expect(article).toBeInTheDocument();
  });

  it('renders skeleton zones for image, title, location, specs, and price areas', () => {
    const { container } = render(<TourCardSkeleton />);

    // The image skeleton should have h-52 matching the real card image container
    const imageSkeleton = container.querySelector('[data-testid="skeleton-image"]');
    expect(imageSkeleton).toBeInTheDocument();

    // Title skeleton
    const titleSkeleton = container.querySelector('[data-testid="skeleton-title"]');
    expect(titleSkeleton).toBeInTheDocument();

    // Location skeleton
    const locationSkeleton = container.querySelector('[data-testid="skeleton-location"]');
    expect(locationSkeleton).toBeInTheDocument();

    // Specs row skeleton (duration + capacity for tours)
    const specsSkeleton = container.querySelector('[data-testid="skeleton-specs"]');
    expect(specsSkeleton).toBeInTheDocument();

    // Price skeleton
    const priceSkeleton = container.querySelector('[data-testid="skeleton-price"]');
    expect(priceSkeleton).toBeInTheDocument();
  });

  it('accepts and applies className prop', () => {
    render(<TourCardSkeleton className="my-custom-class" />);

    const article = screen.getByRole('article');
    expect(article.className).toContain('my-custom-class');
  });
});
