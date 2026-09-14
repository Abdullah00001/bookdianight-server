import { Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import { User } from '@prisma/client';
import { createClubService, updateClubService, getClubListService, getClubDetailService } from '@/app/modules/club/club.services';
import { TCreateClubPayload, TUpdateClubPayload, TClubListQuery } from '@/app/modules/club/club.schema';
import { buildPaginationLinks } from '@/app/modules/explore/explore.helpers';

/**
 * Controller for handling Club creation requests.
 * Calls the createClubService to create a new Club.
 * Returns the created Club and trace ID.
 * @param req
 * @param res
 */
export const createClubController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;
    const payload = req.body as TCreateClubPayload;

    const club = await createClubService({ userId: user.id, payload });

    res.status(201).json({
      success: true,
      message: 'Club created successfully',
      data: club,
      traceId,
    });
  }
);

/**
 * Controller for handling Club update requests.
 * Calls the updateClubService to update an existing Club.
 * Returns the updated Club and trace ID.
 * @param req
 * @param res
 */
export const updateClubController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;
    const id = req.params.id as string;
    const payload = req.body as TUpdateClubPayload;

    const club = await updateClubService({ clubId: id, userId: user.id, payload });

    res.status(200).json({
      success: true,
      message: 'Club updated successfully',
      data: club,
      traceId,
    });
  }
);

/**
 * Controller for handling GET /api/v1/club (List Clubs)
 * Returns a paginated list of clubs owned by the authenticated user.
 */
export const getClubListController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;
    
    const query = (req.validatedQuery || req.query) as unknown as TClubListQuery;

    const { data, total } = await getClubListService({ userId: user.id, query });

    const totalPages = Math.ceil(total / query.limit);
    const links = buildPaginationLinks(req, query.page, totalPages);

    res.status(200).json({
      success: true,
      message: 'Clubs retrieved successfully',
      meta: {
        total,
        totalPages,
        links
      },
      data,
      traceId,
    });
  }
);

/**
 * Controller for handling GET /api/v1/club/:id (Detail Club)
 * Returns the full details of a club if it belongs to the authenticated user.
 */
export const getClubDetailController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;
    const id = req.params.id as string;

    const club = await getClubDetailService({ clubId: id, userId: user.id });

    res.status(200).json({
      success: true,
      message: 'Club details retrieved successfully',
      data: club,
      traceId,
    });
  }
);
