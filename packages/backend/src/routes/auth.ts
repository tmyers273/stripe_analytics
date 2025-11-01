import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  registerSchema,
  loginSchema,
  switchOrganizationSchema,
} from '../schemas/auth';
import { registerUser, authenticateUser, getMembership, listMemberships } from '../services/authService';
import {
  createSession,
  revokeSessionByToken,
  setSessionActiveOrganization,
} from '../services/sessionService';
import { clearSessionCookie, setSessionCookie } from '../utils/cookies';
import { requireAuth } from '../middleware/auth';
import { getConfig } from '../config';
import type { Env } from '../types';
import { getCookie } from 'hono/cookie';
import { providerRegistry, type OAuthProviderName } from '../providers';
import { logger } from '../utils/logger';
import { rateLimit } from '../middleware/rateLimit';

const config = getConfig();

export const authRoutes = new Hono<Env>();

const registerRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  limit: config.RATE_LIMIT_MAX_REGISTER,
  prefix: 'register',
});

const loginRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  limit: config.RATE_LIMIT_MAX_LOGIN,
  prefix: 'login',
});

authRoutes.use('/register', registerRateLimiter);
authRoutes.use('/login', loginRateLimiter);

authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  const payload = c.req.valid('json');

  try {
    const { user, membership } = await registerUser(payload);
    const { token, session } = await createSession({
      userId: user.id,
      activeOrganizationId: membership.organizationId,
      userAgent: c.req.header('user-agent'),
      ipAddress: c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? undefined,
    });

    setSessionCookie(c, token, session.expiresAt);

    logger.info('user.register.success', {
      userId: user.id,
      organizationId: membership.organizationId,
    });

    return c.json({
      success: true,
      user,
      activeOrganizationId: session.activeOrganizationId ?? membership.organizationId,
      memberships: [membership],
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'User already exists') {
      logger.warn('user.register.conflict', { email: payload.email });
      return c.json({ success: false, error: error.message }, 409);
    }

    console.error(error);
    logger.error('user.register.failed', {
      email: payload.email,
      error: error instanceof Error ? error.message : error,
    });
    return c.json({ success: false, error: 'Registration failed' }, 500);
  }
});

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const payload = c.req.valid('json');

  try {
    const { user, memberships } = await authenticateUser(payload);

    if (memberships.length === 0) {
      return c.json({ success: false, error: 'User has no organization memberships' }, 403);
    }

    const activeOrg =
      user.defaultOrganizationId ??
      memberships.find((m) => m.role === 'owner')?.organizationId ??
      memberships[0]?.organizationId;

    const { token, session } = await createSession({
      userId: user.id,
      activeOrganizationId: activeOrg,
      userAgent: c.req.header('user-agent'),
      ipAddress: c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? undefined,
    });

    setSessionCookie(c, token, session.expiresAt);

    logger.info('user.login.success', {
      userId: user.id,
      activeOrganizationId: session.activeOrganizationId ?? activeOrg,
    });

    return c.json({
      success: true,
      user,
      activeOrganizationId: session.activeOrganizationId ?? activeOrg,
      memberships,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid credentials') {
      logger.warn('user.login.invalid', { email: payload.email });
      return c.json({ success: false, error: error.message }, 401);
    }

    console.error(error);
    logger.error('user.login.failed', {
      email: payload.email,
      error: error instanceof Error ? error.message : error,
    });
    return c.json({ success: false, error: 'Login failed' }, 500);
  }
});

authRoutes.post('/logout', requireAuth, async (c) => {
  const cookie = getCookie(c, config.SESSION_COOKIE_NAME);

  if (cookie) {
    await revokeSessionByToken(cookie);
  }

  clearSessionCookie(c);

  const user = c.get('user');
  if (user) {
    logger.info('user.logout', { userId: user.id });
  }

  return c.json({ success: true });
});

authRoutes.get('/me', requireAuth, async (c) => {
  const user = c.get('user');
  const memberships = c.get('memberships') ?? [];
  const session = c.get('session');

  return c.json({
    success: true,
    user,
    activeOrganizationId: session?.activeOrganizationId ?? user?.defaultOrganizationId,
    memberships,
  });
});

authRoutes.post('/switch', requireAuth, zValidator('json', switchOrganizationSchema), async (c) => {
  const { organizationId } = c.req.valid('json');
  const session = c.get('session');
  const user = c.get('user');

  if (!session || !user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const membership = await getMembership(user.id, organizationId);

  if (!membership) {
    return c.json({ success: false, error: 'Membership not found' }, 403);
  }

  await setSessionActiveOrganization(session.id, organizationId);

  return c.json({
    success: true,
    activeOrganizationId: organizationId,
    memberships: await listMemberships(user.id),
  });
});

authRoutes.get('/:provider/init', (c) => {
  const providerName = c.req.param('provider') as OAuthProviderName;
  const provider = providerRegistry[providerName];

  if (!provider) {
    return c.json({ success: false, error: 'Provider not supported' }, 400);
  }

  return c.json({
    success: false,
    error: `${provider.name} OAuth is not configured yet`,
  }, 501);
});

authRoutes.get('/:provider/callback', (c) => {
  const providerName = c.req.param('provider') as OAuthProviderName;
  const provider = providerRegistry[providerName];

  if (!provider) {
    return c.json({ success: false, error: 'Provider not supported' }, 400);
  }

  return c.json({
    success: false,
    error: `${provider.name} OAuth callback not implemented`,
  }, 501);
});
