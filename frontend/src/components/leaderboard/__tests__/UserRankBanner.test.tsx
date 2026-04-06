/**
 * @fileoverview UserRankBanner Component Tests
 * @description Tests for the UserRankBanner sticky footer component:
 *              - Returns null when rank is null
 *              - Returns null when rank <= 10
 *              - Renders banner when rank > 10
 *              - Shows correct rank number in banner
 *              - Shows "Vendedores" label for sellers type
 *              - Shows "Referidos" label for referrers type
 *              - Formats sellers value as USD currency
 *              - Formats referrers value as "referidos"
 * @module components/leaderboard/__tests__/UserRankBanner
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserRankBanner } from '../UserRankBanner';

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('UserRankBanner', () => {
  // ── 1. Null when rank is null ────────────────────────────────────────────────

  it('renders nothing when rank is null', () => {
    const { container } = render(<UserRankBanner rank={null} value={500} type="sellers" />);
    expect(container.firstChild).toBeNull();
  });

  // ── 2. Null when rank <= 10 (top 10 visible in table) ───────────────────────

  it('renders nothing when rank is 1', () => {
    const { container } = render(<UserRankBanner rank={1} value={500} type="sellers" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when rank is exactly 10', () => {
    const { container } = render(<UserRankBanner rank={10} value={100} type="sellers" />);
    expect(container.firstChild).toBeNull();
  });

  // ── 3. Renders when rank > 10 ────────────────────────────────────────────────

  it('renders the banner when rank is 11', () => {
    render(<UserRankBanner rank={11} value={500} type="sellers" />);
    expect(screen.getByText('#11')).toBeInTheDocument();
  });

  it('renders the banner when rank is 99', () => {
    render(<UserRankBanner rank={99} value={200} type="sellers" />);
    expect(screen.getByText('#99')).toBeInTheDocument();
  });

  // ── 4. "Tu posición" label ────────────────────────────────────────────────────

  it('shows "Tu posición" label in the banner', () => {
    render(<UserRankBanner rank={15} value={300} type="sellers" />);
    expect(screen.getByText('Tu posición')).toBeInTheDocument();
  });

  // ── 5. Sellers type labels ───────────────────────────────────────────────────

  it('shows "Vendedores" and "en ventas" for sellers type', () => {
    render(<UserRankBanner rank={20} value={500} type="sellers" />);
    expect(screen.getByText('Vendedores')).toBeInTheDocument();
    expect(screen.getByText('en ventas')).toBeInTheDocument();
  });

  // ── 6. Referrers type labels ─────────────────────────────────────────────────

  it('shows "Referidos" label for referrers type', () => {
    render(<UserRankBanner rank={25} value={7} type="referrers" />);
    expect(screen.getByText('Referidos')).toBeInTheDocument();
  });

  // ── 7. Seller value formatted as USD ────────────────────────────────────────

  it('formats seller value as USD currency string', () => {
    render(<UserRankBanner rank={12} value={1500} type="sellers" />);
    // Intl should format 1500 USD → something with "1.500" or "1,500"
    const el = screen.getByText(/1[.,]500/);
    expect(el).toBeInTheDocument();
  });

  // ── 8. Referrer value formatted as "referidos" ───────────────────────────────

  it('formats referrer value as "{n} referidos"', () => {
    render(<UserRankBanner rank={30} value={5} type="referrers" />);
    expect(screen.getByText('5 referidos')).toBeInTheDocument();
  });
});
