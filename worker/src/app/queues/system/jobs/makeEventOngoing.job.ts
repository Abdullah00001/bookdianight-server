import { Job } from 'bullmq';
import { IJobHandler } from '@/app/@types/queue.types';
import { IMakeEventOngoing } from '@/app/queues/system/system.types';
import { QUEUE_JOBS } from '@/const';
import prisma from '@/app/configs/db.configs';

const handler: IJobHandler<IMakeEventOngoing> = {
  name: QUEUE_JOBS.MAKE_EVENT_ONGOING,
  handler: async (data: IMakeEventOngoing, job: Job) => {
    // Write your processing logic here
    console.log(`Executing ${job.name} with data:`, data);
    const { eventId } = data;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (
      event &&
      event.eventStatus === 'UPCOMING' &&
      event.deactivatedAt === null
    ) {
      await prisma.event.update({
        where: { id: eventId },
        data: { eventStatus: 'ONGOING' },
      });
      console.log(`Event ${eventId} marked as ONGOING`);
    } else {
      console.log(`Event ${eventId} skipped for ONGOING update`);
    }
  },
};

export default handler;
