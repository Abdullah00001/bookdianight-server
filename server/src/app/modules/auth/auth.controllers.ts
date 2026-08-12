import { Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import { signupService } from '@/app/modules/auth/auth.services';
import { TSignupPayload } from '@/app/modules/auth/auth.schema';

export const signupController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const payload = req.body as TSignupPayload;
    await signupService({ payload });

    res.status(201).json({
      success: true,
      message:
        'Signup successful. Please check your email for the verification OTP.',
      traceId,
    });
    return;
  }
);
