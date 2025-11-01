import { Hono } from 'hono';
import { authRoutes } from '../../routes/auth';
import { organizationsRoutes } from '../../routes/organizations';
import type { Env } from '../../types';
import type { TestDb } from './testDb';

/**
 * Creates a test Hono app with routes configured for testing
 * Does not include rate limiting or external dependencies
 */
export function createTestApp(db: TestDb) {
  const app = new Hono<Env>();

  // Mock the database client in services
  // We'll need to inject the test db into the context
  app.use('*', async (c, next) => {
    // Store the test db in context for access by routes
    c.set('testDb' as any, db);
    await next();
  });

  // Mount routes
  app.route('/api/auth', authRoutes);
  app.route('/api/organizations', organizationsRoutes);

  return app;
}

/**
 * Helper to extract cookies from response headers
 */
export function extractCookie(response: Response, cookieName: string): string | null {
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) return null;

  const cookies = setCookie.split(',').map(c => c.trim());
  for (const cookie of cookies) {
    const [nameValue] = cookie.split(';');
    const [name, value] = nameValue.split('=');
    if (name === cookieName) {
      return value;
    }
  }

  return null;
}

/**
 * Helper to make authenticated requests with session cookie
 */
export function withAuth(sessionToken: string) {
  return {
    headers: {
      'Cookie': `session=${sessionToken}`,
    },
  };
}
