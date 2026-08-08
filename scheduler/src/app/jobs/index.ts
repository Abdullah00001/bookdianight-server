import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import logger from '@/app/configs/logger.configs';
import { ICronJob } from '@/app/@types/job.types';

const jobsDir = __dirname;

fs.readdirSync(jobsDir, { withFileTypes: true }).forEach((dirent) => {
  if (dirent.isDirectory()) {
    const jobDir = path.join(jobsDir, dirent.name);
    
    // Find the file ending with .tasks.js (production) or .tasks.ts (development)
    const taskFiles = fs.readdirSync(jobDir).filter(
      (file) => file.endsWith('.tasks.js') || file.endsWith('.tasks.ts')
    );

    for (const file of taskFiles) {
      const taskPath = path.join(jobDir, file);
      
      // Dynamically require the job module
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const taskModule = require(taskPath);
      
      // Extract the default export or the whole module
      const job: ICronJob = taskModule.default || taskModule;

      if (job && job.name && job.schedule && job.execute) {
        cron.schedule(job.schedule, async () => {
          try {
            logger.info(`[Cron] Starting execution of job: ${job.name}`);
            await job.execute();
            logger.info(`[Cron] Successfully completed job: ${job.name}`);
          } catch (error) {
            logger.error(`[Cron] Error executing job ${job.name}: ${error}`);
          }
        });
        logger.info(`[Cron] Registered job: ${job.name} (Schedule: ${job.schedule})`);
      } else {
        logger.warn(`[Cron] Invalid job module exported in ${file}. Expected ICronJob.`);
      }
    }
  }
});

logger.info('[Cron] All schedules dynamically loaded and registered');
