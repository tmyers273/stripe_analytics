import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
});

export const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member'),
});

export const removeMemberSchema = z.object({
  userId: z.string().uuid(),
});
