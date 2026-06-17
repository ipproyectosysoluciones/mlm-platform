/**
 * @fileoverview CartRecoveryNotif Sonner migration tests / Tests de migración a Sonner
 * @description Validates showCartRecoveryToast calls Sonner's toast() with correct args
 *              Verifica que showCartRecoveryToast llama a toast() de Sonner correctamente
 * @module __tests__/components/CartRecoveryNotif.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted runs BEFORE vi.mock hoisting — safe reference for factory
const { mockToast } = vi.hoisted(() => ({
  mockToast: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: mockToast,
}));

// Import AFTER mocking
import { showCartRecoveryToast } from '../../components/Cart/CartRecoveryNotif';

describe('CartRecoveryNotif — Sonner migration (T1.3)', () => {
  beforeEach(() => {
    mockToast.mockClear();
  });

  it('calls toast() with title, description, and resume action', () => {
    const onResume = vi.fn();
    const onDismiss = vi.fn();

    showCartRecoveryToast({
      itemCount: 3,
      totalAmount: 150.5,
      onResume,
      onDismiss,
    });

    expect(mockToast).toHaveBeenCalledTimes(1);

    const [title, options] = mockToast.mock.calls[0];
    expect(typeof title).toBe('string');
    expect(title.length).toBeGreaterThan(0);

    // Must have a description containing item count
    expect(options.description).toContain('3');

    // Must have an action button
    expect(options.action).toBeDefined();
    expect(options.action.label).toBeDefined();
    expect(typeof options.action.onClick).toBe('function');

    // Clicking the action should call onResume
    options.action.onClick();
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it('calls toast() with singular "item" for count=1', () => {
    const onResume = vi.fn();
    const onDismiss = vi.fn();

    showCartRecoveryToast({
      itemCount: 1,
      totalAmount: 49.99,
      onResume,
      onDismiss,
    });

    expect(mockToast).toHaveBeenCalledTimes(1);
    const [, options] = mockToast.mock.calls[0];
    expect(options.description).toContain('1');
    // Should say "item" not "items" for singular
    expect(options.description).toContain('item');
    expect(options.description).not.toContain('items');
  });

  it('passes onDismiss callback to the toast', () => {
    const onResume = vi.fn();
    const onDismiss = vi.fn();

    showCartRecoveryToast({
      itemCount: 2,
      totalAmount: 100,
      onResume,
      onDismiss,
    });

    const [, options] = mockToast.mock.calls[0];
    expect(options.onDismiss).toBe(onDismiss);
  });
});
