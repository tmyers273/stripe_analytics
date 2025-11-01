import { setCookie, deleteCookie } from 'hono/cookie';
import type { Context } from 'hono';
import { getConfig } from '../config';

const config = getConfig();

export function setSessionCookie(c: Context, token: string, expiresAt: Date): void {
  setCookie(c, config.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: resolveSecure(c),
    sameSite: 'Strict',
    path: '/',
    domain: config.SESSION_COOKIE_DOMAIN,
    expires: expiresAt,
  });
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, config.SESSION_COOKIE_NAME, {
    path: '/',
    domain: config.SESSION_COOKIE_DOMAIN,
  });
}

function resolveSecure(c: Context): boolean {
  if (typeof config.SESSION_COOKIE_SECURE === 'boolean') {
    return config.SESSION_COOKIE_SECURE;
  }

  const host = c.req.header('host') ?? '';
  return host.includes('localhost') ? false : true;
}
