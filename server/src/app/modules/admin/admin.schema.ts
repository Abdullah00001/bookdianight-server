import { z } from 'zod';

/**
 * Schema for admin login.
 */
export const adminLoginSchema = z.object({
  email: z.email({ error: 'Invalid email address' }),
  password: z.string().min(6, { error: 'Password must be at least 6 characters long' }),
});

/**
 * Type for admin login.
 */
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
