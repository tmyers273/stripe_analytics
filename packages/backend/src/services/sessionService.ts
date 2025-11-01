import crypto from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '../db/client';
import { sessions } from '../db/schema';
import { getConfig } from '../config';

const config = getConfig();

export type SessionCreateOptions = {
  userId: string;
  activeOrganizationId?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  ttlDays?: number;
};

export type SessionRecord = typeof sessions.$inferSelect;

export function generateSessionToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function hashSessionToken(token: string): string {
  return crypto.createHmac('sha256', config.SESSION_SECRET).update(token).digest('hex');
}

export async function createSession(options: SessionCreateOptions): Promise<{
  token: string;
  session: SessionRecord;
}> {
  const token = generateSessionToken();
  const hashed = hashSessionToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(
    expiresAt.getDate() + (options.ttlDays ?? config.SESSION_TTL_DAYS),
  );

  const [session] = await db
    .insert(sessions)
    .values({
      userId: options.userId,
      activeOrganizationId: options.activeOrganizationId ?? null,
      refreshTokenHash: hashed,
      userAgent: options.userAgent ?? null,
      ipAddress: options.ipAddress ?? null,
      expiresAt,
    })
    .returning();

  return { token, session };
}

export async function getSessionByToken(
  token: string,
): Promise<SessionRecord | undefined> {
  const hashed = hashSessionToken(token);
  const [session] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.refreshTokenHash, hashed),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return session;
}

export async function revokeSessionByToken(token: string): Promise<void> {
  const hashed = hashSessionToken(token);
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.refreshTokenHash, hashed));
}

export async function revokeSessionById(sessionId: string): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.id, sessionId));
}

export async function touchSession(sessionId: string): Promise<void> {
  await db
    .update(sessions)
    .set({ lastSeenAt: new Date() })
    .where(eq(sessions.id, sessionId));
}

export async function setSessionActiveOrganization(
  sessionId: string,
  organizationId: string,
): Promise<void> {
  await db
    .update(sessions)
    .set({ activeOrganizationId: organizationId, lastSeenAt: new Date() })
    .where(eq(sessions.id, sessionId));
}
