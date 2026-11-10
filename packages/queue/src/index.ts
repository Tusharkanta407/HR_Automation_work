import { Queue } from "bullmq";
import IORedis from "ioredis";

/** BullMQ queue name — control plane produces, worker consumes. */
export const WORKFLOW_EXECUTIONS_QUEUE = "workflow-executions";

/**
 * Job payload. Neon `Execution` row is source of truth;
 * Redis only carries ids so the worker can claim + load the graph.
 */
export type WorkflowExecutionJob = {
  executionId: string;
  workflowId: string;
  versionId: string;
};

export function getRedisUrl(): string | null {
  const url = process.env.REDIS_URL?.trim();
  return url || null;
}

/** Shared ioredis options for BullMQ (must set maxRetriesPerRequest: null). */
export function createRedisConnection(redisUrl = getRedisUrl()): IORedis {
  if (!redisUrl) {
    throw new Error(
      "REDIS_URL is not set. Start Redis (`docker compose up -d redis`) and set REDIS_URL=redis://localhost:6379",
    );
  }
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });
}

let producerQueue: Queue<WorkflowExecutionJob> | null = null;
let producerConnection: IORedis | null = null;

function getProducerQueue(): Queue<WorkflowExecutionJob> {
  if (!producerQueue) {
    producerConnection = createRedisConnection();
    producerQueue = new Queue<WorkflowExecutionJob>(WORKFLOW_EXECUTIONS_QUEUE, {
      connection: producerConnection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 200,
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
      },
    });
  }
  return producerQueue;
}

/**
 * Enqueue a run for the background worker.
 * Call AFTER inserting Execution with status QUEUED in Neon.
 */
export async function enqueueWorkflowExecution(
  job: WorkflowExecutionJob,
): Promise<{ enqueued: true; jobId: string }> {
  if (!job.executionId || !job.workflowId || !job.versionId) {
    throw new Error(
      "enqueueWorkflowExecution requires executionId, workflowId, and versionId",
    );
  }
  const queue = getProducerQueue();
  const added = await queue.add("run", job, {
    jobId: job.executionId, // dedupe: one Bull job per execution
  });
  return { enqueued: true, jobId: String(added.id) };
}

export async function closeProducerQueue(): Promise<void> {
  if (producerQueue) {
    await producerQueue.close();
    producerQueue = null;
  }
  if (producerConnection) {
    await producerConnection.quit().catch(() => undefined);
    producerConnection = null;
  }
}
