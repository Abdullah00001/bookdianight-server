import prisma from '@/app/configs/db.configs';
import { Notification } from '@prisma/client';
import {
  IGetNotificationListParams,
  IReadNotificationParams,
  IReadAllNotificationsParams,
  IGetUnreadCountParams
} from './notification.types';

export interface IPaginatedResponse<T> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
  data: T;
}

export const getNotificationListService = async (
  params: IGetNotificationListParams
): Promise<IPaginatedResponse<Notification[]>> => {
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
      totalPage: Math.ceil(total / limit),
    },
    data,
  };
};

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

export const getUnreadNotificationCountService = async (
  params: IGetUnreadCountParams
): Promise<{ unreadCount: number }> => {
  const { userId } = params;

  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return { unreadCount: count };
};
