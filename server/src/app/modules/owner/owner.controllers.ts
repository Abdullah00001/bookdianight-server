import { Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import { User } from '@prisma/client';
import { getOwnerDashboardService, getOwnerEarningsService, getOwnerPaymentsService } from '@/app/modules/owner/owner.services';
import { buildPaginationLinks } from '@/app/modules/explore/explore.helpers';

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

export const getOwnerEarningsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;

    const query = req.validatedQuery as { year?: number };
    const yearQuery = query?.year ? Number(query.year) : undefined;

    const earnings = await getOwnerEarningsService({
      userId: user.id,
      year: yearQuery,
    });

    res.status(200).json({
      success: true,
      message: 'Earnings retrieved successfully',
      data: earnings,
      traceId,
    });
  }
);

export const getOwnerPaymentsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;

    const query = req.validatedQuery as import('@/app/modules/owner/owner.types').TOwnerPaymentsQuery;

    const { meta, data } = await getOwnerPaymentsService({
      userId: user.id,
      query,
    });

    const links = buildPaginationLinks(req, meta.page, meta.totalPages);

    res.status(200).json({
      success: true,
      message: 'Payments retrieved successfully',
      meta: {
        ...meta,
        links,
      },
      data,
      traceId,
    });
  }
);
