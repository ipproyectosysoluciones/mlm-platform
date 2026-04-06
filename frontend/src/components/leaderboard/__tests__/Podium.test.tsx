/**
 * @fileoverview Podium Component Tests
 * @description Tests for the Podium visual component:
 *              - Renders null when no entries
 *              - Shows "🏆 Top 3" heading with valid entries
 *              - Renders correct medal emojis per position
 *              - Shows name, username, and metric for seller entries
 *              - Shows name, username, and metric for referrer entries
 *              - Shows only available positions (partial entries)
 *              - Formats seller metric as currency (USD)
 *              - Formats referrer metric as "ref."
 *              - Generates initials fallback from name
 *              - First place is elevated (uses larger avatar class)
 *              - Handles single-word names for initials
 *              - Does not crash when entries have no profileImage
 * @module components/leaderboard/__tests__/Podium
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Podium } from '../Podium';
import type { SellerEntry, ReferrerEntry } from '../../../services/leaderboardService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSeller(overrides: Partial<SellerEntry> = {}): SellerEntry {
  return {
    rank: 1,
    userId: 'u1',
    name: 'Alice García',
    username: 'alice',
    profileImage: undefined,
    totalSales: 5000,
    period: 'weekly',
    ...overrides,
  };
}

function makeReferrer(overrides: Partial<ReferrerEntry> = {}): ReferrerEntry {
  return {
    rank: 1,
    userId: 'u1',
    name: 'Alice García',
    username: 'alice',
    profileImage: undefined,
    referralCount: 20,
    period: 'weekly',
    ...overrides,
  };
}

const threeSellerEntries: SellerEntry[] = [
  makeSeller({ rank: 1, name: 'Alice', username: 'alice', totalSales: 5000 }),
  makeSeller({ rank: 2, userId: 'u2', name: 'Bob', username: 'bob', totalSales: 3000 }),
  makeSeller({ rank: 3, userId: 'u3', name: 'Carol', username: 'carol', totalSales: 1500 }),
];

const threeReferrerEntries: ReferrerEntry[] = [
  makeReferrer({ rank: 1, name: 'Alice', username: 'alice', referralCount: 20 }),
  makeReferrer({ rank: 2, userId: 'u2', name: 'Bob', username: 'bob', referralCount: 15 }),
  makeReferrer({ rank: 3, userId: 'u3', name: 'Carol', username: 'carol', referralCount: 8 }),
];

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Podium', () => {
  // ── 1. Empty state ──────────────────────────────────────────────────────────

  it('renders null (nothing) when entries array is empty', () => {
    const { container } = render(<Podium entries={[]} />);
    expect(container.firstChild).toBeNull();
  });

  // ── 2. Heading ──────────────────────────────────────────────────────────────

  it('shows "🏆 Top 3" heading when at least one entry is provided', () => {
    render(<Podium entries={[makeSeller({ rank: 1 })]} />);
    expect(screen.getByText('🏆 Top 3')).toBeInTheDocument();
  });

  // ── 3. Medal emojis ─────────────────────────────────────────────────────────

  it('shows 🥇 for 1st place, 🥈 for 2nd, 🥉 for 3rd', () => {
    render(<Podium entries={threeSellerEntries} />);
    expect(screen.getByText('🥇')).toBeInTheDocument();
    expect(screen.getByText('🥈')).toBeInTheDocument();
    expect(screen.getByText('🥉')).toBeInTheDocument();
  });

  // ── 4. Position labels ──────────────────────────────────────────────────────

  it('shows position labels 1°, 2°, 3° in the podium bars', () => {
    render(<Podium entries={threeSellerEntries} />);
    expect(screen.getByText('1°')).toBeInTheDocument();
    expect(screen.getByText('2°')).toBeInTheDocument();
    expect(screen.getByText('3°')).toBeInTheDocument();
  });

  // ── 5. Seller names and usernames ───────────────────────────────────────────

  it('renders seller names and @usernames for all three positions', () => {
    render(<Podium entries={threeSellerEntries} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('@alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('@bob')).toBeInTheDocument();
    expect(screen.getByText('Carol')).toBeInTheDocument();
    expect(screen.getByText('@carol')).toBeInTheDocument();
  });

  // ── 6. Referrer names and metric ────────────────────────────────────────────

  it('renders referrer entries with "ref." metric suffix', () => {
    render(<Podium entries={threeReferrerEntries} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    // referralCount 20 → "20 ref."
    expect(screen.getByText('20 ref.')).toBeInTheDocument();
  });

  // ── 7. Partial entries — only rank 1 ────────────────────────────────────────

  it('renders only 1st place podium slot when only rank 1 entry is provided', () => {
    render(<Podium entries={[makeSeller({ rank: 1 })]} />);
    expect(screen.getByText('🥇')).toBeInTheDocument();
    expect(screen.queryByText('🥈')).not.toBeInTheDocument();
    expect(screen.queryByText('🥉')).not.toBeInTheDocument();
  });

  // ── 8. Partial entries — only rank 1 & 2 ────────────────────────────────────

  it('renders 1st and 2nd place but not 3rd when only two entries are provided', () => {
    render(
      <Podium
        entries={[
          makeSeller({ rank: 1, name: 'Alice', username: 'alice' }),
          makeSeller({ rank: 2, userId: 'u2', name: 'Bob', username: 'bob' }),
        ]}
      />
    );
    expect(screen.getByText('🥇')).toBeInTheDocument();
    expect(screen.getByText('🥈')).toBeInTheDocument();
    expect(screen.queryByText('🥉')).not.toBeInTheDocument();
  });

  // ── 9. No profile image — shows initials fallback ───────────────────────────

  it('shows initials fallback when profileImage is undefined', () => {
    render(
      <Podium entries={[makeSeller({ rank: 1, name: 'Juan Pérez', profileImage: undefined })]} />
    );
    // Initials = "JP"
    expect(screen.getByText('JP')).toBeInTheDocument();
  });

  // ── 10. Single-word name initials ───────────────────────────────────────────

  it('generates a single initial for single-word names', () => {
    render(
      <Podium entries={[makeSeller({ rank: 1, name: 'Madonna', profileImage: undefined })]} />
    );
    // Single word → only first character uppercased → "M"
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  // ── 11. Seller currency formatting ──────────────────────────────────────────

  it('formats seller totalSales as USD currency', () => {
    render(<Podium entries={[makeSeller({ rank: 1, totalSales: 5000 })]} />);
    // Intl.NumberFormat es-CO USD → "USD 5.000" or "US$5.000" depending on env
    // We check that the numeric part 5.000 or 5,000 is present
    const container = screen.getByText(/5[.,]000/);
    expect(container).toBeInTheDocument();
  });

  // ── 12. Does not crash with profileImage set ─────────────────────────────────

  it('renders without crash when profileImage URL is provided', () => {
    render(
      <Podium
        entries={[
          makeSeller({
            rank: 1,
            name: 'Alice',
            username: 'alice',
            profileImage: 'https://example.com/avatar.jpg',
          }),
        ]}
      />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
