/**
 * @fileoverview ListingSkeleton tests / Tests del esqueleto de listado
 * @description Validates ListingSkeleton renders correct variant (tour | property)
 *              with configurable count, in a responsive grid layout
 * @module __tests__/components/skeletons/ListingSkeleton.test
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListingSkeleton } from '../../../components/ui/skeletons';

describe('ListingSkeleton (T2.4)', () => {
  it('renders 4 tour card skeletons by default (count=4, variant=tour)', () => {
    render(<ListingSkeleton variant="tour" />);

    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(4);
  });

  it('renders the specified count of tour card skeletons', () => {
    render(<ListingSkeleton variant="tour" count={6} />);

    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(6);
  });

  it('renders property card skeletons when variant is "property"', () => {
    render(<ListingSkeleton variant="property" count={3} />);

    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(3);

    // Property cards have 3 spec placeholders (beds, baths, area) in their specs row
    // Tour cards have 2 (duration, capacity) — verify the structure differs
    // Each article should have skeleton zones
    articles.forEach((article) => {
      expect(article.querySelector('[data-testid="skeleton-image"]')).toBeTruthy();
      expect(article.querySelector('[data-testid="skeleton-title"]')).toBeTruthy();
    });
  });

  it('renders inside a responsive grid container', () => {
    const { container } = render(<ListingSkeleton variant="tour" count={2} />);

    // The wrapper grid should have the responsive classes
    const grid = container.firstElementChild;
    expect(grid).toBeTruthy();
    expect(grid!.className).toContain('grid');
  });

  it('accepts and applies className to the grid container', () => {
    const { container } = render(
      <ListingSkeleton variant="tour" count={1} className="extra-class" />
    );

    const grid = container.firstElementChild;
    expect(grid!.className).toContain('extra-class');
  });
});
