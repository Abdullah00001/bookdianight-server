import { ICronJob } from '@/app/@types/job.types';
import prisma from '@/app/configs/db.configs';
import { getSystemQueue } from '@/app/queues/system/system.queue';
import { QUEUE_JOBS } from '@/const';

const synceventstatusJob: ICronJob = {
  name: 'syncEventStatus',
  // Run every minute by default
  schedule: '* * * * *',
  execute: async () => {
    console.log('[Cron] Executing syncEventStatus job...');
    const now = new Date();
    const systemQueue = getSystemQueue();

    // 1. Find UPCOMING events whose startAt has passed, dispatch to ONGOING
    const eventsToStart = await prisma.event.findMany({
      where: {
        eventStatus: 'UPCOMING',
        deactivatedAt: null,
        startAt: { lte: now },
      },
      select: { id: true },
    });

    for (const event of eventsToStart) {
      await systemQueue.add(QUEUE_JOBS.MAKE_EVENT_ONGOING, {
        eventId: event.id,
      });
    }
    if (eventsToStart.length > 0) {
      console.log(
        `[Cron] Dispatched ${eventsToStart.length} events to ONGOING queue.`
      );
    }

    // 2. Find UPCOMING or ONGOING events whose endAt has passed, dispatch to COMPLETED
    const eventsToComplete = await prisma.event.findMany({
      where: {
        eventStatus: { in: ['UPCOMING', 'ONGOING'] },
        deactivatedAt: null,
        endAt: { lte: now },
      },
      select: { id: true },
    });

    for (const event of eventsToComplete) {
      await systemQueue.add(QUEUE_JOBS.MAKE_EVENT_COMPLETED, {
        eventId: event.id,
      });
    }
    if (eventsToComplete.length > 0) {
      console.log(
        `[Cron] Dispatched ${eventsToComplete.length} events to COMPLETED queue.`
      );
    }
  },
};

export default synceventstatusJob;
