/**
 * @fileoverview Unit tests for CalendarService
 * @description Tests for CalendarService.notifyReservationConfirmed including:
 *              - Calls fetch with correct URL and payload
 *              - Includes X-Internal-Secret header
 *              - Graceful skip when webhookUrl is not set
 *              - Non-blocking behavior when fetch fails
 *              - Logs error when n8n returns non-ok status
 *              Tests para CalendarService.notifyReservationConfirmed incluyendo:
 *              - Llama a fetch con la URL y payload correctos
 *              - Incluye el encabezado X-Internal-Secret
 *              - Omisión sin error cuando webhookUrl no está configurada
 *              - Comportamiento no bloqueante cuando fetch falla
 *              - Registra error cuando n8n retorna estado no-ok
 * @module __tests__/CalendarService
 */

import { CalendarService, CalendarEventPayload } from '../services/CalendarService';

// ============================================
// HELPERS / AYUDANTES
// ============================================

/**
 * Build a minimal valid CalendarEventPayload for testing
 * Construir un CalendarEventPayload válido mínimo para pruebas
 */
const buildPayload = (overrides: Partial<CalendarEventPayload> = {}): CalendarEventPayload => ({
  reservationId: 'res-uuid-001',
  type: 'property',
  guestName: 'Juan Pérez',
  guestEmail: 'juan@example.com',
  guestPhone: '+549111234567',
  title: 'Casa en la playa',
  startDate: '2026-05-01T00:00:00.000Z',
  endDate: '2026-05-07T00:00:00.000Z',
  notes: 'Llegan tarde',
  vendorId: 'vendor-uuid-001',
  ...overrides,
});

// ============================================
// MOCK global.fetch
// ============================================

const mockFetch = jest.fn();

beforeEach(() => {
  jest.resetAllMocks();
  global.fetch = mockFetch;
});

afterEach(() => {
  // Restore original env vars / Restaurar variables de entorno originales
  delete process.env.N8N_CALENDAR_WEBHOOK_URL;
  delete process.env.INTERNAL_WEBHOOK_SECRET;
});

// ============================================
// TESTS
// ============================================

describe('CalendarService', () => {
  describe('notifyReservationConfirmed', () => {
    it('should call fetch with correct URL and payload', async () => {
      // Arrange / Preparar
      process.env.N8N_CALENDAR_WEBHOOK_URL = 'https://n8n.example.com/webhook/calendar-sync';
      process.env.INTERNAL_WEBHOOK_SECRET = 'test-secret-32-chars-xxxxxxxxxx';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const service = new CalendarService();
      const payload = buildPayload();

      // Act / Actuar
      await service.notifyReservationConfirmed(payload);

      // Assert / Afirmar
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://n8n.example.com/webhook/calendar-sync',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
        })
      );
    });

    it('should include X-Internal-Secret header', async () => {
      // Arrange / Preparar
      process.env.N8N_CALENDAR_WEBHOOK_URL = 'https://n8n.example.com/webhook/calendar-sync';
      process.env.INTERNAL_WEBHOOK_SECRET = 'super-secret-value';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const service = new CalendarService();

      // Act / Actuar
      await service.notifyReservationConfirmed(buildPayload());

      // Assert / Afirmar
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Internal-Secret': 'super-secret-value',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should not throw when webhookUrl is not set (graceful skip)', async () => {
      // Arrange — N8N_CALENDAR_WEBHOOK_URL is not set
      // Preparar — N8N_CALENDAR_WEBHOOK_URL no está configurada
      delete process.env.N8N_CALENDAR_WEBHOOK_URL;

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const service = new CalendarService();

      // Act & Assert — should resolve without calling fetch
      // Actuar y Afirmar — debe resolver sin llamar a fetch
      await expect(service.notifyReservationConfirmed(buildPayload())).resolves.toBeUndefined();
      expect(mockFetch).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        '[CalendarService] N8N_CALENDAR_WEBHOOK_URL not set, skipping calendar sync'
      );

      warnSpy.mockRestore();
    });

    it('should not throw when fetch fails (non-blocking)', async () => {
      // Arrange / Preparar
      process.env.N8N_CALENDAR_WEBHOOK_URL = 'https://n8n.example.com/webhook/calendar-sync';
      process.env.INTERNAL_WEBHOOK_SECRET = 'test-secret';

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const service = new CalendarService();

      // Act & Assert — should resolve even when fetch throws
      // Actuar y Afirmar — debe resolver incluso cuando fetch lanza error
      await expect(service.notifyReservationConfirmed(buildPayload())).resolves.toBeUndefined();
      expect(errorSpy).toHaveBeenCalledWith(
        '[CalendarService] Failed to notify n8n webhook:',
        expect.any(Error)
      );

      errorSpy.mockRestore();
    });

    it('should log error when n8n returns non-ok status', async () => {
      // Arrange / Preparar
      process.env.N8N_CALENDAR_WEBHOOK_URL = 'https://n8n.example.com/webhook/calendar-sync';
      process.env.INTERNAL_WEBHOOK_SECRET = 'test-secret';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const service = new CalendarService();

      // Act / Actuar
      await service.notifyReservationConfirmed(buildPayload());

      // Assert — should log error but NOT throw
      // Afirmar — debe registrar error pero NO lanzar
      expect(errorSpy).toHaveBeenCalledWith('[CalendarService] n8n webhook returned 500');

      errorSpy.mockRestore();
    });
  });
});
