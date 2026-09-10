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

export const verifyRecoverUserController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    await verifyRecoverUserService();

    res.status(200).json({
      success: true,
      message: 'User verification successful',
      traceId,
    });
    return;
  }
);

export const recoverUserPasswordResetController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    await recoverUserPasswordResetService();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      traceId,
    });
    return;
  }
);

export const recoverUserVerificationOtpResendController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    await recoverUserVerificationOtpResendService();

    res.status(200).json({
      success: true,
      message: 'Otp Resend successful ',
      traceId,
    });
    return;
  }
);
