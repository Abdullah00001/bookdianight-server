import { z } from 'zod';

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type TAdminLoginPayload = z.infer<typeof adminLoginSchema>;

/**
 * Schema for updating admin profile.
 */
export const updateAdminProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  phoneNumber: z.string().min(1, 'Phone number is required').optional(),
  profileAvatar: z.url('Invalid avatar URL').optional(),
});

/**
 * Type for updating admin profile.
 */
export type TUpdateAdminProfilePayload = z.infer<typeof updateAdminProfileSchema>;
