import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  organizationName: z.string().min(1, 'Organization name is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const switchOrganizationSchema = z.object({
  organizationId: z.string().uuid(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  password: z.string().min(8).optional(),
  currentPassword: z.string().min(1).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['owner', 'admin', 'member']).default('member'),
});

export const removeMemberSchema = z.object({
  userId: z.string().uuid(),
});
