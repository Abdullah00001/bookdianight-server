import { Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import {
  getClubReviewsService,
  createReviewService,
} from '@/app/modules/reviews/reviews.services';
import { User } from '@prisma/client';
import { TCreateReviewPayload } from '@/app/modules/reviews/reviews.schema';

/**
 * This controller is used to retrieve all reviews of a club
 * @param req Request
 * @param res Response
 * @returns Promise<void>
 */
export const getClubReviewsController = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
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
    const user = req.user as User;
    const payload = req.body as TCreateReviewPayload;

    const data = await createReviewService({
      userId: user.id,
      payload,
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully.',
      data,
      traceId,
    });
    return;
  }
);
