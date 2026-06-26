/**
 * @fileoverview Conversation store abstraction — Strategy pattern
 * @description Provides an interface for conversation history storage with two
 *              implementations: Redis-backed (with TTL) and in-memory Map fallback.
 *              The exported factory function selects the appropriate implementation
 *              based on the REDIS_URL environment variable.
 */

import { Redis } from 'ioredis';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const MAX_HISTORY_MESSAGES = 20;

// ─── ConversationStore Interface ─────────────────────────────────────────────

/**
 * Strategy interface for conversation history storage.
 * Return types use union types to allow both sync (Map) and async (Redis) implementations.
 */
export interface ConversationStore {
  get(phone: string): ChatMessage[] | Promise<ChatMessage[]>;
  append(phone: string, message: ChatMessage, maxMessages?: number): void | Promise<void>;
  clear(phone: string): void | Promise<void>;
}

// ─── MapConversationStore (in-memory fallback) ────────────────────────────────

/**
 * In-memory Map-based conversation store.
 * Behaves identically to the original implementation — no persistence across restarts.
 */
export class MapConversationStore implements ConversationStore {
  private store = new Map<string, ChatMessage[]>();

  get(phone: string): ChatMessage[] {
    return this.store.get(phone) || [];
  }

  append(phone: string, message: ChatMessage, maxMessages = MAX_HISTORY_MESSAGES): void {
    const history = this.store.get(phone) || [];
    history.push(message);
    if (history.length > maxMessages) {
      history.splice(0, history.length - maxMessages);
    }
    this.store.set(phone, history);
  }

  clear(phone: string): void {
    this.store.delete(phone);
  }
}

// ─── Redis Conversation Store ─────────────────────────────────────────────────

export interface RedisConfig {
  url: string;
  ttl: number;
  keyPrefix: string;
}

/**
 * Redis-backed conversation store.
 * Keys follow the pattern: `bot:conversation:{phone}`
 * Each key has a TTL of 24h (configurable) that resets on every append.
 * Serialization uses JSON.stringify / JSON.parse.
 *
 * Usage: new RedisConversationStore({ url: REDIS_URL, ttl: 86400, keyPrefix: 'bot:conversation' })
 */
export class RedisConversationStore implements ConversationStore {
  private redis: Redis;
  private ttl: number;
  private keyPrefix: string;

  constructor(config: RedisConfig) {
    this.redis = new Redis(config.url);
    this.ttl = config.ttl;
    this.keyPrefix = config.keyPrefix;
  }

  private key(phone: string): string {
    return `${this.keyPrefix}:${phone}`;
  }

  async get(phone: string): Promise<ChatMessage[]> {
    const raw = await this.redis.get(this.key(phone));
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  }

  async append(
    phone: string,
    message: ChatMessage,
    maxMessages = MAX_HISTORY_MESSAGES
  ): Promise<void> {
    const history = await this.get(phone);
    history.push(message);
    if (history.length > maxMessages) {
      history.splice(0, history.length - maxMessages);
    }
    await this.redis.setex(this.key(phone), this.ttl, JSON.stringify(history));
  }

  async clear(phone: string): Promise<void> {
    await this.redis.del(this.key(phone));
  }

  /** Gracefully close the Redis connection. Call during shutdown. */
  async quit(): Promise<void> {
    await this.redis.quit();
  }

  /** Expose the underlying Redis instance for advanced use / testing */
  get client(): Redis {
    return this.redis;
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates a ConversationStore based on the REDIS_URL environment variable.
 *
 * - If REDIS_URL is set and non-empty → returns a RedisConversationStore
 * - Otherwise → returns a MapConversationStore (in-memory, no persistence)
 *
 * @param redisUrl - Redis connection URL (defaults to process.env.REDIS_URL)
 * @param ttl - Key TTL in seconds (default: 86400 = 24h)
 * @param keyPrefix - Redis key prefix (default: 'bot:conversation')
 */
export function createConversationStore(
  redisUrl?: string,
  ttl = 86400,
  keyPrefix = 'bot:conversation'
): ConversationStore {
  const url = redisUrl ?? process.env.REDIS_URL;
  if (url) {
    return new RedisConversationStore({ url, ttl, keyPrefix });
  }
  return new MapConversationStore();
}
