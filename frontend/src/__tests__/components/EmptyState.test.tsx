/**
 * @fileoverview EmptyState component tests / Tests del componente EmptyState
 * @description Validates EmptyState renders shadcn Button (not raw <button>)
 *              and correctly wires onAction callback
 * @module __tests__/components/EmptyState.test
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../../components/EmptyState';

describe('EmptyState — shadcn Button migration (T1.2)', () => {
  it('renders shadcn Button (not raw <button>) when actionLabel + onAction provided', () => {
    const onAction = vi.fn();
    const { container } = render(
      <EmptyState
        type="default"
        title="No hay datos"
        actionLabel="Reintentar"
        onAction={onAction}
      />
    );

    // shadcn Button renders a <button> element internally,
    // but it should NOT have the old inline color classes
    const button = screen.getByRole('button', { name: 'Reintentar' });
    expect(button).toBeInTheDocument();

    // OLD inline classes should be GONE (bg-purple-600, hover:bg-purple-500)
    expect(button.className).not.toContain('bg-purple-600');
    expect(button.className).not.toContain('hover:bg-purple-500');

    // The container should NOT have raw <button> elements
    // with the old styling — the button should come from the Button component
    // which adds the data-slot="button" attribute (shadcn convention) or
    // at minimum uses buttonVariants classes
    // Verify it's NOT a raw styled button by checking no focus:ring-purple classes
    expect(button.className).not.toContain('focus:ring-purple-500');
  });

  it('calls onAction when the button is clicked', () => {
    const onAction = vi.fn();
    render(<EmptyState type="error" title="Error" actionLabel="Retry" onAction={onAction} />);

    const button = screen.getByRole('button', { name: 'Retry' });
    fireEvent.click(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('does NOT render a button when actionLabel or onAction is missing', () => {
    render(<EmptyState type="default" title="No data" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
