import { z } from 'zod';
import { Gender } from '@prisma/client';

/**
 * Schema for updating user profile.
 */
export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  phoneNumber: z.string().min(1, 'Phone number is required').optional(),
  location: z.string().optional(),
  gender: z.enum(Gender).optional(),
  dateOfBirth: z.iso.datetime().optional(),
  profileAvatar: z.url('Invalid avatar URL').optional(),
  profileCover: z.url('Invalid cover URL').optional(),
});

/**
 * Type for updating user profile.
 */
export type TUpdateProfilePayload = z.infer<typeof updateProfileSchema>;

/**
 * Schema for changing user password.
 */
export const changePasswordSchema = z
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
 * Type for changing user password.
 */
export type TChangePasswordPayload = z.infer<typeof changePasswordSchema>;

