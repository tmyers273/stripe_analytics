import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { getConfig } from '../config';
import { getSessionByToken, touchSession } from '../services/sessionService';
import { getUserById, listMemberships } from '../services/authService';

const config = getConfig();

export const sessionMiddleware: MiddlewareHandler = async (c, next) => {
  const token = getCookie(c, config.SESSION_COOKIE_NAME);

  if (!token) {
    return next();
  }

  const session = await getSessionByToken(token);

  if (!session) {
    return next();
  }

  const user = await getUserById(session.userId);

  if (!user) {
    return next();
  }

  const memberships = await listMemberships(user.id);

  c.set('session', session);
  c.set('user', user);
  c.set('memberships', memberships);

  await touchSession(session.id);

  return next();
};

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const user = c.get('user');

  if (!user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  return next();
};
