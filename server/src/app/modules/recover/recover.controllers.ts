import { Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import {
  findRecoverUserService,
  verifyRecoverUserService,
  recoverUserPasswordResetService,
  recoverUserVerificationOtpResendService,
} from '@/app/modules/recover/recover.services';
import { COOKIE_NAMES, resetOtpPageTokenExpiresIn } from '@/const';
import { cookieOption } from '@/app/utils/cookie.utils';
import { User } from '@prisma/client';

/**
 * This controller is used to find the user for the password reset.
 * @param req Request
 * @param res Response
 * @returns Promise<void>  
 */
export const findRecoverUserController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const { isAdmin, token } = await findRecoverUserService({ req });
    if (isAdmin) {
      res.cookie(
        COOKIE_NAMES.RECOVER_PAGE_TOKEN,
        token,
        cookieOption(resetOtpPageTokenExpiresIn)
      );
      res.status(200).json({
        success: true,
        message: 'Recover user found and otp send successfully',
        traceId,
      });
      return;
    }
    res.status(200).json({
      success: true,
      message: 'Recover user found and otp send successfully',
      data: { token },
      traceId,
    });
    return;
  }
);

/**
 * This controller is used to verify the OTP of the user.
 * @param req Request
 * @param res Response
 * @returns Promise<void>  
 */
export const verifyRecoverUserController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;
    await verifyRecoverUserService({ user });
    res.status(200).json({
      success: true,
      message: 'User verification successful',
      traceId,
    });
    return;
  }
);

/**
 * This controller is used to reset the password of the user.
 * @param req Request
 * @param res Response
 * @returns Promise<void>  
 */
export const recoverUserPasswordResetController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const { isAdmin } = await recoverUserPasswordResetService({ req });
    if (isAdmin) {
      res.clearCookie(COOKIE_NAMES.RECOVER_PAGE_TOKEN);
    }
    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      traceId,
    });
    return;
  }
);

/**
 * This controller is used to resend the OTP of the user.
 * @param req Request
 * @param res Response
 * @returns Promise<void>  
 */
export const recoverUserVerificationOtpResendController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    await recoverUserVerificationOtpResendService({ req });
    res.status(200).json({
      success: true,
      message: 'Otp Resend successful ',
      traceId,
    });
    return;
  }
);
