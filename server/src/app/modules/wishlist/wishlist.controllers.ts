import { Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import { User } from '@prisma/client';
import { createWishlistService, removeWishlistService, getWishlistService } from '@/app/modules/wishlist/wishlist.services';
import { TCreateWishlistPayload, TGetWishlistQuery } from '@/app/modules/wishlist/wishlist.schema';
import { buildPaginationLinks } from '@/app/modules/explore/explore.helpers';

/**
 * Controller for handling Wishlist addition requests.
 * Calls the createWishlistService to add a Club or Event to the user's wishlist.
 * @param req
 * @param res
 */
export const createWishlistController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;
    const payload = req.body as TCreateWishlistPayload;

    await createWishlistService({
      userId: user.id,
      payload
    });

    res.status(200).json({
      success: true,
      message: 'Added to wishlist successfully',
      traceId
    });
  }
);

/**
 * Controller for handling Wishlist removal requests.
 * Calls the removeWishlistService to remove a Club or Event from the user's wishlist.
 * @param req
 * @param res
 */
export const removeWishlistController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;
    const { type, targetId } = req.params as { type: 'CLUB' | 'EVENT'; targetId: string };

    await removeWishlistService({
      userId: user.id,
      type,
      targetId
    });

    res.status(200).json({
      success: true,
      message: 'Removed from wishlist successfully',
      traceId
    });
  }
);

/**
 * Controller for handling Wishlist retrieval requests.
 * Calls the getWishlistService to retrieve a paginated list of active Clubs and UPCOMING Events.
 * @param req
 * @param res
 */
export const getWishlistController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;
    const query = (req.validatedQuery || req.query) as unknown as TGetWishlistQuery;

    const result = await getWishlistService({
      userId: user.id,
      query
    });

    const totalPages = Math.ceil(result.total / query.limit);

    res.status(200).json({
      success: true,
      message: 'Wishlist retrieved successfully',
      meta: {
        total: result.total,
        totalPages,
        links: buildPaginationLinks(req, query.page, totalPages)
      },
      data: result.data,
      traceId
    });
  }
);
