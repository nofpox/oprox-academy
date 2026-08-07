import Redis from 'ioredis';
import { logStructured } from './logger';

let redisClient: Redis | null = null;
let isConnected = false;
let connectionError: string | null = null;

const REDIS_URL = process.env.REDIS_URL || (process.env.REDIS_HOST ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}` : null);

if (REDIS_URL) {
  try {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      connectTimeout: 2000,
      retryStrategy(times) {
        if (times > 3) {
          connectionError = 'Max connection retries exceeded';
          return null; // Stop retrying
        }
        return Math.min(times * 100, 1000);
      },
    });

    redisClient.on('connect', () => {
      isConnected = true;
      connectionError = null;
      logStructured('info', 'REDIS_CONNECTED', { url: REDIS_URL.replace(/\/\/.*@/, '//[REDACTED]@') });
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      connectionError = err?.message || 'Redis connection error';
      logStructured('warn', 'REDIS_CONNECTION_ERROR', { error: connectionError });
    });

    redisClient.connect().catch((err) => {
      isConnected = false;
      connectionError = err?.message || 'Failed to connect to Redis';
      logStructured('warn', 'REDIS_CONNECT_FAILED', { error: connectionError });
    });
  } catch (err: any) {
    connectionError = err?.message || 'Failed to initialize Redis client';
    logStructured('warn', 'REDIS_INIT_FAILED', { error: connectionError });
  }
}

export function isRedisConfigured(): boolean {
  return !!REDIS_URL;
}

export function isRedisConnected(): boolean {
  return isConnected && redisClient !== null && redisClient.status === 'ready';
}

export function getRedisStatus(): { status: 'connected' | 'not_configured' | 'unavailable' | 'error'; details: string } {
  if (!REDIS_URL) {
    return {
      status: 'not_configured',
      details: 'Distributed cache/rate limiter not configured (REDIS_URL / REDIS_HOST not set). Local memory fallback active.',
    };
  }

  if (isRedisConnected()) {
    return {
      status: 'connected',
      details: 'Connected to distributed Redis instance.',
    };
  }

  return {
    status: connectionError ? 'error' : 'unavailable',
    details: connectionError || 'Redis client disconnected or unavailable. Local memory fallback active.',
  };
}

// In-memory fallback sliding window for local node rate limiting when Redis is unavailable
const memoryRateStore = new Map<string, { count: number; windowStart: number }>();

export function clearMemoryRateStore(): void {
  memoryRateStore.clear();
}

export async function checkDistributedRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; current: number; limit: number; ttlSeconds: number; redisUsed: boolean }> {
  const fullKey = `ratelimit:${key}`;

  if (isRedisConnected() && redisClient) {
    try {
      const current = await redisClient.incr(fullKey);
      if (current === 1) {
        await redisClient.expire(fullKey, windowSeconds);
      }
      const ttl = await redisClient.ttl(fullKey);
      return {
        allowed: current <= maxRequests,
        current,
        limit: maxRequests,
        ttlSeconds: ttl > 0 ? ttl : windowSeconds,
        redisUsed: true,
      };
    } catch (err: any) {
      logStructured('warn', 'REDIS_RATE_LIMIT_FALLBACK', { error: err?.message || err, key });
    }
  }

  // Fallback to local sliding window
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  let record = memoryRateStore.get(fullKey);

  if (!record || now - record.windowStart > windowMs) {
    record = { count: 1, windowStart: now };
    memoryRateStore.set(fullKey, record);
  } else {
    record.count++;
  }

  const remainingMs = Math.max(0, windowMs - (now - record.windowStart));
  const ttlSeconds = Math.ceil(remainingMs / 1000);

  return {
    allowed: record.count <= maxRequests,
    current: record.count,
    limit: maxRequests,
    ttlSeconds,
    redisUsed: false,
  };
}

export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      isConnected = false;
      logStructured('info', 'REDIS_DISCONNECTED', {});
    } catch {
      // Ignore cleanup error
    }
  }
}
