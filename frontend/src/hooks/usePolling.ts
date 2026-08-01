/**
 * @fileoverview usePolling — generic polling utility hook
 * @description Calls a callback immediately on mount, then repeats at a fixed interval.
 *              Cleans up the interval on unmount. Reusable across any polling scenario.
 *
 * ES: Hook utilitario de polling genérico. Llama al callback inmediatamente al montar,
 *     luego lo repite a intervalo fijo. Limpia el intervalo al desmontar.
 * EN: Generic polling utility hook. Calls callback immediately on mount,
 *     then repeats at a fixed interval. Cleans up interval on unmount.
 *
 * @module hooks/usePolling
 */

import { useEffect, useRef } from 'react';

/**
 * Options for the usePolling hook.
 * Opciones para el hook usePolling.
 */
export interface UsePollingOptions {
  /** Polling interval in milliseconds / Intervalo de polling en ms */
  intervalMs: number;
  /** Whether polling is enabled (default: true) / Si el polling está habilitado */
  enabled?: boolean;
}

/**
 * Hook that calls a callback on mount and then at a regular interval.
 * The callback reference is tracked via ref so the interval always calls the latest version
 * without needing to restart.
 *
 * ES: Hook que llama un callback al montar y luego a intervalo regular.
 * EN: Generic polling hook — calls callback on mount and then at fixed interval.
 *
 * @param callback - Async or sync function to call on each tick / Función a llamar en cada tick
 * @param options - Polling configuration ({ intervalMs, enabled? }) / Configuración de polling
 */
export function usePolling(callback: () => void | Promise<void>, options: UsePollingOptions): void;
/**
 * Convenience overload — receives intervalMs directly as a number.
 * Sobrecarga de conveniencia — recibe intervalMs directamente como número.
 *
 * @param callback - Function to call on each tick / Función a ejecutar en cada tick
 * @param intervalMs - Polling interval in milliseconds / Intervalo de polling en ms
 */
export function usePolling(callback: () => void | Promise<void>, intervalMs: number): void;
export function usePolling(
  callback: () => void | Promise<void>,
  optionsOrMs: UsePollingOptions | number
): void {
  const { intervalMs, enabled = true } =
    typeof optionsOrMs === 'number' ? { intervalMs: optionsOrMs } : optionsOrMs;

  const callbackRef = useRef(callback);

  // Keep the ref up-to-date outside render / Mantener la ref actualizada fuera del render
  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (!enabled) return;

    // Immediate call on mount / Llamada inmediata al montar
    callbackRef.current();

    const intervalId = setInterval(() => {
      callbackRef.current();
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [intervalMs, enabled]);
}
