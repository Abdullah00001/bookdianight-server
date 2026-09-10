import z from 'zod';

/**
 * Schema for find recover user by email schema.
 */
export const findRecoverUserByEmailSchema = z
  .object({
    email: z.email({ message: 'Invalid email address' }),
  })
  .strict();

/**
 * Type for find recover user by email schema.
 */
export type TFindRecoverUserByEmailPayload = z.infer<
  typeof findRecoverUserByEmailSchema
>;

/**
 * Schema for verifying recover user otp.
 */
export const verifyRecoverUserOtpSchema = z
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
 * Type for verifying recover user otp.
 */
export type TVerifyRecoverUserOtpPayload = z.infer<
  typeof verifyRecoverUserOtpSchema
>;

/**
 * Schema for resetting recover user password.
 */
export const resetRecoverUserPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

/**
 * Type for resetting recover user password.
 */
export type TResetRecoverUserOtpPayload = z.infer<typeof resetRecoverUserPasswordSchema>;
