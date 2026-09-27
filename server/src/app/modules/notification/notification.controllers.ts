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

export const getNotificationListController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const result = await getNotificationListService({ userId: user.id, page, limit });
    
    res.status(200).json({
      success: true,
      message: 'Notifications fetched successfully',
      traceId,
      meta: result.meta,
      data: result.data,
    });
  }
);

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
