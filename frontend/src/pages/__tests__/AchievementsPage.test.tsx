/**
 * @fileoverview AchievementsPage Tests
 * @description Tests for the AchievementsPage:
 *              - Shows loading skeleton while fetching
 *              - Shows error message when service throws
 *              - Retry button re-fetches data
 *              - Shows summary stats card after successful load
 *              - Shows "Desbloqueados" section for unlocked achievements
 *              - Shows "Por desbloquear" section for active locked achievements
 *              - Shows "Próximamente" section for coming_soon achievements
 *              - Shows empty state when achievements list is empty
 *              - Progress bar reflects unlocked/total ratio
 *              - "Actualizar datos" button triggers re-fetch
 * @module pages/__tests__/AchievementsPage
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import type {
  AchievementWithProgress,
  AchievementSummary,
} from '../../services/achievementService';

// ============================================
// MOCKS
// ============================================

vi.mock('../../services/achievementService', () => ({
  achievementService: {
    getAllAchievements: vi.fn(),
    getMySummary: vi.fn(),
  },
}));

// Import AFTER mocks are set up
import AchievementsPage from '../AchievementsPage';
import { achievementService } from '../../services/achievementService';

// ============================================
// FAKE DATA
// ============================================

function makeAchievement(
  overrides: Partial<AchievementWithProgress> = {}
): AchievementWithProgress {
  return {
    id: 'ach-1',
    key: 'first_sale',
    name: 'Primera Venta',
    description: 'Realiza tu primera venta.',
    icon: '🎯',
    points: 100,
    tier: 'bronze',
    status: 'active',
    conditionType: 'sales_count',
    conditionValue: 1,
    unlockedAt: null,
    progress: 0,
    currentValue: 0,
    targetValue: 1,
    ...overrides,
  };
}

const fakeUnlocked: AchievementWithProgress = makeAchievement({
  id: 'ach-u1',
  name: 'Primera Venta',
  unlockedAt: '2025-01-15T12:00:00.000Z',
  progress: 100,
  currentValue: 1,
  targetValue: 1,
});

const fakeLocked: AchievementWithProgress = makeAchievement({
  id: 'ach-l1',
  name: 'Diez Ventas',
  status: 'active',
  unlockedAt: null,
  progress: 30,
  currentValue: 3,
  targetValue: 10,
});

const fakeComingSoon: AchievementWithProgress = makeAchievement({
  id: 'ach-cs1',
  name: 'Super Vendedor',
  status: 'coming_soon',
  unlockedAt: null,
});

const fakeSummary: AchievementSummary = {
  unlocked: 1,
  total: 3,
  totalPoints: 100,
  recent: [fakeUnlocked],
};

// ============================================
// HELPERS
// ============================================

function mockSuccess() {
  (achievementService.getAllAchievements as ReturnType<typeof vi.fn>).mockResolvedValue([
    fakeUnlocked,
    fakeLocked,
    fakeComingSoon,
  ]);
  (achievementService.getMySummary as ReturnType<typeof vi.fn>).mockResolvedValue(fakeSummary);
}

function mockError() {
  const err = new Error('Network error');
  (achievementService.getAllAchievements as ReturnType<typeof vi.fn>).mockRejectedValue(err);
  (achievementService.getMySummary as ReturnType<typeof vi.fn>).mockRejectedValue(err);
}

function mockEmpty() {
  (achievementService.getAllAchievements as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (achievementService.getMySummary as ReturnType<typeof vi.fn>).mockResolvedValue({
    unlocked: 0,
    total: 0,
    totalPoints: 0,
    recent: [],
  });
}

// ============================================
// TESTS
// ============================================

describe('AchievementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. Loading skeleton ─────────────────────────────────────────────────────

  it('shows page heading "🏅 Logros" immediately (before data loads)', () => {
    (achievementService.getAllAchievements as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise(() => {})
    );
    (achievementService.getMySummary as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise(() => {})
    );

    render(<AchievementsPage />);

    expect(screen.getByText('🏅 Logros')).toBeInTheDocument();
    // Content not yet visible
    expect(screen.queryByText('Logros desbloqueados')).not.toBeInTheDocument();
  });

  // ── 2. Error state ──────────────────────────────────────────────────────────

  it('shows error message when service rejects', async () => {
    mockError();
    render(<AchievementsPage />);

    await waitFor(() => {
      expect(screen.getByText(/no se pudieron cargar los logros/i)).toBeInTheDocument();
    });
  });

  it('shows "Reintentar" button in error state', async () => {
    mockError();
    render(<AchievementsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    });
  });

  // ── 3. Retry re-fetches ─────────────────────────────────────────────────────

  it('retry button triggers a new fetch and clears the error', async () => {
    mockError();
    render(<AchievementsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    });

    // Second call succeeds
    mockSuccess();
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));

    await waitFor(() => {
      expect(screen.queryByText(/no se pudieron cargar los logros/i)).not.toBeInTheDocument();
    });
  });

  // ── 4. Summary stats card ───────────────────────────────────────────────────

  it('shows "Logros desbloqueados" and "Puntos totales" stats after load', async () => {
    mockSuccess();
    render(<AchievementsPage />);

    await waitFor(() => {
      expect(screen.getByText('Logros desbloqueados')).toBeInTheDocument();
      expect(screen.getByText('Puntos totales')).toBeInTheDocument();
    });
  });

  it('shows unlocked count and total from summary', async () => {
    mockSuccess();
    render(<AchievementsPage />);

    await waitFor(() => {
      // "/ 3" total — unique enough string in the summary card
      expect(screen.getByText('/ 3')).toBeInTheDocument();
      // 100 points are shown
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  // ── 5. "Desbloqueados" section ──────────────────────────────────────────────

  it('shows "✅ Desbloqueados" section heading with unlocked achievements', async () => {
    mockSuccess();
    render(<AchievementsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Desbloqueados/)).toBeInTheDocument();
    });

    expect(screen.getByText('Primera Venta')).toBeInTheDocument();
  });

  // ── 6. "Por desbloquear" section ────────────────────────────────────────────

  it('shows "🔓 Por desbloquear" section heading with locked active achievements', async () => {
    mockSuccess();
    render(<AchievementsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Por desbloquear/)).toBeInTheDocument();
    });

    expect(screen.getByText('Diez Ventas')).toBeInTheDocument();
  });

  // ── 7. "Próximamente" section ───────────────────────────────────────────────

  it('shows "🔒 Próximamente" section with coming_soon achievements', async () => {
    mockSuccess();
    render(<AchievementsPage />);

    await waitFor(() => {
      // Use the heading role to disambiguate from the badge inside AchievementCard
      const headings = screen.getAllByText(/Próximamente/);
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText('Super Vendedor')).toBeInTheDocument();
  });

  // ── 8. Empty state ──────────────────────────────────────────────────────────

  it('shows empty state message when achievements list is empty', async () => {
    mockEmpty();
    render(<AchievementsPage />);

    await waitFor(() => {
      expect(screen.getByText('No hay logros disponibles')).toBeInTheDocument();
    });
  });

  // ── 9. "Actualizar datos" refresh button ────────────────────────────────────

  it('shows "Actualizar datos" button after load and calls service again on click', async () => {
    mockSuccess();
    render(<AchievementsPage />);

    await waitFor(() => {
      expect(screen.getByText('Actualizar datos')).toBeInTheDocument();
    });

    // Click refresh
    mockSuccess();
    fireEvent.click(screen.getByText('Actualizar datos'));

    // Service called again (total = 2x initial + 2x refresh)
    await waitFor(() => {
      expect(achievementService.getAllAchievements).toHaveBeenCalledTimes(2);
    });
  });

  // ── 10. Progress bar present ────────────────────────────────────────────────

  it('renders the progress percentage text (33% = 1/3)', async () => {
    mockSuccess();
    render(<AchievementsPage />);

    await waitFor(() => {
      // 1/3 unlocked = 33%
      expect(screen.getByText('33% completado')).toBeInTheDocument();
    });
  });
});
