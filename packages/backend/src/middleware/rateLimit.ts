import type { MiddlewareHandler } from 'hono';
import { getRedisClient } from '../services/redisClient';
import { logger } from '../utils/logger';

type RateLimitOptions = {
  windowMs: number;
  limit: number;
  prefix?: string;
  keyGenerator?: (context: Parameters<MiddlewareHandler>[0]) => string;
  onLimitReached?: (context: Parameters<MiddlewareHandler>[0]) => void;
};

type Entry = {
  count: number;
  expiresAt: number;
};

const memoryBuckets = new Map<string, Entry>();

export function rateLimit(options: RateLimitOptions): MiddlewareHandler {
  const { windowMs, limit, keyGenerator, onLimitReached } = options;
  const prefix = options.prefix ?? 'rl';

  return async (c, next) => {
    const redis = getRedisClient();
    const keyId = keyGenerator?.(c) ?? getDefaultKey(c);
    const redisKey = `${prefix}:${keyId}`;

    if (redis && redis.status === 'ready') {
      try {
        const count = await redis.incr(redisKey);
        if (count === 1) {
          await redis.pexpire(redisKey, windowMs);
        }

        if (count > limit) {
          onLimitReached?.(c);
          return c.json({ success: false, error: 'Too many requests' }, 429);
        }

        return next();
      } catch (error) {
        logger.warn('rate_limit.redis_fallback', {
          key: redisKey,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const now = Date.now();
    const entryKey = redisKey;
    const entry = memoryBuckets.get(entryKey);

    if (!entry || entry.expiresAt <= now) {
      memoryBuckets.set(entryKey, { count: 1, expiresAt: now + windowMs });
      return next();
    }

    if (entry.count >= limit) {
      onLimitReached?.(c);
      return c.json({ success: false, error: 'Too many requests' }, 429);
    }

    entry.count += 1;
    return next();
  };
}

function getDefaultKey(c: Parameters<MiddlewareHandler>[0]): string {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip');
  return ip ?? c.req.header('user-agent') ?? 'anonymous';
}
