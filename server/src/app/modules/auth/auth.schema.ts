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
    deviceIdentifier: z.string().min(1, 'Device Identifier is required'),
    fcmToken: z.string().optional(),
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
    deviceIdentifier: z.string().min(1, 'Device Identifier is required'),
    fcmToken: z.string().optional(),
    platform: z.enum(['ANDROID', 'IOS']),
  })
  .strict();

/**
 * Type for verifying signup user.
 */
export type TVerifySignupUserPayload = z.infer<typeof verifySignupUserSchema>;

/**
 * Schema for check access token.
 */
export const checkAccessTokenSchema = z
  .object({
    deviceIdentifier: z.string().min(1, 'Device Identifier is required'),
    lat: z.number(),
    lng: z.number(),
    platform: z.enum(['ANDROID', 'IOS']),
    fcmToken: z.string().optional(),
  })
  .strict();

/**
 * Type for check access token.
 */
export type TCheckAccessTokenPayload = z.infer<typeof checkAccessTokenSchema>;

/**
 * Schema for user login.
 */
export const loginSchema = z
  .object({
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    deviceIdentifier: z.string().min(1, 'Device Identifier is required'),
    platform: z.enum(['ANDROID', 'IOS']),
    fcmToken: z.string().optional(),
    rememberMe: z.boolean().optional().default(false),
  })
  .strict();

/**
 * Type for user login.
 */
export type TLoginPayload = z.infer<typeof loginSchema>;
