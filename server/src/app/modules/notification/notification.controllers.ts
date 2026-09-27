import { Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import {
  getNotificationListService,
  readNotificationService,
  readAllNotificationsService,
  getUnreadNotificationCountService
} from '@/app/modules/notification/notification.services';
import { User } from '@prisma/client';
import { buildPaginationLinks } from '@/app/modules/explore/explore.helpers';

/**
 * Controller to handle fetching a paginated list of notifications for the authenticated user.
 * Parses page and limit from query parameters and calls getNotificationListService.
 * Returns the notifications along with pagination meta data and links.
 *
 * @param req Express Request object
 * @param res Express Response object
 */
export const getNotificationListController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const result = await getNotificationListService({ userId: user.id, page, limit });
    const links = buildPaginationLinks(req, result.meta.page, result.meta.totalPages);
    
    res.status(200).json({
      success: true,
      message: 'Notifications fetched successfully',
      traceId,
      meta: {
        ...result.meta,
        links,
      },
      data: result.data,
    });
  }
);

/**
 * Controller to mark a specific notification as read.
 * Validates ownership within the service.
 *
 * @param req Express Request object
 * @param res Express Response object
 */
export const readNotificationController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;
    const notificationId = req.params.id as string;

    const result = await readNotificationService({ userId: user.id, notificationId });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      traceId,
      data: result,
    });
  }
);

/**
 * Controller to mark all unread notifications for the authenticated user as read.
 *
 * @param req Express Request object
 * @param res Express Response object
 */
export const readAllNotificationsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;

    const result = await readAllNotificationsService({ userId: user.id });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      traceId,
      data: result,
    });
  }
);

/**
 * Controller to fetch the total count of unread notifications for the authenticated user.
 *
 * @param req Express Request object
 * @param res Express Response object
 */
export const getUnreadNotificationCountController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;

    const result = await getUnreadNotificationCountService({ userId: user.id });

    res.status(200).json({
      success: true,
      message: 'Unread notification count fetched successfully',
      traceId,
      data: result,
    });
  }
);
