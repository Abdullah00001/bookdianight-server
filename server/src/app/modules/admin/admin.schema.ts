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

/**
 * Schema for changing admin password.
 */
export const changeAdminPasswordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Password must be at least 6 characters long'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters long'),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Type for changing admin password.
 */
export type TChangeAdminPasswordPayload = z.infer<typeof changeAdminPasswordSchema>;

/**
 * Schema for updating commission configuration.
 */
export const updateCommissionSchema = z
  .object({
    serviceType: z.enum(['EVENT', 'CLUB']),
    chargePercentage: z.number(),
  })
  .strict();

/**
 * Type for updating commission configuration.
 */
export type TUpdateCommissionPayload = z.infer<typeof updateCommissionSchema>;
