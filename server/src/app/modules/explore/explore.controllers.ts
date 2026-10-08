import { Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import { exploreListService, exploreDetailService, getSharePreviewHtmlService } from '@/app/modules/explore/explore.services';
import { TExploreQuery, TExploreDetailQuery } from '@/app/modules/explore/explore.schema';
import { buildPaginationLinks } from '@/app/modules/explore/explore.helpers';
import { JwtPayload } from 'jsonwebtoken';

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
    const userId = req.user ? (req.user as JwtPayload).sub : undefined;

    const { data, total } = await exploreListService({ query, userId });

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
    const userId = req.user ? (req.user as JwtPayload).sub : undefined;

    const data = await exploreDetailService({ id, query, userId });

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

export const getAppleAppSiteAssociationController = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      applinks: {
        details: [
          {
            appIDs: ['3Z64Z2KU2S.com.bookdianightltd.bookdianightapp'],
            components: [{ '/': '/club/*' }, { '/': '/event/*' }],
          },
        ],
      },
    });
  }
);

export const getAndroidAssetLinksController = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json([
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: 'com.bookdianightltd.bookdianightapp',
          sha256_cert_fingerprints: [
            '45:1C:1D:8D:B0:D3:AC:E9:32:D1:EC:77:31:D9:44:96:57:1E:0B:76:EF:E4:8E:64:82:D2:19:75:A4:F9:4D:87',
          ],
        },
      },
    ]);
  }
);

export const getClubSharePreviewController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const html = await getSharePreviewHtmlService({ id, type: 'CLUB' });
    
    if (!html) {
      res.status(404).send('<!DOCTYPE html><html><body><h1>404 - Club Not Found</h1></body></html>');
      return;
    }
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  }
);

export const getEventSharePreviewController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const html = await getSharePreviewHtmlService({ id, type: 'EVENT' });
    
    if (!html) {
      res.status(404).send('<!DOCTYPE html><html><body><h1>404 - Event Not Found</h1></body></html>');
      return;
    }
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  }
);
