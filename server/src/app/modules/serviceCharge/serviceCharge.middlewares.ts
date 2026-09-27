import { NextFunction, Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import prisma from '@/app/configs/db.configs';
import { asyncHandler } from '@/app/utils/system.utils';

const GLOBAL_SERVICE_CHARGE_ID = 'GLOBAL';

/**
 * Checks that the global Service Charge configuration exists.
 * Attaches the trusted configuration to the request for downstream handlers.
 *
 * @param req Request
 * @param res Response
 * @param next NextFunction
 * @returns Promise<void>
 */
export const checkServiceChargeExistenceMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const traceId = getTraceId();
    const serviceCharge = await prisma.serviceCharge.findUnique({
      where: { id: GLOBAL_SERVICE_CHARGE_ID },
    });

    if (!serviceCharge) {
      res.status(404).json({
        success: false,
        message: 'Service Charge configuration not found',
        traceId,
      });
      return;
    }

    req.serviceCharge = serviceCharge;
    next();
  }
);
