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

// Mock ioredis for RedisConversationStore tests
// Uses vi.hoisted to ensure the mock object survives hoisting
const mockRedisInstance = vi.hoisted(() => ({
  get: vi.fn().mockResolvedValue(null),
  setex: vi.fn().mockResolvedValue('OK'),
  del: vi.fn().mockResolvedValue(1),
  quit: vi.fn().mockResolvedValue('OK'),
}));

vi.mock('ioredis', () => {
  // Must return a constructable function for `new Redis(url)`
  function Redis(this: Record<string, unknown>, _url?: string) {
    return mockRedisInstance;
  }
  return { default: Redis, Redis };
});

// ─── Imports AFTER mocks ───────────────────────────────────────────────────────

import {
  detectAgent,
  getHistory,
  appendToHistory,
  clearHistory,
  withRetry,
} from '../../services/ai.service.js';
import type { AgentName } from '../../services/ai.service.js';
import type { ChatMessage } from '../../services/conversation-store.js';
import {
  RedisConversationStore,
  createConversationStore,
  MapConversationStore,
} from '../../services/conversation-store.js';

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

    beforeEach(async () => {
      await clearHistory(phone);
    });

    it('returns an empty array for an unknown phone number', async () => {
      const history = await getHistory('unknown-phone-000');
      expect(history).toEqual([]);
    });

    it('stores and retrieves messages, then clearHistory removes them', async () => {
      const msg: ChatMessage = { role: 'user', content: 'Hola' };
      await appendToHistory(phone, msg);

      const history = await getHistory(phone);
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(msg);

      await clearHistory(phone);
      expect(await getHistory(phone)).toEqual([]);
    });

    it('trims history to the last 20 messages when exceeding MAX_HISTORY_MESSAGES', async () => {
      // Push 25 messages — only the last 20 should remain
      for (let i = 1; i <= 25; i++) {
        const msg: ChatMessage = { role: 'user', content: `Message ${i}` };
        await appendToHistory(phone, msg);
      }

      const history = await getHistory(phone);
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

  // ─── RedisConversationStore ──────────────────────────────────────────────────

  describe('RedisConversationStore', () => {
    const phone = 'test-phone-redis-001';

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('stores and retrieves messages via Redis with setex', async () => {
      const store = new RedisConversationStore({
        url: 'redis://test:6379',
        ttl: 86400,
        keyPrefix: 'bot:conversation',
      });
      const msg: ChatMessage = { role: 'user', content: 'Hello Redis' };

      await store.append(phone, msg);

      // Should call setex with key, TTL, and JSON value
      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        `bot:conversation:${phone}`,
        86400,
        JSON.stringify([msg])
      );
    });

    it('retrieves stored messages from Redis', async () => {
      const msg: ChatMessage = { role: 'user', content: 'Hi' };
      mockRedisInstance.get.mockResolvedValueOnce(JSON.stringify([msg]));

      const store = new RedisConversationStore({
        url: 'redis://test:6379',
        ttl: 86400,
        keyPrefix: 'bot:conversation',
      });
      const history = await store.get(phone);

      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(msg);
      expect(mockRedisInstance.get).toHaveBeenCalledWith(`bot:conversation:${phone}`);
    });

    it('returns empty array when Redis key does not exist', async () => {
      mockRedisInstance.get.mockResolvedValueOnce(null);

      const store = new RedisConversationStore({
        url: 'redis://test:6379',
        ttl: 86400,
        keyPrefix: 'bot:conversation',
      });
      const history = await store.get(phone);

      expect(history).toEqual([]);
    });

    it('clears conversation from Redis', async () => {
      const store = new RedisConversationStore({
        url: 'redis://test:6379',
        ttl: 86400,
        keyPrefix: 'bot:conversation',
      });

      await store.clear(phone);

      expect(mockRedisInstance.del).toHaveBeenCalledWith(`bot:conversation:${phone}`);
    });

    it('trims history to maxMessages when exceeding limit', async () => {
      const store = new RedisConversationStore({
        url: 'redis://test:6379',
        ttl: 86400,
        keyPrefix: 'bot:conversation',
      });
      mockRedisInstance.get.mockResolvedValue(null); // start empty

      // Append 5 messages with maxMessages=3
      for (let i = 1; i <= 5; i++) {
        mockRedisInstance.get.mockResolvedValueOnce(
          i === 1
            ? null
            : JSON.stringify(
                Array.from({ length: Math.min(i - 1, 3) }, (_, j) => ({
                  role: 'user' as const,
                  content: `Message ${i - 3 + j}`,
                }))
              )
        );
        await store.append(phone, { role: 'user', content: `Message ${i}` }, 3);
      }

      // The last setex call should contain only 3 messages
      const lastCallArgs = mockRedisInstance.setex.mock.calls.slice(-1)[0];
      const stored = JSON.parse(lastCallArgs[2]) as ChatMessage[];
      expect(stored).toHaveLength(3);
      expect(stored[0].content).toBe('Message 3');
      expect(stored[2].content).toBe('Message 5');
    });
  });

  // ─── createConversationStore factory ──────────────────────────────────────────

  describe('createConversationStore', () => {
    it('returns MapConversationStore when no REDIS_URL is set', () => {
      const store = createConversationStore();
      expect(store).toBeInstanceOf(MapConversationStore);
    });

    it('returns RedisConversationStore when REDIS_URL is provided', () => {
      const store = createConversationStore('redis://test:6379');
      expect(store).toBeInstanceOf(RedisConversationStore);
    });

    it('uses custom TTL and keyPrefix when provided', () => {
      const store = createConversationStore('redis://test:6379', 3600, 'custom:prefix');
      expect(store).toBeInstanceOf(RedisConversationStore);
    });
  });
});
