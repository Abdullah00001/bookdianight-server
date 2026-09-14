import { Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import { exploreListService, exploreDetailService } from '@/app/modules/explore/explore.services';
import { TExploreQuery, TExploreDetailQuery } from '@/app/modules/explore/explore.schema';
import { buildPaginationLinks } from '@/app/modules/explore/explore.helpers';

/**
 * Controller for handling Explore list requests.
 * Calls the exploreListService to fetch paginated clubs and events.
 * Returns the data with pagination metadata and trace ID.
 * @param req
 * @param res
 */
export const exploreListController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const query = (req.validatedQuery || req.query) as unknown as TExploreQuery;

    const { data, total } = await exploreListService({ query });

    const totalPages = Math.ceil(total / query.limit);
    const links = buildPaginationLinks(req, query.page, totalPages);

    res.status(200).json({
      success: true,
      message: 'Data retrieved successfully',
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
 * Controller for handling Explore detail requests.
 * Calls the exploreDetailService to fetch a specific club or event.
 * Returns the detail data and trace ID.
 * @param req
 * @param res
 */
export const exploreDetailController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const id = req.params.id as string;
    const query = (req.validatedQuery || req.query) as unknown as TExploreDetailQuery;

    const data = await exploreDetailService({ id, query });

    if (!data) {
      res.status(404).json({
        success: false,
        message: 'Resource not found',
        traceId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Data retrieved successfully',
      data,
      traceId,
    });
  }
);
