import { Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import { signupService, verifySignupUserService, resendOtpService } from '@/app/modules/auth/auth.services';
import {
  TSignupPayload
} from '@/app/modules/auth/auth.schema';
import { User } from '@prisma/client';
import { extractToken } from '@/app/utils/jwt.utils';

/**
 * Controller for handling signup requests.
 * Calls the signup service to create a new user.
 * Returns the user token and trace ID.
 * @param req
 * @param res
 */
export const signupController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const payload = req.body as TSignupPayload;
    const data = await signupService({ payload });
    res.status(201).json({
      success: true,
      message:
        'Signup successful. Please check your email for the verification OTP.',
      data,
      traceId,
    });
    return;
  }
);

/**
 * Controller for handling verify signup user requests.
 * Calls the verify signup service to verify the user.
 * Returns the trace ID.
 * @param req
 * @param res
 */
export const verifySignupUserController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;
    const token = extractToken(req) as string;
    const data = await verifySignupUserService({  user, token });
    res.status(200).json({
      success: true,
      message: 'Account verification successful',
      data,
      traceId,
    });
    return;
  }
);

/**
 * Controller for handling resend OTP requests.
 * Calls the resend OTP service to resend the OTP.
 * Returns the trace ID.
 * @param req
 * @param res
 */
export const resendOtpController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user=req.user as User;
    await resendOtpService({user});
    res.status(200).json({
      success: true,
      message: 'Otp resend successful',
      traceId
    });
    return;
  }
);
