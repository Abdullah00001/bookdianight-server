import { NextFunction, Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import { getRedisClient } from '@/app/configs/redis.configs';
import { REDIS_PREFIXES } from '@/const';
import { createRedisKey } from '@/app/utils/system.utils';
import { User } from '@prisma/client';
import { getConnectStatusService } from '@/app/modules/connect/connect.services';
import { TConnectCallbackQuery } from '@/app/modules/connect/connect.schema';

/**
 * Validates the trusted Connect callback token and attaches its owner context.
 *
 * @param req Request
 * @param res Response
 * @param next NextFunction
 * @returns Promise<void>
 */
export const checkConnectCallbackTokenMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const traceId = getTraceId();
    const { token } = req.validatedQuery as TConnectCallbackQuery;
    const userId = await getRedisClient().get(
      createRedisKey(REDIS_PREFIXES.connectOnboarding, token)
    );
    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired Connect callback',
        traceId,
      });
      return;
    }
    req.connectCallbackUserId = userId;
    next();
  }
);

/**
 * Requires a Club Owner to have a ready Stripe Connect account for listing access.
 *
 * @param req Request
 * @param res Response
 * @param next NextFunction
 * @returns Promise<void>
 */
export const checkConnectReadinessMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const traceId = getTraceId();
    const status = await getConnectStatusService({
      userId: (req.user as User).id,
    });
    if (!status.canCreateListings) {
      res.status(403).json({
        success: false,
        message: 'Complete Stripe Connect setup before managing listings',
        traceId,
      });
      return;
    }
    next();
  }
);
