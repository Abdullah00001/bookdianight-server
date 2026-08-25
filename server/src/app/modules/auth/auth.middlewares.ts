import { NextFunction, Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import { TSignupPayload } from '@/app/modules/auth/auth.schema';
import prisma from '@/app/configs/db.configs';

export const checkSignupUserExists = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = getTraceId();
    const { email } = req.body as TSignupPayload;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exist',
        traceId,
      });
    }
    return next();
  }
);
