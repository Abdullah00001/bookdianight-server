import { Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import {
  retrieveLoggedInUserBookingsService,
  retrieveLoggedInUserSingleBookingsService,
} from '@/app/modules/bookings/bookings.services';

/**
 * This controller is used to retrieve all bookings of logged in user
 * @param req Promise<void>
 * @param res Promise<void>
 * @returns Promise<void>
 */
export const retrieveLoggedInUserBookingsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    await retrieveLoggedInUserBookingsService();

    res.status(200).json({
      success: true,
      message: 'All bookings retrieve successful',
      traceId,
    });
    return;
  }
);

/**
 * This controller is used to retrieve single booking of logged in user
 * @param req Promise<void>
 * @param res Promise<void>
 * @returns Promise<void>
 */
export const retrieveLoggedInUserSingleBookingsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    await retrieveLoggedInUserSingleBookingsService();

    res.status(200).json({
      success: true,
      message: 'Retrieve single booking successful',
      traceId,
    });
    return;
  }
);
