import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock logger before importing the service so it doesn't write to stderr
vi.mock('../../services/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    alert: vi.fn().mockResolvedValue(undefined),
  },
}));

import { triggerScheduleVisit, triggerHumanHandoff } from '../../services/n8n.service.js';
import type { ScheduleVisitPayload, HumanHandoffPayload } from '../../services/n8n.service.js';

const SCHEDULE_PAYLOAD: ScheduleVisitPayload = {
  phone: '5491122334455',
  name: 'Juan Test',
  preferredDate: 'martes 15 a las 10am',
  interest: 'departamento en Palermo',
  language: 'es',
};

const HANDOFF_PAYLOAD: HumanHandoffPayload = {
  phone: '5491122334455',
  name: 'Juan Test',
  reason: 'quiere hablar con un asesor',
  agent: 'sophia',
  language: 'es',
  escalatedAt: new Date().toISOString(),
};

describe('n8n.service', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('triggerScheduleVisit', () => {
    it('returns success:true on HTTP 200', async () => {
      fetchSpy.mockResolvedValue(new Response('ok', { status: 200 }));

      const result = await triggerScheduleVisit(SCHEDULE_PAYLOAD);

      expect(result.success).toBe(true);
      expect(fetchSpy).toHaveBeenCalledOnce();
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toContain('schedule-visit');
    });

    it('returns success:false with error code on HTTP 4xx', async () => {
      fetchSpy.mockResolvedValue(new Response('Not found', { status: 404 }));

      const result = await triggerScheduleVisit(SCHEDULE_PAYLOAD);

      expect(result.success).toBe(false);
      expect(result.error).toBe('HTTP 404');
    });

    it('returns success:false with "timeout" on AbortError', async () => {
      fetchSpy.mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' }));

      const result = await triggerScheduleVisit(SCHEDULE_PAYLOAD);

      expect(result.success).toBe(false);
      expect(result.error).toBe('timeout');
    });

    it('returns success:false with error message on network failure', async () => {
      fetchSpy.mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await triggerScheduleVisit(SCHEDULE_PAYLOAD);

      expect(result.success).toBe(false);
      expect(result.error).toBe('ECONNREFUSED');
    });

    it('sends the payload as JSON body', async () => {
      fetchSpy.mockResolvedValue(new Response('ok', { status: 200 }));

      await triggerScheduleVisit(SCHEDULE_PAYLOAD);

      const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(options.method).toBe('POST');
      expect(options.headers).toMatchObject({ 'Content-Type': 'application/json' });
      expect(JSON.parse(options.body as string)).toMatchObject(SCHEDULE_PAYLOAD);
    });
  });

  describe('triggerHumanHandoff', () => {
    it('returns success:true on HTTP 200', async () => {
      fetchSpy.mockResolvedValue(new Response('ok', { status: 200 }));

      const result = await triggerHumanHandoff(HANDOFF_PAYLOAD);

      expect(result.success).toBe(true);
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toContain('human-handoff');
    });

    it('returns success:false on HTTP 500', async () => {
      fetchSpy.mockResolvedValue(new Response('Server error', { status: 500 }));

      const result = await triggerHumanHandoff(HANDOFF_PAYLOAD);

      expect(result.success).toBe(false);
      expect(result.error).toBe('HTTP 500');
    });
  });
});
