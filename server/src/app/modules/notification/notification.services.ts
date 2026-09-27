import prisma from '@/app/configs/db.configs';
import { Notification } from '@prisma/client';
import {
  IGetNotificationListParams,
  IReadNotificationParams,
  IReadAllNotificationsParams,
  IGetUnreadCountParams,
  INotificationPaginatedResponse
} from '@/app/modules/notification/notification.types';

/**
 * Service to fetch a paginated list of notifications for a user.
 * @param params Object containing userId, page, and limit
 * @returns INotificationPaginatedResponse containing meta and data
 */
export const getNotificationListService = async (
  params: IGetNotificationListParams
): Promise<INotificationPaginatedResponse<Notification[]>> => {
  const { userId, page, limit } = params;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data,
  };
};

/**
 * Service to mark a single notification as read.
 * @param params Object containing userId and notificationId
 * @returns The updated notification
 */
export const readNotificationService = async (
  params: IReadNotificationParams
): Promise<Notification> => {
  const { userId, notificationId } = params;

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== userId) {
    throw { statusCode: 404, message: 'Notification not found' };
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

/**
 * Service to mark all unread notifications of a user as read.
 * @param params Object containing userId
 * @returns Count of updated notifications
 */
export const readAllNotificationsService = async (
  params: IReadAllNotificationsParams
): Promise<{ count: number }> => {
  const { userId } = params;

  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return { count: result.count };
};

/**
 * Service to retrieve the count of unread notifications for a user.
 * @param params Object containing userId
 * @returns The count of unread notifications
 */
export const getUnreadNotificationCountService = async (
  params: IGetUnreadCountParams
): Promise<{ unreadCount: number }> => {
  const { userId } = params;

  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return { unreadCount: count };
};
