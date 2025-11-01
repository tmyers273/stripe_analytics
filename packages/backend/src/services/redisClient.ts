import Redis from 'ioredis';
import { getConfig } from '../config';
import { logger } from '../utils/logger';

let client: Redis | null | undefined;

export function getRedisClient(): Redis | null {
  if (client !== undefined) {
    return client;
  }

  const { REDIS_URL } = getConfig();

  if (!REDIS_URL) {
    client = null;
    return client;
  }

  try {
    client = new Redis(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });

    client.on('error', (error) => {
      logger.warn('redis.error', { error: error.message });
    });

    void client.connect().catch((error) => {
      logger.error('redis.connect_failed', { error: error.message });
      client = null;
    });

    return client;
  } catch (error) {
    logger.error('redis.init_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    client = null;
    return client;
  }
}
