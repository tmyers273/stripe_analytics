/**
 * Vitest setup file for integration tests
 * Sets up required environment variables and mocks
 */

// Set required environment variables for tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.SESSION_SECRET = 'test-session-secret-key-for-testing-only';
process.env.SESSION_COOKIE_NAME = 'session';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.RATE_LIMIT_MAX_LOGIN = '10';
process.env.RATE_LIMIT_MAX_REGISTER = '5';
