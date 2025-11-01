# Testing Documentation

## Test Suite Overview

This project uses a comprehensive testing approach with **PGlite** (in-memory PostgreSQL), **drizzle-seed**, and **FakeRedis** for complete test isolation.

### Test Statistics
- **Total Tests**: 73 tests ✅
- **Unit Tests**: 4 tests (password service, rate limiting)
- **Database Tests**: 15 tests (CRUD, relations, helpers)
- **Integration Tests**: 19 tests (auth + organizations endpoints)
- **Fake Redis Tests**: 35 tests (all Redis operations)
- **Test Coverage**: 40%+ overall coverage

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.integration

# Run integration tests only
npm test -- integration

# Run database tests only
npm test -- database

# Run with watch mode
npm run test:watch
```

## Test Structure

### Unit Tests (`src/__tests__/`)
Test individual functions in isolation without external dependencies:
- `passwordService.test.ts` - Argon2 password hashing/verification
- `rateLimit.test.ts` - Rate limiting with Redis fallback

### Database Tests (`src/__tests__/database.test.ts`)
Test database operations using PGlite:
- Basic CRUD operations
- Organization membership management
- Complex queries with relations
- Helper functions and assertions
- Database cleanup utilities
- Seed functions

### Fake Redis Tests (`src/__tests__/fakeRedis.test.ts`)
Test the in-memory Redis implementation (35 tests):
- Basic get/set operations
- Increment/decrement operations
- Key expiration (expire, pexpire, setex)
- Pattern matching with keys()
- Hash operations (hset, hget, hgetall, hdel)
- Database operations (flushdb, flushall, ping, info)
- Rate limiting patterns
- Session storage patterns

### Integration Tests (`src/__tests__/integration/`)
Test complete HTTP request flows with database integration:

**Auth Routes** (`auth.integration.test.ts`):
- POST `/api/auth/register` - User registration with validation
- POST `/api/auth/login` - User authentication
- POST `/api/auth/logout` - Session termination
- GET `/api/auth/me` - Current user info
- Error handling (409 conflicts, 401 unauthorized)

**Organization Routes** (`organizations.integration.test.ts`):
- GET `/api/organizations/` - List user memberships
- POST `/api/organizations/` - Create organization
- GET `/api/organizations/:id/members` - List members
- POST `/api/organizations/:id/members` - Add member
- DELETE `/api/organizations/:id/members/:userId` - Remove member
- Database integrity verification
- Cascade delete verification

## Test Utilities

### Database Setup (`src/__tests__/setup/`)

**Core Functions**:
- `createTestDb()` - Fresh in-memory database per test
- `getGlobalTestDb()` - Shared database for performance
- `clearDatabase()` - Clean data between tests
- `closeGlobalTestDb()` - Cleanup after test suite

**Seed Factories**:
- `createTestUser()` - Create user with org and credentials
- `createTestSession()` - Create session for user
- `createTestOrganizations()` - Bulk organization creation
- `seedMinimal()` - Quick minimal test data
- `seedDatabase()` - Generate realistic bulk data

**Test Helpers**:
- `findUserByEmail()` - Query with relations
- `findOrganizationWithMembers()` - Query with members
- `assert.userExists()` - Assert user presence
- `assert.userHasRole()` - Assert membership role
- `assert.organizationMemberCount()` - Assert member count
- `countRecords()` - Count table records

### Integration Test Helpers (`src/__tests__/setup/testApp.ts`)
- `createTestApp()` - Hono app instance for testing
- `extractCookie()` - Extract cookies from responses
- `withAuth()` - Create authenticated request headers

### Fake Redis (`src/__tests__/setup/fakeRedis.ts`)
- `FakeRedis` - Full Redis-like interface with in-memory storage
- `createFakeRedis()` - Factory to create new instances
- **Supported Operations**:
  - String: get, set, setex, del, exists
  - Numbers: incr, incrby, decr, decrby
  - Expiration: expire, pexpire, ttl
  - Hashes: hset, hget, hgetall, hdel
  - Keys: keys (with pattern matching)
  - Database: flushdb, flushall, ping, info
- Automatic expiration with setTimeout
- Perfect for testing rate limiting and caching

## Key Features

### PGlite Benefits
✅ No external PostgreSQL server required
✅ Runs entirely in-memory for speed
✅ Full PostgreSQL compatibility
✅ Perfect for CI/CD pipelines
✅ Automatic migration execution
✅ Handles `pgcrypto` extension compatibility

### drizzle-seed Benefits
✅ Realistic fake data generation
✅ Respects foreign key constraints
✅ Customizable data counts
✅ Great for integration testing

### FakeRedis Benefits
✅ No external Redis server required
✅ Full Redis-like API compatibility
✅ Automatic key expiration with setTimeout
✅ 96%+ test coverage verified
✅ Perfect for rate limiting tests
✅ Zero configuration needed
✅ Synchronous and async operations

## Example Test Patterns

### Basic Database Test
```typescript
import { createTestDb, createTestUser } from './__tests__/setup';

