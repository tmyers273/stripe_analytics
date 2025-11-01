import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../types';
import { requireAuth } from '../middleware/auth';
import { createOrganizationSchema, addMemberSchema } from '../schemas/organization';
import { listMemberships, getMembership } from '../services/authService';
import {
  createOrganizationForUser,
  ensureMemberCanManage,
  addMemberByEmail,
  removeMember,
  listOrganizationMembers,
} from '../services/organizationService';
import { setSessionActiveOrganization } from '../services/sessionService';

export const organizationsRoutes = new Hono<Env>();

organizationsRoutes.get('/', requireAuth, async (c) => {
  const user = c.get('user');

  if (!user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const memberships = await listMemberships(user.id);
  return c.json({ success: true, memberships });
});

organizationsRoutes.post(
  '/',
  requireAuth,
  zValidator('json', createOrganizationSchema),
  async (c) => {
    const user = c.get('user');
    const session = c.get('session');
    const { name } = c.req.valid('json');

    if (!user || !session) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const organization = await createOrganizationForUser(user.id, name);
    await setSessionActiveOrganization(session.id, organization.id);

    const memberships = await listMemberships(user.id);

    return c.json({
      success: true,
      organization,
      memberships,
      activeOrganizationId: organization.id,
    });
  },
);

organizationsRoutes.get('/:id/members', requireAuth, async (c) => {
  const user = c.get('user');
  const organizationId = c.req.param('id');

  if (!user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const membership = await getMembership(user.id, organizationId);

  if (!membership) {
    return c.json({ success: false, error: 'Not a member' }, 403);
  }

  const members = await listOrganizationMembers(organizationId);

  return c.json({
    success: true,
    members,
  });
});

organizationsRoutes.post(
  '/:id/members',
  requireAuth,
  zValidator('json', addMemberSchema),
  async (c) => {
    const user = c.get('user');
    const organizationId = c.req.param('id');
    const body = c.req.valid('json');

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    try {
      await ensureMemberCanManage(user.id, organizationId);
      await addMemberByEmail({ organizationId, email: body.email, role: body.role });
      const members = await listOrganizationMembers(organizationId);
      return c.json({ success: true, members });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Not authorized to manage organization') {
          return c.json({ success: false, error: error.message }, 403);
        }
        if (error.message === 'User not found') {
          return c.json({ success: false, error: error.message }, 404);
        }
      }

      console.error(error);
      return c.json({ success: false, error: 'Failed to add member' }, 500);
    }
  },
);

organizationsRoutes.delete('/:id/members/:userId', requireAuth, async (c) => {
  const user = c.get('user');
  const organizationId = c.req.param('id');
  const memberId = c.req.param('userId');

  if (!user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    await ensureMemberCanManage(user.id, organizationId);
    await removeMember({ organizationId, userId: memberId });
    const members = await listOrganizationMembers(organizationId);
    return c.json({ success: true, members });
  } catch (error) {
    if (error instanceof Error && error.message === 'Cannot remove the last owner') {
      return c.json({ success: false, error: error.message }, 400);
    }

    console.error(error);
    return c.json({ success: false, error: 'Failed to remove member' }, 500);
  }
});
