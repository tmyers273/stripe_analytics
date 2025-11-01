import { eq } from 'drizzle-orm';
import * as schema from '../../db/schema';
import type { TestDb } from './testDb';

/**
 * Helper to find a user by email
 */
export async function findUserByEmail(db: TestDb, email: string) {
  return db.query.users.findFirst({
    where: eq(schema.users.email, email),
    with: {
      credentials: true,
      memberships: {
        with: {
          organization: true,
        },
      },
    },
  });
}

/**
 * Helper to find an organization with its members
 */
export async function findOrganizationWithMembers(db: TestDb, orgId: string) {
  return db.query.organizations.findFirst({
    where: eq(schema.organizations.id, orgId),
    with: {
      members: {
        with: {
          user: true,
        },
      },
    },
  });
}

/**
 * Helper to find active sessions for a user
 */
export async function findUserActiveSessions(db: TestDb, userId: string) {
  return db.query.sessions.findMany({
    where: eq(schema.sessions.userId, userId),
  });
}

/**
 * Helper to count records in a table
 */
export async function countRecords<T extends keyof typeof schema>(
  db: TestDb,
  tableName: T
) {
  const table = schema[tableName];
  const result = await db.select().from(table);
  return result.length;
}

/**
 * Assert helpers for common test scenarios
 */
export const assert = {
  /**
   * Asserts that a user exists with the given email
   */
  async userExists(db: TestDb, email: string) {
    const user = await findUserByEmail(db, email);
    if (!user) {
      throw new Error(`Expected user with email ${email} to exist`);
    }
    return user;
  },

  /**
   * Asserts that a user does not exist with the given email
   */
  async userDoesNotExist(db: TestDb, email: string) {
    const user = await findUserByEmail(db, email);
    if (user) {
      throw new Error(`Expected user with email ${email} to not exist`);
    }
  },

  /**
   * Asserts that an organization has a specific number of members
   */
  async organizationMemberCount(db: TestDb, orgId: string, expectedCount: number) {
    const org = await findOrganizationWithMembers(db, orgId);
    if (!org) {
      throw new Error(`Organization ${orgId} not found`);
    }
    if (org.members.length !== expectedCount) {
      throw new Error(
        `Expected organization to have ${expectedCount} members, but has ${org.members.length}`
      );
    }
    return org;
  },

  /**
   * Asserts that a user is a member of an organization with a specific role
   */
  async userHasRole(
    db: TestDb,
    userId: string,
    orgId: string,
    expectedRole: 'owner' | 'admin' | 'member'
  ) {
    const membership = await db.query.organizationMembers.findFirst({
      where: (members, { and, eq }) =>
        and(
          eq(members.userId, userId),
          eq(members.organizationId, orgId)
        ),
    });

    if (!membership) {
      throw new Error(`User ${userId} is not a member of organization ${orgId}`);
    }

    if (membership.role !== expectedRole) {
      throw new Error(
        `Expected user to have role ${expectedRole}, but has ${membership.role}`
      );
    }

    return membership;
  },
};

/**
 * Transaction helper for testing rollback scenarios
 */
export async function withTransaction<T>(
  db: TestDb,
  callback: (tx: TestDb) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    return await callback(tx as TestDb);
  });
}

/**
 * Time travel helper for testing time-based functionality
 */
export function createDateInPast(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

export function createDateInFuture(daysFromNow: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

/**
 * Creates a spy that can track database operations
 */
export function createDbSpy(db: TestDb) {
  const operations: Array<{ type: string; table: string; timestamp: Date }> = [];

  return {
    operations,
    trackInsert(table: string) {
      operations.push({ type: 'insert', table, timestamp: new Date() });
    },
    trackUpdate(table: string) {
      operations.push({ type: 'update', table, timestamp: new Date() });
    },
    trackDelete(table: string) {
      operations.push({ type: 'delete', table, timestamp: new Date() });
    },
    reset() {
      operations.length = 0;
    },
  };
}
