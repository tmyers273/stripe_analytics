/**
 * Fake Redis client for testing
 * Implements a Redis-like interface using in-memory storage
 */

type RedisValue = string | number;
type ExpiryMap = Map<string, NodeJS.Timeout>;

export class FakeRedis {
  status: 'ready' | 'connecting' | 'disconnected' = 'ready';
  private store: Map<string, RedisValue> = new Map();
  private expiries: ExpiryMap = new Map();

  /**
   * Get the value of a key
   */
  async get(key: string): Promise<string | null> {
    this.checkExpiry(key);
    const value = this.store.get(key);
    return value !== undefined ? String(value) : null;
  }

  /**
   * Set key to hold the string value
   */
  async set(key: string, value: RedisValue, mode?: 'EX' | 'PX', time?: number): Promise<'OK'> {
    this.store.set(key, value);
    this.clearExpiry(key);

    if (mode && time) {
      if (mode === 'EX') {
        this.setExpiry(key, time * 1000);
      } else if (mode === 'PX') {
        this.setExpiry(key, time);
      }
    }

    return 'OK';
  }

  /**
   * Set key with expiration in seconds
   */
  async setex(key: string, seconds: number, value: RedisValue): Promise<'OK'> {
    return this.set(key, value, 'EX', seconds);
  }

  /**
   * Increment the integer value of a key by one
   */
  async incr(key: string): Promise<number> {
    this.checkExpiry(key);
    const current = this.store.get(key);
    const currentNum = current !== undefined ? Number(current) : 0;
    const newValue = currentNum + 1;
    this.store.set(key, newValue);
    return newValue;
  }

  /**
   * Increment the integer value of a key by the given amount
   */
  async incrby(key: string, increment: number): Promise<number> {
    this.checkExpiry(key);
    const current = this.store.get(key);
    const currentNum = current !== undefined ? Number(current) : 0;
    const newValue = currentNum + increment;
    this.store.set(key, newValue);
    return newValue;
  }

  /**
   * Decrement the integer value of a key by one
   */
  async decr(key: string): Promise<number> {
    this.checkExpiry(key);
    const current = this.store.get(key);
    const currentNum = current !== undefined ? Number(current) : 0;
    const newValue = currentNum - 1;
    this.store.set(key, newValue);
    return newValue;
  }

  /**
   * Decrement the integer value of a key by the given amount
   */
  async decrby(key: string, decrement: number): Promise<number> {
    this.checkExpiry(key);
    const current = this.store.get(key);
    const currentNum = current !== undefined ? Number(current) : 0;
    const newValue = currentNum - decrement;
    this.store.set(key, newValue);
    return newValue;
  }

