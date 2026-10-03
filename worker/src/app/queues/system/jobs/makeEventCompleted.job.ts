import { Job } from 'bullmq';
import { IJobHandler } from '@/app/@types/queue.types';
import { IMakeEventCompleted } from '@/app/queues/system/system.types';
import { QUEUE_JOBS } from '@/const';
import prisma from '@/app/configs/db.configs';

const handler: IJobHandler<IMakeEventCompleted> = {
  name: QUEUE_JOBS.MAKE_EVENT_COMPLETED,
  handler: async (data: IMakeEventCompleted, job: Job) => {
    // Write your processing logic here
    console.log(`Executing ${job.name} with data:`, data);
    const { eventId } = data;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (
      event &&
      (event.eventStatus === 'UPCOMING' || event.eventStatus === 'ONGOING') &&
      event.deactivatedAt === null
    ) {
      await prisma.event.update({
        where: { id: eventId },
        data: { eventStatus: 'COMPLETED' },
      });
      console.log(`Event ${eventId} marked as COMPLETED`);
    } else {
      console.log(`Event ${eventId} skipped for COMPLETED update`);
    }
  },
};

export default handler;
