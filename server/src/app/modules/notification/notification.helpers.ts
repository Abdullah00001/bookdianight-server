import { NotificationType } from '@prisma/client';
import { getNotificationQueue } from '@/app/queues/notification/notification.queue';
import { QUEUE_JOBS } from '@/const';
import logger from '@/app/configs/logger.configs';

export const sendPushNotification = async (params: {
  userIds: string[];
  notificationType: NotificationType;
  title: string;
  description?: string;
  metaData?: any;
}) => {
  try {
    await getNotificationQueue().add(QUEUE_JOBS.SEND_FCM_NOTIFICATION, params, {
      removeOnComplete: true,
      removeOnFail: false,
    });
  } catch (error) {
    logger.error('Failed to dispatch SEND_FCM_NOTIFICATION job', error);
  }
};
