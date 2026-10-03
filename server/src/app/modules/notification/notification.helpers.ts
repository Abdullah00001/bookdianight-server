import { NotificationType } from '@prisma/client';
import { getNotificationQueue } from '@/app/queues/notification/notification.queue';
import { getRedisClient } from '@/app/configs/redis.configs';
import { createRedisKey } from '@/app/utils/system.utils';
import { QUEUE_JOBS, REDIS_PREFIXES } from '@/const';
import logger from '@/app/configs/logger.configs';

/**
 * Finds all user IDs stored in the users:locations Redis geo set within
 * a given radius (in km) from the supplied coordinates.
 *
 * WHY: When a new event/club is created we fan-out push notifications only
 * to the users who are physically nearby, keeping the blast radius sensible.
 */
export const getUsersNearby = async ({
  lat,
  lng,
  radiusKm = 5,
  excludeUserId,
}: {
  lat: number;
  lng: number;
  radiusKm?: number;
  excludeUserId?: string;
}): Promise<string[]> => {
  try {
    const redis = getRedisClient();
    const key = createRedisKey(REDIS_PREFIXES.locations);

    // GEOSEARCH <key> FROMLONLAT <lng> <lat> BYRADIUS <radius> km ASC
    // Returns an array of member names (user IDs) within the radius.
    const members = (await redis.call(
      'GEOSEARCH',
      key,
      'FROMLONLAT',
      String(lng),
      String(lat),
      'BYRADIUS',
      String(radiusKm),
      'km',
      'ASC',
    )) as string[];

    if (!Array.isArray(members)) return [];

    return members.filter((id) => id !== excludeUserId);
  } catch (error) {
    logger.error('[getUsersNearby] Failed to query Redis GEOSEARCH', error);
    return [];
  }
};

export const sendPushNotification = async (params: {
  userIds: string[];
  notificationType: NotificationType;
  title: string;
  description?: string;
  metaData?: any;
}) => {
  try {
    if (!params.userIds.length) return;
    await getNotificationQueue().add(QUEUE_JOBS.SEND_FCM_NOTIFICATION, params, {
      removeOnComplete: true,
      removeOnFail: false,
    });
  } catch (error) {
    logger.error('Failed to dispatch SEND_FCM_NOTIFICATION job', error);
  }
};
