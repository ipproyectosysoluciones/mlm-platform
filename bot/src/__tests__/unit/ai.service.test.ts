import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock external dependencies BEFORE importing the module under test ─────────

vi.mock('../../services/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    alert: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('openai', () => ({
  default: vi.fn(),
}));

vi.mock('fs', () => ({
  readFileSync: vi.fn().mockReturnValue(''),
}));

vi.mock('../../services/mlm-api.service.js', () => ({
  mlmApi: {
    searchProperties: vi.fn().mockResolvedValue([]),
    searchTours: vi.fn().mockResolvedValue([]),
  },
  BotProperty: {},
  BotTour: {},
}));

// ─── Imports AFTER mocks ───────────────────────────────────────────────────────

import {
  detectAgent,
  getHistory,
  appendToHistory,
  clearHistory,
  withRetry,
} from '../../services/ai.service.js';
import type { ChatMessage, AgentName } from '../../services/ai.service.js';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ai.service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── detectAgent ────────────────────────────────────────────────────────────

  describe('detectAgent', () => {
    it('returns "sophia" for a male name (Carlos)', () => {
      const result: AgentName = detectAgent('Carlos');
      expect(result).toBe('sophia');
    });

    it('returns "max" for a female name (Maria)', () => {
      const result: AgentName = detectAgent('Maria');
      expect(result).toBe('max');
    });

    it('returns "sophia" for an empty string', () => {
      const result: AgentName = detectAgent('');
      expect(result).toBe('sophia');
    });

    it('is case-insensitive — "LAURA" returns "max"', () => {
      expect(detectAgent('LAURA')).toBe('max');
    });

    it('uses only the first token — "Ana Rodriguez" returns "max"', () => {
      expect(detectAgent('Ana Rodriguez')).toBe('max');
    });
  });

  // ─── Conversation history ────────────────────────────────────────────────────

  describe('getHistory / appendToHistory / clearHistory', () => {
    const phone = 'test-phone-999';

    beforeEach(() => {
      clearHistory(phone);
    });

    it('returns an empty array for an unknown phone number', () => {
      const history = getHistory('unknown-phone-000');
      expect(history).toEqual([]);
    });

    it('stores and retrieves messages, then clearHistory removes them', () => {
      const msg: ChatMessage = { role: 'user', content: 'Hola' };
      appendToHistory(phone, msg);

      const history = getHistory(phone);
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(msg);

      clearHistory(phone);
      expect(getHistory(phone)).toEqual([]);
    });

    it('trims history to the last 20 messages when exceeding MAX_HISTORY_MESSAGES', () => {
      // Push 25 messages — only the last 20 should remain
      for (let i = 1; i <= 25; i++) {
        const msg: ChatMessage = { role: 'user', content: `Message ${i}` };
        appendToHistory(phone, msg);
      }

      const history = getHistory(phone);
      expect(history).toHaveLength(20);
      // The first surviving message should be message #6 (25 - 20 + 1)
      expect(history[0].content).toBe('Message 6');
      // The last surviving message should be message #25
      expect(history[history.length - 1].content).toBe('Message 25');
    });
  });

  // ─── withRetry ──────────────────────────────────────────────────────────────

  describe('withRetry', () => {
    it('returns immediately on first success', async () => {
      const fn = vi.fn<() => Promise<string>>().mockResolvedValue('ok');

      const result = await withRetry(fn, 3, 1);

      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on 500 status and succeeds on the second attempt', async () => {
      const serverError = Object.assign(new Error('Internal Server Error'), { status: 500 });
      const fn = vi
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce('recovered');

      const result = await withRetry(fn, 3, 1);

      expect(result).toBe('recovered');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('does NOT retry on a 400 status — throws immediately', async () => {
      const badRequest = Object.assign(new Error('Bad Request'), { status: 400 });
      const fn = vi.fn<() => Promise<string>>().mockRejectedValue(badRequest);

      await expect(withRetry(fn, 3, 1)).rejects.toThrow('Bad Request');
      // Must NOT have retried — only one call
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('does NOT retry on a 401 status — throws immediately', async () => {
      const unauthorized = Object.assign(new Error('Unauthorized'), { status: 401 });
      const fn = vi.fn<() => Promise<string>>().mockRejectedValue(unauthorized);

      await expect(withRetry(fn, 3, 1)).rejects.toThrow('Unauthorized');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('throws the last error after all retries are exhausted', async () => {
      const networkError = new Error('ECONNRESET');
      const fn = vi.fn<() => Promise<string>>().mockRejectedValue(networkError);

      await expect(withRetry(fn, 3, 1)).rejects.toThrow('ECONNRESET');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('retries on a 429 rate-limit status', async () => {
      const rateLimit = Object.assign(new Error('Too Many Requests'), { status: 429 });
      const fn = vi
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(rateLimit)
        .mockResolvedValueOnce('ok after rate limit');

      const result = await withRetry(fn, 3, 1);

      expect(result).toBe('ok after rate limit');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
