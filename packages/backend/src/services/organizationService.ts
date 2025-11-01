import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import {
  organizationMembers,
  organizations,
  users,
} from '../db/schema';
import type { OrganizationMembership } from './authService';

export async function createOrganizationForUser(userId: string, name: string) {
  const result = await db.transaction(async (tx) => {
    const [organization] = await tx
      .insert(organizations)
      .values({ name })
      .returning();

    await tx
      .insert(organizationMembers)
      .values({ organizationId: organization.id, userId, role: 'owner' });

    await tx
      .update(users)
      .set({ defaultOrganizationId: organization.id })
      .where(eq(users.id, userId));

    return organization;
  });

  return result;
}

export async function ensureMemberCanManage(
  userId: string,
  organizationId: string,
): Promise<OrganizationMembership> {
  const [membership] = await db
    .select({
      organizationId: organizationMembers.organizationId,
      role: organizationMembers.role,
      organizationName: organizations.name,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(and(eq(organizationMembers.userId, userId), eq(organizationMembers.organizationId, organizationId)));

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    throw new Error('Not authorized to manage organization');
  }

  return {
    organizationId: membership.organizationId,
    organizationName: membership.organizationName,
    role: membership.role,
  };
}

export async function addMemberByEmail(options: {
  organizationId: string;
  email: string;
  role: 'admin' | 'member';
}): Promise<void> {
  const email = options.email.toLowerCase();

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new Error('User not found');
  }

  await db
    .insert(organizationMembers)
    .values({
      organizationId: options.organizationId,
      userId: user.id,
      role: options.role,
    })
    .onConflictDoNothing({
      target: [organizationMembers.organizationId, organizationMembers.userId],
    });
}

export async function removeMember(options: {
  organizationId: string;
  userId: string;
}): Promise<void> {
  const members = await db
    .select()
    .from(organizationMembers)
    .where(eq(organizationMembers.organizationId, options.organizationId));

  const owners = members.filter((member) => member.role === 'owner');
  const removingOwner = owners.some((owner) => owner.userId === options.userId);

  if (removingOwner && owners.length <= 1) {
    throw new Error('Cannot remove the last owner');
  }

  await db
    .delete(organizationMembers)
    .where(and(eq(organizationMembers.organizationId, options.organizationId), eq(organizationMembers.userId, options.userId)));
}

export async function listOrganizationMembers(organizationId: string) {
  return db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(organizationMembers.userId, users.id))
    .where(eq(organizationMembers.organizationId, organizationId));
}
