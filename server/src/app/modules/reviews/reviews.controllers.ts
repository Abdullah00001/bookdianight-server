import { Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import {
  getClubReviewsService,
  createReviewService,
} from '@/app/modules/reviews/reviews.services';
import { User } from '@prisma/client';
import { TCreateReviewPayload, TGetClubReviewsQuery } from '@/app/modules/reviews/reviews.schema';
import { buildPaginationLinks } from '@/app/modules/explore/explore.helpers';

/**
 * This controller is used to retrieve all reviews of a club
 * @param req Request
 * @param res Response
 * @returns Promise<void>
 */
export const getClubReviewsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const clubId = req.params.clubId as string;
    const query = (req.validatedQuery || req.query) as unknown as TGetClubReviewsQuery;

    const { total, averageRating, reviews } = await getClubReviewsService({ clubId, query });

    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    const links = buildPaginationLinks(req, query.page, totalPages);

    res.status(200).json({
      success: true,
      message: 'All reviews retrieve successful',
      meta: {
        total,
        totalPages,
        links,
      },
      data: {
        averageRating,
        reviews,
      },
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
