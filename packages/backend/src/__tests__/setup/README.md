# Database Testing Setup

This directory contains the test database setup using **PGlite** and **drizzle-seed** for solid database testing.

## Overview

- **PGlite**: In-memory PostgreSQL database that runs in Node.js without requiring a separate PostgreSQL server
- **drizzle-seed**: Powerful seeding library for generating realistic test data
- **Drizzle ORM**: Type-safe database access with full schema support

## Test Types

### Unit Tests
Located in `src/__tests__/` - Test individual functions and services in isolation
- `passwordService.test.ts` - Password hashing and verification
- `rateLimit.test.ts` - Rate limiting middleware

### Database Tests
Located in `src/__tests__/database.test.ts` - Test database operations, CRUD, relations, and helpers (15 tests)

### Integration Tests
Located in `src/__tests__/integration/` - Test complete request-to-database flows
- `auth.integration.test.ts` - Auth endpoints (7 tests: register, login, logout, validation)
- `organizations.integration.test.ts` - Organization management endpoints (12 tests: CRUD, members, permissions)

**Run all tests:** `npm test`
**Run specific test file:** `npm test -- auth.integration`
**Run integration tests only:** `npm test -- integration`

## Files

### `testDb.ts`
Core database setup utilities for tests:
- `createTestDb()` - Creates a fresh in-memory database for each test
- `getGlobalTestDb()` - Returns a shared database instance across tests (faster for large test suites)
- `closeGlobalTestDb()` - Cleanup for the global database
- `clearDatabase()` - Clears all data while preserving schema

### `seeds.ts`
Seed data generators and factories:
- `seedDatabase()` - Uses drizzle-seed to generate large amounts of realistic test data
- `seedMinimal()` - Creates minimal seed data (1 org, 1 user) for quick tests
- `createTestUser()` - Factory for creating users with organizations and credentials
- `createTestSession()` - Factory for creating user sessions
- `createTestOrganizations()` - Factory for creating multiple organizations with members

### `helpers.ts`
Test helper functions and assertions:
- `findUserByEmail()` - Query user with related data
- `findOrganizationWithMembers()` - Query organization with members
- `findUserActiveSessions()` - Query active sessions
- `countRecords()` - Count records in any table
- `assert.*` - Assertion helpers for common test scenarios
- `withTransaction()` - Transaction helper for testing rollback scenarios
- Time travel helpers for date-based testing

### `index.ts`
Convenience re-exports for all setup utilities.

### `vitest.setup.ts`
Test environment setup that runs before all tests:
- Sets required environment variables (DATABASE_URL, JWT_SECRET, etc.)
- Ensures config validation passes for integration tests
- Configured in `vitest.config.ts` as a setup file

### `testApp.ts`
Utilities for integration testing with Hono:
- `createTestApp()` - Creates a test Hono app instance
- `extractCookie()` - Helper to extract cookies from responses
- `withAuth()` - Helper to create authenticated request headers

### `fakeRedis.ts`
In-memory Redis implementation for testing:
- `FakeRedis` - Full Redis-like interface with in-memory storage
- `createFakeRedis()` - Factory function to create new instances
- Supports: get, set, incr, decr, del, expire, pexpire, keys, hashes, and more
- Automatic expiration handling with setTimeout
- No external Redis server required
- Perfect for testing rate limiting, caching, and session storage

## Usage

### Basic Test Setup

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, createTestUser, clearDatabase } from './__tests__/setup';

describe('My Feature', () => {
  let db: Awaited<ReturnType<typeof createTestDb>>;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it('should work', async () => {
    const { user, org } = await createTestUser(db, {
      email: 'test@example.com',
      name: 'Test User',
    });

    expect(user.email).toBe('test@example.com');
  });
});
```

### Using Global Database (Performance)

For faster test execution when you have many tests:

```typescript
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { getGlobalTestDb, closeGlobalTestDb, clearDatabase } from './__tests__/setup';

describe('My Feature Suite', () => {
  let db: Awaited<ReturnType<typeof getGlobalTestDb>>;

  beforeAll(async () => {
    db = await getGlobalTestDb();
  });

  beforeEach(async () => {
    await clearDatabase(db);
  });

  afterAll(async () => {
    await closeGlobalTestDb();
  });
});
```

### Using Seed Factories

```typescript
import { createTestUser, createTestOrganizations } from './__tests__/setup';

// Create a single user with org
const { user, org } = await createTestUser(db, {
  email: 'admin@test.com',
  role: 'admin',
});

