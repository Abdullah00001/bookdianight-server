import { Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import {
  getClubReviewsService,
  createReviewService,
} from '@/app/modules/reviews/reviews.services';

/**
 * This controller is used to retrieve all reviews of a club
 * @param req Request
 * @param res Response
 * @returns Promise<void>
 */
export const getClubReviewsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    await getClubReviewsService();

    res.status(200).json({
      success: true,
      message: 'All reviews retrieve successful',
      traceId,
    });
    return;
  }
);

/**
 * This controller is used to create a review
 * @param req Request
 * @param res Response
 * @returns Promise<void>
 */
export const createReviewController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    await createReviewService();

    res.status(201).json({
      success: true,
      message: 'Review created successfully.',
      traceId,
    });
    return;
  }
);