it('should create a user', async () => {
  const db = await createTestDb();
  const { user, org } = await createTestUser(db, {
    email: 'test@example.com',
    name: 'Test User',
  });

  expect(user.email).toBe('test@example.com');
});
```

### Integration Test with Mocking
```typescript
import { vi } from 'vitest';
import * as authService from '../../services/authService';

it('should register user', async () => {
  const registerSpy = vi.spyOn(authService, 'registerUser');
  registerSpy.mockImplementation(async (payload) => {
    // Use test database for implementation
    return { user, membership };
  });

  const response = await app.request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, organizationName }),
  });

  expect(response.status).toBe(200);
});
```

### Using Test Helpers
```typescript
import { assert } from './__tests__/setup';

// Assert user exists
await assert.userExists(db, 'test@example.com');

// Assert user has specific role
await assert.userHasRole(db, userId, orgId, 'admin');

// Assert member count
await assert.organizationMemberCount(db, orgId, 5);
```

### Using Fake Redis
```typescript
import { createFakeRedis } from './__tests__/setup';

it('should implement rate limiting', async () => {
  const redis = createFakeRedis();
  const key = 'ratelimit:user:123';
  const limit = 5;

  // First 5 requests succeed
  for (let i = 0; i < limit; i++) {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.pexpire(key, 60000); // 60 second window
    }
    expect(count).toBeLessThanOrEqual(limit);
  }

  // 6th request is over limit
  const overLimit = await redis.incr(key);
  expect(overLimit).toBeGreaterThan(limit);

  // Cleanup
  redis.clear();
});

it('should store session data', async () => {
  const redis = createFakeRedis();
  const sessionData = JSON.stringify({ userId: '123' });

  // Store with 1 hour expiration
  await redis.setex('session:abc', 3600, sessionData);

  // Retrieve
  const data = await redis.get('session:abc');
  expect(JSON.parse(data!).userId).toBe('123');
});
```

## Best Practices

1. **Isolation**: Each test uses `createTestDb()` or `clearDatabase()` for isolation
2. **Factories**: Use factory functions (`createTestUser`) for consistent test data
3. **Cleanup**: Always clean up global resources in `afterAll` hooks
4. **Mocking**: Mock service layer for integration tests, not database operations
5. **Assertions**: Use helper assertions for better error messages

## Troubleshooting

### Tests are slow
Use `getGlobalTestDb()` with `clearDatabase()` in `beforeEach` instead of creating new instances

### Environment variable errors
Check that `vitest.setup.ts` is configured in `vitest.config.ts`

### Foreign key constraint errors
Ensure parent records exist before creating child records, or use factory functions

## Development Seeding

Seed development database with test data:
```bash
npm run seed
```

This generates:
- 10 organizations
- 50 users
- 100 sessions

Customize counts in `src/scripts/seed.ts`.

## CI/CD Integration

Tests work perfectly in CI environments:
- No external dependencies
- Fast execution (~5-6 seconds)
- No database setup required
- Isolated test runs

## Contributing

When adding new features:
1. Add unit tests for new services/utilities
2. Add database tests for new schema/queries
3. Add integration tests for new API endpoints
4. Update test factories if needed
5. Maintain test isolation and cleanup
