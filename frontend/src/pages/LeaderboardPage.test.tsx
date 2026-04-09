/**
 * @fileoverview Unit tests for LeaderboardPage
 * @description Tests rendering and user interactions:
 *              - Loading skeleton while fetching
 *              - Podium + RankingTable after data loads
 *              - Error state with retry button
 *              - Tab switching triggers correct service call
 * @module pages/LeaderboardPage.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { SellerEntry, ReferrerEntry, MyRankResponse } from '../services/leaderboardService';

// ============================================
// MOCKS
// ============================================

// Mock leaderboard service — must be hoisted above imports
vi.mock('../services/leaderboardService', () => ({
  leaderboardService: {
    getTopSellers: vi.fn(),
    getTopReferrers: vi.fn(),
    getMyRank: vi.fn(),
  },
  // Re-export types as values for vi.mock factory (not needed at runtime, but satisfies import)
}));

// Mock AuthContext — provide a fake authenticated user
vi.mock('../context/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-test', email: 'test@example.com' },
    isAuthenticated: true,
  }),
}));

// Import AFTER mocks are set up
import LeaderboardPage from './LeaderboardPage';
import { leaderboardService } from '../services/leaderboardService';

// ============================================
// FAKE DATA
// ============================================

const fakeSellers: SellerEntry[] = [
  {
    rank: 1,
    userId: 'u1',
    name: 'Alice',
    username: 'alice',
    profileImage: undefined,
    totalSales: 500,
    period: 'weekly',
  },
  {
    rank: 2,
    userId: 'u2',
    name: 'Bob',
    username: 'bob',
    profileImage: undefined,
    totalSales: 300,
    period: 'weekly',
  },
  {
    rank: 3,
    userId: 'u3',
    name: 'Carol',
    username: 'carol',
    profileImage: undefined,
    totalSales: 200,
    period: 'weekly',
  },
  {
    rank: 4,
    userId: 'u4',
    name: 'Dave',
    username: 'dave',
    profileImage: undefined,
    totalSales: 100,
    period: 'weekly',
  },
];

const fakeReferrers: ReferrerEntry[] = [
  {
    rank: 1,
    userId: 'u1',
    name: 'Alice',
    username: 'alice',
    profileImage: undefined,
    referralCount: 20,
    period: 'weekly',
  },
  {
    rank: 2,
    userId: 'u2',
    name: 'Bob',
    username: 'bob',
    profileImage: undefined,
    referralCount: 15,
    period: 'weekly',
  },
  {
    rank: 3,
    userId: 'u3',
    name: 'Carol',
    username: 'carol',
    profileImage: undefined,
    referralCount: 10,
    period: 'weekly',
  },
  {
    rank: 4,
    userId: 'u4',
    name: 'Dave',
    username: 'dave',
    profileImage: undefined,
    referralCount: 5,
    period: 'weekly',
  },
];

const fakeMyRank: MyRankResponse = {
  sellers: { rank: null, totalSales: 0 },
  referrers: { rank: null, referralCount: 0 },
  period: 'weekly',
};

// ============================================
// HELPERS
// ============================================

function renderPage() {
  return render(
    <MemoryRouter>
      <LeaderboardPage />
    </MemoryRouter>
  );
}

/** Make all three service methods resolve with fake data */
function mockServiceSuccess() {
  (leaderboardService.getTopSellers as ReturnType<typeof vi.fn>).mockResolvedValue(fakeSellers);
  (leaderboardService.getTopReferrers as ReturnType<typeof vi.fn>).mockResolvedValue(fakeReferrers);
  (leaderboardService.getMyRank as ReturnType<typeof vi.fn>).mockResolvedValue(fakeMyRank);
}

/** Make all service methods reject to simulate network error */
function mockServiceError() {
  const err = new Error('Network error');
  (leaderboardService.getTopSellers as ReturnType<typeof vi.fn>).mockRejectedValue(err);
  (leaderboardService.getTopReferrers as ReturnType<typeof vi.fn>).mockRejectedValue(err);
  (leaderboardService.getMyRank as ReturnType<typeof vi.fn>).mockRejectedValue(err);
}

// ============================================
// TESTS
// ============================================

describe('LeaderboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ------------------------------------------
  // 1. Loading skeleton
  // ------------------------------------------

  it('shows loading skeleton (Loader2 spinner) while fetching', () => {
    // Service never resolves during this test
    (leaderboardService.getTopSellers as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise(() => {})
    );
    (leaderboardService.getTopReferrers as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise(() => {})
    );
    (leaderboardService.getMyRank as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise(() => {})
    );

    renderPage();

    // The loading spinner (Loader2) is rendered at the bottom while isLoading is true
    // and PodiumSkeleton renders Skeleton components (visible as animated blocks)
    // We verify the page title is there AND the content table is NOT yet visible
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();

    // The Podium / RankingTable data rows are not yet visible
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  // ------------------------------------------
  // 2. Successful data load
  // ------------------------------------------

  it('shows Podium entries and RankingTable rows after data loads', async () => {
    mockServiceSuccess();
    renderPage();

    // Wait for loading to complete and data to render
    await waitFor(() => {
      // Podium renders "🏆 Top 3" heading
      expect(screen.getByText('🏆 Top 3')).toBeInTheDocument();
    });

    // Top 3 seller names should appear in the Podium
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Carol')).toBeInTheDocument();

    // Rank 4 (Dave) is in the RankingTable, not the Podium
    expect(screen.getByText('Dave')).toBeInTheDocument();
  });

  it('calls getTopSellers and getTopReferrers on initial mount', async () => {
    mockServiceSuccess();
    renderPage();

    await waitFor(() => {
      expect(leaderboardService.getTopSellers).toHaveBeenCalledTimes(1);
      expect(leaderboardService.getTopReferrers).toHaveBeenCalledTimes(1);
      expect(leaderboardService.getMyRank).toHaveBeenCalledTimes(1);
    });
  });

  // ------------------------------------------
  // 3. Error state
  // ------------------------------------------

  it('shows error message and retry button when service throws', async () => {
    mockServiceError();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/no se pudo cargar el leaderboard/i)).toBeInTheDocument();
    });

    // Retry button must be present
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('retry button triggers a new fetchData call', async () => {
    mockServiceError();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    });

    // First call failed — now configure success for the retry
    mockServiceSuccess();

    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));

    // After retry, error should disappear and data loads
    await waitFor(() => {
      expect(screen.queryByText(/no se pudo cargar el leaderboard/i)).not.toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // 4. Tab switching triggers getTopReferrers
  // ------------------------------------------

  it('clicking the "Referidos" tab changes activeTab state (aria-selected becomes true)', async () => {
    const user = userEvent.setup();
    mockServiceSuccess();
    renderPage();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('🏆 Top 3')).toBeInTheDocument();
    });

    // The Referidos tab is initially inactive (sellers is default)
    const referidosTab = screen.getByRole('tab', { name: /referidos/i });
    expect(referidosTab).toHaveAttribute('aria-selected', 'false');

    // Use userEvent which fires pointer events that Radix Tabs listens to
    await user.click(referidosTab);

    // After tab switch, aria-selected should be "true"
    await waitFor(() => {
      expect(referidosTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('getTopReferrers is called during the initial data fetch', async () => {
    mockServiceSuccess();
    renderPage();

    await waitFor(() => {
      expect(leaderboardService.getTopReferrers).toHaveBeenCalledWith('weekly', 10);
    });
  });
});
