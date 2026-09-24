import { Queue } from 'bullmq';
import { createQueueOptions } from '@/app/configs/queue.configs';

let _systemQueue: Queue | null = null;

export const getSystemQueue = (): Queue => {
  if (!_systemQueue) {
    _systemQueue = new Queue('system-queue', createQueueOptions());
  }
  return _systemQueue;
};
