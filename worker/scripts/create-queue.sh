#!/bin/bash
set -e

# Ensure a queue name was provided
if [ -z "$1" ]; then
  echo "❌ Error: Please provide a queue name (e.g., npm run create:queue email)"
  exit 1
fi

QUEUE_NAME=$1
QUEUE_DIR="worker/src/app/queues/$QUEUE_NAME"
JOBS_DIR="$QUEUE_DIR/jobs"

# Check if directory already exists
if [ -d "$QUEUE_DIR" ]; then
  echo "❌ Error: Queue module '$QUEUE_NAME' already exists in $QUEUE_DIR"
  exit 1
fi

# Create the directory
mkdir -p "$JOBS_DIR"

# Convert kebab-case to PascalCase for interfaces/variables
QUEUE_PASCAL=$(echo "$QUEUE_NAME" | awk -F- '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1' OFS="")
QUEUE_CAMEL="$(tr '[:upper:]' '[:lower:]' <<< ${QUEUE_PASCAL:0:1})${QUEUE_PASCAL:1}"

# 1. Create the types file
cat > "$QUEUE_DIR/$QUEUE_NAME.types.ts" <<EOF
// Types specific to the $QUEUE_NAME queue can be defined here
// export interface I${QUEUE_PASCAL}JobData { ... }
EOF

# 2. Create the queue instance file
cat > "$QUEUE_DIR/$QUEUE_NAME.queue.ts" <<EOF
import { Queue } from 'bullmq';
import { createQueueOptions } from '@/app/configs/queue.configs';

let _${QUEUE_CAMEL}Queue: Queue | null = null;

export const get${QUEUE_PASCAL}Queue = (): Queue => {
  if (!_${QUEUE_CAMEL}Queue) {
    _${QUEUE_CAMEL}Queue = new Queue('${QUEUE_NAME}-queue', createQueueOptions());
  }
  return _${QUEUE_CAMEL}Queue;
};
EOF

# 3. Create the workers file with dynamic job discovery
cat > "$QUEUE_DIR/$QUEUE_NAME.workers.ts" <<EOF
import { Job, Worker } from 'bullmq';
import fs from 'fs';
import path from 'path';

import logger from '@/app/configs/logger.configs';
import { getRedisClient } from '@/app/configs/redis.configs';
import { IJobHandler } from '@/app/@types/queue.types';

export const create${QUEUE_PASCAL}Worker = (): Worker => {
  // Dynamically load all job handlers from the jobs/ directory
  const handlers: Record<string, IJobHandler> = {};
  const jobsDir = path.join(__dirname, 'jobs');

  if (fs.existsSync(jobsDir)) {
    const files = fs.readdirSync(jobsDir).filter(f => f.endsWith('.job.ts') || f.endsWith('.job.js'));
    for (const file of files) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const importedModule = require(path.join(jobsDir, file));
      const jobHandler: IJobHandler = importedModule.default || importedModule;
      if (jobHandler && jobHandler.name && typeof jobHandler.handler === 'function') {
        handlers[jobHandler.name] = jobHandler;
        logger.info(\`[Worker] Registered handler for job '\${jobHandler.name}' in queue '${QUEUE_NAME}'\`);
      }
    }
  }

  const worker = new Worker(
    '${QUEUE_NAME}-queue',
    async (job: Job) => {
      const { name, data, id } = job;
      
      const jobHandler = handlers[name];
      if (!jobHandler) {
        throw new Error(\`Unhandled job '\${name}' in queue '${QUEUE_NAME}'\`);
      }

      try {
        await jobHandler.handler(data, job);
      } catch (error) {
        logger.error(\`[\${job.name}] Job failed\`, { jobId: id, error });
        throw error;
      }
    },
    },
    { connection: getRedisClient() as unknown as import('bullmq').ConnectionOptions }
  );

  worker.on('completed', (job: Job) => {
    logger.info(\`[Worker] Job '\${job.name}' (ID: \${job.id}) completed successfully in '${QUEUE_NAME}' queue.\`);
  });

  worker.on('failed', (job: Job | undefined, error: Error) => {
    if (job) {
      logger.error(\`[Worker] Job '\${job.name}' (ID: \${job.id}) failed in '${QUEUE_NAME}' queue.\n\${error.stack}\`);
    } else {
      logger.error(\`[Worker] A job failed in '${QUEUE_NAME}' queue but job data is undefined.\n\${error.stack}\`);
    }
  });

  return worker;
};
EOF

# 4. Generate a placeholder job to demonstrate how to use it
JOB_NAME="example"
JOB_PASCAL=\$(echo "\$JOB_NAME" | awk -F- '{for(i=1;i<=NF;i++) \$i=toupper(substr(\$i,1,1)) tolower(substr(\$i,2))}1' OFS="")

cat > "$JOBS_DIR/$JOB_NAME.job.ts" <<EOF
import { Job } from 'bullmq';
import { IJobHandler } from '@/app/@types/queue.types';
import { I${QUEUE_PASCAL}JobData } from '../${QUEUE_NAME}.types';

const handler: IJobHandler<I${QUEUE_PASCAL}JobData> = {
  name: '${JOB_NAME}',
  handler: async (data: I${QUEUE_PASCAL}JobData, job: Job) => {
    // Write your processing logic here
    console.log(\`Executing \${job.name} with data:\`, data);
  }
};

export default handler;
EOF

echo "✅ Successfully created queue module '$QUEUE_NAME' in $QUEUE_DIR!"
echo "   - $QUEUE_DIR/$QUEUE_NAME.queue.ts"
echo "   - $QUEUE_DIR/$QUEUE_NAME.workers.ts"
echo "   - $QUEUE_DIR/$QUEUE_NAME.types.ts"
echo "   - $JOBS_DIR/$JOB_NAME.job.ts (Example handler)"
