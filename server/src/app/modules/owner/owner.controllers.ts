import { Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import { User } from '@prisma/client';
import { getOwnerDashboardService } from '@/app/modules/owner/owner.services';

export const getOwnerDashboardController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;

    const dashboard = await getOwnerDashboardService({ userId: user.id });

    res.status(200).json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: dashboard,
      traceId,
    });
  }
);
