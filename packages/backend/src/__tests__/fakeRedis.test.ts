import { describe, it, expect, beforeEach } from 'vitest';
import { FakeRedis, createFakeRedis } from './setup/fakeRedis';

describe('FakeRedis', () => {
  let redis: FakeRedis;

  beforeEach(() => {
    redis = createFakeRedis();
  });

  describe('Basic operations', () => {
    it('should set and get string values', async () => {
      await redis.set('key1', 'value1');
      const value = await redis.get('key1');
      expect(value).toBe('value1');
    });

    it('should return null for non-existent keys', async () => {
      const value = await redis.get('nonexistent');
      expect(value).toBeNull();
    });

    it('should set and get numeric values', async () => {
      await redis.set('counter', 42);
      const value = await redis.get('counter');
      expect(value).toBe('42');
    });

    it('should delete keys', async () => {
      await redis.set('key1', 'value1');
      await redis.set('key2', 'value2');

      const deleted = await redis.del('key1', 'key2');
      expect(deleted).toBe(2);

      const value1 = await redis.get('key1');
      const value2 = await redis.get('key2');
      expect(value1).toBeNull();
      expect(value2).toBeNull();
    });

    it('should check if keys exist', async () => {
      await redis.set('key1', 'value1');
      await redis.set('key2', 'value2');

      const exists = await redis.exists('key1', 'key2', 'key3');
      expect(exists).toBe(2);
    });
  });

  describe('Increment/Decrement operations', () => {
    it('should increment a key', async () => {
      const val1 = await redis.incr('counter');
      expect(val1).toBe(1);

      const val2 = await redis.incr('counter');
      expect(val2).toBe(2);

      const val3 = await redis.incr('counter');
      expect(val3).toBe(3);
    });

    it('should increment by a specific amount', async () => {
      await redis.set('counter', 10);
      const val = await redis.incrby('counter', 5);
      expect(val).toBe(15);
    });

    it('should decrement a key', async () => {
      await redis.set('counter', 10);

      const val1 = await redis.decr('counter');
      expect(val1).toBe(9);

      const val2 = await redis.decr('counter');
      expect(val2).toBe(8);
    });

    it('should decrement by a specific amount', async () => {
      await redis.set('counter', 100);
      const val = await redis.decrby('counter', 30);
      expect(val).toBe(70);
    });
  });

  describe('Expiration', () => {
    it('should set key with expiration using set with EX', async () => {
      await redis.set('temp', 'value', 'EX', 1);
      const value = await redis.get('temp');
      expect(value).toBe('value');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const expiredValue = await redis.get('temp');
      expect(expiredValue).toBeNull();
    });

    it('should set key with expiration using set with PX', async () => {
      await redis.set('temp', 'value', 'PX', 500);
      const value = await redis.get('temp');
      expect(value).toBe('value');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 600));

      const expiredValue = await redis.get('temp');
      expect(expiredValue).toBeNull();
    });

    it('should set key with expiration using setex', async () => {
      await redis.setex('temp', 1, 'value');
      const value = await redis.get('temp');
      expect(value).toBe('value');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const expiredValue = await redis.get('temp');
      expect(expiredValue).toBeNull();
    });

    it('should set expiration on existing key with expire', async () => {
      await redis.set('key', 'value');
      const result = await redis.expire('key', 1);
      expect(result).toBe(1);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const expiredValue = await redis.get('key');
      expect(expiredValue).toBeNull();
    });

    it('should set expiration in milliseconds with pexpire', async () => {
      await redis.set('key', 'value');
      const result = await redis.pexpire('key', 500);
      expect(result).toBe(1);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 600));

      const expiredValue = await redis.get('key');
      expect(expiredValue).toBeNull();
    });

    it('should return 0 when setting expiration on non-existent key', async () => {
      const result = await redis.expire('nonexistent', 10);
      expect(result).toBe(0);
    });

    it('should check TTL', async () => {
      await redis.set('key', 'value');
      const noExpiry = await redis.ttl('key');
      expect(noExpiry).toBe(-1);

      const nonExistent = await redis.ttl('nonexistent');
      expect(nonExistent).toBe(-2);
    });
  });

  describe('Pattern matching', () => {
    it('should find keys matching pattern with *', async () => {
      await redis.set('user:1', 'alice');
      await redis.set('user:2', 'bob');
      await redis.set('user:3', 'charlie');
      await redis.set('post:1', 'hello');

      const userKeys = await redis.keys('user:*');
      expect(userKeys).toHaveLength(3);
      expect(userKeys).toContain('user:1');
      expect(userKeys).toContain('user:2');
      expect(userKeys).toContain('user:3');
    });

    it('should find keys matching pattern with ?', async () => {
      await redis.set('key1', 'val1');
      await redis.set('key2', 'val2');
      await redis.set('key10', 'val10');

      const keys = await redis.keys('key?');
      expect(keys).toHaveLength(2);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });

    it('should return all keys with * pattern', async () => {
      await redis.set('a', '1');
      await redis.set('b', '2');
      await redis.set('c', '3');

      const allKeys = await redis.keys('*');
      expect(allKeys).toHaveLength(3);
    });
  });

  describe('Hash operations', () => {
    it('should set and get hash fields', async () => {
      await redis.hset('user:1', 'name', 'Alice');
      await redis.hset('user:1', 'age', '30');

      const name = await redis.hget('user:1', 'name');
      const age = await redis.hget('user:1', 'age');

      expect(name).toBe('Alice');
      expect(age).toBe('30');
    });

    it('should get all hash fields and values', async () => {
      await redis.hset('user:1', 'name', 'Alice');
      await redis.hset('user:1', 'age', '30');
      await redis.hset('user:1', 'city', 'NYC');

      const hash = await redis.hgetall('user:1');

      expect(hash).toEqual({
        name: 'Alice',
        age: '30',
        city: 'NYC',
      });
    });

    it('should delete hash fields', async () => {
      await redis.hset('user:1', 'name', 'Alice');
      await redis.hset('user:1', 'age', '30');
      await redis.hset('user:1', 'city', 'NYC');

      const deleted = await redis.hdel('user:1', 'age', 'city');
      expect(deleted).toBe(2);

      const hash = await redis.hgetall('user:1');
      expect(hash).toEqual({
        name: 'Alice',
      });
    });

    it('should return null for non-existent hash fields', async () => {
      const value = await redis.hget('nonexistent', 'field');
      expect(value).toBeNull();
    });
  });

  describe('Database operations', () => {
    it('should flush database', async () => {
      await redis.set('key1', 'value1');
      await redis.set('key2', 'value2');
      await redis.set('key3', 'value3');

      const result = await redis.flushdb();
      expect(result).toBe('OK');

      const keys = await redis.keys('*');
      expect(keys).toHaveLength(0);
    });

    it('should flush all databases', async () => {
      await redis.set('key1', 'value1');
      await redis.set('key2', 'value2');

      const result = await redis.flushall();
      expect(result).toBe('OK');

      const keys = await redis.keys('*');
      expect(keys).toHaveLength(0);
    });

    it('should ping the server', async () => {
      const pong = await redis.ping();
      expect(pong).toBe('PONG');
    });

    it('should get server info', async () => {
      const info = await redis.info();
      expect(info).toContain('redis_version');
      expect(info).toContain('FakeRedis');
    });
  });

  describe('Connection management', () => {
    it('should start with ready status', () => {
      expect(redis.status).toBe('ready');
    });

    it('should disconnect', async () => {
      await redis.disconnect();
      expect(redis.status).toBe('disconnected');
    });

    it('should quit', async () => {
      const result = await redis.quit();
      expect(result).toBe('OK');
      expect(redis.status).toBe('disconnected');
    });
  });

  describe('Rate limiting use case', () => {
    it('should implement rate limiting pattern', async () => {
      const key = 'ratelimit:user:123';
      const limit = 5;
      const windowMs = 1000;

      // Simulate 5 requests (should all succeed)
      for (let i = 0; i < limit; i++) {
        const count = await redis.incr(key);
        if (count === 1) {
          await redis.pexpire(key, windowMs);
        }
        expect(count).toBeLessThanOrEqual(limit);
      }

      // 6th request should be over limit
      const count = await redis.incr(key);
      expect(count).toBe(6);
      expect(count).toBeGreaterThan(limit);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // After expiration, counter should reset
      const newCount = await redis.incr(key);
      expect(newCount).toBe(1);
    });
  });

  describe('Session storage use case', () => {
    it('should store and retrieve session data', async () => {
      const sessionId = 'sess:abc123';
      const sessionData = JSON.stringify({
        userId: '123',
        email: 'user@example.com',
        createdAt: Date.now(),
      });

      // Store session with 1 hour expiration
      await redis.setex(sessionId, 3600, sessionData);

      // Retrieve session
      const retrieved = await redis.get(sessionId);
      expect(retrieved).toBe(sessionData);

      const parsed = JSON.parse(retrieved!);
      expect(parsed.userId).toBe('123');
      expect(parsed.email).toBe('user@example.com');
    });
  });

  describe('Helper methods', () => {
    it('should get all keys', async () => {
      await redis.set('key1', 'val1');
      await redis.set('key2', 'val2');

      const keys = redis.getKeys();
      expect(keys).toHaveLength(2);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });

    it('should clear all data', () => {
      redis.set('key1', 'val1');
      redis.set('key2', 'val2');

      redis.clear();

      const keys = redis.getKeys();
      expect(keys).toHaveLength(0);
    });

    it('should get raw store', async () => {
      await redis.set('key1', 'val1');

      const store = redis.getStore();
      expect(store.get('key1')).toBe('val1');
    });
  });
});