// Create multiple organizations with members
const { organizations, users } = await createTestOrganizations(db, 3, 5);
// Creates 3 organizations, each with 5 members
```

### Using Assertion Helpers

```typescript
import { assert } from './__tests__/setup';

// Assert user exists
const user = await assert.userExists(db, 'test@example.com');

// Assert user doesn't exist
await assert.userDoesNotExist(db, 'nonexistent@example.com');

// Assert organization member count
await assert.organizationMemberCount(db, org.id, 5);

// Assert user has specific role
await assert.userHasRole(db, user.id, org.id, 'admin');
```

### Complex Queries with Relations

The schema includes full Drizzle relations for easy querying:

```typescript
// Query user with all related data
const user = await db.query.users.findFirst({
  where: eq(users.email, 'test@example.com'),
  with: {
    credentials: true,
    memberships: {
      with: {
        organization: true,
      },
    },
    sessions: true,
    identities: true,
  },
});
```

### Using Fake Redis

Perfect for testing rate limiting, caching, and session storage without a real Redis server:

```typescript
import { createFakeRedis } from './__tests__/setup';

// Create a fake Redis instance
const redis = createFakeRedis();

// Basic operations
await redis.set('key', 'value');
const value = await redis.get('key');

// Increment/decrement (perfect for rate limiting)
const count = await redis.incr('counter');
await redis.pexpire('counter', 60000); // Expire in 60 seconds

// Rate limiting pattern
const userKey = 'ratelimit:user:123';
const requestCount = await redis.incr(userKey);
if (requestCount === 1) {
  await redis.pexpire(userKey, 60000);
}
if (requestCount > 10) {
  // Rate limit exceeded
}

// Hash operations (for structured data)
await redis.hset('user:1', 'name', 'Alice');
await redis.hset('user:1', 'email', 'alice@example.com');
const userData = await redis.hgetall('user:1');

// Pattern matching
await redis.set('user:1', 'Alice');
await redis.set('user:2', 'Bob');
const userKeys = await redis.keys('user:*');

// Cleanup
redis.clear(); // or await redis.flushdb();
```

### Mocking Redis in Tests

Replace the real Redis client with fake Redis:

```typescript
import { vi } from 'vitest';
import { createFakeRedis } from './__tests__/setup';
import * as redisClient from '../services/redisClient';

it('should use fake Redis', async () => {
  const fakeRedis = createFakeRedis();
  const getRedisClientSpy = vi.spyOn(redisClient, 'getRedisClient');
  getRedisClientSpy.mockReturnValue(fakeRedis as any);

  // Now your code will use the fake Redis instance
  // Test rate limiting, caching, etc.
});
```

## Seeding the Development Database

To seed your development database with test data:

```bash
npm run seed
```

This will:
1. Clear existing data
2. Generate 10 organizations
3. Generate 50 users
4. Generate 100 sessions

You can customize the seed counts by editing `src/scripts/seed.ts`.

## How It Works

### PGlite
- Runs PostgreSQL entirely in-memory
- No external database server required
- Full PostgreSQL compatibility
- Perfect for CI/CD pipelines
- Automatically removes `pgcrypto` extension requirement (not needed for `gen_random_uuid()`)

### drizzle-seed
- Generates realistic fake data
- Respects foreign key constraints
- Customizable data generation
- Great for integration tests

## Best Practices

1. **Isolation**: Each test should use `createTestDb()` or `clearDatabase()` to ensure isolation
2. **Factories**: Use factory functions (`createTestUser`, etc.) for consistent test data
3. **Performance**: Use `getGlobalTestDb()` for large test suites, `createTestDb()` for critical isolation
4. **Assertions**: Use the `assert.*` helpers for consistent error messages
5. **Cleanup**: Always clean up global resources in `afterAll` hooks

## Examples

See `src/__tests__/database.test.ts` for comprehensive examples of:
- Basic CRUD operations
- Complex queries with relations
- Using helper functions
- Database cleanup
- Seed data generation
- Assertion helpers

## Troubleshooting

### Tests are slow
- Consider using `getGlobalTestDb()` instead of `createTestDb()`
- Use `clearDatabase()` in `beforeEach` instead of creating new instances

### Foreign key constraint errors
- Ensure you create parent records before child records
- Use the factory functions which handle this automatically

### Migration errors
- Ensure migrations are in `src/db/migrations/` and end with `.sql`
- PGlite automatically strips `pgcrypto` extension requirements
