import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Hono } from 'hono';
import { rateLimit } from '../middleware/rateLimit';

const getRedisClientMock = vi.hoisted(() => vi.fn());

vi.mock('../services/redisClient', () => ({
  getRedisClient: getRedisClientMock,
}));

type FakeRedis = {
  status: 'ready' | string;
  incr: (key: string) => Promise<number>;
  pexpire: (key: string, ms: number) => Promise<number>;
};

function createApp(limit: number) {
  const app = new Hono();
  app.use(
    '*',
    rateLimit({
      windowMs: 10_000,
      limit,
      prefix: 'test',
    }),
  );
  app.get('/', (c) => c.json({ ok: true }));
  return app;
}

describe('rateLimit middleware', () => {
  beforeEach(() => {
    getRedisClientMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('enforces limits using Redis when available', async () => {
    const counters: Record<string, number> = {};
    const redis: FakeRedis = {
      status: 'ready',
      incr: async (key) => {
        counters[key] = (counters[key] ?? 0) + 1;
        return counters[key];
      },
      pexpire: async () => 1,
    };

    getRedisClientMock.mockReturnValue(redis);

    const app = createApp(2);

    const first = await app.request('http://test/');
    expect(first.status).toBe(200);

    const second = await app.request('http://test/');
    expect(second.status).toBe(200);

    const third = await app.request('http://test/');
    expect(third.status).toBe(429);
    const body = await third.json();
    expect(body).toMatchObject({ success: false });
  });

  it('falls back to in-memory limiting when Redis is unavailable', async () => {
    getRedisClientMock.mockReturnValue(null);

    const app = createApp(1);

    const first = await app.request('http://test/');
    expect(first.status).toBe(200);

    const second = await app.request('http://test/');
    expect(second.status).toBe(429);
  });
});
