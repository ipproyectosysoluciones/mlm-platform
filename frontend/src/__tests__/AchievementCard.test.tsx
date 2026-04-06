/**
 * @fileoverview AchievementCard Component Tests
 * @description Tests for AchievementCard visual states:
 *              - Renders "Próximamente" badge for coming_soon achievements
 *              - Renders progress bar for locked (active, not yet unlocked) achievements
 *              - Shows unlock date for unlocked achievements
 * @module __tests__/AchievementCard
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AchievementCard } from '../components/achievements/AchievementCard';
import type { AchievementWithProgress } from '../services/achievementService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeAchievement(
  overrides: Partial<AchievementWithProgress> = {}
): AchievementWithProgress {
  return {
    id: 'ach-1',
    key: 'first_sale',
    name: 'Primera Venta',
    description: 'Realiza tu primera venta completada.',
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

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AchievementCard', () => {
  it('renders "Próximamente" badge for status === coming_soon', () => {
    const achievement = makeAchievement({ status: 'coming_soon' });

    render(<AchievementCard achievement={achievement} />);

    expect(screen.getByText(/Próximamente/i)).toBeInTheDocument();
  });

  it('renders progress bar for locked active achievements (not unlocked)', () => {
    const achievement = makeAchievement({
      status: 'active',
      unlockedAt: null,
      progress: 30,
      currentValue: 3,
      targetValue: 10,
    });

    render(<AchievementCard achievement={achievement} />);

    // Progress label and values must be visible
    expect(screen.getByText('Progreso')).toBeInTheDocument();
    expect(screen.getByText('3 / 10')).toBeInTheDocument();
  });

  it('shows unlock date for unlocked achievements', () => {
    // Use a fixed ISO date so the test is deterministic
    const achievement = makeAchievement({
      status: 'active',
      unlockedAt: '2025-01-15T12:00:00.000Z',
      progress: 100,
      currentValue: 1,
      targetValue: 1,
    });

    render(<AchievementCard achievement={achievement} />);

    // Must show a message containing "Desbloqueado"
    expect(screen.getByText(/Desbloqueado/i)).toBeInTheDocument();
  });
});
