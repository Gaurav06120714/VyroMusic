import { env } from '../config/env.js';
import Redis from 'ioredis';

let _client: Redis | null = null;

/**
 * Returns the shared ioredis client singleton.
 * Configured for rate-limiting use: fail fast on errors, no offline queuing.
 */
export function getRedis(): Redis {
  if (!_client) {
    _client = new Redis(env.REDIS_URL, {
      // Don't queue commands when Redis is unavailable — fail fast so
      // slidingWindowCheck() catches the error and fails open.
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 3_000,
    });

    _client.on('error', (err) => {
      console.error('[redis] Connection error:', err.message);
    });

    _client.on('connect', () => {
      console.log('[redis] Connected');
    });
  }
  return _client;
}

export async function closeRedis(): Promise<void> {
  if (_client) {
    await _client.quit();
    _client = null;
  }
}