  /**
   * Delete one or more keys
   */
  async del(...keys: string[]): Promise<number> {
    let deletedCount = 0;
    for (const key of keys) {
      if (this.store.has(key)) {
        this.store.delete(key);
        this.clearExpiry(key);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  /**
   * Determine if a key exists
   */
  async exists(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      this.checkExpiry(key);
      if (this.store.has(key)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Set a key's time to live in seconds
   */
  async expire(key: string, seconds: number): Promise<number> {
    if (!this.store.has(key)) {
      return 0;
    }
    this.setExpiry(key, seconds * 1000);
    return 1;
  }

  /**
   * Set a key's time to live in milliseconds
   */
  async pexpire(key: string, milliseconds: number): Promise<number> {
    if (!this.store.has(key)) {
      return 0;
    }
    this.setExpiry(key, milliseconds);
    return 1;
  }

  /**
   * Get the time to live for a key in seconds
   */
  async ttl(key: string): Promise<number> {
    this.checkExpiry(key);
    if (!this.store.has(key)) {
      return -2;
    }
    const timeout = this.expiries.get(key);
    if (!timeout) {
      return -1;
    }
    // This is a simplification - actual Redis tracks exact expiry time
    return -1;
  }

  /**
   * Get all keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    const regex = this.patternToRegex(pattern);
    const matchingKeys: string[] = [];

    for (const key of this.store.keys()) {
      this.checkExpiry(key);
      if (this.store.has(key) && regex.test(key)) {
        matchingKeys.push(key);
      }
    }

    return matchingKeys;
  }

  /**
   * Remove all keys from the current database
   */
  async flushdb(): Promise<'OK'> {
    this.store.clear();
    this.clearAllExpiries();
    return 'OK';
  }

  /**
   * Remove all keys from all databases
   */
  async flushall(): Promise<'OK'> {
    return this.flushdb();
  }

  /**
   * Get information and statistics about the server
   */
  async info(): Promise<string> {
    return `# Server
redis_version:7.0.0-fake
redis_mode:standalone
os:FakeRedis
# Keyspace
db0:keys=${this.store.size}`;
  }

  /**
   * Ping the server
   */
  async ping(): Promise<'PONG'> {
    return 'PONG';
  }

  /**
   * Hash set - set field in hash
   */
  async hset(key: string, field: string, value: RedisValue): Promise<number> {
    const hash = this.getHash(key);
    const isNew = !hash.has(field);
    hash.set(field, value);
    this.store.set(key, JSON.stringify(Array.from(hash.entries())));
    return isNew ? 1 : 0;
  }

  /**
   * Hash get - get field from hash
   */
  async hget(key: string, field: string): Promise<string | null> {
    this.checkExpiry(key);
    const hash = this.getHash(key);
    const value = hash.get(field);
    return value !== undefined ? String(value) : null;
  }

  /**
   * Hash get all - get all fields and values from hash
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    this.checkExpiry(key);
    const hash = this.getHash(key);
    const result: Record<string, string> = {};
    for (const [field, value] of hash) {
      result[field] = String(value);
    }
    return result;
  }

  /**
   * Hash delete - delete fields from hash
   */
  async hdel(key: string, ...fields: string[]): Promise<number> {
    const hash = this.getHash(key);
    let deletedCount = 0;
    for (const field of fields) {
      if (hash.delete(field)) {
        deletedCount++;
      }
    }
    if (hash.size === 0) {
      this.store.delete(key);
      this.clearExpiry(key);
    } else {
      this.store.set(key, JSON.stringify(Array.from(hash.entries())));
    }
    return deletedCount;
  }

  // Helper methods

  private getHash(key: string): Map<string, RedisValue> {
    const value = this.store.get(key);
    if (value === undefined) {
      return new Map();
    }
    try {
      const entries = JSON.parse(String(value));
      return new Map(entries);
    } catch {
      // If not a valid hash, return empty map
      return new Map();
    }
  }

  private checkExpiry(key: string): void {
    const timeout = this.expiries.get(key);
    if (timeout) {
      // If timeout exists but hasn't fired, key is still valid
      return;
    }
  }

  private setExpiry(key: string, milliseconds: number): void {
    this.clearExpiry(key);
    const timeout = setTimeout(() => {
      this.store.delete(key);
      this.expiries.delete(key);
    }, milliseconds);
    this.expiries.set(key, timeout);
  }

  private clearExpiry(key: string): void {
    const timeout = this.expiries.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.expiries.delete(key);
    }
  }

  private clearAllExpiries(): void {
    for (const timeout of this.expiries.values()) {
      clearTimeout(timeout);
    }
    this.expiries.clear();
  }

  private patternToRegex(pattern: string): RegExp {
    // Convert Redis pattern to regex
    // * matches any sequence of characters
    // ? matches any single character
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
      .replace(/\*/g, '.*') // * -> .*
      .replace(/\?/g, '.'); // ? -> .
    return new RegExp(`^${regexPattern}$`);
  }

  /**
   * Get all keys in the store (for debugging/testing)
   */
  getKeys(): string[] {
    return Array.from(this.store.keys());
  }

  /**
   * Get the raw store (for debugging/testing)
   */
  getStore(): Map<string, RedisValue> {
    return this.store;
  }

  /**
   * Clear all data (alias for flushdb)
   */
  clear(): void {
    this.store.clear();
    this.clearAllExpiries();
  }

  /**
   * Disconnect (no-op for fake client)
   */
  async disconnect(): Promise<void> {
    this.status = 'disconnected';
    this.clearAllExpiries();
  }

  /**
   * Quit (alias for disconnect)
   */
  async quit(): Promise<'OK'> {
    await this.disconnect();
    return 'OK';
  }
}

/**
 * Create a new fake Redis client instance
 */
export function createFakeRedis(): FakeRedis {
  return new FakeRedis();
}
