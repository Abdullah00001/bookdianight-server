#!/bin/bash
set -e

# Ensure queue name and job name were provided
if [ -z "$1" ] || [ -z "$2" ]; then
  echo "❌ Error: Please provide a queue name and a job name"
  echo "Usage: npm run create:queue-job <queue_name> <job_name>"
  echo "Example: npm run create:queue-job email send-welcome"
  exit 1
fi

QUEUE_NAME=$1
JOB_NAME=$2
QUEUE_DIR="worker/src/app/queues/$QUEUE_NAME"
JOBS_DIR="$QUEUE_DIR/jobs"
JOB_FILE="$JOBS_DIR/$JOB_NAME.job.ts"

# Check if queue directory exists
if [ ! -d "$QUEUE_DIR" ]; then
  echo "❌ Error: Queue module '$QUEUE_NAME' does not exist in $QUEUE_DIR"
  echo "Please create the queue first using: npm run create:queue $QUEUE_NAME"
  exit 1
fi

# Check if job file already exists
if [ -f "$JOB_FILE" ]; then
  echo "❌ Error: Job '$JOB_NAME' already exists in $JOBS_DIR"
  exit 1
fi

JOB_PASCAL=$(echo "$QUEUE_NAME" | awk -F- '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1' OFS="")
JOB_NAME_PASCAL=$(echo "$JOB_NAME" | awk -F- '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1' OFS="")

# Generate the job handler file
cat > "$JOB_FILE" <<EOF
import { Job } from 'bullmq';
import { IJobHandler } from '@/app/@types/queue.types';
import { I${JOB_PASCAL}JobData } from '../${QUEUE_NAME}.types';

const handler: IJobHandler<I${JOB_PASCAL}JobData> = {
  name: '${JOB_NAME}',
  handler: async (data: I${JOB_PASCAL}JobData, job: Job) => {
    // Write your processing logic here
    console.log(\`Executing \${job.name} with data:\`, data);
  }
};

export default handler;
EOF

echo "✅ Successfully created job handler '$JOB_NAME' in queue '$QUEUE_NAME'!"
echo "   - $JOB_FILE"
