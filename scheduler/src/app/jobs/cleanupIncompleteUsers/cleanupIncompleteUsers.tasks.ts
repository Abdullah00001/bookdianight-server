import prisma from '@/app/configs/db.configs';
import logger from '@/app/configs/logger.configs';
import { ICronJob } from '@/app/@types/job.types';

const TAG = '[cleanupIncompleteUsers]';

/**
 * Cron job that deletes users who registered more than 24 hours ago
 * but have not completed email verification.
 *
 * Deletion condition:
 *   createdAt <= now - 24 hours
 *   AND isVerified = false
 *
 * All related records (Profile, Device, Notification, etc.) are removed
 * automatically via the Prisma/PostgreSQL cascade defined in schema.prisma.
 *
 * The job is idempotent: re-running it simply finds nothing eligible if
 * already-deleted users no longer exist.
 */
const cleanupIncompleteUsersJob: ICronJob = {
  name: 'cleanupIncompleteUsers',
  schedule: '0 0 * * *',
  execute: async (): Promise<void> => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    logger.info(`${TAG} Incomplete user cleanup started`);
    logger.info(`${TAG} Cutoff: ${cutoff.toISOString()}`);

    try {
      const result = await prisma.user.deleteMany({
        where: {
          createdAt: { lte: cutoff },
          isVerified: false,
        },
      });

      logger.info(`${TAG} Deleted ${result.count} incomplete user(s)`);
      logger.info(`${TAG} Cleanup completed successfully`);
    } catch (error) {
      logger.error(`${TAG} Cleanup failed`, { error });
    }
  },
};

export default cleanupIncompleteUsersJob;
