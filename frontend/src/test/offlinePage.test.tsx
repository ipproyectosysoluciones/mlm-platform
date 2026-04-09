/**
 * @fileoverview offlinePage.test — Offline page unit tests
 * @description Tests for the Offline fallback page shown when there's no internet connection.
 *              Cubre: render del contenido, botón Reintentar (reload), botón Volver (history.back).
 *
 * @module test/offlinePage
 * @author Nexo Real Development Team
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Offline from '../pages/Offline';

// ============================================
// Mocks
// ============================================

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
    i18n: { language: 'es' },
  }),
}));

// ============================================
// Test Suite
// ============================================

describe('Offline', () => {
  let reloadSpy: ReturnType<typeof vi.fn>;
  let historyBackSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock window.location.reload
    reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { ...window.location, reload: reloadSpy },
    });

    // Mock window.history.back
    historyBackSpy = vi.fn();
    Object.defineProperty(window, 'history', {
      configurable: true,
      writable: true,
      value: { ...window.history, back: historyBackSpy },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ──────────────────────────────────────────
  // Render / Contenido
  // ──────────────────────────────────────────
  describe('contenido / content', () => {
    it('debe renderizar el título de sin conexión / should render offline title', () => {
      render(<Offline />);
      expect(screen.getByText('Sin conexión a internet')).toBeDefined();
    });

    it('debe renderizar la descripción / should render description', () => {
      render(<Offline />);
      expect(screen.getByText(/parece que perdiste la conexión/i)).toBeDefined();
    });

    it('debe renderizar el hint de verificación / should render verification hint', () => {
      render(<Offline />);
      expect(screen.getByText(/también podés verificar si el wifi está activado/i)).toBeDefined();
    });

    it('debe renderizar el botón "Reintentar" / should render "Reintentar" button', () => {
      render(<Offline />);
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeDefined();
    });

    it('debe renderizar el botón "Volver" / should render "Volver" button', () => {
      render(<Offline />);
      expect(screen.getByRole('button', { name: /volver/i })).toBeDefined();
    });

    it('debe renderizar ambos botones de acción / should render both action buttons', () => {
      render(<Offline />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ──────────────────────────────────────────
  // Botón Reintentar
  // ──────────────────────────────────────────
  describe('botón Reintentar / Retry button', () => {
    it('debe llamar a window.location.reload al hacer click / should call reload on click', () => {
      render(<Offline />);
      const retryBtn = screen.getByRole('button', { name: /reintentar/i });
      fireEvent.click(retryBtn);
      expect(reloadSpy).toHaveBeenCalledTimes(1);
    });

    it('debe llamar a reload cada vez que se clickea / should call reload each click', () => {
      render(<Offline />);
      const retryBtn = screen.getByRole('button', { name: /reintentar/i });
      fireEvent.click(retryBtn);
      fireEvent.click(retryBtn);
      fireEvent.click(retryBtn);
      expect(reloadSpy).toHaveBeenCalledTimes(3);
    });
  });

  // ──────────────────────────────────────────
  // Botón Volver
  // ──────────────────────────────────────────
  describe('botón Volver / Back button', () => {
    it('debe llamar a window.history.back al hacer click / should call history.back on click', () => {
      render(<Offline />);
      const backBtn = screen.getByRole('button', { name: /volver/i });
      fireEvent.click(backBtn);
      expect(historyBackSpy).toHaveBeenCalledTimes(1);
    });

    it('debe llamar a history.back cada vez que se clickea / should call back each click', () => {
      render(<Offline />);
      const backBtn = screen.getByRole('button', { name: /volver/i });
      fireEvent.click(backBtn);
      fireEvent.click(backBtn);
      expect(historyBackSpy).toHaveBeenCalledTimes(2);
    });
  });

  // ──────────────────────────────────────────
  // Accesibilidad / Accessibility
  // ──────────────────────────────────────────
  describe('accesibilidad / accessibility', () => {
    it('debe tener un heading con el título / should have a heading with the title', () => {
      render(<Offline />);
      const heading = screen.getByRole('heading');
      expect(heading.textContent).toContain('Sin conexión a internet');
    });

    it('los botones deben tener texto visible / buttons should have visible text', () => {
      render(<Offline />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn.textContent?.trim().length).toBeGreaterThan(0);
      });
    });
  });

  // ──────────────────────────────────────────
  // Aislamiento / Isolation
  // ──────────────────────────────────────────
  describe('aislamiento / isolation', () => {
    it('Reintentar no debe llamar a history.back / Retry should not call history.back', () => {
      render(<Offline />);
      fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));
      expect(historyBackSpy).not.toHaveBeenCalled();
    });

    it('Volver no debe llamar a location.reload / Back should not call location.reload', () => {
      render(<Offline />);
      fireEvent.click(screen.getByRole('button', { name: /volver/i }));
      expect(reloadSpy).not.toHaveBeenCalled();
    });
  });
});
