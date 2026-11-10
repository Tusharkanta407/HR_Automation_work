import { Worker as BullWorker, type Worker } from "bullmq";
import type IORedis from "ioredis";
import {
  WORKFLOW_EXECUTIONS_QUEUE,
  type WorkflowExecutionJob,
} from "@hr-automation/queue";
import { processWorkflowJob } from "../process-job";

export type WorkflowExecutionsConsumer = {
  worker: Worker<WorkflowExecutionJob>;
  close: () => Promise<void>;
};

/**
 * BullMQ consumer for queue "workflow-executions".
 * Job → claim in Neon → packages/workflow-engine (not local executors/).
 */
export function startWorkflowExecutionsConsumer(opts: {
  connection: IORedis;
  workerId: string;
  concurrency: number;
}): WorkflowExecutionsConsumer {
  const { connection, workerId, concurrency } = opts;

  const worker = new BullWorker<WorkflowExecutionJob>(
    WORKFLOW_EXECUTIONS_QUEUE,
    async (job) => {
      console.log(
        `[consumer:workflow-executions] job id=${job.id} executionId=${job.data.executionId}`,
      );
      return processWorkflowJob(job.data, workerId);
    },
    { connection, concurrency },
  );

  worker.on("completed", (job, result) => {
    console.log(
      `[consumer:workflow-executions] completed id=${job.id} status=${(result as { status?: string })?.status}`,
    );
  });

  worker.on("failed", (job, err) => {
    console.error(
      `[consumer:workflow-executions] failed id=${job?.id}`,
      err.message,
    );
  });

  console.log(
    `[consumer:workflow-executions] listening on "${WORKFLOW_EXECUTIONS_QUEUE}" (concurrency=${concurrency})`,
  );

  return {
    worker,
    close: async () => {
      await worker.close();
    },
  };
}
