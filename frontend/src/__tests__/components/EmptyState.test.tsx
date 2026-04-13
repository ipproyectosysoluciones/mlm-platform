/**
 * @fileoverview EmptyState component tests / Tests del componente EmptyState
 * @description Validates EmptyState renders shadcn Button (not raw <button>),
 *              wires onAction callback, supports new types (cart, reservation, order),
 *              and supports actionHref with Link navigation
 * @module __tests__/components/EmptyState.test
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState';

/* ─────────────────── Phase 1 Tests (T1.2 — existing) ─────────────────── */

describe('EmptyState — shadcn Button migration (T1.2)', () => {
  it('renders shadcn Button (not raw <button>) when actionLabel + onAction provided', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        type="default"
        title="No hay datos"
        actionLabel="Reintentar"
        onAction={onAction}
      />
    );

    const button = screen.getByRole('button', { name: 'Reintentar' });
    expect(button).toBeInTheDocument();

    // OLD inline classes should be GONE
    expect(button.className).not.toContain('bg-purple-600');
    expect(button.className).not.toContain('hover:bg-purple-500');
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

/* ─────────────────── Phase 2 Tests (T2.2 — new types) ─────────────────── */

describe('EmptyState — new types: cart, reservation, order (T2.2)', () => {
  it('renders cart type with shopping cart icon and i18n defaults', () => {
    render(<EmptyState type="cart" />);

    // Should render the i18n default title for cart
    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
    expect(
      screen.getByText('Explorá tours y propiedades disponibles para comenzar.')
    ).toBeInTheDocument();
  });

  it('renders reservation type with calendar icon and i18n defaults', () => {
    render(<EmptyState type="reservation" />);

    expect(screen.getByText('No tenés reservas todavía')).toBeInTheDocument();
    expect(
      screen.getByText('Explorá propiedades y tours disponibles para hacer tu primera reserva.')
    ).toBeInTheDocument();
  });

  it('renders order type with receipt icon and i18n defaults', () => {
    render(<EmptyState type="order" />);

    expect(screen.getByText('No tenés órdenes todavía')).toBeInTheDocument();
    expect(
      screen.getByText('Tus compras aparecerán aquí cuando realices tu primera orden.')
    ).toBeInTheDocument();
  });

  it('allows custom title/description to override i18n defaults for new types', () => {
    render(<EmptyState type="cart" title="Custom Title" description="Custom Desc" />);

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Desc')).toBeInTheDocument();
    // The default cart title should NOT appear
    expect(screen.queryByText('Tu carrito está vacío')).not.toBeInTheDocument();
  });
});

/* ─────────────────── Phase 2 Tests (T2.2 — actionHref) ─────────────────── */

describe('EmptyState — actionHref navigation (T2.2)', () => {
  it('renders a link (not button callback) when actionHref is provided', () => {
    render(
      <MemoryRouter>
        <EmptyState type="cart" actionLabel="Explorar tours" actionHref="/tours" />
      </MemoryRouter>
    );

    // Should render a link element navigating to /tours
    const link = screen.getByRole('link', { name: 'Explorar tours' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/tours');
  });

  it('renders onAction button (not link) when onAction is provided without actionHref', () => {
    const onAction = vi.fn();
    render(<EmptyState type="reservation" actionLabel="Buscar" onAction={onAction} />);

    // Should be a button, NOT a link
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('prefers actionHref over onAction when both are provided', () => {
    const onAction = vi.fn();
    render(
      <MemoryRouter>
        <EmptyState type="order" actionLabel="Ver tienda" actionHref="/tours" onAction={onAction} />
      </MemoryRouter>
    );

    // actionHref takes precedence — renders a link, not a button
    const link = screen.getByRole('link', { name: 'Ver tienda' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/tours');
  });

  it('does NOT render action when only actionHref is present without actionLabel', () => {
    render(
      <MemoryRouter>
        <EmptyState type="cart" actionHref="/tours" />
      </MemoryRouter>
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
