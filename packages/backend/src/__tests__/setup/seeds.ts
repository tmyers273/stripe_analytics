import { seed } from 'drizzle-seed';
import * as schema from '../../db/schema';
import type { TestDb } from './testDb';

/**
 * Seed configuration for generating test data
 */
export const seedConfig = {
  organizations: {
    count: 5,
  },
  users: {
    count: 10,
  },
  sessions: {
    count: 15,
  },
};

/**
 * Seeds the database with randomly generated test data
 * Uses drizzle-seed for realistic fake data generation
 */
export async function seedDatabase(db: TestDb, options?: Partial<typeof seedConfig>) {
  const config = { ...seedConfig, ...options };

  await seed(db, schema).refine((funcs) => ({
    organizations: {
      count: config.organizations.count,
      with: {
        members: config.users.count,
      },
    },
  }));
}

/**
 * Creates a minimal seed for quick tests
 * Returns the created entities for easy test assertions
 */
export async function seedMinimal(db: TestDb) {
  const [org] = await db.insert(schema.organizations).values({
    name: 'Test Organization',
    plan: 'free',
  }).returning();

  const [user] = await db.insert(schema.users).values({
    email: 'test@example.com',
    name: 'Test User',
    defaultOrganizationId: org.id,
  }).returning();

  await db.insert(schema.userCredentials).values({
    userId: user.id,
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$test',
    passwordVersion: 'argon2id:v1',
  });

  await db.insert(schema.organizationMembers).values({
    organizationId: org.id,
    userId: user.id,
    role: 'owner',
  });

  return { org, user };
}

/**
 * Creates a complete user with organization and membership
 */
export async function createTestUser(
  db: TestDb,
  overrides?: {
    email?: string;
    name?: string;
    orgName?: string;
    role?: 'owner' | 'admin' | 'member';
  }
) {
  const { email = 'user@test.com', name = 'Test User', orgName = 'Test Org', role = 'owner' } = overrides ?? {};

  const [org] = await db.insert(schema.organizations).values({
    name: orgName,
    plan: 'free',
  }).returning();

  const [user] = await db.insert(schema.users).values({
    email,
    name,
    defaultOrganizationId: org.id,
  }).returning();

  await db.insert(schema.userCredentials).values({
    userId: user.id,
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$testpasswordhash',
    passwordVersion: 'argon2id:v1',
  });

  await db.insert(schema.organizationMembers).values({
    organizationId: org.id,
    userId: user.id,
    role,
  });

  return { org, user };
}

/**
 * Creates a test session for a user
 */
export async function createTestSession(
  db: TestDb,
  userId: string,
  organizationId?: string
) {
  const [session] = await db.insert(schema.sessions).values({
    userId,
    activeOrganizationId: organizationId,
    refreshTokenHash: `test-token-${Date.now()}`,
    userAgent: 'Test Agent',
    ipAddress: '127.0.0.1',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  }).returning();

  return session;
}

/**
 * Creates multiple organizations with members
 */
export async function createTestOrganizations(
  db: TestDb,
  count: number,
  membersPerOrg: number = 3
) {
  const organizations = [];
  const users = [];

  for (let i = 0; i < count; i++) {
    const [org] = await db.insert(schema.organizations).values({
      name: `Organization ${i + 1}`,
      plan: i % 3 === 0 ? 'pro' : 'free',
    }).returning();

    organizations.push(org);

    for (let j = 0; j < membersPerOrg; j++) {
      const [user] = await db.insert(schema.users).values({
        email: `user${i}-${j}@test.com`,
        name: `User ${i}-${j}`,
        defaultOrganizationId: org.id,
      }).returning();

      users.push(user);

      await db.insert(schema.userCredentials).values({
        userId: user.id,
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$test',
        passwordVersion: 'argon2id:v1',
      });

      await db.insert(schema.organizationMembers).values({
        organizationId: org.id,
        userId: user.id,
        role: j === 0 ? 'owner' : j === 1 ? 'admin' : 'member',
      });
    }
  }

  return { organizations, users };
}
