import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createTestDb, clearDatabase, closeGlobalTestDb } from './setup/testDb';
import { createTestUser, createTestSession, createTestOrganizations, seedMinimal } from './setup/seeds';
import { findUserByEmail, findOrganizationWithMembers, assert, countRecords } from './setup/helpers';
import * as schema from '../db/schema';

describe('Database Testing with PGlite and drizzle-seed', () => {
  let db: Awaited<ReturnType<typeof createTestDb>>;

  beforeEach(async () => {
    db = await createTestDb();
  });

  afterAll(async () => {
    await closeGlobalTestDb();
  });

  describe('Basic CRUD operations', () => {
    it('should create and retrieve a user', async () => {
      const { user, org } = await createTestUser(db, {
        email: 'john@example.com',
        name: 'John Doe',
        orgName: 'Acme Corp',
      });

      expect(user).toBeDefined();
      expect(user.email).toBe('john@example.com');
      expect(user.name).toBe('John Doe');

      const foundUser = await findUserByEmail(db, 'john@example.com');
      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(user.id);
      expect(foundUser?.memberships).toHaveLength(1);
      expect(foundUser?.memberships[0].organization.name).toBe('Acme Corp');
    });

    it('should create a user with credentials', async () => {
      const { user } = await createTestUser(db);

      const credentials = await db.query.userCredentials.findFirst({
        where: (creds, { eq }) => eq(creds.userId, user.id),
      });

      expect(credentials).toBeDefined();
      expect(credentials?.passwordHash).toBeDefined();
      expect(credentials?.passwordVersion).toBe('argon2id:v1');
    });

    it('should handle user sessions', async () => {
      const { user, org } = await createTestUser(db);

      const session = await createTestSession(db, user.id, org.id);

      expect(session).toBeDefined();
      expect(session.userId).toBe(user.id);
      expect(session.activeOrganizationId).toBe(org.id);
      expect(session.refreshTokenHash).toContain('test-token');
    });
  });

  describe('Organization membership', () => {
    it('should create organization with multiple members', async () => {
      const { organizations, users } = await createTestOrganizations(db, 2, 3);

      expect(organizations).toHaveLength(2);
      expect(users).toHaveLength(6);

      const org = await findOrganizationWithMembers(db, organizations[0].id);
      expect(org?.members).toHaveLength(3);

      const roles = org?.members.map(m => m.role).sort();
      expect(roles).toEqual(['admin', 'member', 'owner']);
    });

    it('should enforce unique email constraint', async () => {
      await createTestUser(db, { email: 'duplicate@test.com' });

      await expect(
        createTestUser(db, { email: 'duplicate@test.com' })
      ).rejects.toThrow();
    });
  });

  describe('Helper functions', () => {
    it('should use assert.userExists helper', async () => {
      await createTestUser(db, { email: 'exists@test.com' });

      const user = await assert.userExists(db, 'exists@test.com');
      expect(user.email).toBe('exists@test.com');
    });

    it('should use assert.userDoesNotExist helper', async () => {
      await expect(
        assert.userDoesNotExist(db, 'nonexistent@test.com')
      ).resolves.not.toThrow();

      await createTestUser(db, { email: 'exists@test.com' });

      await expect(
        assert.userDoesNotExist(db, 'exists@test.com')
      ).rejects.toThrow();
    });

    it('should use assert.organizationMemberCount helper', async () => {
      const { org } = await createTestUser(db);

      await assert.organizationMemberCount(db, org.id, 1);

      await expect(
        assert.organizationMemberCount(db, org.id, 5)
      ).rejects.toThrow();
    });

    it('should use assert.userHasRole helper', async () => {
      const { user, org } = await createTestUser(db, { role: 'admin' });

      await assert.userHasRole(db, user.id, org.id, 'admin');

      await expect(
        assert.userHasRole(db, user.id, org.id, 'owner')
      ).rejects.toThrow();
    });

    it('should count records', async () => {
      await seedMinimal(db);

      const userCount = await countRecords(db, 'users');
      const orgCount = await countRecords(db, 'organizations');

      expect(userCount).toBe(1);
      expect(orgCount).toBe(1);
    });
  });

  describe('Database cleanup', () => {
    it('should clear database between tests', async () => {
      await createTestOrganizations(db, 3, 2);

      let userCount = await countRecords(db, 'users');
      let orgCount = await countRecords(db, 'organizations');

      expect(userCount).toBe(6);
      expect(orgCount).toBe(3);

      await clearDatabase(db);

      userCount = await countRecords(db, 'users');
      orgCount = await countRecords(db, 'organizations');

      expect(userCount).toBe(0);
      expect(orgCount).toBe(0);
    });
  });

  describe('Seed functions', () => {
    it('should create minimal seed data', async () => {
      const { user, org } = await seedMinimal(db);

      expect(user.email).toBe('test@example.com');
      expect(org.name).toBe('Test Organization');

      const foundUser = await findUserByEmail(db, 'test@example.com');
      expect(foundUser?.defaultOrganizationId).toBe(org.id);
    });
  });

  describe('Complex queries', () => {
    it('should query users with their organizations', async () => {
      const { user, org } = await createTestUser(db, {
        email: 'query@test.com',
        orgName: 'Query Org',
      });

      const foundUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, user.id),
        with: {
          memberships: {
            with: {
              organization: true,
            },
          },
        },
      });

      expect(foundUser?.memberships[0].organization.name).toBe('Query Org');
    });

    it('should query sessions with user data', async () => {
      const { user, org } = await createTestUser(db);
      await createTestSession(db, user.id, org.id);

      const sessions = await db.query.sessions.findMany({
        where: (sessions, { eq }) => eq(sessions.userId, user.id),
        with: {
          user: true,
        },
      });

      expect(sessions).toHaveLength(1);
      expect(sessions[0].user.email).toBe(user.email);
    });
  });

  describe('Audit logs', () => {
    it('should create audit log entries', async () => {
      const { user, org } = await createTestUser(db);

      await db.insert(schema.auditLogs).values({
        userId: user.id,
        organizationId: org.id,
        action: 'user.login',
        metadata: { ip: '127.0.0.1' },
      });

      const logs = await db.query.auditLogs.findMany({
        where: (logs, { eq }) => eq(logs.userId, user.id),
      });

      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('user.login');
      expect(logs[0].metadata).toEqual({ ip: '127.0.0.1' });
    });
  });
});
