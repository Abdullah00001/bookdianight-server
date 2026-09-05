import { z } from 'zod';

/**
 * Schema for user signup.
 */
export const signupSchema = z
  .object({
    role: z.enum(['CLUB_OWNER', 'USER']),
    name: z.string().min(1, 'Name is required'),
    email: z.email('Invalid email'),
    phoneNumber: z.string().min(5, 'Phone number is required'),
    location: z.string().min(1, 'Location is required'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    fcmToken: z.string().min(1, 'FCM Token is required'),
    lat: z.number(),
    lng: z.number(),
    platform: z.enum(['ANDROID', 'IOS']),
  })
  .strict();

/**
 * Type for user signup.
 */
export type TSignupPayload = z.infer<typeof signupSchema>;

/**
 * Schema for verifying signup user.
 */
export const verifySignupUserSchema = z
  .object({
    otp: z
      .string()
      .trim()
      .min(1, 'OTP cannot be empty')
      .length(6, 'OTP must be exactly 6 characters long')
      .regex(/^\d+$/, 'OTP must contain numbers only'),
  })
  .strict();

/**
 * Type for verifying signup user.
 */
export type TVerifySignupUserPayload = z.infer<typeof verifySignupUserSchema>;

export const checkAccessTokenSchema = z
  .object({
    lat: z.number(),
    lng: z.number(),
    platform: z.enum(['ANDROID', 'IOS']),
    fcmToken: z.string().min(1, 'FCM Token is required'),
  })
  .strict();

/**
 * Type for check access token.
 */
export type TCheckAccessTokenPayload = z.infer<typeof checkAccessTokenSchema>;
