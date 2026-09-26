import { Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import { JwtPayload } from 'jsonwebtoken';
import {
  retrieveLoggedInUserBookingsService,
  retrieveLoggedInUserSingleBookingsService,
} from '@/app/modules/bookings/bookings.services';
import {
  TRetrieveLoggedInUserBookingsQuery,
  TRetrieveLoggedInUserSingleBookingsQuery,
} from '@/app/modules/bookings/bookings.schema';
import { buildPaginationLinks } from '@/app/modules/explore/explore.helpers';

/**
 * This controller is used to retrieve all bookings of logged in user
 * @param req Request
 * @param res Response
 * @returns Promise<void>
 */
export const retrieveLoggedInUserBookingsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const query = req.validatedQuery as TRetrieveLoggedInUserBookingsQuery;
    const userId = (req.user as JwtPayload).sub as string;

    const { data, total, totalPages } = await retrieveLoggedInUserBookingsService({
      query,
      userId,
    });

    const links = buildPaginationLinks(req, query.page, totalPages);

    res.status(200).json({
      success: true,
      message: 'All bookings retrieve successful',
      data,
      meta: {
        total,
        totalPages,
        links,
      },
      traceId,
    });
    return;
  }
);

/**
 * This controller is used to retrieve single booking of logged in user
 * @param req Request
 * @param res Response
 * @returns Promise<void>
 */
export const retrieveLoggedInUserSingleBookingsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const id = req.params.id as string;
    const query = req.validatedQuery as TRetrieveLoggedInUserSingleBookingsQuery;
    const userId = (req.user as JwtPayload).sub as string;

    const data = await retrieveLoggedInUserSingleBookingsService({ id, query, userId });

    res.status(200).json({
      success: true,
      message: 'Retrieve single booking successful',
      data,
      traceId,
    });
    return;
  }
);
