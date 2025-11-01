import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import {
  organizationMembers,
  organizations,
  userCredentials,
  users,
} from '../db/schema';
import type { RegisterInput, LoginInput } from '../schemas/auth';
import { hashPassword, verifyPassword } from './passwordService';

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  defaultOrganizationId: string | null;
};

export type OrganizationMembership = {
  organizationId: string;
  organizationName: string;
  role: 'owner' | 'admin' | 'member';
};

export async function registerUser(input: RegisterInput): Promise<{
  user: AuthenticatedUser;
  membership: OrganizationMembership;
}> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existing.length > 0) {
    throw new Error('User already exists');
  }

  const passwordHash = await hashPassword(input.password);

  const result = await db.transaction(async (tx) => {
    const [organization] = await tx
      .insert(organizations)
      .values({
        name: input.organizationName,
      })
      .returning();

    const [user] = await tx
      .insert(users)
      .values({
        email: input.email.toLowerCase(),
        name: input.name,
        defaultOrganizationId: organization.id,
      })
      .returning();

    await tx.insert(userCredentials).values({
      userId: user.id,
      passwordHash,
    });

    await tx.insert(organizationMembers).values({
      organizationId: organization.id,
      userId: user.id,
      role: 'owner',
    });

    return {
      user,
      organization,
    };
  });

  return {
    user: mapUser(result.user),
    membership: {
      organizationId: result.organization.id,
      organizationName: result.organization.name,
      role: 'owner',
    },
  };
}

export async function authenticateUser(input: LoginInput): Promise<{
  user: AuthenticatedUser;
  memberships: OrganizationMembership[];
}> {
  const [record] = await db
    .select({
      user: users,
      credential: userCredentials,
      organizationId: organizationMembers.organizationId,
      role: organizationMembers.role,
      organizationName: organizations.name,
    })
    .from(users)
    .innerJoin(userCredentials, eq(userCredentials.userId, users.id))
    .leftJoin(
      organizationMembers,
      eq(organizationMembers.userId, users.id),
    )
    .leftJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(eq(users.email, input.email.toLowerCase()))
    .limit(1);

  if (!record) {
    throw new Error('Invalid credentials');
  }

  const isValid = await verifyPassword(input.password, record.credential.passwordHash);

  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  const memberships = await db
    .select({
      organizationId: organizationMembers.organizationId,
      organizationName: organizations.name,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(eq(organizationMembers.userId, record.user.id));

  return {
    user: mapUser(record.user),
    memberships: memberships.map((membership) => ({
      organizationId: membership.organizationId,
      organizationName: membership.organizationName,
      role: membership.role as OrganizationMembership['role'],
    })),
  };
}

export async function getUserById(userId: string): Promise<AuthenticatedUser | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user ? mapUser(user) : null;
}

export async function getMembership(
  userId: string,
  organizationId: string,
): Promise<OrganizationMembership | null> {
  const [membership] = await db
    .select({
      organizationId: organizationMembers.organizationId,
      organizationName: organizations.name,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!membership) {
    return null;
  }

  return {
    organizationId: membership.organizationId,
    organizationName: membership.organizationName,
    role: membership.role as OrganizationMembership['role'],
  };
}

export async function listMemberships(userId: string): Promise<OrganizationMembership[]> {
  const rows = await db
    .select({
      organizationId: organizationMembers.organizationId,
      organizationName: organizations.name,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(eq(organizationMembers.userId, userId));

  return rows.map((row) => ({
    organizationId: row.organizationId,
    organizationName: row.organizationName,
    role: row.role as OrganizationMembership['role'],
  }));
}

function mapUser(user: typeof users.$inferSelect): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    defaultOrganizationId: user.defaultOrganizationId ?? null,
  };
}
