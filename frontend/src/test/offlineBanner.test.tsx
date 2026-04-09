/**
 * @fileoverview offlineBanner.test — OfflineBanner component unit tests
 * @description Tests for the offline banner that reacts to online/offline window events.
 *              Cubre: render inicial, eventos online/offline, dismiss, auto-hide tras reconexión.
 *
 * @module test/offlineBanner
 * @author Nexo Real Development Team
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import OfflineBanner from '../components/OfflineBanner';

// ============================================
// Helpers
// ============================================

/** Simula el estado de conexión del navegador. */
const setNavigatorOnline = (online: boolean) => {
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    get: () => online,
  });
};

/** Dispara un evento online/offline en el window. */
const dispatchConnectionEvent = (type: 'online' | 'offline') => {
  window.dispatchEvent(new Event(type));
};

// ============================================
// Test Suite
// ============================================

describe('OfflineBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Default: online
    setNavigatorOnline(true);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  // ──────────────────────────────────────────
  // Render inicial
  // ──────────────────────────────────────────
  describe('render inicial / initial render', () => {
    it('no debe renderizar el banner cuando está online / should not render when online', () => {
      setNavigatorOnline(true);
      render(<OfflineBanner />);

      expect(screen.queryByRole('button', { name: /cerrar/i })).toBeNull();
      expect(screen.queryByText(/sin conexión/i)).toBeNull();
    });

    it('debe renderizar el banner cuando está offline / should render when offline', () => {
      setNavigatorOnline(false);
      render(<OfflineBanner />);

      expect(screen.getByText(/sin conexión a internet/i)).toBeDefined();
    });

    it('debe mostrar el botón de cerrar cuando está offline / should show dismiss button when offline', () => {
      setNavigatorOnline(false);
      render(<OfflineBanner />);

      expect(screen.getByRole('button', { name: /cerrar/i })).toBeDefined();
    });
  });

  // ──────────────────────────────────────────
  // Evento offline
  // ──────────────────────────────────────────
  describe('evento offline / offline event', () => {
    it('debe mostrar el banner al perder conexión / should show banner on connection loss', async () => {
      setNavigatorOnline(true);
      render(<OfflineBanner />);

      // Confirm not visible
      expect(screen.queryByText(/sin conexión/i)).toBeNull();

      // Trigger offline
      act(() => {
        setNavigatorOnline(false);
        dispatchConnectionEvent('offline');
      });

      expect(screen.getByText(/sin conexión a internet/i)).toBeDefined();
    });

    it('debe mostrar el mensaje correcto en modo offline / should show correct offline message', () => {
      setNavigatorOnline(false);
      render(<OfflineBanner />);

      expect(
        screen.getByText(/sin conexión a internet\. algunas funciones pueden no estar disponibles/i)
      ).toBeDefined();
    });
  });

  // ──────────────────────────────────────────
  // Evento online
  // ──────────────────────────────────────────
  describe('evento online / online event', () => {
    it('debe mostrar "Conexión restaurada" al reconectarse / should show reconnection message', async () => {
      setNavigatorOnline(false);
      render(<OfflineBanner />);

      // Go offline first (already rendered)
      expect(screen.getByText(/sin conexión/i)).toBeDefined();

      // Come back online
      act(() => {
        setNavigatorOnline(true);
        dispatchConnectionEvent('online');
      });

      expect(screen.getByText(/conexión restaurada/i)).toBeDefined();
    });

    it('debe ocultar el banner 3 segundos después de reconectarse / should hide banner 3s after reconnect', () => {
      setNavigatorOnline(false);
      render(<OfflineBanner />);

      act(() => {
        setNavigatorOnline(true);
        dispatchConnectionEvent('online');
      });

      // Still visible before 3s
      expect(screen.getByText(/conexión restaurada/i)).toBeDefined();

      // Advance 3 seconds — synchronous act to flush state updates
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Banner should be gone
      expect(screen.queryByText(/conexión restaurada/i)).toBeNull();
    });

    it('no debe ocultar el banner antes de los 3 segundos / should not hide before 3s', () => {
      setNavigatorOnline(false);
      render(<OfflineBanner />);

      act(() => {
        setNavigatorOnline(true);
        dispatchConnectionEvent('online');
      });

      act(() => {
        vi.advanceTimersByTime(2999);
      });

      // Still visible
      expect(screen.getByText(/conexión restaurada/i)).toBeDefined();
    });
  });

  // ──────────────────────────────────────────
  // Dismiss / Cerrar
  // ──────────────────────────────────────────
  describe('botón cerrar / dismiss button', () => {
    it('debe ocultar el banner al hacer click en cerrar / should hide on dismiss click', () => {
      setNavigatorOnline(false);
      render(<OfflineBanner />);

      const dismissBtn = screen.getByRole('button', { name: /cerrar/i });

      act(() => {
        fireEvent.click(dismissBtn);
      });

      expect(screen.queryByText(/sin conexión/i)).toBeNull();
    });

    it('no debe re-aparecer si se hace dismiss / should not reappear after dismiss', () => {
      setNavigatorOnline(false);
      render(<OfflineBanner />);

      const dismissBtn = screen.getByRole('button', { name: /cerrar/i });
      fireEvent.click(dismissBtn);

      expect(screen.queryByText(/sin conexión/i)).toBeNull();
    });
  });

  // ──────────────────────────────────────────
  // Ciclo completo / Full cycle
  // ──────────────────────────────────────────
  describe('ciclo completo / full cycle', () => {
    it('offline → online → auto-ocultar / offline → online → auto-hide', () => {
      setNavigatorOnline(true);
      render(<OfflineBanner />);

      // 1. Go offline
      act(() => {
        setNavigatorOnline(false);
        dispatchConnectionEvent('offline');
      });
      expect(screen.getByText(/sin conexión/i)).toBeDefined();

      // 2. Come back online
      act(() => {
        setNavigatorOnline(true);
        dispatchConnectionEvent('online');
      });
      expect(screen.getByText(/conexión restaurada/i)).toBeDefined();

      // 3. Auto-hide after 3s
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.queryByText(/conexión restaurada/i)).toBeNull();
    });

    it('debe cancelar el timeout de auto-hide si se vuelve offline / should cancel auto-hide if going offline again', () => {
      setNavigatorOnline(false);
      render(<OfflineBanner />);

      // Come back online → start 3s timer
      act(() => {
        setNavigatorOnline(true);
        dispatchConnectionEvent('online');
      });

      // Go offline again before 3s — timer should be cancelled
      act(() => {
        vi.advanceTimersByTime(1500);
        setNavigatorOnline(false);
        dispatchConnectionEvent('offline');
      });

      // Should now show offline message (not "restored")
      expect(screen.getByText(/sin conexión/i)).toBeDefined();

      // Advance past original 3s — should NOT auto-hide now
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText(/sin conexión/i)).toBeDefined();
    });
  });

  // ──────────────────────────────────────────
  // Cleanup / Desmontaje
  // ──────────────────────────────────────────
  describe('desmontaje / unmount cleanup', () => {
    it('debe limpiar los event listeners al desmontar / should remove listeners on unmount', () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      const removeSpy = vi.spyOn(window, 'removeEventListener');

      setNavigatorOnline(false);
      const { unmount } = render(<OfflineBanner />);
      unmount();

      // Should have removed online + offline listeners
      const removedEvents = removeSpy.mock.calls.map(([ev]) => ev);
      expect(removedEvents).toContain('online');
      expect(removedEvents).toContain('offline');

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });
});
