import type IORedis from "ioredis";
import {
  startWorkflowExecutionsConsumer,
  type WorkflowExecutionsConsumer,
} from "./workflow-executions";

export type StartedConsumers = {
  workflowExecutions: WorkflowExecutionsConsumer;
  closeAll: () => Promise<void>;
};

/** Register all Redis/BullMQ consumers for this worker process. */
export function startAllConsumers(opts: {
  connection: IORedis;
  workerId: string;
  concurrency: number;
}): StartedConsumers {
  const workflowExecutions = startWorkflowExecutionsConsumer(opts);

  return {
    workflowExecutions,
    closeAll: async () => {
      await workflowExecutions.close();
    },
  };
}

export { startWorkflowExecutionsConsumer } from "./workflow-executions";
