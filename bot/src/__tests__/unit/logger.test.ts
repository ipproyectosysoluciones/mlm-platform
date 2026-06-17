import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../services/logger.js';

describe('logger', () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logger.info', () => {
    it('writes a valid JSON line to stdout', () => {
      logger.info('test.event', { foo: 'bar' });

      expect(stdoutSpy).toHaveBeenCalledOnce();
      const raw = stdoutSpy.mock.calls[0][0] as string;
      const entry = JSON.parse(raw.trim());

      expect(entry.level).toBe('info');
      expect(entry.event).toBe('test.event');
      expect(entry.service).toBe('nexo-bot');
      expect(entry.context).toEqual({ foo: 'bar' });
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('omits context key when no context provided', () => {
      logger.info('test.no-context');
      const raw = stdoutSpy.mock.calls[0][0] as string;
      const entry = JSON.parse(raw.trim());
      expect(entry.context).toBeUndefined();
    });
  });

  describe('logger.warn', () => {
    it('writes to stderr', () => {
      logger.warn('test.warn', { reason: 'test' });
      expect(stderrSpy).toHaveBeenCalledOnce();
      const entry = JSON.parse((stderrSpy.mock.calls[0][0] as string).trim());
      expect(entry.level).toBe('warn');
    });
  });

  describe('logger.error', () => {
    it('always writes to stderr regardless of log level', () => {
      logger.error('test.error', { error: 'boom' });
      expect(stderrSpy).toHaveBeenCalledOnce();
      const entry = JSON.parse((stderrSpy.mock.calls[0][0] as string).trim());
      expect(entry.level).toBe('error');
      expect(entry.event).toBe('test.error');
    });
  });

  describe('logger.alert', () => {
    it('writes to stderr and skips fetch when BOT_ALERT_WEBHOOK_URL is not set', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      delete process.env.BOT_ALERT_WEBHOOK_URL;

      await logger.alert('test.alert', { error: 'critical' });

      expect(stderrSpy).toHaveBeenCalledOnce();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('fires a POST to BOT_ALERT_WEBHOOK_URL when set', async () => {
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(new Response(null, { status: 200 }));
      process.env.BOT_ALERT_WEBHOOK_URL = 'http://slack.test/webhook';

      await logger.alert('test.slack-alert', { error: 'bad thing' });

      expect(stderrSpy).toHaveBeenCalledOnce();
      expect(fetchSpy).toHaveBeenCalledOnce();
      const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://slack.test/webhook');
      expect(options.method).toBe('POST');

      delete process.env.BOT_ALERT_WEBHOOK_URL;
    });

    it('does not throw when the Slack webhook request fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network error'));
      process.env.BOT_ALERT_WEBHOOK_URL = 'http://slack.test/webhook';

      await expect(logger.alert('test.slack-fail', { error: 'uh oh' })).resolves.toBeUndefined();

      delete process.env.BOT_ALERT_WEBHOOK_URL;
    });
  });
});
