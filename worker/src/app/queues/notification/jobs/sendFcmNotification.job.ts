import { Job } from 'bullmq';
import { IJobHandler } from '@/app/@types/queue.types';
import { ISendFcmNotification } from '@/app/queues/notification/notification.types';
import { QUEUE_JOBS } from '@/const';

import { getMessaging } from 'firebase-admin/messaging';
import { Prisma } from '@prisma/client';
import prisma from '@/app/configs/db.configs';
import logger from '@/app/configs/logger.configs';

const handler: IJobHandler<ISendFcmNotification> = {
  name: QUEUE_JOBS.SEND_FCM_NOTIFICATION,
  handler: async (data: ISendFcmNotification, _job: Job) => {
    const { userIds, notificationType, title, description, metaData } = data;

    if (!userIds || userIds.length === 0) {
      logger.info(`[SEND_FCM_NOTIFICATION] No userIds provided. Skipping.`);
      return;
    }

    try {
      // 1. Save to Database for In-App Notification Center
      const notificationRecords = userIds.map((userId) => ({
        userId,
        notificationType,
        notificationTitle: title,
        notificationDescription: description || null,
        metaData: metaData
          ? (metaData as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      }));

      await prisma.notification.createMany({
        data: notificationRecords,
      });

      // 2. Fetch Active FCM Tokens
      const activeDevices = await prisma.device.findMany({
        where: {
          userId: { in: userIds },
          isActive: true,
          fcmToken: { not: null },
        },
        select: {
          id: true,
          fcmToken: true,
        },
      });

      const fcmTokens = activeDevices.map((d) => d.fcmToken as string);

      if (fcmTokens.length === 0) {
        logger.info(
          `[SEND_FCM_NOTIFICATION] No active FCM tokens found for users: ${userIds.join(', ')}`
        );
        return;
      }

      // 3. Send Push Notifications using Firebase Admin
      const message = {
        notification: {
          title,
          body: description,
        },
        data: metaData ? (metaData as { [key: string]: string }) : undefined,
        tokens: fcmTokens,
      };

      const response = await getMessaging().sendEachForMulticast(message);

      logger.info(
        `[SEND_FCM_NOTIFICATION] Sent ${response.successCount} messages successfully, ${response.failureCount} failed.`
      );

      // 4. Handle Failed Tokens (e.g., Unregistered/Expired)
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            const errorCode = resp.error.code;
            if (
              errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered'
            ) {
              failedTokens.push(fcmTokens[idx]);
            }
          }
        });

        if (failedTokens.length > 0) {
          logger.info(
            `[SEND_FCM_NOTIFICATION] Deactivating ${failedTokens.length} expired FCM tokens.`
          );
          await prisma.device.updateMany({
            where: {
              fcmToken: { in: failedTokens },
            },
            data: {
              isActive: false,
            },
          });
        }
      }
    } catch (error) {
      logger.error(
        `[SEND_FCM_NOTIFICATION] Error processing notification:`,
        error
      );
      throw error;
    }
  },
};

export default handler;
